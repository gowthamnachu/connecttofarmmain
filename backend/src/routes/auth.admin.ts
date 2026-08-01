import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq, or } from 'drizzle-orm'
import { createDb } from '../db/client'
import { admins } from '../db/schema'
import { validateBody } from '../middleware/validate'
import { rateLimit } from '../middleware/rateLimit'
import { signAccessToken, signRefreshToken } from '../lib/jwt'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const loginSchema = z.object({
  phone: z.string().trim().min(10),
  password: z.string().min(6),
})

app.post(
  '/login',
  rateLimit({ key: (c) => `admin-login:${c.req.header('CF-Connecting-IP') ?? 'unknown'}`, limit: 10, windowSeconds: 15 * 60 }),
  validateBody(loginSchema),
  async (c) => {
    const { phone, password } = c.get('validatedBody' as never) as z.infer<typeof loginSchema>
    const db = createDb(c.env.DATABASE_URL)

    const cleanPhone = phone.replace(/[\s()-]/g, '')
    const phoneE164 = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/^0+/, '')}`

    const [admin] = await db
      .select()
      .from(admins)
      .where(or(eq(admins.phone, cleanPhone), eq(admins.phone, phoneE164)))
      .limit(1)

    if (!admin || !admin.isActive) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const identity = { sub: admin.id, role: 'admin' as const, phone: admin.phone }
    const accessToken = await signAccessToken(c.env.JWT_SECRET, identity)
    const refreshToken = await signRefreshToken(c.env.JWT_REFRESH_SECRET, identity)

    return c.json({ accessToken, refreshToken, admin: { id: admin.id, name: admin.name, role: admin.role } })
  }
)

export default app
