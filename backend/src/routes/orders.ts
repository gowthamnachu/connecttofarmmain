import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { createDb } from '../db/client'
import { orders, orderItems, cartItems, products, addresses, shipments } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import { createRazorpayOrder, verifyRazorpayPaymentSignature } from '../lib/razorpay'
import { createNimbuspostShipment, getNimbuspostShippingLabel } from '../lib/nimbuspost'
import { STORE_ORIGIN, FREE_DELIVERY_THRESHOLD, FLAT_DELIVERY_FEE } from '../config/store'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

function generateOrderNumber() {
  return `CTF${Date.now().toString(36).toUpperCase()}`
}

// Places an order from the customer's current cart.
app.post(
  '/',
  requireAuth,
  requireRole('customer'),
  validateBody(z.object({ addressId: z.string().uuid() })),
  async (c) => {
    const auth = c.get('auth')
    const { addressId } = c.get('validatedBody' as never) as { addressId: string }
    const db = createDb(c.env.DATABASE_URL)

    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, auth.id)))
      .limit(1)
    if (!address) return c.json({ error: 'Address not found' }, 404)

    const cart = await db
      .select({
        productId: products.id,
        farmerId: products.farmerId,
        name: products.name,
        price: products.price,
        stock: products.stock,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, auth.id))

    if (cart.length === 0) return c.json({ error: 'Cart is empty' }, 400)

    for (const item of cart) {
      if (item.quantity > item.stock) {
        return c.json({ error: `${item.name} has only ${item.stock} in stock` }, 409)
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : Number(FLAT_DELIVERY_FEE)
    const total = subtotal + deliveryFee

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId: auth.id,
        addressId,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
      })
      .returning()

    await db.insert(orderItems).values(
      cart.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        farmerId: item.farmerId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      }))
    )

    for (const item of cart) {
      await db
        .update(products)
        .set({ stock: item.stock - item.quantity })
        .where(eq(products.id, item.productId))
    }

    await db.delete(cartItems).where(eq(cartItems.userId, auth.id))

    const razorpayOrder = await createRazorpayOrder({
      keyId: c.env.RAZORPAY_KEY_ID,
      keySecret: c.env.RAZORPAY_KEY_SECRET,
      amountPaise: Math.round(total * 100),
      receipt: order.orderNumber,
    })

    await db.update(orders).set({ razorpayOrderId: razorpayOrder.id }).where(eq(orders.id, order.id))

    return c.json({
      order: { id: order.id, orderNumber: order.orderNumber, total: order.total },
      razorpay: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, keyId: c.env.RAZORPAY_KEY_ID },
    }, 201)
  }
)

const confirmPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

app.post('/:id/confirm-payment', requireAuth, requireRole('customer'), validateBody(confirmPaymentSchema), async (c) => {
  const auth = c.get('auth')
  const orderId = c.req.param('id')
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = c.get('validatedBody' as never) as z.infer<
    typeof confirmPaymentSchema
  >
  const db = createDb(c.env.DATABASE_URL)

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, auth.id)))
    .limit(1)
  if (!order || order.razorpayOrderId !== razorpayOrderId) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const isValid = await verifyRazorpayPaymentSignature({
    keySecret: c.env.RAZORPAY_KEY_SECRET,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  })
  if (!isValid) return c.json({ error: 'Payment signature verification failed' }, 400)

  await db
    .update(orders)
    .set({ paymentStatus: 'paid', status: 'confirmed', razorpayPaymentId, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  return c.json({ success: true })
})

app.get('/', requireAuth, requireRole('customer'), async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(orders).where(eq(orders.userId, auth.id)).orderBy(desc(orders.createdAt))
  return c.json({ orders: rows })
})

app.get('/:id', requireAuth, requireRole('customer'), async (c) => {
  const auth = c.get('auth')
  const orderId = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, auth.id)))
    .limit(1)
  if (!order) return c.json({ error: 'Order not found' }, 404)

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1)

  return c.json({ order, items, shipment: shipment ?? null })
})

// ADMIN API: Fetch all orders with shipment details and NimbusPost label URL
app.get('/admin/all', requireAuth, requireRole('admin'), async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt))

  const results = await Promise.all(
    rows.map(async (ord) => {
      const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, ord.id)).limit(1)
      const [address] = await db.select().from(addresses).where(eq(addresses.id, ord.addressId)).limit(1)
      return {
        ...ord,
        shipment: shipment ?? null,
        address: address ?? null,
      }
    })
  )

  return c.json({ orders: results })
})

