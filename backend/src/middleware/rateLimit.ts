import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types/bindings'

// Fixed-window rate limiter backed by Workers KV. Used for OTP requests and login
// attempts to blunt brute-force/abuse (e.g. 5 requests per 15 minutes per key).
export function rateLimit(options: { key: (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => string; limit: number; windowSeconds: number }): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const identifier = options.key(c)
    const kvKey = `ratelimit:${identifier}`

    const current = await c.env.RATE_LIMIT_KV.get(kvKey)
    const count = current ? parseInt(current, 10) : 0

    if (count >= options.limit) {
      throw new HTTPException(429, { message: 'Too many requests, please try again later' })
    }

    await c.env.RATE_LIMIT_KV.put(kvKey, String(count + 1), { expirationTtl: options.windowSeconds })
    await next()
  }
}
