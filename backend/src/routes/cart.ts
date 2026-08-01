import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { cartItems, products } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('customer'))

app.get('/', async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      unit: products.unit,
      images: products.images,
      stock: products.stock,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, auth.id))
  return c.json({ items: rows })
})

const addItemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(50) })

app.post('/', validateBody(addItemSchema), async (c) => {
  const auth = c.get('auth')
  const { productId, quantity } = c.get('validatedBody' as never) as z.infer<typeof addItemSchema>
  const db = createDb(c.env.DATABASE_URL)

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!product || !product.isActive) return c.json({ error: 'Product not found' }, 404)
  if (quantity > product.stock) return c.json({ error: 'Insufficient stock' }, 409)

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, auth.id), eq(cartItems.productId, productId)))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItems.id, existing.id))
      .returning()
    return c.json({ item: updated })
  }

  const [created] = await db.insert(cartItems).values({ userId: auth.id, productId, quantity }).returning()
  return c.json({ item: created }, 201)
})

app.patch(
  '/:productId',
  validateBody(z.object({ quantity: z.number().int().min(1).max(50) })),
  async (c) => {
    const auth = c.get('auth')
    const productId = c.req.param('productId')
    const { quantity } = c.get('validatedBody' as never) as { quantity: number }
    const db = createDb(c.env.DATABASE_URL)

    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.userId, auth.id), eq(cartItems.productId, productId)))
      .returning()
    if (!updated) return c.json({ error: 'Cart item not found' }, 404)
    return c.json({ item: updated })
  }
)

app.delete('/:productId', async (c) => {
  const auth = c.get('auth')
  const productId = c.req.param('productId')
  const db = createDb(c.env.DATABASE_URL)
  await db.delete(cartItems).where(and(eq(cartItems.userId, auth.id), eq(cartItems.productId, productId)))
  return c.json({ success: true })
})

export default app
