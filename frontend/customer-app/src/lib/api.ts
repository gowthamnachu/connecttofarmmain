const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: { id: string; name: string; phone: string }
}

export type Product = {
  id: string
  name: string
  slug: string
  price: string
  unit: string
  stock: number
  images: string[]
  farmerName: string
  farmerVillage: string | null
  farmerCertificationStatus: string
}

export type PublicFarmer = {
  id: string
  name: string
  village: string | null
  district: string | null
  state: string | null
  certificationStatus: string
  photoUrl: string | null
}

export type CartItem = {
  productId: string
  name: string
  slug: string
  price: string
  unit: string
  images: string[]
  stock: number
  quantity: number
}

export type Address = {
  id: string
  label: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export type CustomerOrder = {
  id: string
  orderNumber: string
  status: string
  total: string
  paymentStatus: string
  createdAt: string
}

export type PlaceOrderResponse = {
  order: { id: string; orderNumber: string; total: string }
  razorpay: { orderId: string; amount: number; keyId: string }
}

function formatErrorBody(body: { error?: string; details?: { fieldErrors?: Record<string, string[]> } }): string {
  const fieldErrors = body.details?.fieldErrors
  if (fieldErrors) {
    const messages = Object.entries(fieldErrors)
      .filter(([, value]) => value && value.length > 0)
      .map(([field, value]) => `${field}: ${value[0]}`)

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
    const body = (await res.json().catch(() => ({}))) as {
      error?: string
      details?: { fieldErrors?: Record<string, string[]> }
    }
    throw new Error(formatErrorBody(body))
  }

  return res
}

export async function verifyCustomerToken(params: { idToken: string; name?: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/customer/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Login failed')
  }

  return res.json()
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string }> {
  const res = await fetch(`${API_BASE_URL}/maps/reverse-geocode?lat=${lat}&lng=${lng}`)
  if (!res.ok) throw new Error('Could not resolve address for this location')
  return res.json()
}

export async function getProducts(categorySlug: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products?category=${encodeURIComponent(categorySlug)}`)
  if (!res.ok) throw new Error('Could not load products')
  const body = (await res.json()) as { products: Product[] }
  return body.products
}

export async function getPublicFarmers(): Promise<PublicFarmer[]> {
  const res = await fetch(`${API_BASE_URL}/farmers/public`)
  if (!res.ok) throw new Error('Could not load farmers')
  const body = (await res.json()) as { farmers: PublicFarmer[] }
  return body.farmers
}

export async function getCart(): Promise<CartItem[]> {
  const res = await authFetch('/cart')
  return ((await res.json()) as { items: CartItem[] }).items
}

export async function addToCart(productId: string, quantity: number): Promise<void> {
  await authFetch('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
}

export async function updateCartItem(productId: string, quantity: number): Promise<void> {
  await authFetch(`/cart/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })
}

export async function removeCartItem(productId: string): Promise<void> {
  await authFetch(`/cart/${productId}`, { method: 'DELETE' })
}

export async function getAddresses(): Promise<Address[]> {
  const res = await authFetch('/addresses')
  return ((await res.json()) as { addresses: Address[] }).addresses
}

export async function createAddress(data: {
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}): Promise<Address> {
  const res = await authFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return ((await res.json()) as { address: Address }).address
}

export async function placeOrder(addressId: string): Promise<PlaceOrderResponse> {
  const res = await authFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({ addressId }),
  })
  return res.json()
}

export async function confirmOrderPayment(
  orderId: string,
  data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
): Promise<void> {
  await authFetch(`/orders/${orderId}/confirm-payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getOrders(): Promise<CustomerOrder[]> {
  const res = await authFetch('/orders')
  return ((await res.json()) as { orders: CustomerOrder[] }).orders
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem('accessToken', auth.accessToken)
  localStorage.setItem('refreshToken', auth.refreshToken)
  localStorage.setItem('user', JSON.stringify(auth.user))
}

export function getSession() {
  const accessToken = localStorage.getItem('accessToken')
  const userRaw = localStorage.getItem('user')
  if (!accessToken || !userRaw) return null
  return { accessToken, user: JSON.parse(userRaw) as AuthResponse['user'] }
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}
