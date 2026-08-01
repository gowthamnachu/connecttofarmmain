import { Hono } from 'hono'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { products, farmers, categories } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody, validateQuery } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const listQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
})

// Public: storefront product listing, optionally filtered by category slug / search term.
app.get('/', validateQuery(listQuerySchema), async (c) => {
  const { category, search } = c.get('validatedQuery' as never) as z.infer<typeof listQuerySchema>
  const db = createDb(c.env.DATABASE_URL)

  const conditions = [eq(products.isActive, true)]
  if (category) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, category)).limit(1)
    if (!cat) return c.json({ products: [] })
    conditions.push(eq(products.categoryId, cat.id))
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      unit: products.unit,
      stock: products.stock,
      images: products.images,
      farmerName: farmers.name,
      farmerVillage: farmers.village,
      farmerCertificationStatus: farmers.certificationStatus,
    })
    .from(products)
    .innerJoin(farmers, eq(products.farmerId, farmers.id))
    .where(and(...conditions))

  const filtered = search ? rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : rows
  return c.json({ products: filtered })
})

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = createDb(c.env.DATABASE_URL)

  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      unit: products.unit,
      stock: products.stock,
      images: products.images,
      farmerId: farmers.id,
      farmerName: farmers.name,
      farmerVillage: farmers.village,
      farmerDistrict: farmers.district,
      farmerCertificationStatus: farmers.certificationStatus,
      farmerPhotoUrl: farmers.photoUrl,
    })
    .from(products)
    .innerJoin(farmers, eq(products.farmerId, farmers.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1)

  if (!product) return c.json({ error: 'Product not found' }, 404)
  return c.json({ product })
})

const upsertSchema = z.object({
  categoryId: z.string().uuid(),
  farmerId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  unit: z.string().min(1).max(20),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).default([]),
})

app.post('/', requireAuth, requireRole('admin'), validateBody(upsertSchema), async (c) => {
  const data = c.get('validatedBody' as never) as z.infer<typeof upsertSchema>
  const db = createDb(c.env.DATABASE_URL)
  const [created] = await db.insert(products).values(data).returning()
  return c.json({ product: created }, 201)
})

app.put('/:id', requireAuth, requireRole('admin'), validateBody(upsertSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.get('validatedBody' as never) as Partial<z.infer<typeof upsertSchema>>
  const db = createDb(c.env.DATABASE_URL)
  const [updated] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning()
  if (!updated) return c.json({ error: 'Product not found' }, 404)
  return c.json({ product: updated })
})

app.delete('/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)
  const [updated] = await db.update(products).set({ isActive: false }).where(eq(products.id, id)).returning()
  if (!updated) return c.json({ error: 'Product not found' }, 404)
  return c.json({ success: true })
})

export default app
