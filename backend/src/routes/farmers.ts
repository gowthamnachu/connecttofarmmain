import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { farmers, products } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// Strips spaces, dashes, and parentheses admins commonly type/paste into phone fields (e.g. "98765 43210",
// "+91-98765-43210") before enforcing the digits-only shape, so those cosmetic separators never trigger
// a validation failure.
const phoneField = z.preprocess(
  (val) => (typeof val === 'string' ? val.replace(/[\s()-]/g, '') : val),
  z.string().regex(/^\+?[0-9]{10,15}$/, 'Phone must be 10-15 digits, optionally starting with +'),
)

// Deliberately minimal onboarding fields, per business decision (South-India, simple entities only).
const onboardSchema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.number().int().min(18).max(100).optional(),
  phone: phoneField,
  village: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  photoUrl: z.string().url().optional(),
  upiId: z.string().max(100).optional(),
})

function generateTempPassword() {
  // 10-char random alphanumeric, shown once to the admin to hand off to the farmer.
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10)
}

// Public: allows customer app to display farmers (e.g. "Meet Our Farmers" section).
app.get('/public', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db
    .select({
      id: farmers.id,
      name: farmers.name,
      village: farmers.village,
      district: farmers.district,
      state: farmers.state,
      certificationStatus: farmers.certificationStatus,
      photoUrl: farmers.photoUrl,
    })
    .from(farmers)
    .where(eq(farmers.isActive, true))
  return c.json({ farmers: rows })
})

app.get('/', requireAuth, requireRole('admin'), async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(farmers)
  return c.json({ farmers: rows.map(({ passwordHash: _passwordHash, ...rest }) => rest) })
})

// Admin onboards a farmer and receives a one-time temporary password to share with them.
app.post('/', requireAuth, requireRole('admin'), validateBody(onboardSchema), async (c) => {
  const data = c.get('validatedBody' as never) as z.infer<typeof onboardSchema>
  const db = createDb(c.env.DATABASE_URL)
  const auth = c.get('auth')

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const [created] = await db
    .insert(farmers)
    .values({ ...data, passwordHash, createdBy: auth.id })
    .returning()

  const { passwordHash: _passwordHash, ...safeFarmer } = created
  return c.json({ farmer: safeFarmer, tempPassword }, 201)
})

app.patch(
  '/:id/certification',
  requireAuth,
  requireRole('admin'),
  validateBody(z.object({ status: z.enum(['pending', 'certified', 'rejected']) })),
  async (c) => {
    const id = c.req.param('id')
    const { status } = c.get('validatedBody' as never) as { status: 'pending' | 'certified' | 'rejected' }
    const db = createDb(c.env.DATABASE_URL)
    const [updated] = await db
      .update(farmers)
      .set({ certificationStatus: status, updatedAt: new Date() })
      .where(eq(farmers.id, id))
      .returning()
    if (!updated) return c.json({ error: 'Farmer not found' }, 404)
    const { passwordHash: _passwordHash, ...safeFarmer } = updated
    return c.json({ farmer: safeFarmer })
  }
)

app.patch('/:id/reset-password', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)
  const [updated] = await db.update(farmers).set({ passwordHash }).where(eq(farmers.id, id)).returning()
  if (!updated) return c.json({ error: 'Farmer not found' }, 404)
  return c.json({ tempPassword })
})

// Farmer self-service (read-only profile + toggling their own products' availability).
app.get('/me', requireAuth, requireRole('farmer'), async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const [farmer] = await db.select().from(farmers).where(eq(farmers.id, auth.id)).limit(1)
  if (!farmer) return c.json({ error: 'Farmer not found' }, 404)
  const { passwordHash: _passwordHash, ...safeFarmer } = farmer
  return c.json({ farmer: safeFarmer })
})

app.get('/me/products', requireAuth, requireRole('farmer'), async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(products).where(eq(products.farmerId, auth.id))
  return c.json({ products: rows })
})

app.patch(
  '/me/products/:id/stock',
  requireAuth,
  requireRole('farmer'),
  validateBody(z.object({ stock: z.number().int().min(0) })),
  async (c) => {
    const auth = c.get('auth')
    const productId = c.req.param('id')
    const { stock } = c.get('validatedBody' as never) as { stock: number }
    const db = createDb(c.env.DATABASE_URL)

    const [updated] = await db
      .update(products)
      .set({ stock, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.farmerId, auth.id)))
      .returning()

    if (!updated) return c.json({ error: 'Product not found' }, 404)
    return c.json({ product: updated })
  }
)

export default app