// ADMIN API: Fetch or download NimbusPost shipping label
app.get('/admin/:id/label', requireAuth, requireRole('admin'), async (c) => {
  const orderId = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)

  const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1)
  if (!shipment || !shipment.awbNumber) {
    return c.json({ error: 'No shipment or AWB booked for this order yet' }, 404)
  }

  let labelUrl = shipment.labelUrl
  if (!labelUrl) {
    labelUrl = await getNimbuspostShippingLabel({
      email: c.env.NIMBUSPOST_EMAIL,
      password: c.env.NIMBUSPOST_PASSWORD,
      awb: shipment.awbNumber,
    })
    if (labelUrl) {
      await db.update(shipments).set({ labelUrl }).where(eq(shipments.id, shipment.id))
    }
  }

  return c.json({
    orderId,
    awbNumber: shipment.awbNumber,
    courierName: shipment.courierName,
    labelUrl: labelUrl ?? `https://api.nimbuspost.com/v1/shipments/label?awb=${encodeURIComponent(shipment.awbNumber)}`,
  })
})

// ADMIN API: Dispatch order to NimbusPost manually
app.post('/admin/:id/send-to-nimbuspost', requireAuth, requireRole('admin'), async (c) => {
  const orderId = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return c.json({ error: 'Order not found' }, 404)

  const [existingShipment] = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1)
  if (existingShipment && existingShipment.awbNumber) {
    return c.json({ error: 'Order has already been sent to NimbusPost', shipment: existingShipment })
  }

  const [address] = await db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1)
  if (!address) return c.json({ error: 'Delivery address for order not found' }, 400)

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

  try {
    const receiverName = address.receiverName || 'Valued Customer'
    const receiverPhone = address.receiverPhone || '9999999999'

    const shipmentData = await createNimbuspostShipment({
      email: c.env.NIMBUSPOST_EMAIL,
      password: c.env.NIMBUSPOST_PASSWORD,
      orderNumber: order.orderNumber,
      origin: STORE_ORIGIN,
      destination: {
        name: receiverName,
        phone: receiverPhone,
        address: `${address.line1}${address.line2 ? ', ' + address.line2 : ''}`,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      items: items.map((i) => ({ name: i.productName, qty: i.quantity, price: Number(i.unitPrice) })),
      codAmount: 0,
      paymentType: 'prepaid',
    })

    let labelUrl: string | null = null
    if (shipmentData.data.awb_number) {
      labelUrl = await getNimbuspostShippingLabel({
        email: c.env.NIMBUSPOST_EMAIL,
        password: c.env.NIMBUSPOST_PASSWORD,
        awb: shipmentData.data.awb_number,
      })
    }

    let createdShipment
    if (existingShipment) {
      ;[createdShipment] = await db
        .update(shipments)
        .set({
          nimbuspostShipmentId: shipmentData.data.shipment_id,
          awbNumber: shipmentData.data.awb_number,
          courierName: shipmentData.data.courier_name,
          status: 'booked',
          labelUrl,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, existingShipment.id))
        .returning()
    } else {
      ;[createdShipment] = await db
        .insert(shipments)
        .values({
          orderId,
          nimbuspostShipmentId: shipmentData.data.shipment_id,
          awbNumber: shipmentData.data.awb_number,
          courierName: shipmentData.data.courier_name,
          status: 'booked',
          labelUrl,
        })
        .returning()
    }

    await db
      .update(orders)
      .set({ status: 'shipped', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    return c.json({ success: true, shipment: createdShipment, awbNumber: shipmentData.data.awb_number })
  } catch (err) {
    console.error('NimbusPost shipment creation failed:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Failed to create NimbusPost shipment' }, 500)
  }
})

const statusSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']),
})

app.patch('/:id/status', requireAuth, requireRole('admin'), validateBody(statusSchema), async (c) => {
    const orderId = c.req.param('id')
    const { status } = c.get('validatedBody' as never) as z.infer<typeof statusSchema>
    const db = createDb(c.env.DATABASE_URL)
    const [updated] = await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId)).returning()
    if (!updated) return c.json({ error: 'Order not found' }, 404)
    return c.json({ order: updated })
  }
)

export default app
