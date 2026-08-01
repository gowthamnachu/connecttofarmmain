import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ZodTypeAny, z } from 'zod'

// Parses and validates the JSON body against a Zod schema, rejecting unknown/invalid
// payloads before they reach route handlers. Validated data is exposed via c.get('validatedBody').
export function validateBody<T extends ZodTypeAny>(schema: T) {
  const middleware: MiddlewareHandler<{ Variables: { validatedBody: z.infer<T> } }> = async (c, next) => {
    let json: unknown
    try {
      json = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Request body must be valid JSON' })
    }

    const result = schema.safeParse(json)
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Validation failed',
        cause: result.error.flatten(),
      })
    }

    c.set('validatedBody', result.data)
    await next()
  }
  return middleware
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  const middleware: MiddlewareHandler<{ Variables: { validatedQuery: z.infer<T> } }> = async (c, next) => {
    const result = schema.safeParse(c.req.query())
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Validation failed',
        cause: result.error.flatten(),
      })
    }
    c.set('validatedQuery', result.data)
    await next()
  }
  return middleware
}
