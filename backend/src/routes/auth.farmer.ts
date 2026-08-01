import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq, or } from 'drizzle-orm'
import { createDb } from '../db/client'
import { farmers } from '../db/schema'
import { validateBody } from '../middleware/validate'
import { rateLimit } from '../middleware/rateLimit'
import { signAccessToken, signRefreshToken } from '../lib/jwt'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const loginSchema = z.object({
  phone: z.string().trim().min(10),
  password: z.string().min(6),
})

// Farmers login endpoint with phone & password
app.post(
  '/login',
  rateLimit({ key: (c) => `farmer-login:${c.req.header('CF-Connecting-IP') ?? 'unknown'}`, limit: 10, windowSeconds: 15 * 60 }),
  validateBody(loginSchema),
  async (c) => {
    const { phone, password } = c.get('validatedBody' as never) as z.infer<typeof loginSchema>
    const db = createDb(c.env.DATABASE_URL)

    const cleanPhone = phone.replace(/[\s()-]/g, '')
    const phoneE164 = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/^0+/, '')}`

    const [farmer] = await db
      .select()
      .from(farmers)
      .where(or(eq(farmers.phone, cleanPhone), eq(farmers.phone, phoneE164)))
      .limit(1)

    if (!farmer || !farmer.isActive) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isValid = await bcrypt.compare(password, farmer.passwordHash)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const identity = { sub: farmer.id, role: 'farmer' as const, phone: farmer.phone }
    const accessToken = await signAccessToken(c.env.JWT_SECRET, identity)
    const refreshToken = await signRefreshToken(c.env.JWT_REFRESH_SECRET, identity)

    return c.json({
      accessToken,
      refreshToken,
      farmer: { id: farmer.id, name: farmer.name, certificationStatus: farmer.certificationStatus },
    })
  }
)

export default app
