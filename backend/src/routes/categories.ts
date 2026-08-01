import { Hono } from 'hono'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'
import { createDb } from '../db/client'
import { categories, products } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const upsertSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

// Public: storefront active category list
app.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder))
  return c.json({ categories: rows })
})

// Admin: fetch ALL categories (active & inactive)
app.get('/admin/all', requireAuth, requireRole('admin'), async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
  return c.json({ categories: rows })
})

// Admin: create category
app.post('/', requireAuth, requireRole('admin'), validateBody(upsertSchema), async (c) => {
  const data = c.get('validatedBody' as never) as z.infer<typeof upsertSchema>
  if (!data.name || !data.slug) {
    return c.json({ error: 'Name and slug are required' }, 400)
  }
  const db = createDb(c.env.DATABASE_URL)
  const [created] = await db.insert(categories).values({
    name: data.name,
    slug: data.slug,
    iconUrl: data.iconUrl,
    bannerUrl: data.bannerUrl,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
  }).returning()
  return c.json({ category: created }, 201)
})

// Admin: update category (supports updating name, slug, sortOrder, and isActive status)
app.put('/:id', requireAuth, requireRole('admin'), validateBody(upsertSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.get('validatedBody' as never) as Partial<z.infer<typeof upsertSchema>>
  const db = createDb(c.env.DATABASE_URL)
  const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning()
  if (!updated) return c.json({ error: 'Category not found' }, 404)
  return c.json({ category: updated })
})

// Admin: delete or deactivate category
app.delete('/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const permanent = c.req.query('permanent') === 'true'
  const db = createDb(c.env.DATABASE_URL)

  if (permanent) {
    // Delete any dependent products first to avoid FK constraint error
    await db.delete(products).where(eq(products.categoryId, id))
    await db.delete(categories).where(eq(categories.id, id))
  } else {
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id))
  }
  return c.json({ success: true })
})

export default app
