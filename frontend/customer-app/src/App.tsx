import { useEffect, useState, type FormEvent } from 'react'
import Login from './pages/Login'
import {
  addToCart,
  clearSession,
  confirmOrderPayment,
  createAddress,
  getAddresses,
  getCart,
  getOrders,
  getProducts,
  getPublicFarmers,
  getSession,
  placeOrder,
  removeCartItem,
  reverseGeocode,
  updateCartItem,
  type Address,
  type CartItem,
  type CustomerOrder,
  type PlaceOrderResponse,
  type Product,
  type PublicFarmer,
} from './lib/api'

const CATEGORIES = [
  { name: 'Millets', slug: 'millets', icon: '🌾', accent: 'from-amber-200 via-orange-100 to-white' },
  { name: 'Pulses', slug: 'pulses', icon: '🫘', accent: 'from-rose-100 via-white to-orange-50' },
  { name: 'Grains', slug: 'grains', icon: '🌿', accent: 'from-lime-100 via-white to-emerald-50' },
  { name: 'Spices', slug: 'spices', icon: '🌶️', accent: 'from-red-100 via-orange-50 to-white' },
  { name: 'Oils', slug: 'oils', icon: '🫙', accent: 'from-yellow-100 via-white to-amber-50' },
  { name: 'Snacks', slug: 'snacks', icon: '🥨', accent: 'from-orange-100 via-white to-yellow-50' },
]

const PUBLIC_NAV = new Set(['Home', 'Search'])
const FREE_DELIVERY_THRESHOLD = 500
const FLAT_DELIVERY_FEE = 20

const INITIAL_ADDRESS_FORM = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
}

type RazorpaySuccessPayload = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; contact?: string }
  theme?: { color: string }
  modal?: { ondismiss?: () => void }
  handler: (payload: RazorpaySuccessPayload) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void }
  }
}

