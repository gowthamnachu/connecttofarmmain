const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type AdminAuthResponse = {
  accessToken: string
  refreshToken: string
  admin: { id: string; name: string; role: string }
}

export type Category = {
  id: string
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
}

export type Farmer = {
  id: string
  name: string
  age: number | null
  phone: string
  photoUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null
  area?: string | null
  village: string | null
  district: string | null
  state: string | null
  pincode?: string | null
  landAreaAcres?: string | number | null
  experienceYears?: number | null
  upiId?: string | null
  certificationStatus: 'pending' | 'certified' | 'rejected'
  certifiedByConnectToFarm: boolean
  isActive: boolean
}

export type Product = {
  id: string
  categoryId: string
  farmerId: string
  name: string
  slug: string
  description: string | null
  price: string
  unit: string
  stock: number
  images: string[]
  harvestDate?: string | null
  gradeTag?: string | null
  processTag?: string | null
  isCertifiedNoPesticides?: boolean
  isActive: boolean
  farmerName?: string
  categoryName?: string
}

export type Order = {
  id: string
  orderNumber: string
  userId: string
  status: string
  total: string
  paymentStatus: string
  createdAt: string
  shipment?: {
    id: string
    nimbuspostShipmentId?: string | null
    awbNumber?: string | null
    courierName?: string | null
    status?: string
    labelUrl?: string | null
  } | null
  address?: {
    label?: string
    receiverName?: string | null
    receiverPhone?: string | null
    line1?: string
    line2?: string | null
    city?: string
    state?: string
    pincode?: string
  } | null
}

function formatErrorBody(body: { error?: string; details?: { fieldErrors?: Record<string, string[]> } }): string {
  const fieldErrors = body.details?.fieldErrors
  if (fieldErrors) {
    const messages = Object.entries(fieldErrors)
      .filter(([, msgs]) => msgs && msgs.length > 0)
      .map(([field, msgs]) => `${field}: ${msgs![0]}`)
    if (messages.length > 0) return messages.join('; ')
  }
  return body.error ?? 'Request failed'
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadJson) as { exp?: number }
    if (!payload.exp) return false
    return payload.exp * 1000 <= Date.now() + 5000
  } catch {
    return true
  }
}

async function authFetch(path: string, options: RequestInit = {}) {
  const session = getSession()
  if (!session) {
    clearSession()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new Error('Session expired, please log in again')
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...options.headers,
    },
  })

  if (res.status === 401) {
    clearSession()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new Error('Session expired, please log in again')
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: { fieldErrors?: Record<string, string[]> } }
    throw new Error(formatErrorBody(body))
  }
  return res
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const session = getSession()
  if (!session) {
    clearSession()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new Error('Session expired, please log in again')
  }

  const res = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: formData,
  })

  if (res.status === 401) {
    clearSession()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new Error('Session expired, please log in again')
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    throw new Error(body.message || body.error || `Image upload failed (${res.status})`)
  }

  const json = (await res.json()) as { url: string }
  return json.url
}

export async function adminLogin(phone: string, password: string): Promise<AdminAuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
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

export async function getCategories(): Promise<Category[]> {
  const res = await authFetch('/categories/admin/all')
  return (await res.json() as { categories: Category[] }).categories
}

export async function createCategory(data: { name: string; slug: string; sortOrder: number }): Promise<Category> {
  const res = await authFetch('/categories', { method: 'POST', body: JSON.stringify(data) })
  return (await res.json() as { category: Category }).category
}

export async function updateCategory(id: string, data: Partial<{ name: string; slug: string; sortOrder: number; isActive: boolean }>): Promise<Category> {
  const res = await authFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return (await res.json() as { category: Category }).category
}

