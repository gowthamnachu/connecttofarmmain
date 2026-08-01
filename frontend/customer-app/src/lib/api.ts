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
  description?: string | null
  price: string
  unit: string
  stock: number
  images: string[]
  harvestDate?: string | null
  gradeTag?: string | null
  processTag?: string | null
  isCertifiedNoPesticides?: boolean
  farmerName: string
  farmerVillage: string | null
  farmerCertificationStatus: string
  categoryName?: string | null
  categoryId?: string | null
  categorySlug?: string | null
}

export type PublicFarmer = {
  id: string
  name: string
  age?: number | null
  phone?: string | null
  village?: string | null
  district?: string | null
  state?: string | null
  area?: string | null
  pincode?: string | null
  certificationStatus: string
  photoUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null
  landAreaAcres?: string | number | null
  experienceYears?: number | null
  certifiedByConnectToFarm?: boolean | null
}

export type Category = {
  id: string
  name: string
  slug: string
  iconUrl?: string | null
  bannerUrl?: string | null
  sortOrder: number
  isActive: boolean
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
  receiverName?: string | null
  receiverPhone?: string | null
  line1: string
  line2?: string | null
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

export type NimbuspostShipment = {
  id: string
  nimbuspostShipmentId: string | null
  awbNumber: string | null
  courierName: string | null
  status: string
  trackingEvents: Array<{ status?: string; activity?: string; location?: string; date?: string; timestamp?: string }> | null
  createdAt?: string
  updatedAt?: string
}

export type OrderItem = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: string
  unit: string
}

export type OrderDetailResponse = {
  order: CustomerOrder
  items: OrderItem[]
  shipment: NimbuspostShipment | null
}

export type PlaceOrderResponse = {
  order: { id: string; orderNumber: string; total: string }
  razorpay: { orderId: string; amount: number; keyId: string }
}

export type OlaPrediction = {
  description: string
  place_id: string
  pincode?: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

export type NimbuspostEddResponse = {
  success: boolean
  edd: string
  expectedDeliveryDate: string
  transitDays: number
  courierName: string
  pincode: string
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
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
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

export async function checkCustomerPhone(phone: string): Promise<{ exists: boolean; name?: string | null }> {
  const res = await fetch(`${API_BASE_URL}/auth/customer/check-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) return { exists: false }
  return res.json()
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

export async function getWishlist(): Promise<{ productIds: string[]; products: Product[] }> {
  const session = getSession()
  if (!session) return { productIds: [], products: [] }
  const res = await authFetch('/wishlist')
  return res.json()
}

export async function addToWishlist(productId: string): Promise<{ success: boolean }> {
  const res = await authFetch('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
  return res.json()
}

export async function removeFromWishlist(productId: string): Promise<{ success: boolean }> {
  const res = await authFetch(`/wishlist/${productId}`, {
    method: 'DELETE',
  })
  return res.json()
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string }> {
  const res = await fetch(`${API_BASE_URL}/maps/reverse-geocode?lat=${lat}&lng=${lng}`)
  if (!res.ok) throw new Error('Could not resolve address for this location')
  return res.json()
}

export async function getOlaMapsAutocomplete(input: string): Promise<OlaPrediction[]> {
  if (!input || input.trim().length < 2) return []
  const res = await fetch(`${API_BASE_URL}/maps/autocomplete?input=${encodeURIComponent(input.trim())}`)
  if (!res.ok) return []
  const body = (await res.json()) as { predictions?: OlaPrediction[] }
  return body.predictions ?? []
}

export async function getNimbuspostEdd(pincode?: string): Promise<NimbuspostEddResponse> {
  const url = pincode ? `${API_BASE_URL}/maps/edd?pincode=${encodeURIComponent(pincode)}` : `${API_BASE_URL}/maps/edd`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not fetch NimbusPost EDD')
  return res.json()
}

export async function getProducts(categorySlug?: string): Promise<Product[]> {
  const url = categorySlug && categorySlug.trim()
    ? `${API_BASE_URL}/products?category=${encodeURIComponent(categorySlug.trim())}`
    : `${API_BASE_URL}/products`
  const res = await fetch(url)
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
  receiverName?: string
  receiverPhone?: string
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

export async function updateAddress(
  id: string,
  data: Partial<{
    label: string
    receiverName: string
    receiverPhone: string
    line1: string
    line2: string
    city: string
    state: string
    pincode: string
    isDefault: boolean
  }>,
): Promise<Address> {
  const res = await authFetch(`/addresses/${id}`, {
    method: 'PUT',
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

export async function getOrderDetails(orderId: string): Promise<OrderDetailResponse> {
  const res = await authFetch(`/orders/${orderId}`)
  return res.json()
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem('accessToken', auth.accessToken)
  localStorage.setItem('refreshToken', auth.refreshToken)
  localStorage.setItem('user', JSON.stringify(auth.user))
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

export function getSession() {
  const accessToken = localStorage.getItem('accessToken')
  const userRaw = localStorage.getItem('user')
  if (!accessToken || !userRaw) return null
  if (isTokenExpired(accessToken)) {
    clearSession()
    return null
  }
  try {
    return { accessToken, user: JSON.parse(userRaw) as AuthResponse['user'] }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  const res = await fetch(`${API_BASE_URL}/categories`)
  if (!res.ok) throw new Error('Could not fetch categories')
  return res.json()
}
