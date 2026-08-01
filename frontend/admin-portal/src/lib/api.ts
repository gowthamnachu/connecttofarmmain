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
  village: string | null
  district: string | null
  state: string | null
  certificationStatus: 'pending' | 'certified' | 'rejected'
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
  isActive: boolean
}

export type Order = {
  id: string
  orderNumber: string
  userId: string
  status: string
  total: string
  paymentStatus: string
  createdAt: string
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

async function authFetch(path: string, options: RequestInit = {}) {
  const session = getSession()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    clearSession()
    throw new Error('Session expired, please log in again')
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: { fieldErrors?: Record<string, string[]> } }
    throw new Error(formatErrorBody(body))
  }
  return res
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
  const res = await authFetch('/categories')
  return (await res.json() as { categories: Category[] }).categories
}

export async function createCategory(data: { name: string; slug: string; sortOrder: number }): Promise<Category> {
  const res = await authFetch('/categories', { method: 'POST', body: JSON.stringify(data) })
  return (await res.json() as { category: Category }).category
}

export async function getFarmers(): Promise<Farmer[]> {
  const res = await authFetch('/farmers')
  return (await res.json() as { farmers: Farmer[] }).farmers
}

export async function onboardFarmer(data: {
  name: string
  age?: number
  phone: string
  village?: string
  district?: string
  state?: string
}): Promise<{ farmer: Farmer; tempPassword: string }> {
  const res = await authFetch('/farmers', { method: 'POST', body: JSON.stringify(data) })
  return res.json()
}

export async function getProducts(): Promise<Product[]> {
  const res = await authFetch('/products')
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
}): Promise<Product> {
  const res = await authFetch('/products', { method: 'POST', body: JSON.stringify(data) })
  return (await res.json() as { product: Product }).product
}

export async function getAdminOrders(): Promise<Order[]> {
  const res = await authFetch('/orders/admin/all')
  return (await res.json() as { orders: Order[] }).orders
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await authFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return (await res.json() as { order: Order }).order
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
  return { accessToken, admin: JSON.parse(adminRaw) as AdminAuthResponse['admin'] }
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('admin')
}