export async function deleteCategory(id: string, permanent: boolean = false): Promise<void> {
  await authFetch(`/categories/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' })
}

export async function getFarmers(): Promise<Farmer[]> {
  const res = await authFetch('/farmers')
  return (await res.json() as { farmers: Farmer[] }).farmers
}

export async function onboardFarmer(data: {
  name: string
  age?: number
  phone: string
  photoUrl?: string
  bannerUrl?: string
  bio?: string
  area?: string
  village?: string
  district?: string
  state?: string
  pincode?: string
  landAreaAcres?: number
  experienceYears?: number
  upiId?: string
  certifiedByConnectToFarm?: boolean
}): Promise<{ farmer: Farmer; tempPassword: string }> {
  const res = await authFetch('/farmers', { method: 'POST', body: JSON.stringify(data) })
  return res.json()
}

export async function updateFarmer(
  farmerId: string,
  data: Partial<{
    name: string
    age: number
    phone: string
    photoUrl: string
    bannerUrl: string
    bio: string
    area: string
    village: string
    district: string
    state: string
    pincode: string
    landAreaAcres: number
    experienceYears: number
    upiId: string
    certifiedByConnectToFarm: boolean
  }>
): Promise<{ farmer: Farmer }> {
  const res = await authFetch(`/farmers/${farmerId}`, { method: 'PUT', body: JSON.stringify(data) })
  return res.json()
}

export async function updateFarmerCertification(farmerId: string, status: 'pending' | 'certified' | 'rejected'): Promise<{ farmer: Farmer }> {
  const res = await authFetch(`/farmers/${farmerId}/certification`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return res.json()
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products`)
  if (!res.ok) throw new Error('Could not load products')
  return (await res.json() as { products: Product[] }).products
}

export async function getAdminProducts(): Promise<Product[]> {
  const res = await authFetch('/products/admin/all')
  return (await res.json() as { products: Product[] }).products
}

export async function createProduct(data: {
  categoryId: string
  farmerId: string
  name: string
  slug: string
  description?: string
  price: string
  unit: string
  stock: number
  images: string[]
  harvestDate?: string
  gradeTag?: string
  processTag?: string
  isCertifiedNoPesticides?: boolean
}): Promise<Product> {
  const res = await authFetch('/products', { method: 'POST', body: JSON.stringify(data) })
  return (await res.json() as { product: Product }).product
}

export async function updateProductPatch(
  productId: string,
  data: {
    stock?: number
    price?: string
    isActive?: boolean
    name?: string
    unit?: string
    harvestDate?: string
    gradeTag?: string
    processTag?: string
    isCertifiedNoPesticides?: boolean
  }
): Promise<Product> {
  const res = await authFetch(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return (await res.json() as { product: Product }).product
}

export async function deleteProduct(productId: string): Promise<void> {
  await authFetch(`/products/${productId}`, { method: 'DELETE' })
}

export async function getAdminOrders(): Promise<Order[]> {
  const res = await authFetch('/orders/admin/all')
  return (await res.json() as { orders: Order[] }).orders
}

export async function downloadOfficialNimbuspostLabel(orderId: string): Promise<void> {
  const session = getSession()
  if (!session) throw new Error('Session expired, please log in again')

  const res = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/label`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!res.ok) {
    let errMessage = 'Could not fetch shipping label from NimbusPost'
    try {
      const errJson = (await res.json()) as { error?: string }
      if (errJson.error) errMessage = errJson.error
    } catch {
      // ignore
    }
    throw new Error(errMessage)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await res.json()) as { labelUrl?: string }
    if (json.labelUrl) {
      window.open(json.labelUrl, '_blank')
      return
    }
  }

  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank')
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await authFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return (await res.json() as { order: Order }).order
}

export async function sendOrderToNimbuspost(orderId: string): Promise<{ success: boolean; awbNumber: string }> {
  const res = await authFetch(`/orders/admin/${orderId}/send-to-nimbuspost`, {
    method: 'POST',
  })
  return res.json()
}

export function saveSession(auth: AdminAuthResponse) {
  localStorage.setItem('accessToken', auth.accessToken)
  localStorage.setItem('refreshToken', auth.refreshToken)
  localStorage.setItem('admin', JSON.stringify(auth.admin))
}

export function getSession() {
  const accessToken = localStorage.getItem('accessToken')
  const adminRaw = localStorage.getItem('admin')
  if (!accessToken || !adminRaw) return null
  if (isTokenExpired(accessToken)) {
    clearSession()
    return null
  }
  try {
    return { accessToken, admin: JSON.parse(adminRaw) as AdminAuthResponse['admin'] }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('admin')
}
