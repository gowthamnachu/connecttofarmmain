import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { wishlists, products, farmers } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// All wishlist routes require customer auth
app.use('*', requireAuth)

// GET /wishlist - returns list of wishlisted product IDs and full product details
app.get('/', async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)

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
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .innerJoin(farmers, eq(products.farmerId, farmers.id))
    .where(eq(wishlists.userId, auth.id))

  const productIds = rows.map((r) => r.id)
  return c.json({ productIds, products: rows })
})

const addWishlistSchema = z.object({
  productId: z.string().uuid(),
})

// POST /wishlist - add product to wishlist
app.post('/', validateBody(addWishlistSchema), async (c) => {
  const auth = c.get('auth')
  const { productId } = c.get('validatedBody' as never) as z.infer<typeof addWishlistSchema>
  const db = createDb(c.env.DATABASE_URL)

  const [existing] = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, auth.id), eq(wishlists.productId, productId)))
    .limit(1)

  if (!existing) {
    await db.insert(wishlists).values({
      userId: auth.id,
      productId,
    })
  }

  return c.json({ success: true, productId })
})

// DELETE /wishlist/:productId - remove product from wishlist
app.delete('/:productId', async (c) => {
  const auth = c.get('auth')
  const productId = c.req.param('productId')
  const db = createDb(c.env.DATABASE_URL)

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, auth.id), eq(wishlists.productId, productId)))

  return c.json({ success: true, productId })
})

export default app
