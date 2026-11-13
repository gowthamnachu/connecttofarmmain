import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../lib/jwt'
import type { AppEnv } from '../types/bindings'

// Verifies the access token (Authorization: Bearer <token> or `access_token` cookie)
// and attaches the caller's identity/role to context. Never trust client-supplied roles.
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization')
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const cookieToken = getCookie(c, 'access_token')
  const token = bearerToken ?? cookieToken

  if (!token) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  try {
    const payload = await verifyToken(c.env.JWT_SECRET, token)
    c.set('auth', { id: payload.sub, role: payload.role, phone: payload.phone })
  } catch (err) {
    console.error('requireAuth verifyToken error:', err, 'Token was:', token ? token.slice(0, 20) : 'none')
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }

  await next()
}
