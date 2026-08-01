import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { orders } from '../db/schema'
import { verifyRazorpayWebhookSignature } from '../lib/razorpay'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// Async backstop for payment confirmation in case the client never calls
// /orders/:id/confirm-payment (e.g. app closed mid-checkout). Always verify the signature.
app.post('/webhook', async (c) => {
  const rawBody = await c.req.text()
  const signature = c.req.header('X-Razorpay-Signature')

  if (!signature) return c.json({ error: 'Missing signature' }, 400)

  const isValid = await verifyRazorpayWebhookSignature({
    webhookSecret: c.env.RAZORPAY_WEBHOOK_SECRET,
    rawBody,
    signature,
  })
  if (!isValid) return c.json({ error: 'Invalid signature' }, 401)

  const payload = JSON.parse(rawBody) as {
    event: string
    payload: { payment: { entity: { order_id: string; id: string } } }
  }

  if (payload.event === 'payment.captured') {
    const db = createDb(c.env.DATABASE_URL)
    const { order_id: razorpayOrderId, id: razorpayPaymentId } = payload.payload.payment.entity
    await db
      .update(orders)
      .set({ paymentStatus: 'paid', status: 'confirmed', razorpayPaymentId, updatedAt: new Date() })
      .where(eq(orders.razorpayOrderId, razorpayOrderId))
  }

  return c.json({ received: true })
})

export default app
