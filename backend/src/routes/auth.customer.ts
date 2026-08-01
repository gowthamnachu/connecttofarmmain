import { Hono } from 'hono'
import { z } from 'zod'
import { eq, or } from 'drizzle-orm'
import { createDb } from '../db/client'
import { users } from '../db/schema'
import { validateBody } from '../middleware/validate'
import { rateLimit } from '../middleware/rateLimit'
import { verifyFirebaseIdToken } from '../lib/firebaseAuth'
import { signAccessToken, signRefreshToken } from '../lib/jwt'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const checkPhoneSchema = z.object({
  phone: z.string().trim().min(10),
})

// Check if user already exists by phone number (so existing users skip name entry)
app.post('/check-phone', validateBody(checkPhoneSchema), async (c) => {
  const { phone } = c.get('validatedBody' as never) as z.infer<typeof checkPhoneSchema>
  const db = createDb(c.env.DATABASE_URL)

  const cleanPhone = phone.replace(/[\s()-]/g, '')
  const phoneE164 = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/^0+/, '')}`

  const [existing] = await db
    .select()
    .from(users)
    .where(or(eq(users.phone, phoneE164), eq(users.phone, cleanPhone)))
    .limit(1)

  return c.json({
    exists: Boolean(existing),
    name: existing?.name ?? null,
  })
})

const verifySchema = z.object({
  idToken: z.string().min(10),
  name: z.string().trim().min(2).max(100).optional(),
})

app.post(
  '/verify',
  rateLimit({ key: (c) => `customer-verify:${c.req.header('CF-Connecting-IP') ?? 'unknown'}`, limit: 20, windowSeconds: 15 * 60 }),
  validateBody(verifySchema),
  async (c) => {
    const { idToken, name } = c.get('validatedBody' as never) as z.infer<typeof verifySchema>
    const db = createDb(c.env.DATABASE_URL)

    let claims
    try {
      claims = await verifyFirebaseIdToken(idToken, c.env.FIREBASE_PROJECT_ID)
    } catch {
      return c.json({ error: 'Invalid or expired Firebase token' }, 401)
    }

    if (!claims.phone_number) {
      return c.json({ error: 'Phone number missing from token' }, 400)
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(or(eq(users.firebaseUid, claims.uid), eq(users.phone, claims.phone_number)))
      .limit(1)

    let user = existing
    if (!user) {
      if (!name) {
        return c.json({ error: 'Name is required for first-time sign-up' }, 400)
      }
      const [created] = await db
        .insert(users)
        .values({ name, phone: claims.phone_number, firebaseUid: claims.uid })
        .returning()
      user = created
    } else if (!user.firebaseUid || user.firebaseUid !== claims.uid) {
      // Link firebaseUid if phone matched an existing record
      await db.update(users).set({ firebaseUid: claims.uid }).where(eq(users.id, user.id))
    }

    if (!user.isActive) {
      return c.json({ error: 'Account is disabled' }, 403)
    }

    const identity = { sub: user.id, role: 'customer' as const, phone: user.phone }
    const accessToken = await signAccessToken(c.env.JWT_SECRET, identity)
    const refreshToken = await signRefreshToken(c.env.JWT_REFRESH_SECRET, identity)

    return c.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, phone: user.phone } })
  }
)

export default app
