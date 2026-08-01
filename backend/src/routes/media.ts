import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15MB limit

const localMediaCache = new Map<string, { buffer: ArrayBuffer; contentType: string }>()

app.post('/upload', requireAuth, requireRole('admin'), async (c) => {
  let form: FormData
  try {
    form = await c.req.formData()
  } catch (err) {
    throw new HTTPException(400, { message: `Invalid form upload data: ${err instanceof Error ? err.message : String(err)}` })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: 'A file field is required' })
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new HTTPException(400, { message: 'File exceeds 15MB limit' })
  }

  let extension = 'jpg'
  if (file.type && file.type.includes('/')) {
    extension = file.type.split('/')[1].replace('jpeg', 'jpg')
  } else if (file.name && file.name.includes('.')) {
    extension = file.name.split('.').pop() || 'jpg'
  }

  const key = `uploads/${crypto.randomUUID()}.${extension}`
  const arrayBuffer = await file.arrayBuffer()
  const contentType = file.type || 'image/jpeg'

  let r2Saved = false
  let r2Error: string | null = null

  if (c.env.MEDIA_BUCKET) {
    try {
      await c.env.MEDIA_BUCKET.put(key, arrayBuffer, {
        httpMetadata: { contentType },
      })
      r2Saved = true
    } catch (err) {
      r2Error = err instanceof Error ? err.message : String(err)
      console.error('Cloudflare R2 Bucket Upload Error:', err)
    }
  } else {
    r2Error = 'c.env.MEDIA_BUCKET binding is missing'
    console.error(r2Error)
  }

  localMediaCache.set(key, { buffer: arrayBuffer, contentType })

  const requestOrigin = new URL(c.req.url).origin
  const fullUrl = `${requestOrigin}/media/${key}`

  if (!r2Saved && r2Error) {
    console.warn(`Upload stored in local dev cache. R2 status: ${r2Error}`)
  }

  return c.json({ key, url: fullUrl, r2Saved, r2Error }, 201)
})

app.get('/:key{.+}', async (c) => {
  const key = c.req.param('key')

  if (c.env.MEDIA_BUCKET) {
    try {
      const object = await c.env.MEDIA_BUCKET.get(key)
      if (object) {
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
    } catch (err) {
      console.warn('R2 get object error:', err)
    }
  }

  const cached = localMediaCache.get(key)
  if (cached) {
    return new Response(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  return c.json({ error: 'Media file not found' }, 404)
})

export default app
