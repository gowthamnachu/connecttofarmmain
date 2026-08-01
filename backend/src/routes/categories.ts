import { Hono } from 'hono'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'
import { createDb } from '../db/client'
import { categories } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const upsertSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
})

// Public: storefront category grid
app.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder))
  return c.json({ categories: rows })
})

app.post('/', requireAuth, requireRole('admin'), validateBody(upsertSchema), async (c) => {
  const data = c.get('validatedBody' as never) as z.infer<typeof upsertSchema>
  const db = createDb(c.env.DATABASE_URL)
  const [created] = await db.insert(categories).values(data).returning()
  return c.json({ category: created }, 201)
})

app.put('/:id', requireAuth, requireRole('admin'), validateBody(upsertSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.get('validatedBody' as never) as Partial<z.infer<typeof upsertSchema>>
  const db = createDb(c.env.DATABASE_URL)
  const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning()
  if (!updated) return c.json({ error: 'Category not found' }, 404)
  return c.json({ category: updated })
})

app.delete('/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)
  const [updated] = await db.update(categories).set({ isActive: false }).where(eq(categories.id, id)).returning()
  if (!updated) return c.json({ error: 'Category not found' }, 404)
  return c.json({ success: true })
})

export default app
