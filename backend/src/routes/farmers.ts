import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { farmers, products, categories } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import type { AppEnv } from '../types/bindings'
import {
  sarvamTranscribe,
  sarvamTextToSpeech,
  sarvamDialogueAgent,
  INDIC_CROPS,
  type SarvamDraftProduct,
} from '../lib/sarvam'

const app = new Hono<AppEnv>()

const phoneField = z.preprocess(
  (val) => (typeof val === 'string' ? val.replace(/[\s()-]/g, '') : val),
  z.string().regex(/^\+?[0-9]{10,15}$/, 'Phone must be 10-15 digits, optionally starting with +'),
)

// Enterprise farmer onboarding schema with complete profile entities
const onboardSchema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.number().int().min(18).max(100).optional(),
  phone: phoneField,
  photoUrl: z.string().url().or(z.literal('')).optional(),
  bannerUrl: z.string().url().or(z.literal('')).optional(),
  bio: z.string().trim().max(1000).optional(),
  area: z.string().trim().max(150).optional(),
  village: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  pincode: z.string().trim().max(10).optional(),
  landAreaAcres: z.number().positive().optional(),
  experienceYears: z.number().int().min(0).optional(),
  upiId: z.string().trim().max(100).optional(),
  certifiedByConnectToFarm: z.boolean().default(true),
})

function generateTempPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10)
}

// Public: allows customer app to display farmers with photos, bio, village, and certification
app.get('/public', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db
    .select({
      id: farmers.id,
      name: farmers.name,
      age: farmers.age,
      phone: farmers.phone,
      photoUrl: farmers.photoUrl,
      bannerUrl: farmers.bannerUrl,
      bio: farmers.bio,
      area: farmers.area,
      village: farmers.village,
      district: farmers.district,
      state: farmers.state,
      pincode: farmers.pincode,
      landAreaAcres: farmers.landAreaAcres,
      experienceYears: farmers.experienceYears,
      certificationStatus: farmers.certificationStatus,
      certifiedByConnectToFarm: farmers.certifiedByConnectToFarm,
    })
    .from(farmers)
    .where(eq(farmers.isActive, true))
  return c.json({ farmers: rows })
})

app.get('/', requireAuth, requireRole('admin'), async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(farmers)
  return c.json({ farmers: rows.map(({ passwordHash: _passwordHash, ...rest }) => rest) })
})

// Admin onboards a farmer with complete profile metadata
app.post('/', requireAuth, requireRole('admin'), validateBody(onboardSchema), async (c) => {
  const data = c.get('validatedBody' as never) as z.infer<typeof onboardSchema>
  const db = createDb(c.env.DATABASE_URL)
  const auth = c.get('auth')

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const [created] = await db
    .insert(farmers)
    .values({
      ...data,
      landAreaAcres: data.landAreaAcres ? data.landAreaAcres.toString() : undefined,
      passwordHash,
      createdBy: auth.id,
    })
    .returning()

  const { passwordHash: _passwordHash, ...safeFarmer } = created
  return c.json({ farmer: safeFarmer, tempPassword }, 201)
})

app.put('/:id', requireAuth, requireRole('admin'), validateBody(onboardSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.get('validatedBody' as never) as Partial<z.infer<typeof onboardSchema>>
  const db = createDb(c.env.DATABASE_URL)

  const [updated] = await db
    .update(farmers)
    .set({
      ...(data.name ? { name: data.name } : {}),
      ...(data.age !== undefined ? { age: data.age } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl || null } : {}),
      ...(data.bannerUrl !== undefined ? { bannerUrl: data.bannerUrl || null } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.area !== undefined ? { area: data.area } : {}),
      ...(data.village !== undefined ? { village: data.village } : {}),
      ...(data.district !== undefined ? { district: data.district } : {}),
      ...(data.state !== undefined ? { state: data.state } : {}),
      ...(data.pincode !== undefined ? { pincode: data.pincode } : {}),
      ...(data.landAreaAcres !== undefined ? { landAreaAcres: data.landAreaAcres.toString() } : {}),
      ...(data.experienceYears !== undefined ? { experienceYears: data.experienceYears } : {}),
      ...(data.upiId !== undefined ? { upiId: data.upiId } : {}),
      ...(data.certifiedByConnectToFarm !== undefined ? { certifiedByConnectToFarm: data.certifiedByConnectToFarm } : {}),
      updatedAt: new Date(),
    })
    .where(eq(farmers.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Farmer not found' }, 404)
  const { passwordHash: _passwordHash, ...safeFarmer } = updated
  return c.json({ farmer: safeFarmer })
})

app.patch(
  '/:id/certification',
  requireAuth,
  requireRole('admin'),
  validateBody(z.object({ status: z.enum(['pending', 'certified', 'rejected']) })),
  async (c) => {
    const id = c.req.param('id')
    const { status } = c.get('validatedBody' as never) as { status: 'pending' | 'certified' | 'rejected' }
    const db = createDb(c.env.DATABASE_URL)
    const [updated] = await db
      .update(farmers)
      .set({ certificationStatus: status, updatedAt: new Date() })
      .where(eq(farmers.id, id))
      .returning()
    if (!updated) return c.json({ error: 'Farmer not found' }, 404)
    const { passwordHash: _passwordHash, ...safeFarmer } = updated
    return c.json({ farmer: safeFarmer })
  }
)

app.patch('/:id/reset-password', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)
  const [updated] = await db.update(farmers).set({ passwordHash }).where(eq(farmers.id, id)).returning()
  if (!updated) return c.json({ error: 'Farmer not found' }, 404)
  return c.json({ tempPassword })
})

