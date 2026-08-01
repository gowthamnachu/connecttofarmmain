import { Hono } from 'hono'
import { z } from 'zod'
import { rateLimit } from '../middleware/rateLimit'
import { validateQuery } from '../middleware/validate'
import { reverseGeocode, autocompleteAddress } from '../lib/olaMaps'
import { getNimbuspostEdd } from '../lib/nimbuspost'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

// Public (no login needed to detect/browse location), rate-limited per IP
app.use('*', rateLimit({ key: (c) => `maps:${c.req.header('CF-Connecting-IP') ?? 'unknown'}`, limit: 60, windowSeconds: 15 * 60 }))

// Server-side proxy for Ola Maps reverse-geocode
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

// Ola Maps autocomplete address proxy
app.get('/autocomplete', validateQuery(z.object({ input: z.string().min(2) })), async (c) => {
  const { input } = c.get('validatedQuery' as never) as { input: string }
  try {
    if (!c.env.OLA_MAPS_API_KEY || c.env.OLA_MAPS_API_KEY.includes('REPLACE')) {
      // Mock predictions for local dev if Ola key isn't provided
      const mockMatches = [
        { description: `${input}, Jubilee Hills, Hyderabad, Telangana 500081`, place_id: 'ola_place_1', pincode: '500081' },
        { description: `${input}, Gachibowli, Hyderabad, Telangana 500032`, place_id: 'ola_place_2', pincode: '500032' },
        { description: `${input}, Banjara Hills, Hyderabad, Telangana 500034`, place_id: 'ola_place_3', pincode: '500034' },
        { description: `${input}, Hitec City, Hyderabad, Telangana 500081`, place_id: 'ola_place_4', pincode: '500081' },
      ]
      return c.json({ predictions: mockMatches })
    }
    const result = await autocompleteAddress({ apiKey: c.env.OLA_MAPS_API_KEY, input })
    return c.json(result)
  } catch {
    return c.json({ predictions: [] })
  }
})

// NimbusPost EDD (Estimated Delivery Date) Endpoint
app.get(
  '/edd',
  validateQuery(z.object({ pincode: z.string().optional() })),
  async (c) => {
    const { pincode } = c.get('validatedQuery' as never) as { pincode?: string }
    const targetPincode = pincode && /^\d{6}$/.test(pincode) ? pincode : '500081'
    const STORE_ORIGIN_PINCODE = '500074'

    const result = await getNimbuspostEdd({
      email: c.env.NIMBUSPOST_EMAIL,
      password: c.env.NIMBUSPOST_PASSWORD,
      originPincode: STORE_ORIGIN_PINCODE,
      deliveryPincode: targetPincode,
    })

    return c.json(result)
  }
)

export default app
