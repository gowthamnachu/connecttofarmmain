import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from './types/bindings'

import authAdmin from './routes/auth.admin'
import authFarmer from './routes/auth.farmer'
import authCustomer from './routes/auth.customer'
import categories from './routes/categories'
import products from './routes/products'
import farmers from './routes/farmers'
import cart from './routes/cart'
import addresses from './routes/addresses'
import orders from './routes/orders'
import payments from './routes/payments'
import webhooksNimbuspost from './routes/webhooks.nimbuspost'
import maps from './routes/maps'
import media from './routes/media'

const app = new Hono<AppEnv>()

app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    // Restrict to the three known frontend origins per environment; never use a wildcard
    // since requests carry bearer tokens / cookies.
    origin: [
      'http://localhost:5173', // customer-app (dev)
      'http://localhost:5174', // farmer-portal (dev)
      'http://localhost:5175', // admin-portal (dev)
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature', 'X-Webhook-Secret'],
    credentials: true,
  })
)

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth/admin', authAdmin)
app.route('/auth/farmer', authFarmer)
app.route('/auth/customer', authCustomer)
app.route('/categories', categories)
app.route('/products', products)
app.route('/farmers', farmers)
app.route('/cart', cart)
app.route('/addresses', addresses)
app.route('/orders', orders)
app.route('/payments', payments)
app.route('/webhooks/nimbuspost', webhooksNimbuspost)
app.route('/maps', maps)
app.route('/media', media)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message, details: (err.cause as unknown) ?? undefined }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