app.get('/me', requireAuth, requireRole('farmer'), async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const [farmer] = await db.select().from(farmers).where(eq(farmers.id, auth.id)).limit(1)
  if (!farmer) return c.json({ error: 'Farmer not found' }, 404)
  const { passwordHash: _passwordHash, ...safeFarmer } = farmer
  return c.json({ farmer: safeFarmer })
})

app.get('/me/products', requireAuth, requireRole('farmer'), async (c) => {
  const auth = c.get('auth')
  const db = createDb(c.env.DATABASE_URL)
  const rows = await db.select().from(products).where(eq(products.farmerId, auth.id))
  return c.json({ products: rows })
})

app.patch(
  '/me/products/:id/stock',
  requireAuth,
  requireRole('farmer'),
  validateBody(z.object({ stock: z.number().int().min(0) })),
  async (c) => {
    const auth = c.get('auth')
    const productId = c.req.param('id')
    const { stock } = c.get('validatedBody' as never) as { stock: number }
    const db = createDb(c.env.DATABASE_URL)

    const [updated] = await db
      .update(products)
      .set({ stock, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.farmerId, auth.id)))
      .returning()

    if (!updated) return c.json({ error: 'Product not found' }, 404)
    return c.json({ product: updated })
  }
)

const farmerCreateProductSchema = z.object({
  name: z.string().trim().min(2).max(150),
  categoryId: z.string().uuid().optional(),
  price: z.preprocess((val) => String(val).replace(/[^\d.]/g, ''), z.string().min(1)),
  unit: z.string().min(1).max(20).default('kg'),
  stock: z.preprocess((val) => Math.floor(Number(val) || 0), z.number().int().min(0)),
  description: z.string().max(2000).optional(),
  harvestDate: z.string().max(50).optional(),
  gradeTag: z.string().max(100).optional(),
  processTag: z.string().max(150).optional(),
  images: z.array(z.string().url()).default([]),
})

function createProductSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'product'
  return `${base}-${Date.now().toString(36)}`
}

app.post(
  '/me/products',
  requireAuth,
  requireRole('farmer'),
  validateBody(farmerCreateProductSchema),
  async (c) => {
    const auth = c.get('auth')
    const data = c.get('validatedBody' as never) as z.infer<typeof farmerCreateProductSchema>
    const db = createDb(c.env.DATABASE_URL)

    // Ensure category ID is valid
    let categoryId = data.categoryId
    if (!categoryId) {
      const activeCats = await db.select({ id: categories.id, slug: categories.slug }).from(categories).where(eq(categories.isActive, true))
      categoryId = activeCats[0]?.id
    }

    const slug = createProductSlug(data.name)
    const matchedCropDef = INDIC_CROPS.find((crop) => crop.name === data.name || data.name.includes(crop.teluguShort))
    const defaultImages = data.images && data.images.length > 0 ? data.images : (matchedCropDef?.defaultImage ? [matchedCropDef.defaultImage] : [])

    const [created] = await db
      .insert(products)
      .values({
        ...data,
        categoryId: categoryId!,
        slug,
        farmerId: auth.id,
        isCertifiedNoPesticides: true,
        isActive: true,
        images: defaultImages,
      })
      .returning()

    console.log('[POST /me/products] Successfully created product:', created.id, created.name)
    return c.json({ product: created }, 201)
  }
)