function formatCurrency(amount: number | string) {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong'
}

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const existing = document.getElementById('razorpay-checkout-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'razorpay-checkout-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

type NavView = 'Home' | 'Search' | 'Orders' | 'Profile'
type PostLoginTarget = 'cart' | 'orders' | 'profile' | null

function ProductTile({
  product,
  onAdd,
  busy,
}: {
  product: Product
  onAdd: (product: Product) => void
  busy: boolean
}) {
  return (
    <article className="rounded-[26px] border border-white/60 bg-white/90 p-3 shadow-[0_18px_40px_rgba(24,43,32,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b9278]">Fresh pick</p>
          <h4 className="mt-1 truncate text-sm font-semibold text-[#203229]">{product.name}</h4>
          <p className="mt-1 text-xs text-[#6e7768]">by {product.farmerName}</p>
        </div>
        <div className="rounded-2xl bg-[#f6f0df] px-2 py-1 text-[11px] font-semibold text-[#4e5f50]">
          {product.stock} {product.unit}
        </div>
      </div>
      <div className="mt-4 rounded-[22px] bg-gradient-to-br from-[#faf4e8] to-white p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-[#203229]">{formatCurrency(product.price)}</p>
            <p className="text-xs text-[#6e7768]">per {product.unit}</p>
          </div>
          <button
            onClick={() => onAdd(product)}
            disabled={product.stock < 1 || busy}
            className="rounded-full bg-[#22372d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1b2d24] disabled:opacity-45"
          >
            {product.stock < 1 ? 'Sold out' : busy ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [session, setSession] = useState(() => getSession())
  const [showLogin, setShowLogin] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [postLoginTarget, setPostLoginTarget] = useState<PostLoginTarget>(null)
  const [pendingAddProduct, setPendingAddProduct] = useState<Product | null>(null)
  const [activeView, setActiveView] = useState<NavView>('Home')

  const [locationLabel, setLocationLabel] = useState('Detect my location')
  const [locatingInProgress, setLocatingInProgress] = useState(false)

  const [activeCategory, setActiveCategory] = useState<{ name: string; slug: string } | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [catalogByCategory, setCatalogByCategory] = useState<Record<string, Product[]>>({})
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(CATEGORIES[0].slug)
  const [searchQuery, setSearchQuery] = useState('')

  const [farmers, setFarmers] = useState<PublicFarmer[]>([])
  const [farmersLoading, setFarmersLoading] = useState(true)

  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartBusyProductId, setCartBusyProductId] = useState<string | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState(INITIAL_ADDRESS_FORM)
  const [addressBusy, setAddressBusy] = useState(false)

  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  function requireAuth(action: () => void, target: PostLoginTarget = null) {
    if (session) {
      action()
    } else {
      setPostLoginTarget(target)
      setShowLogin(true)
    }
  }

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    getPublicFarmers()
      .then(setFarmers)
      .catch(() => setFarmers([]))
      .finally(() => setFarmersLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setCatalogLoading(true)
      const pairs = await Promise.all(
        CATEGORIES.map(async (category) => [category.slug, await getProducts(category.slug).catch(() => [])] as const),
      )
      if (cancelled) return
      setCatalogByCategory(Object.fromEntries(pairs))
      setCatalogLoading(false)
    }

    void loadCatalog()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setCartItems([])
      setAddresses([])
      setOrders([])
      setSelectedAddressId(null)
      return
    }

    void loadCart()
    void loadAddresses()
    void loadOrders()
  }, [session])

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null)
      return
    }

    if (selectedAddressId && addresses.some((address) => address.id === selectedAddressId)) return

    const fallback = addresses.find((address) => address.isDefault) ?? addresses[0]
    setSelectedAddressId(fallback.id)
  }, [addresses, selectedAddressId])

  async function loadCart() {
    if (!getSession()) return
    setCartLoading(true)
    setCartError(null)
    try {
      setCartItems(await getCart())
    } catch (err) {
      setCartError(getErrorMessage(err))
    } finally {
      setCartLoading(false)
    }
  }

  async function loadAddresses() {
    if (!getSession()) return
    try {
      setAddresses(await getAddresses())
    } catch (err) {
      setCartError(getErrorMessage(err))
    }
  }

  async function loadOrders() {
    if (!getSession()) return
    setOrdersLoading(true)
    try {
      setOrders(await getOrders())
    } catch (err) {
      setCartError(getErrorMessage(err))
    } finally {
      setOrdersLoading(false)
    }
  }

  async function addProductToCart(product: Product) {
    setCartBusyProductId(product.id)
    try {
      await addToCart(product.id, 1)
      await loadCart()
      setCartOpen(true)
      setNotice(`${product.name} added to cart`)
    } catch (err) {
      setNotice(getErrorMessage(err))
    } finally {
      setCartBusyProductId(null)
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationLabel('Location not supported on this device')
      return
    }
    setLocatingInProgress(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const result = await reverseGeocode(latitude, longitude)
          setLocationLabel(result.address)
        } catch {
          setLocationLabel('Could not resolve address, try again')
        } finally {
          setLocatingInProgress(false)
        }
      },
      () => {
        setLocationLabel('Location permission denied')
        setLocatingInProgress(false)
      },
    )
  }

  async function openCategory(category: { name: string; slug: string }) {
    setActiveCategory(category)
    setCategoryError(null)
    setSelectedCategorySlug(category.slug)
    if (!catalogByCategory[category.slug]) {
      try {
        const products = await getProducts(category.slug)
        setCatalogByCategory((current) => ({ ...current, [category.slug]: products }))
      } catch {
        setCategoryError('Could not load products right now.')
      }
    }
  }

  async function handleAddToCart(product: Product) {
    if (!session) {
      setPendingAddProduct(product)
      setPostLoginTarget('cart')
      setShowLogin(true)
      return
    }
    await addProductToCart(product)
  }

  async function changeCartQuantity(productId: string, nextQuantity: number) {
    setCartBusyProductId(productId)
    setCartError(null)
    try {
      if (nextQuantity <= 0) {
        await removeCartItem(productId)
      } else {
        await updateCartItem(productId, nextQuantity)
      }
      await loadCart()
    } catch (err) {
      setCartError(getErrorMessage(err))
    } finally {
      setCartBusyProductId(null)
    }
  }

  async function saveAddress(e?: FormEvent) {
    e?.preventDefault()
    setAddressBusy(true)
    setCartError(null)
    try {
      const address = await createAddress({
        label: addressForm.label.trim() || 'Home',
        line1: addressForm.line1.trim(),
        line2: addressForm.line2.trim() || undefined,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        isDefault: addresses.length === 0,
      })
      setAddresses((current) => [address, ...current])
      setSelectedAddressId(address.id)
      setAddressForm(INITIAL_ADDRESS_FORM)
      setNotice('Address saved')
      return address.id
    } catch (err) {
      setCartError(getErrorMessage(err))
      return null
    } finally {
      setAddressBusy(false)
    }
  }

  async function launchCheckout(result: PlaceOrderResponse) {
    const loaded = await loadRazorpayScript()
    if (!loaded || !window.Razorpay) {
      setNotice(`Order ${result.order.orderNumber} created. Payment is pending.`)
      await loadOrders()
      setActiveView('Orders')
      return
    }

    try {
      const payment = await new Promise<RazorpaySuccessPayload>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: result.razorpay.keyId,
          amount: result.razorpay.amount,
          currency: 'INR',
          name: 'Connect to Farm',
          description: `Order ${result.order.orderNumber}`,
          order_id: result.razorpay.orderId,
          prefill: {
            name: session?.user.name,
            contact: session?.user.phone,
          },
          theme: { color: '#2F855A' },
          modal: {
            ondismiss: () => reject(new Error(`Payment cancelled. Order ${result.order.orderNumber} is still pending.`)),
          },
          handler: resolve,
        })
        checkout.open()
      })

      await confirmOrderPayment(result.order.id, {
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      })

      await loadOrders()
      setActiveView('Orders')
      setNotice(`Order ${result.order.orderNumber} placed successfully`)
    } catch (err) {
      await loadOrders()
      setActiveView('Orders')
      setNotice(getErrorMessage(err))
    }
  }

  async function handlePlaceOrder() {
    requireAuth(() => {
      void (async () => {
        setPlacingOrder(true)
        setCartError(null)
        try {
          let addressId = selectedAddressId
          if (!addressId) {
            addressId = await saveAddress()
          }

          if (!addressId) throw new Error('Add a delivery address first')

          const result = await placeOrder(addressId)
          await loadCart()
          setCartOpen(false)
          await launchCheckout(result)
        } catch (err) {
          setCartError(getErrorMessage(err))
        } finally {
          setPlacingOrder(false)
        }
      })()
    }, 'cart')
  }

  const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const deliveryFee = cartSubtotal >= FREE_DELIVERY_THRESHOLD || cartItems.length === 0 ? 0 : FLAT_DELIVERY_FEE
  const cartTotal = cartSubtotal + deliveryFee
  const discoveryProducts = Object.values(catalogByCategory).flat()
  const heroProducts = (catalogByCategory[selectedCategorySlug] ?? discoveryProducts).slice(0, 6)
  const searchResults = discoveryProducts.filter((product) => {
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) return true
    return [product.name, product.farmerName, product.farmerVillage ?? '', product.unit].some((value) =>
      value.toLowerCase().includes(needle),
    )
  })
  const topCategory = CATEGORIES.find((category) => category.slug === selectedCategorySlug) ?? CATEGORIES[0]

  function renderHome() {
    return (
      <>
        <section className="rounded-[34px] bg-[linear-gradient(135deg,#22372d_0%,#40604c_55%,#c89b53_100%)] px-5 py-5 text-white shadow-[0_24px_50px_rgba(22,38,30,0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[70%]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">10-minute farm cart</p>
              <h1 className="mt-2 text-[28px] font-extrabold leading-8">Groceries that feel local, not generic.</h1>
              <p className="mt-3 text-sm leading-6 text-white/78">
                Fresh picks, farmer stories, and a cart flow that gets you from browse to payment without friction.
              </p>
            </div>
            <div className="rounded-[28px] bg-white/14 px-4 py-3 text-right backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Live zone</p>
              <p className="mt-1 text-2xl font-extrabold">18 min</p>
              <p className="text-xs text-white/80">Hyderabad dispatch</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium">Free delivery above {formatCurrency(FREE_DELIVERY_THRESHOLD)}</span>
            <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium">Single cart, instant checkout</span>
            <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium">Fresh farmer supply</span>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7e876f]">Browse fast</p>
              <h2 className="text-xl font-bold text-[#203229]">Shop by category</h2>
            </div>
            <button
              onClick={() => setActiveView('Search')}
              className="rounded-full border border-[#d8cfb8] bg-white px-4 py-2 text-xs font-semibold text-[#203229]"
            >
              Search all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORIES.map((category) => (
              <button
                key={category.slug}
                onClick={() => {
                  setSelectedCategorySlug(category.slug)
                  void openCategory(category)
                }}
                className={`rounded-[28px] border px-3 py-4 text-left shadow-[0_12px_24px_rgba(30,45,35,0.08)] transition ${
                  selectedCategorySlug === category.slug
                    ? 'border-[#22372d] bg-[#22372d] text-white'
                    : `border-white/70 bg-gradient-to-br ${category.accent} text-[#203229]`
                }`}
              >
                <div className="text-2xl">{category.icon}</div>
                <p className="mt-3 text-xs font-semibold">{category.name}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7e876f]">Spotlight</p>
              <h2 className="text-xl font-bold text-[#203229]">Best of {topCategory.name}</h2>
            </div>
            <button
              onClick={() => void openCategory(topCategory)}
              className="text-sm font-semibold text-[#203229] underline underline-offset-4"
            >
              View category
            </button>
          </div>
          {catalogLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-[26px] bg-white/70" />
              ))}
            </div>
          ) : heroProducts.length === 0 ? (
            <div className="rounded-[28px] bg-white px-5 py-8 text-center text-sm text-[#6e7768] shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
              Products are not live in this category yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {heroProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  busy={cartBusyProductId === product.id}
                  onAdd={(item) => void handleAddToCart(item)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7e876f]">Fresh faces</p>
            <h2 className="text-xl font-bold text-[#203229]">Meet your growers</h2>
          </div>
          {farmersLoading ? (
            <p className="text-sm text-[#6e7768]">Loading farmers...</p>
          ) : farmers.length === 0 ? (
            <div className="rounded-[28px] bg-white px-5 py-8 text-center text-sm text-[#6e7768] shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
              No farmers are onboarded yet.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 pr-2 app-scrollbar-none">
              {farmers.map((farmer) => (
                <article
                  key={farmer.id}
                  className="min-w-[190px] rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(24,43,32,0.08)] backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,#f6ecd7,#ead9af)]" />
                    <span className="rounded-full bg-[#f4efe0] px-3 py-1 text-[11px] font-semibold capitalize text-[#536154]">
                      {farmer.certificationStatus}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[#203229]">{farmer.name}</h3>
                  <p className="mt-1 text-xs text-[#6e7768]">
                    {[farmer.village, farmer.district, farmer.state].filter(Boolean).join(', ') || 'Farmer network'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </>
    )
  }

  function renderSearch() {
    return (
      <section className="space-y-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_40px_rgba(24,43,32,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7e876f]">Search catalog</p>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, farmers, or units"
            className="mt-3 w-full rounded-[22px] border border-[#ded6c2] bg-[#fbf8f1] px-4 py-3 text-sm outline-none focus:border-[#22372d]"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.slug}
                onClick={() => {
                  setSearchQuery(category.name)
                  setSelectedCategorySlug(category.slug)
                }}
                className="rounded-full border border-[#e1d9c8] px-3 py-1 text-xs font-semibold text-[#4f5f50]"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {searchResults.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
              busy={cartBusyProductId === product.id}
              onAdd={(item) => void handleAddToCart(item)}
            />
          ))}
        </div>

        {!catalogLoading && searchResults.length === 0 && (
          <div className="rounded-[28px] bg-white px-5 py-8 text-center text-sm text-[#6e7768] shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
            No products match your search.
          </div>
        )}
      </section>
    )
  }

  function renderOrders() {
    if (!session) {
      return (
        <section className="rounded-[28px] bg-white px-5 py-10 text-center shadow-[0_18px_40px_rgba(24,43,32,0.08)]">
          <h2 className="text-xl font-bold text-[#203229]">Track every order in one place</h2>
          <p className="mt-2 text-sm text-[#6e7768]">Log in to view payment status, delivery progress, and your recent purchases.</p>
          <button
            onClick={() => requireAuth(() => setActiveView('Orders'), 'orders')}
            className="mt-5 rounded-full bg-[#22372d] px-5 py-3 text-sm font-semibold text-white"
          >
            Continue with phone
          </button>
        </section>
      )
    }

    return (
      <section className="space-y-4">
        <div className="rounded-[28px] bg-[linear-gradient(135deg,#fff9ef,#f2ead8)] p-5 shadow-[0_18px_40px_rgba(24,43,32,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7e876f]">Order center</p>
          <h2 className="mt-1 text-2xl font-bold text-[#203229]">Your deliveries and payments</h2>
          <p className="mt-2 text-sm text-[#6e7768]">Every placed order stays here until delivery is completed.</p>
        </div>

        {ordersLoading ? (
          <p className="text-sm text-[#6e7768]">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] bg-white px-5 py-8 text-center text-sm text-[#6e7768] shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
            No orders yet. Add something to cart and checkout.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-[28px] bg-white p-4 shadow-[0_18px_40px_rgba(24,43,32,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b9278]">{order.orderNumber}</p>
                    <h3 className="mt-1 text-lg font-bold text-[#203229]">{formatCurrency(order.total)}</h3>
                    <p className="mt-1 text-xs text-[#6e7768]">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-right">
                    <span className="rounded-full bg-[#f4efe0] px-3 py-1 text-[11px] font-semibold capitalize text-[#4d5c4e]">
                      {order.status.replaceAll('_', ' ')}
                    </span>
                    <span className="rounded-full bg-[#eef4ec] px-3 py-1 text-[11px] font-semibold capitalize text-[#335140]">
                      Payment {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  function renderProfile() {
    return (
      <section className="space-y-4">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#22372d,#425e4a)] p-5 text-white shadow-[0_24px_50px_rgba(22,38,30,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Account</p>
          <h2 className="mt-2 text-2xl font-bold">{session ? session.user.name : 'Guest shopper'}</h2>
          <p className="mt-1 text-sm text-white/75">{session ? session.user.phone : 'Log in to save addresses and place orders faster.'}</p>
          {!session && (
            <button
              onClick={() => requireAuth(() => setActiveView('Profile'), 'profile')}
              className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#22372d]"
            >
              Log in with phone
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] bg-white p-4 shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b9278]">Saved addresses</p>
            <p className="mt-3 text-3xl font-extrabold text-[#203229]">{addresses.length}</p>
          </div>
          <div className="rounded-[24px] bg-white p-4 shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b9278]">Orders placed</p>
            <p className="mt-3 text-3xl font-extrabold text-[#203229]">{orders.length}</p>
          </div>
          <div className="rounded-[24px] bg-white p-4 shadow-[0_16px_30px_rgba(30,45,35,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b9278]">Cart items</p>
            <p className="mt-3 text-3xl font-extrabold text-[#203229]">{cartItems.length}</p>
          </div>
        </div>

        {session && (
          <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_40px_rgba(24,43,32,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#203229]">Saved delivery points</h3>
                <p className="mt-1 text-sm text-[#6e7768]">Use the cart screen to add or switch addresses before checkout.</p>
              </div>
              <button
                onClick={() => setCartOpen(true)}
                className="rounded-full border border-[#d8cfb8] px-4 py-2 text-xs font-semibold text-[#203229]"
              >
                Open cart
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {addresses.length === 0 ? (
                <p className="text-sm text-[#6e7768]">No saved addresses yet.</p>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-[20px] bg-[#f8f4ea] px-4 py-3 text-sm text-[#304133]">
                    <p className="font-semibold">{address.label}</p>
                    <p className="mt-1 text-xs text-[#6e7768]">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => {
                clearSession()
                setSession(null)
                setActiveView('Home')
                setNotice('Logged out')
              }}
              className="mt-5 rounded-full bg-[#22372d] px-5 py-3 text-sm font-semibold text-white"
            >
              Log out
            </button>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,#fdf9ee_0%,#f2ecde_52%,#e8dfcb_100%)] pb-24 text-[#203229]">
      <header className="sticky top-0 z-20 px-4 pb-4 pt-4 backdrop-blur">
        <div className="mx-auto max-w-6xl rounded-[30px] border border-white/70 bg-[rgba(255,252,245,0.85)] px-4 py-4 shadow-[0_20px_50px_rgba(30,45,35,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <button onClick={detectLocation} className="text-left" disabled={locatingInProgress}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7e876f]">Delivering to</p>
              <p className="mt-1 text-sm font-semibold text-[#203229]">{locatingInProgress ? 'Detecting...' : locationLabel}</p>
            </button>
            <button
              onClick={() => {
                if (session) {
                  setActiveView('Profile')
                  return
                }
                setPostLoginTarget('profile')
                setShowLogin(true)
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22372d] text-sm font-bold text-white shadow-[0_12px_22px_rgba(34,55,45,0.22)]"
            >
              {session ? session.user.name.slice(0, 1).toUpperCase() : 'Go'}
            </button>
          </div>
          <button
            onClick={() => setActiveView('Search')}
            className="mt-4 flex w-full items-center justify-between rounded-[22px] border border-[#e5dcc8] bg-white px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          >
            <span className="text-sm text-[#7a816b]">Search vegetables, millets, pulses...</span>
            <span className="rounded-full bg-[#f3eddc] px-3 py-1 text-xs font-semibold text-[#203229]">Search</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex-1 max-w-6xl px-4 py-3">
        <div className="space-y-6">
          {activeView === 'Home' && renderHome()}
          {activeView === 'Search' && renderSearch()}
          {activeView === 'Orders' && renderOrders()}
          {activeView === 'Profile' && renderProfile()}
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-surface-dark flex items-center justify-around py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {['Home', 'Search', 'Orders', 'Cart', 'Profile'].map((label) => (
          <button
            key={label}
            onClick={() => {
              if (label === 'Cart') {
                requireAuth(() => setCartOpen(true), 'cart')
                return
              }
              if (label === 'Orders') {
                requireAuth(() => {
                  void loadOrders()
                  setActiveView('Orders')
                }, 'orders')
                return
              }
              if (label === 'Profile') {
                requireAuth(() => setActiveView('Profile'), 'profile')
                return
              }
              if (PUBLIC_NAV.has(label)) {
                setActiveView(label as NavView)
              }
            }}
            className={`flex flex-col items-center gap-1 rounded-full px-4 py-2 text-[11px] font-semibold transition ${
              activeView === label ? 'text-[#203229]' : 'text-[#7a816b]'
            }`}
          >
            <span className={`relative h-8 w-8 rounded-full ${activeView === label ? 'bg-[#22372d] text-white' : 'bg-[#f2ecdd] text-[#4b5c4d]'} flex items-center justify-center`}>
              {label.slice(0, 1)}
              {label === 'Cart' && cartItems.length > 0 && (
                <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#d46b4b] px-1 text-[9px] leading-4 text-white">
                  {cartItems.length}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>

      {cartOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex justify-end">
          <div className="h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-dark">
              <div>
                <h3 className="text-base font-semibold text-primary-dark">Your cart</h3>
                <p className="text-xs text-neutral-500">Add delivery details and place your order.</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-surface text-neutral-600">
                X
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {cartLoading && <p className="text-sm text-[#6e7768]">Loading cart...</p>}
              {cartError && <p className="text-sm text-red-600">{cartError}</p>}

              {!cartLoading && cartItems.length === 0 && (
                <div className="rounded-[26px] bg-[#f8f4ea] px-4 py-5 text-center">
                  <p className="text-sm text-[#4c5e4f]">Your cart is empty.</p>
                  <p className="mt-1 text-xs text-[#6e7768]">Add products from a category to start checkout.</p>
                </div>
              )}

              {cartItems.length > 0 && (
                <ul className="space-y-3">
                  {cartItems.map((item) => (
                    <li key={item.productId} className="rounded-[24px] border border-[#e4dcc9] bg-[#fffdf8] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#203229]">{item.name}</p>
                          <p className="text-xs text-[#6e7768]">
                            {formatCurrency(item.price)}/{item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => void changeCartQuantity(item.productId, 0)}
                          disabled={cartBusyProductId === item.productId}
                          className="text-xs text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void changeCartQuantity(item.productId, item.quantity - 1)}
                            disabled={cartBusyProductId === item.productId}
                            className="w-8 h-8 rounded-full bg-surface text-sm"
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => void changeCartQuantity(item.productId, item.quantity + 1)}
                            disabled={cartBusyProductId === item.productId || item.quantity >= item.stock}
                            className="w-8 h-8 rounded-full bg-surface text-sm disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-primary-dark">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#203229]">Delivery address</h4>
                  <p className="text-xs text-[#6e7768]">Select a saved address or add a new one.</p>
                </div>

                {addresses.length > 0 ? (
                  <div className="space-y-2">
                    {addresses.map((address) => (
                      <label key={address.id} className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-[#e4dcc9] bg-[#fffdf8] p-3">
                        <input
                          type="radio"
                          name="selected-address"
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#203229]">{address.label}</p>
                          <p className="text-xs text-[#6e7768]">
                            {address.line1}
                            {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.pincode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6e7768]">No saved address yet.</p>
                )}

                <form onSubmit={(e) => void saveAddress(e)} className="space-y-2 rounded-[24px] bg-[#f8f4ea] p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm((current) => ({ ...current, label: e.target.value }))}
                      className="rounded-2xl border border-[#ddd4bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#22372d]"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm((current) => ({ ...current, pincode: e.target.value }))}
                      className="rounded-2xl border border-[#ddd4bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#22372d]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="House / street / area"
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm((current) => ({ ...current, line1: e.target.value }))}
                    className="w-full rounded-2xl border border-[#ddd4bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#22372d]"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (optional)"
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm((current) => ({ ...current, line2: e.target.value }))}
                    className="w-full rounded-2xl border border-[#ddd4bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#22372d]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((current) => ({ ...current, city: e.target.value }))}
                      className="rounded-2xl border border-[#ddd4bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#22372d]"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm((current) => ({ ...current, state: e.target.value }))}
                      className="rounded-2xl border border-[#ddd4bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#22372d]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addressBusy}
                    className="w-full rounded-full border border-[#22372d] px-3 py-3 text-sm font-semibold text-[#22372d] disabled:opacity-50"
                  >
                    {addressBusy ? 'Saving address...' : 'Save address'}
                  </button>
                </form>
              </section>
            </div>

            <div className="space-y-2 border-t border-[#ece3d0] px-4 py-4">
              <div className="flex items-center justify-between text-sm text-[#6e7768]">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#6e7768]">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-[#203229]">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <button
                onClick={() => void handlePlaceOrder()}
                disabled={cartItems.length === 0 || placingOrder}
                className="w-full rounded-full bg-[#22372d] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {placingOrder ? 'Starting payment...' : 'Place order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-20 inset-x-0 flex justify-center px-4 z-30">
          <div className="rounded-full bg-[#1d2e25] px-4 py-2 text-xs text-white shadow-[0_18px_40px_rgba(24,43,32,0.2)]">{notice}</div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center px-6">
          <Login
            onSuccess={() => {
              const refreshedSession = getSession()
              setSession(refreshedSession)
              setShowLogin(false)
              if (pendingAddProduct && refreshedSession) {
                const product = pendingAddProduct
                setPendingAddProduct(null)
                void addProductToCart(product)
              }
              if (postLoginTarget === 'cart') setCartOpen(true)
              if (postLoginTarget === 'orders') setActiveView('Orders')
              if (postLoginTarget === 'profile') setActiveView('Profile')
              setPostLoginTarget(null)
            }}
            onCancel={() => {
              setShowLogin(false)
              setPostLoginTarget(null)
              setPendingAddProduct(null)
            }}
          />
        </div>
      )}

      {activeCategory && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 px-4 sm:items-center">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[34px] bg-[#fffdf7] shadow-[0_35px_80px_rgba(18,32,24,0.24)]">
            <div className="border-b border-[#eee4d2] bg-[linear-gradient(135deg,#fff8ea,#f3ecd9)] px-5 py-5">
              <button
                onClick={() => setActiveCategory(null)}
                className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white text-[#5b6657]"
              >
                X
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b9278]">Category spotlight</p>
              <h3 className="mt-2 text-2xl font-bold text-[#203229]">{activeCategory.name}</h3>
              <p className="mt-1 text-sm text-[#6e7768]">Browse live inventory and add products directly to cart.</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              {catalogLoading && !catalogByCategory[activeCategory.slug] && <p className="text-sm text-[#6e7768]">Loading products...</p>}
              {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}
              {(catalogByCategory[activeCategory.slug] ?? []).length === 0 && !catalogLoading ? (
                <p className="text-sm text-[#6e7768]">No products in this category yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(catalogByCategory[activeCategory.slug] ?? []).map((product) => (
                    <ProductTile
                      key={product.id}
                      product={product}
                      busy={cartBusyProductId === product.id}
                      onAdd={(item) => void handleAddToCart(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

