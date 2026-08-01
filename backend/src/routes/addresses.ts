import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { addresses } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('customer'))

app.get('/', async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(addresses).where(eq(addresses.userId, auth.id))
  return c.json({ addresses: rows })
})

const addressSchema = z.object({
  label: z.string().trim().max(40).default('Home'),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().regex(/^[0-9]{6}$/),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().default(false),
})

app.post('/', validateBody(addressSchema), async (c) => {
  const auth = c.get('auth')
  const data = c.get('validatedBody' as never) as z.infer<typeof addressSchema>
  const db = createDb(c.env.DATABASE_URL)

  const [created] = await db
    .insert(addresses)
    .values({
      userId: auth.id,
      label: data.label,
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      lat: data.lat?.toString(),
      lng: data.lng?.toString(),
      isDefault: data.isDefault,
    })
    .returning()
  return c.json({ address: created }, 201)
})

app.delete('/:id', async (c) => {
  const auth = c.get('auth')
  const id = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, auth.id)))
  return c.json({ success: true })
})

export default app
