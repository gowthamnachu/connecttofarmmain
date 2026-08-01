import { Hono } from 'hono'
import { z } from 'zod'
import { rateLimit } from '../middleware/rateLimit'
import { validateQuery } from '../middleware/validate'
import { reverseGeocode, autocompleteAddress } from '../lib/olaMaps'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// Public (no login needed to detect/browse location, like a quick-commerce storefront),
// but rate-limited per IP since it proxies a paid third-party API.
app.use('*', rateLimit({ key: (c) => `maps:${c.req.header('CF-Connecting-IP') ?? 'unknown'}`, limit: 60, windowSeconds: 15 * 60 }))

// Thin server-side proxy so the Ola Maps API key never reaches the browser.
// Falls back gracefully if OLA_MAPS_API_KEY is unset or invalid in local dev.
app.get(
  '/reverse-geocode',
  validateQuery(z.object({ lat: z.coerce.number(), lng: z.coerce.number() })),
  async (c) => {
    const { lat, lng } = c.get('validatedQuery' as never) as { lat: number; lng: number }
    try {
      if (!c.env.OLA_MAPS_API_KEY || c.env.OLA_MAPS_API_KEY.includes('REPLACE')) {
        return c.json({ address: `${lat.toFixed(4)}°, ${lng.toFixed(4)}° (Hyderabad area)` })
      }
      const result = await reverseGeocode({ apiKey: c.env.OLA_MAPS_API_KEY, lat, lng })
      const address = result.results?.[0]?.formatted_address ?? `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`
      return c.json({ address })
    } catch (err) {
      console.warn('Ola Maps reverse-geocode error, using fallback coordinates:', err)
      return c.json({ address: `${lat.toFixed(4)}°, ${lng.toFixed(4)}° (Location detected)` })
    }
  }
)

app.get('/autocomplete', validateQuery(z.object({ input: z.string().min(2) })), async (c) => {
  const { input } = c.get('validatedQuery' as never) as { input: string }
  try {
    if (!c.env.OLA_MAPS_API_KEY || c.env.OLA_MAPS_API_KEY.includes('REPLACE')) {
      return c.json({ predictions: [] })
    }
    const result = await autocompleteAddress({ apiKey: c.env.OLA_MAPS_API_KEY, input })
    return c.json(result)
  } catch {
    return c.json({ predictions: [] })
  }
})

export default app
