import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv, Role } from '../types/bindings'

// Must run after requireAuth. Restricts a route to specific roles (customer/farmer/admin).
export function requireRole(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const auth = c.get('auth')
    if (!auth || !roles.includes(auth.role)) {
      throw new HTTPException(403, { message: 'Insufficient permissions' })
    }
    await next()
  }
}
