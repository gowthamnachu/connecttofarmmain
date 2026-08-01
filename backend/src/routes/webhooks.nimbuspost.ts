import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { shipments, orders } from '../db/schema'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// Maps NimbusPost's tracking status strings to our internal order status.
const STATUS_MAP: Record<string, (typeof orders.$inferInsert)['status']> = {
  'in transit': 'shipped',
  shipped: 'shipped',
  'out for delivery': 'out_for_delivery',
  delivered: 'delivered',
  rto: 'returned',
}

app.post('/webhook', async (c) => {
  const secret = c.req.header('X-Webhook-Secret')
  if (secret !== c.env.NIMBUSPOST_WEBHOOK_SECRET) {
    return c.json({ error: 'Invalid webhook secret' }, 401)
  }

  const body = await c.req.json<{ awb: string; current_status: string; scan_detail?: Record<string, unknown>[] }>()
  const db = createDb(c.env.DATABASE_URL)

  const [shipment] = await db.select().from(shipments).where(eq(shipments.awbNumber, body.awb)).limit(1)
  if (!shipment) return c.json({ error: 'Shipment not found' }, 404)

  await db
    .update(shipments)
    .set({
      status: body.current_status,
      trackingEvents: body.scan_detail ?? shipment.trackingEvents,
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipment.id))

  const mappedStatus = STATUS_MAP[body.current_status.toLowerCase()]
  if (mappedStatus) {
    await db.update(orders).set({ status: mappedStatus, updatedAt: new Date() }).where(eq(orders.id, shipment.orderId))
  }

  return c.json({ received: true })
})

export default app
