import { Hono } from 'hono'
import { z } from 'zod'
import { and, eq, desc } from 'drizzle-orm'
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

// Public: storefront product listing with complete organic attributes
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
      description: products.description,
      price: products.price,
      unit: products.unit,
      stock: products.stock,
      images: products.images,
      harvestDate: products.harvestDate,
      gradeTag: products.gradeTag,
      processTag: products.processTag,
      isCertifiedNoPesticides: products.isCertifiedNoPesticides,
      farmerName: farmers.name,
      farmerVillage: farmers.village,
      farmerCertificationStatus: farmers.certificationStatus,
      categoryName: categories.name,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(farmers, eq(products.farmerId, farmers.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))

  const filtered = search ? rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : rows
  return c.json({ products: filtered })
})

// Admin API: List all products for inventory management
app.get('/admin/all', requireAuth, requireRole('admin'), async (c) => {
  const db = createDb(c.env.DATABASE_URL)

  const rows = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      farmerId: products.farmerId,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      unit: products.unit,
      stock: products.stock,
      images: products.images,
      harvestDate: products.harvestDate,
      gradeTag: products.gradeTag,
      processTag: products.processTag,
      isCertifiedNoPesticides: products.isCertifiedNoPesticides,
      isActive: products.isActive,
      farmerName: farmers.name,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(farmers, eq(products.farmerId, farmers.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt))

  return c.json({ products: rows })
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
      harvestDate: products.harvestDate,
      gradeTag: products.gradeTag,
      processTag: products.processTag,
      isCertifiedNoPesticides: products.isCertifiedNoPesticides,
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
  harvestDate: z.string().max(50).optional(),
  gradeTag: z.string().max(100).optional(),
  processTag: z.string().max(150).optional(),
  isCertifiedNoPesticides: z.boolean().default(true),
})

app.post('/', requireAuth, requireRole('admin'), validateBody(upsertSchema), async (c) => {
  const data = c.get('validatedBody' as never) as z.infer<typeof upsertSchema>
  const db = createDb(c.env.DATABASE_URL)
  const [created] = await db.insert(products).values(data).returning()
  return c.json({ product: created }, 201)
})

const patchSchema = z.object({
  stock: z.number().int().min(0).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(150).optional(),
  unit: z.string().min(1).max(20).optional(),
  harvestDate: z.string().max(50).optional(),
  gradeTag: z.string().max(100).optional(),
  processTag: z.string().max(150).optional(),
  isCertifiedNoPesticides: z.boolean().optional(),
})

app.patch('/:id', requireAuth, requireRole('admin'), validateBody(patchSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.get('validatedBody' as never) as z.infer<typeof patchSchema>
  const db = createDb(c.env.DATABASE_URL)

  const [updated] = await db
    .update(products)
    .set({
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.unit ? { unit: data.unit } : {}),
      ...(data.harvestDate !== undefined ? { harvestDate: data.harvestDate } : {}),
      ...(data.gradeTag !== undefined ? { gradeTag: data.gradeTag } : {}),
      ...(data.processTag !== undefined ? { processTag: data.processTag } : {}),
      ...(data.isCertifiedNoPesticides !== undefined ? { isCertifiedNoPesticides: data.isCertifiedNoPesticides } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Product not found' }, 404)
  return c.json({ product: updated })
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
