import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { farmers } from '../db/schema'
import { validateBody } from '../middleware/validate'
import { rateLimit } from '../middleware/rateLimit'
import { signAccessToken, signRefreshToken } from '../lib/jwt'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const loginSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  password: z.string().min(8),
})

// Farmers never self-register: credentials are issued by an admin during onboarding.
app.post(
  '/login',
  rateLimit({ key: (c) => `farmer-login:${c.req.header('CF-Connecting-IP') ?? 'unknown'}`, limit: 10, windowSeconds: 15 * 60 }),
  validateBody(loginSchema),
  async (c) => {
    const { phone, password } = c.get('validatedBody' as never) as z.infer<typeof loginSchema>
    const db = createDb(c.env.DATABASE_URL)

    const [farmer] = await db.select().from(farmers).where(eq(farmers.phone, phone)).limit(1)
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
