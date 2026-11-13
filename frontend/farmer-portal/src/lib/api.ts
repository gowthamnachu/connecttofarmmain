const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export type FarmerAuthResponse = {
  accessToken: string
  refreshToken: string
  farmer: { id: string; name: string; phone?: string; certificationStatus: string; village?: string }
}

export type FarmerProduct = {
  id: string
  categoryId?: string
  name: string
  slug: string
  description?: string | null
  price: string
  unit: string
  stock: number
  images: string[]
  harvestDate?: string | null
  gradeTag?: string | null
  processTag?: string | null
  isCertifiedNoPesticides: boolean
  isActive: boolean
  createdAt: string
}

export type ProductDraft = {
  name?: string
  categoryId?: string
  categoryName?: string
  stock?: number
  unit?: string
  price?: string
  harvestDate?: string
  gradeTag?: string
  description?: string
}

export type VoiceChatResponse = {
  transcript: string
  englishSummary: string
  teluguReply: string
  audioBase64: string | null
  updatedDraft: ProductDraft
  isComplete: boolean
  isConfirmed: boolean
  createdProduct?: FarmerProduct | null
}

export function saveSession(auth: FarmerAuthResponse) {
  localStorage.setItem('accessToken', auth.accessToken)
  localStorage.setItem('refreshToken', auth.refreshToken)
  localStorage.setItem('farmer', JSON.stringify(auth.farmer))
}

export function getSession(): FarmerAuthResponse | null {
  const accessToken = localStorage.getItem('accessToken')
  const farmerRaw = localStorage.getItem('farmer')
  const refreshToken = localStorage.getItem('refreshToken') || ''
  if (!accessToken || !farmerRaw) return null
  return {
    accessToken,
    refreshToken,
    farmer: JSON.parse(farmerRaw) as FarmerAuthResponse['farmer'],
  }
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('farmer')
}

// Auto-refreshing fetch wrapper that recovers from expired tokens seamlessly
async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = getSession()
  if (!session?.accessToken) {
    clearSession()
    window.dispatchEvent(new CustomEvent('farmer:unauthorized'))
    throw new Error('Please sign in to continue')
  }

  const makeReq = (token: string) => {
    const headers = new Headers(options.headers || {})
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  }

  let res: Response
  try {
    res = await makeReq(session.accessToken)
  } catch {
    // If backend was temporarily reloading (hot reload), retry once
    await new Promise((resolve) => setTimeout(resolve, 800))
    res = await makeReq(session.accessToken)
  }

  // If worker returned 503 during reload, retry once
  if (res.status === 503) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    res = await makeReq(session.accessToken)
  }

  // If 401, attempt silent refresh using the 30-day refreshToken
  if (res.status === 401 && session.refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/farmer/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })

      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { accessToken: string }
        session.accessToken = data.accessToken
        saveSession(session)
        // Retry the original request with new token
        res = await makeReq(data.accessToken)
      } else {
        clearSession()
        window.dispatchEvent(new CustomEvent('farmer:unauthorized'))
        throw new Error('Session expired. Please log in again.')
      }
    } catch {
      clearSession()
      window.dispatchEvent(new CustomEvent('farmer:unauthorized'))
      throw new Error('Session expired. Please log in again.')
    }
  }

  if (res.status === 401) {
    clearSession()
    window.dispatchEvent(new CustomEvent('farmer:unauthorized'))
    throw new Error('Session expired. Please log in again.')
  }

  return res
}

export async function farmerLogin(phone: string, password: string): Promise<FarmerAuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/farmer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Login failed')
  }

  return res.json()
}

export async function fetchFarmerProducts(_ignoredToken?: string): Promise<FarmerProduct[]> {
  const res = await authenticatedFetch('/farmers/me/products')
  if (!res.ok) throw new Error('Failed to load products')
  const data = (await res.json()) as { products: FarmerProduct[] }
  return data.products
}

export async function updateProductStock(
  _ignoredToken: string,
  productId: string,
  stock: number
): Promise<FarmerProduct> {
  const res = await authenticatedFetch(`/farmers/me/products/${productId}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock }),
  })
  if (!res.ok) throw new Error('Failed to update stock')
  const data = (await res.json()) as { product: FarmerProduct }
  return data.product
}

export async function createFarmerProduct(
  _ignoredToken: string,
  productData: ProductDraft
): Promise<FarmerProduct> {
  const res = await authenticatedFetch('/farmers/me/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: productData.name,
      categoryId: productData.categoryId,
      price: productData.price,
      unit: productData.unit || 'kg',
      stock: productData.stock || 0,
      description: productData.description,
      harvestDate: productData.harvestDate,
      gradeTag: productData.gradeTag || 'Grade A',
    }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Failed to create product')
  }

  const data = (await res.json()) as { product: FarmerProduct }
  return data.product
}

export async function sendVoiceChat(
  _ignoredToken: string,
  options: {
    audioBlob?: Blob
    text?: string
    draft?: ProductDraft
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
): Promise<VoiceChatResponse> {
  let body: FormData | string
  const headers: Record<string, string> = {}

  if (options.audioBlob) {
    const rawType = options.audioBlob.type || 'audio/webm'
    const cleanType = rawType.split(';')[0].trim() || 'audio/webm'
    const cleanBlob = new Blob([await options.audioBlob.arrayBuffer()], { type: cleanType })
    const formData = new FormData()
    formData.append('audio', cleanBlob, 'farmer_speech.webm')
    if (options.draft) formData.append('draft', JSON.stringify(options.draft))
    if (options.text) formData.append('text', options.text)
    if (options.history) formData.append('history', JSON.stringify(options.history))
    body = formData
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({
      text: options.text || '',
      draft: options.draft || {},
      history: options.history || [],
    })
  }

  const res = await authenticatedFetch('/farmers/voice/chat', {
    method: 'POST',
    headers,
    body,
  })

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(errData.error ?? 'Voice chat failed')
  }

  return res.json()
}

export type CategoryItem = {
  id: string
  name: string
  slug: string
  iconUrl?: string | null
  bannerUrl?: string | null
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch(`${API_BASE_URL}/categories`)
  if (!res.ok) return []
  const data = (await res.json().catch(() => ({ categories: [] }))) as { categories: CategoryItem[] }
  return data.categories || []
}

export type FarmerProfile = {
  id: string
  name: string
  phone: string
  certificationStatus?: string
  certifiedByConnectToFarm?: boolean
  village?: string
  district?: string
  state?: string
  landAreaAcres?: string
  experienceYears?: number
  upiId?: string
  bio?: string
}

export async function fetchFarmerProfile(): Promise<FarmerProfile | null> {
  const res = await authenticatedFetch('/farmers/me')
  if (!res.ok) return null
  const data = (await res.json().catch(() => ({}))) as { farmer: FarmerProfile }
  return data.farmer || null
}
