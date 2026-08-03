import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { shipments, orders } from '../db/schema'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// Maps NimbusPost's tracking status strings to our internal order status.
const STATUS_MAP: Record<string, (typeof orders.$inferInsert)['status']> = {
  'in transit': 'shipped',
  intransit: 'shipped',
  shipped: 'shipped',
  dispatched: 'shipped',
  'out for delivery': 'out_for_delivery',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  rto: 'returned',
  returned: 'returned',
  cancelled: 'cancelled',
  canceled: 'cancelled',
}

app.post('/webhook', async (c) => {
  // Validate webhook secret header
  const secret = c.req.header('X-Webhook-Secret')
  if (!c.env.NIMBUSPOST_WEBHOOK_SECRET || secret !== c.env.NIMBUSPOST_WEBHOOK_SECRET) {
    return c.json({ error: 'Invalid or missing webhook secret' }, 401)
  }

  let body: Record<string, unknown>
  try {
    body = (await c.req.json()) as Record<string, unknown>
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  // Support field aliases for AWB number and status
  const awb = (body.awb || body.awb_number || body.awb_no) as string | undefined
  const currentStatus = (body.current_status || body.status || body.history_status) as string | undefined
  const scanDetail = (body.scan_detail || body.scans || body.history) as Record<string, unknown>[] | undefined

  if (!awb) {
    return c.json({ error: 'Missing AWB number in payload' }, 400)
  }

  const db = createDb(c.env.DATABASE_URL)

  const [shipment] = await db.select().from(shipments).where(eq(shipments.awbNumber, awb)).limit(1)
  if (!shipment) return c.json({ error: 'Shipment not found' }, 404)

  const incomingLabelUrl = (body.label_url || body.label || body.shipping_label || body.pdf_url) as string | undefined
  const statusToSave = currentStatus || shipment.status

  const updatePayload: Record<string, unknown> = {
    status: statusToSave,
    trackingEvents: scanDetail ?? shipment.trackingEvents,
    updatedAt: new Date(),
  }

  if (incomingLabelUrl && typeof incomingLabelUrl === 'string' && incomingLabelUrl.startsWith('http')) {
    updatePayload.labelUrl = incomingLabelUrl
  }

  await db
    .update(shipments)
    .set(updatePayload)
    .where(eq(shipments.id, shipment.id))

  if (currentStatus) {
    const mappedStatus = STATUS_MAP[currentStatus.toLowerCase().trim()]
    if (mappedStatus) {
      await db.update(orders).set({ status: mappedStatus, updatedAt: new Date() }).where(eq(orders.id, shipment.orderId))
    }
  }

  return c.json({ received: true })
})

export default app