app.post('/voice/chat', requireAuth, requireRole('farmer'), async (c) => {
  const auth = c.get('auth')
  const apiKey = c.env.SARVAM_API_KEY
  if (!apiKey) {
    return c.json({ error: 'SARVAM_API_KEY is not configured on the server' }, 500)
  }

  const db = createDb(c.env.DATABASE_URL)
  const allCategories = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.isActive, true))

  let farmerText = ''
  let currentDraft: SarvamDraftProduct = {}
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = []

  const contentType = c.req.header('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData()
    const audioEntry = formData.get('audio')
    const textEntry = formData.get('text')
    const draftJson = formData.get('draft')
    const historyJson = formData.get('history')

    if (draftJson && typeof draftJson === 'string') {
      try {
        currentDraft = JSON.parse(draftJson)
      } catch { }
    }

    if (historyJson && typeof historyJson === 'string') {
      try {
        history = JSON.parse(historyJson)
      } catch { }
    }

    if (textEntry && typeof textEntry === 'string' && textEntry.trim()) {
      farmerText = textEntry.trim()
    } else if (audioEntry && audioEntry instanceof Blob) {
      try {
        farmerText = await sarvamTranscribe(apiKey, audioEntry, 'farmer_speech.webm')
      } catch (err) {
        console.error('STT error during voice chat:', err)
        farmerText = ''
      }
    }
  } else {
    const body = (await c.req.json().catch(() => ({}))) as {
      text?: string
      draft?: SarvamDraftProduct
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    }
    farmerText = (body.text || '').trim()
    currentDraft = body.draft || {}
    history = body.history || []
  }

  if (!farmerText) {
    const fallbackAudio = await sarvamTextToSpeech(apiKey, 'మీ మాట వినపడలేదు, దయచేసి మళ్లీ మాట్లాడండి.')
    return c.json({
      transcript: '',
      englishSummary: 'Could not hear clearly. Please speak your crop details again.',
      teluguReply: 'మీ మాట వినపడలేదు, దయచేసి మళ్లీ మాట్లాడండి.',
      audioBase64: fallbackAudio,
      updatedDraft: currentDraft,
      isComplete: false,
      isConfirmed: false,
      createdProduct: null,
    })
  }

  // Run dialogue understanding and slot filling with memory and Indic entity recognition
  const dialogueResult = await sarvamDialogueAgent(apiKey, farmerText, currentDraft, allCategories, history)

  // Ensure categoryId and categoryName are filled
  if (!dialogueResult.updatedDraft.categoryId && allCategories.length > 0) {
    dialogueResult.updatedDraft.categoryId = allCategories[0].id
    dialogueResult.updatedDraft.categoryName = allCategories[0].name
  } else if (dialogueResult.updatedDraft.categoryId && !dialogueResult.updatedDraft.categoryName) {
    const matched = allCategories.find((c) => c.id === dialogueResult.updatedDraft.categoryId)
    if (matched) dialogueResult.updatedDraft.categoryName = matched.name
  }

  console.log('[voice/chat] Turn summary:', {
    text: farmerText,
    isConfirmed: dialogueResult.isConfirmed,
    isComplete: dialogueResult.isComplete,
    crop: dialogueResult.updatedDraft.name,
    stock: dialogueResult.updatedDraft.stock,
    price: dialogueResult.updatedDraft.price,
  })

  let createdProduct = null

  // If the product details are complete and the farmer confirmed, auto-save to database
  if (
    dialogueResult.isConfirmed &&
    dialogueResult.updatedDraft.name &&
    dialogueResult.updatedDraft.stock &&
    dialogueResult.updatedDraft.price
  ) {
    try {
      const cleanPrice = String(dialogueResult.updatedDraft.price).replace(/[^\d.]/g, '') || '0'
      const cleanStock = Math.floor(Number(dialogueResult.updatedDraft.stock) || 0)
      const catId = dialogueResult.updatedDraft.categoryId || allCategories[0]?.id

      const slug = createProductSlug(dialogueResult.updatedDraft.name)
      const matchedCropDef = INDIC_CROPS.find((c) => c.name === dialogueResult.updatedDraft.name)
      const cropImages = matchedCropDef?.defaultImage ? [matchedCropDef.defaultImage] : []

      const [saved] = await db
        .insert(products)
        .values({
          name: dialogueResult.updatedDraft.name,
          categoryId: catId,
          farmerId: auth.id,
          slug,
          stock: cleanStock,
          unit: dialogueResult.updatedDraft.unit || 'kg',
          price: cleanPrice,
          description:
            dialogueResult.updatedDraft.description ||
            `${dialogueResult.updatedDraft.name} harvested freshly and listed by certified farmer.`,
          harvestDate: dialogueResult.updatedDraft.harvestDate || new Date().toISOString().split('T')[0],
          gradeTag: dialogueResult.updatedDraft.gradeTag || 'Grade A',
          isCertifiedNoPesticides: true,
          isActive: true,
          images: cropImages,
        })
        .returning()
      createdProduct = saved
      console.log('[voice/chat] Successfully auto-saved product:', createdProduct.id, createdProduct.name)
    } catch (saveErr) {
      console.error('[voice/chat] Auto-save error:', saveErr)
    }
  }

  // Synthesize Telugu voice reply
  const audioBase64 = await sarvamTextToSpeech(apiKey, dialogueResult.teluguReply)

  return c.json({
    transcript: farmerText,
    englishSummary: dialogueResult.englishSummary,
    teluguReply: dialogueResult.teluguReply,
    audioBase64,
    updatedDraft: dialogueResult.updatedDraft,
    isComplete: dialogueResult.isComplete,
    isConfirmed: dialogueResult.isConfirmed,
    createdProduct,
  })
})

export default app
