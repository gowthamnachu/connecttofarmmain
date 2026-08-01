import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import type { AppEnv } from '../types/bindings'

const app = new Hono<AppEnv>()

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

// Admin-only direct upload to R2 (product images, category art, farmer photos/certificates).
// Files are streamed straight to the Worker's R2 binding rather than the browser talking to R2 directly.
app.post('/upload', requireAuth, requireRole('admin'), async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: 'A file field is required' })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new HTTPException(400, { message: 'Only JPEG, PNG, or WebP images are allowed' })
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new HTTPException(400, { message: 'File exceeds 5MB limit' })
  }

  const extension = file.type.split('/')[1]
  const key = `uploads/${crypto.randomUUID()}.${extension}`

  await c.env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  return c.json({ key, url: `/media/${key}` }, 201)
})

// Serves the uploaded object back out (place a custom domain / public bucket in front of this in production).
app.get('/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.MEDIA_BUCKET.get(key)
  if (!object) return c.json({ error: 'Not found' }, 404)

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

export default app
