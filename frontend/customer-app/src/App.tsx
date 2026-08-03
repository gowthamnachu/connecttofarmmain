import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useDebounce } from './lib/useDebounce'
import Login from './pages/Login'
import FarmerProfileModal from './components/FarmerProfileModal'
import {
  addToCart,
  addToWishlist,
  clearSession,
  confirmOrderPayment,
  createAddress,
  getAddresses,
  getCart,
  getCategories,
  getNimbuspostEdd,
  getOlaMapsAutocomplete,
  getOrderDetails,
  getOrders,
  getProducts,
  getPublicFarmers,
  getSession,
  getWishlist,
  placeOrder,
  removeCartItem,
  removeFromWishlist,
  reverseGeocode,
  updateAddress,
  updateCartItem,
  type Address,
  type CartItem,
  type Category,
  type CustomerOrder,
  type NimbuspostEddResponse,
  type OlaPrediction,
  type OrderDetailResponse,
  type PlaceOrderResponse,
  type Product,
  type PublicFarmer,
} from './lib/api'
import {
  IconSearch,
  IconHome,
  IconOrders,
  IconUser,
  IconCart,
  IconLocation,
  IconShield,
  IconTag,
  IconTruck,
  IconSprout,
  IconSparkles,
  IconCheck,
  IconArrowRight,
  IconCross,
  IconHeart,
  IconMenu,
} from './components/Icons'

const CATEGORIES = [
  { name: 'MILLET BASKET', slug: 'millets', discount: 'UP TO 30% OFF', accent: 'from-[#C29845]/20 via-[#E8DFC9]/40 to-white' },
  { name: 'SIRIDHANYA', slug: 'siridhanya', discount: 'MIN 20% OFF', accent: 'from-[#A98234]/15 via-[#E8DFC9]/40 to-white' },
  { name: 'COMBOS', slug: 'combos', discount: 'FRESH HARVEST', accent: 'from-[#4A5947]/20 via-[#E8DFC9]/40 to-white' },
  { name: 'READY TO COOK', slug: 'ready-to-cook', discount: 'PURE & ORGANIC', accent: 'from-amber-800/15 via-[#E8DFC9]/40 to-white' },
  { name: 'SWEETS & SNACKS', slug: 'snacks', discount: 'COLD PRESSED', accent: 'from-yellow-700/15 via-[#E8DFC9]/40 to-white' },
  { name: 'BATTERS', slug: 'batters', discount: 'HEALTHY BITES', accent: 'from-[#C29845]/25 via-[#E8DFC9]/40 to-white' },
]

const SEARCH_PLACEHOLDERS = [
  "Search 'Organic Foxtail Millet'",
  "Search 'Cold Pressed Groundnut Oil'",
  "Search 'A2 Desi Cow Ghee'",
  "Search 'Unpolished Toor Dal'",
  "Search 'Organic Turmeric Powder'",
]

const BANNERS = [
  {
    id: 1,
    title: 'Pure Organic Millets & Healthy Grains',
    subtitle: 'Directly sourced from verified local organic farmers',
    tag: 'ORGANIC MILLET HARVEST',
    bg: 'from-[#2D382C] via-[#3B4A39] to-[#C29845]',
  },
  {
    id: 2,
    title: 'Millet Amma Inspired Health & Wellness',
    subtitle: 'Unpolished, gluten-free, zero mineral oil polish',
    tag: '100% NATURAL',
    bg: 'from-[#C29845] via-[#A98234] to-[#2D382C]',
  },
  {
    id: 3,
    title: 'Express Farm-to-Kitchen Delivery',
    subtitle: 'Traditionally wood-pressed oils & lab certified millets',
    tag: 'LAB CERTIFIED',
    bg: 'from-[#2D382C] via-[#1E261D] to-[#4A5947]',
  },
]

const FREE_DELIVERY_THRESHOLD = 500
const FLAT_DELIVERY_FEE = 20

const INITIAL_ADDRESS_FORM = {
  label: 'Home',
  receiverName: '',
  receiverPhone: '',
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
    maximumFractionDigits: 0,
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

type NavView = 'Home' | 'Search' | 'Farmers' | 'OurStory' | 'Orders' | 'Profile'
type PostLoginTarget = 'cart' | 'orders' | 'profile' | null

// Millet Amma Plain White Product Tile with Deep Green Buttons
function ProductTile({
  product,
  quantityInCart,
  isWishlisted,
  onAdd,
  onUpdateQty,
  onToggleWishlist,
  onClickProduct,
  busy,
}: {
  product: Product
  quantityInCart: number
  isWishlisted: boolean
  onAdd: (product: Product) => void
  onUpdateQty: (productId: string, nextQty: number) => void
  onToggleWishlist: (product: Product) => void
  onClickProduct?: (product: Product) => void
  busy: boolean
}) {
  const imageUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
  const coopPrice = (Number(product.price) * 0.9).toFixed(2)
  const [selectedWeight, setSelectedWeight] = useState(product.unit || '100g')

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-[#164220]/40 hover:shadow-md transition-all duration-300">
      {/* Product Image Box */}
      <div
        onClick={() => onClickProduct?.(product)}
        className="relative h-44 w-full bg-[#f4f5f6] rounded-xl p-3 flex items-center justify-center overflow-hidden mb-3 cursor-pointer group-hover:bg-[#ebedee] transition"
      >
        {/* Top Left Discount Tag */}
        <div className="absolute top-2 left-2 rounded-md bg-[#e53935] px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs z-10">
          -10%
        </div>

        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Top Right Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist(product)
          }}
          aria-label="Add to wishlist"
          className={`absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur-md border flex items-center justify-center shadow-xs transition z-10 ${
            isWishlisted ? 'text-[#164220] bg-emerald-50 border-[#164220]' : 'text-slate-400 border-slate-200 hover:text-[#164220]'
          }`}
        >
          <IconHeart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#164220]' : ''}`} />
        </button>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Title */}
          <h3
            onClick={() => onClickProduct?.(product)}
            className="font-display text-xs md:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug hover:text-[#164220] transition min-h-[36px] cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Main Price */}
          <div className="mt-2 flex items-baseline gap-1 font-numeric">
            <span className="text-sm font-bold text-slate-900">₹</span>
            <span className="text-lg font-extrabold text-slate-950">{product.price}.00</span>
          </div>

          {/* Co-Op Member Price Badge Pill */}
          <div className="mt-1.5 rounded-lg bg-[#e6f4ea] border border-[#cbe5d4] px-2.5 py-1 text-[11px] font-semibold text-[#164220] flex items-center gap-1.5">
            <span className="text-xs">🍃</span>
            <span>₹ {coopPrice} for Co-Op Members</span>
          </div>
        </div>

        {/* Weight Selector Dropdown & Add Button Row */}
        <div className="mt-3 flex items-center gap-2 pt-1">
          <div className="relative">
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              className="appearance-none rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 pr-6 text-xs font-semibold text-slate-700 outline-none hover:border-slate-400 cursor-pointer"
            >
              <option value={product.unit || '100g'}>{product.unit || '100g'}</option>
              <option value="200g">200g</option>
              <option value="500g">500g</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">▼</span>
          </div>

          {/* Add / Stepper Button */}
          {quantityInCart > 0 ? (
            <div className="flex-1 flex items-center justify-between rounded-lg bg-[#164220] px-2 py-1 text-white shadow-xs">
              <button
                onClick={() => onUpdateQty(product.id, quantityInCart - 1)}
                disabled={busy}
                aria-label="Decrease quantity"
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[#103318] text-xs font-extrabold transition disabled:opacity-50"
              >
                -
              </button>
              <span className="text-xs font-numeric font-bold">{busy ? '...' : quantityInCart}</span>
              <button
                onClick={() => onUpdateQty(product.id, quantityInCart + 1)}
                disabled={busy || quantityInCart >= product.stock}
                aria-label="Increase quantity"
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[#103318] text-xs font-extrabold transition disabled:opacity-50"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              disabled={product.stock < 1 || busy}
              className="flex-1 rounded-lg bg-[#164220] hover:bg-[#103318] text-white py-1.5 px-3 font-display font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              <span>{product.stock < 1 ? 'Out' : busy ? '...' : 'Add'}</span>
            </button>
          )}
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
  const [activeView, setActiveView] = useState<NavView>('Home')

  useEffect(() => {
    function handleUnauthorized() {
      clearSession()
      setSession(null)
      setNotice('Your session has expired. Please log in again.')
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const [locationLabel, setLocationLabel] = useState('Select Location - Hyderabad')
  const [currentPincode, setCurrentPincode] = useState('500081')
  const [locatingInProgress, setLocatingInProgress] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)

  function handleDetectGpsLocation() {
    if (!navigator.geolocation) {
      setNotice('GPS geolocation is not supported by your browser')
      return
    }
    setLocatingInProgress(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (res.address) {
            const pincodeMatch = res.address.match(/\b\d{6}\b/)
            const extractedPin = pincodeMatch ? pincodeMatch[0] : null
            setLocationLabel(res.address)
            if (extractedPin) setCurrentPincode(extractedPin)
            setNotice(`Location updated: ${res.address}`)
            setShowLocationModal(false)
          }
        } catch {
          setLocationLabel(`GPS Location (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`)
          setNotice('GPS coordinates captured successfully')
          setShowLocationModal(false)
        } finally {
          setLocatingInProgress(false)
        }
      },
      () => {
        setLocatingInProgress(false)
        setNotice('Could not get GPS position. Please select location manually or enter pincode.')
      }
    )
  }

  function handleSelectLocationPincode(label: string, pincode: string) {
    setLocationLabel(label)
    setCurrentPincode(pincode)
    setNotice(`Delivery location set to: ${label} (${pincode})`)
    setShowLocationModal(false)
  }

  // NimbusPost EDD state - fetched for header & cart
  const [eddInfo, setEddInfo] = useState<NimbuspostEddResponse | null>(null)
  const [eddLoading, setEddLoading] = useState(false)

  // Products & Categories state
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 250)
  const [_placeholderIndex, setPlaceholderIndex] = useState(0)

  const [farmers, setFarmers] = useState<PublicFarmer[]>([])
  const [farmersLoading, setFarmersLoading] = useState(true)
  const [selectedFarmer, setSelectedFarmer] = useState<PublicFarmer | null>(null)

  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartBusyProductId, setCartBusyProductId] = useState<string | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const cartSyncTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState(INITIAL_ADDRESS_FORM)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressBusy, setAddressBusy] = useState(false)

  // Ola Maps Autocomplete states inside address form
  const [olaSearchInput, setOlaSearchInput] = useState('')
  const [olaPredictions, setOlaPredictions] = useState<OlaPrediction[]>([])
  const [olaLoading, setOlaLoading] = useState(false)

  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [activeOrderDetail, setActiveOrderDetail] = useState<OrderDetailResponse | null>(null)
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false)

  const [bannerIndex, setBannerIndex] = useState(0)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [_dbCategories, setDbCategories] = useState<Category[]>([])

  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null)

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res.categories && res.categories.length > 0) {
          setDbCategories(res.categories)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    function syncSlugFromUrl() {
      const hash = window.location.hash
      if (hash === '#/our-story' || hash === '#our-story') {
        setActiveView('OurStory')
        setSelectedCategorySlug('')
        setSelectedProductSlug(null)
      } else if (hash === '#/farmers' || hash === '#farmers') {
        setActiveView('Farmers')
        setSelectedCategorySlug('')
        setSelectedProductSlug(null)
      } else if (hash.startsWith('#/category/')) {
        const slug = hash.replace('#/category/', '')
        setSelectedCategorySlug(slug)
        setActiveView('Home')
        setSelectedProductSlug(null)
      } else if (hash.startsWith('#/product/')) {
        const slug = hash.replace('#/product/', '')
        setSelectedProductSlug(slug)
        setActiveView('Home')
      } else if (hash === '#/orders' || hash === '#orders') {
        setActiveView('Orders')
        setSelectedProductSlug(null)
      } else if (hash === '#/profile' || hash === '#profile') {
        setActiveView('Profile')
        setSelectedProductSlug(null)
      } else if (hash === '#/search' || hash === '#search') {
        setActiveView('Search')
        setSelectedProductSlug(null)
      } else if (hash === '#/location' || hash === '#location') {
        setShowLocationModal(true)
      } else if (hash === '#/cart' || hash === '#cart') {
        setCartOpen(true)
      } else if (hash === '#/' || hash === '' || hash === '#home') {
        setActiveView('Home')
        setSelectedCategorySlug('')
        setSelectedProductSlug(null)
      }
    }

    syncSlugFromUrl()
    window.addEventListener('hashchange', syncSlugFromUrl)
    return () => window.removeEventListener('hashchange', syncSlugFromUrl)
  }, [])

  useEffect(() => {
    if (session) {
      getWishlist()
        .then((res) => setWishlistIds(new Set(res.productIds)))
        .catch(console.error)
    } else {
      setWishlistIds(new Set())
    }
  }, [session])

  async function handleToggleWishlist(product: Product) {
    if (!session) {
      setNotice('Please sign in to save items to your wishlist')
      setPostLoginTarget(null)
      setShowLogin(true)
      return
    }

    const isCurrentlyWishlisted = wishlistIds.has(product.id)
    const nextIds = new Set(wishlistIds)
    if (isCurrentlyWishlisted) {
      nextIds.delete(product.id)
    } else {
      nextIds.add(product.id)
      setWishlistOpen(true)
    }
    setWishlistIds(nextIds)

    try {
      if (isCurrentlyWishlisted) {
        await removeFromWishlist(product.id)
      } else {
        await addToWishlist(product.id)
      }
    } catch (err) {
      console.error('Wishlist error:', err)
    }
  }

  function requireAuth(action: () => void, target: PostLoginTarget = null) {
    if (session) {
      action()
    } else {
      setPostLoginTarget(target)
      setShowLogin(true)
    }
  }

  // Fetch NimbusPost EDD whenever currentPincode changes
  useEffect(() => {
    let cancelled = false
    setEddLoading(true)

    getNimbuspostEdd(currentPincode)
      .then((res) => {
        if (!cancelled) setEddInfo(res)
      })
      .catch(() => {
        if (!cancelled) setEddInfo(null)
      })
      .finally(() => {
        if (!cancelled) setEddLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentPincode])

  // Ola Maps autocomplete input change handler
  useEffect(() => {
    if (!olaSearchInput || olaSearchInput.trim().length < 2) {
      setOlaPredictions([])
      return
    }
    const timer = setTimeout(async () => {
      setOlaLoading(true)
      try {
        const predictions = await getOlaMapsAutocomplete(olaSearchInput)
        setOlaPredictions(predictions)
      } catch {
        setOlaPredictions([])
      } finally {
        setOlaLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [olaSearchInput])

  // Rotate search placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // Rotate promo banners
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    getPublicFarmers()
      .then(setFarmers)
      .catch(() => setFarmers([]))
      .finally(() => setFarmersLoading(false))
  }, [])

  // Load ALL products unconditionally
  useEffect(() => {
    let cancelled = false

    async function loadAllCatalog() {
      setCatalogLoading(true)
      try {
        const prods = await getProducts()
        if (cancelled) return
        setAllProducts(prods)
      } catch {
        if (cancelled) return
        setAllProducts([])
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }

    void loadAllCatalog()

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
    if (fallback.pincode) {
      setCurrentPincode(fallback.pincode)
    }
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
      const list = await getOrders()
      setOrders(list)
      if (list.length > 0 && !activeOrderDetail) {
        void fetchOrderDetail(list[0].id)
      }
    } catch (err) {
      setCartError(getErrorMessage(err))
    } finally {
      setOrdersLoading(false)
    }
  }

  async function fetchOrderDetail(orderId: string) {
    setLoadingOrderDetail(true)
    try {
      const detail = await getOrderDetails(orderId)
      setActiveOrderDetail(detail)
    } catch {
      setActiveOrderDetail(null)
    } finally {
      setLoadingOrderDetail(false)
    }
  }

  async function addProductToCart(product: Product) {
    // 1. Optimistic instant local update (0ms UI latency)
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.productId === product.id)
      if (existing) {
        return prevItems.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [
        ...prevItems,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          unit: product.unit,
          images: product.images,
          stock: product.stock,
          quantity: 1,
        },
      ]
    })
    setNotice(`Added ${product.name} to cart`)

    // 2. Debounced API sync
    if (cartSyncTimeouts.current[product.id]) {
      clearTimeout(cartSyncTimeouts.current[product.id])
    }

    cartSyncTimeouts.current[product.id] = setTimeout(async () => {
      setCartBusyProductId(product.id)
      try {
        await addToCart(product.id, 1)
        await loadCart()
      } catch (err) {
        setNotice(getErrorMessage(err))
        await loadCart()
      } finally {
        setCartBusyProductId(null)
      }
    }, 250)
  }

  async function changeCartQuantity(productId: string, nextQuantity: number) {
    setCartError(null)

    // 1. Optimistic instant local update (0ms UI latency)
    setCartItems((prevItems) => {
      if (nextQuantity <= 0) {
        return prevItems.filter((i) => i.productId !== productId)
      }
      return prevItems.map((i) => (i.productId === productId ? { ...i, quantity: nextQuantity } : i))
    })

    // 2. Debounced API sync
    if (cartSyncTimeouts.current[productId]) {
      clearTimeout(cartSyncTimeouts.current[productId])
    }

    cartSyncTimeouts.current[productId] = setTimeout(async () => {
      setCartBusyProductId(productId)
      try {
        if (nextQuantity <= 0) {
          await removeCartItem(productId)
        } else {
          await updateCartItem(productId, nextQuantity)
        }
        await loadCart()
      } catch (err) {
        setCartError(getErrorMessage(err))
        await loadCart()
      } finally {
        setCartBusyProductId(null)
      }
    }, 250)
  }


  function handleSelectOlaPrediction(pred: OlaPrediction) {
    const desc = pred.description
    setOlaSearchInput('')
    setOlaPredictions([])

    const matchPin = pred.pincode || desc.match(/\b\d{6}\b/)?.[0] || '500081'
    const parts = desc.split(',').map((s) => s.trim())
    const line1 = parts.slice(0, Math.max(1, parts.length - 2)).join(', ')
    const city = parts[parts.length - 2] || 'Hyderabad'
    const state = 'Telangana'

    setAddressForm((prev) => ({
      ...prev,
      line1: line1 || desc,
      city: city,
      state: state,
      pincode: matchPin,
    }))

    setLocationLabel(desc)
    setCurrentPincode(matchPin)
    setNotice(`Location selected: ${matchPin}`)
  }

  async function handleAddToCart(product: Product) {
    if (!session) {
      setPostLoginTarget('cart')
      setShowLogin(true)
      return
    }
    await addProductToCart(product)
  }

  async function handleAddAllWishlistToCart() {
    if (!session) {
      setPostLoginTarget('cart')
      setShowLogin(true)
      return
    }

    const itemsToAdd = wishlistedProducts.filter((p) => p.stock > 0)
    for (const product of itemsToAdd) {
      try {
        await addToCart(product.id, 1)
        await removeFromWishlist(product.id)
      } catch (err) {
        console.error('Error transferring wishlist item to cart:', err)
      }
    }
    setWishlistIds(new Set())
    await loadCart()
    setWishlistOpen(false)
    setCartOpen(true)
    setNotice(`Moved ${itemsToAdd.length} liked ${itemsToAdd.length === 1 ? 'item' : 'items'} to cart!`)
  }

  function startEditAddress(addr: Address) {
    setEditingAddressId(addr.id)
    setAddressForm({
      label: addr.label,
      receiverName: addr.receiverName || '',
      receiverPhone: addr.receiverPhone || '',
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    })
  }

  function cancelEditAddress() {
    setEditingAddressId(null)
    setAddressForm(INITIAL_ADDRESS_FORM)
  }

  async function saveAddress(e?: FormEvent) {
    e?.preventDefault()
    setAddressBusy(true)
    setCartError(null)
    try {
      if (editingAddressId) {
        const updated = await updateAddress(editingAddressId, {
          label: addressForm.label.trim() || 'Home',
          receiverName: addressForm.receiverName.trim() || undefined,
          receiverPhone: addressForm.receiverPhone.trim() || undefined,
          line1: addressForm.line1.trim(),
          line2: addressForm.line2.trim() || undefined,
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          pincode: addressForm.pincode.trim(),
        })
        setAddresses((current) => current.map((a) => (a.id === editingAddressId ? updated : a)))
        setSelectedAddressId(updated.id)
        if (updated.pincode) setCurrentPincode(updated.pincode)
        setEditingAddressId(null)
        setAddressForm(INITIAL_ADDRESS_FORM)
        setNotice('Address updated successfully')
        return updated.id
      } else {
        const address = await createAddress({
          label: addressForm.label.trim() || 'Home',
          receiverName: addressForm.receiverName.trim() || undefined,
          receiverPhone: addressForm.receiverPhone.trim() || undefined,
          line1: addressForm.line1.trim(),
          line2: addressForm.line2.trim() || undefined,
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          pincode: addressForm.pincode.trim(),
          isDefault: addresses.length === 0,
        })
        setAddresses((current) => [address, ...current])
        setSelectedAddressId(address.id)
        if (address.pincode) {
          setCurrentPincode(address.pincode)
        }
        setAddressForm(INITIAL_ADDRESS_FORM)
        setNotice('Address saved via Ola Maps autocomplete!')
        return address.id
      }
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
      setNotice(`Order ${result.order.orderNumber} created. Payment pending.`)
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
          theme: { color: '#6A7B67' },
          modal: {
            ondismiss: () => reject(new Error(`Payment cancelled. Order ${result.order.orderNumber} pending.`)),
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
      setNotice(`Order ${result.order.orderNumber} placed & confirmed!`)
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

          if (!addressId) throw new Error('Please add a delivery address')

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
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartQuantityMap = Object.fromEntries(cartItems.map((item) => [item.productId, item.quantity]))

  const categoryFiltered = selectedCategorySlug
    ? allProducts.filter(
        (p) =>
          p.slug.toLowerCase().includes(selectedCategorySlug.toLowerCase()) ||
          p.name.toLowerCase().includes(selectedCategorySlug.toLowerCase()),
      )
    : allProducts

  const heroProducts = categoryFiltered.length > 0 ? categoryFiltered : allProducts
  const wishlistedProducts = allProducts.filter((p) => wishlistIds.has(p.id))

  // Render Home Content
  function renderHome() {
    const activeBanner = BANNERS[bannerIndex]
    const ALL_SIDEBAR_CATEGORIES = [
      'Staples',
      'Dairy',
      'Fruits & Vegetables',
      'Dals & Pulses',
      'Millets',
      'Oils',
      'Snacks',
      'Bakery',
      'Dry Fruits',
      'Beverages',
      'Edibles',
    ]

    return (
      <div className="space-y-6 pb-24">
        {/* Express Banner Carousel */}
        <section className="relative overflow-hidden rounded-3xl border border-[#164220]/20 shadow-md transition-all duration-500">
          <div className={`relative bg-gradient-to-r ${activeBanner.bg} p-6 sm:p-8 text-white min-h-[180px] flex flex-col justify-between`}>
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  {activeBanner.tag}
                </span>
                <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl tracking-tight leading-tight text-white">
                  {activeBanner.title}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-white/90 font-medium">
                  {activeBanner.subtitle}
                </p>
              </div>

              {/* Express Badge */}
              <div className="hidden sm:flex flex-col items-end rounded-2xl bg-white/10 p-3.5 backdrop-blur border border-white/15 text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">Direct Farm</span>
                <span className="text-xl font-extrabold text-white mt-0.5">⚡ 15 MIN</span>
                <span className="text-[10px] text-white/80 font-medium">Express Dispatch</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <IconSparkles className="w-4 h-4 text-white" />
                <span>Free Express Delivery on orders above ₹500</span>
              </span>

              {/* Carousel Dots */}
              <div className="flex gap-1.5">
                {BANNERS.map((banner, idx) => (
                  <button
                    key={banner.id}
                    onClick={() => setBannerIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === bannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quality Seals */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { title: '100% Farmer Verified', desc: 'Direct Mandya & Guntur', icon: IconShield },
            { title: '15-Min Dispatch', desc: 'Express fulfillment', icon: IconTruck },
            { title: 'Zero Middlemen Price', desc: 'Fair direct rates', icon: IconTag },
            { title: 'Lab Tested Organic', desc: 'Unadulterated guaranteed', icon: IconSprout },
          ].map((seal) => {
            const Icon = seal.icon
            return (
              <div key={seal.title} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#164220]">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{seal.title}</p>
                  <p className="text-[10px] font-medium text-slate-500">{seal.desc}</p>
                </div>
              </div>
            )
          })}
        </section>

        {/* Main Content Layout with Desktop Category Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Product Showcase Grid (Left / Main Column) */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#164220]">Direct Farm Harvest</span>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {selectedCategorySlug ? `Category: ${selectedCategorySlug.toUpperCase()}` : 'All Organic Products'}
                </h2>
              </div>
              {selectedCategorySlug && (
                <button
                  onClick={() => setSelectedCategorySlug('')}
                  className="text-xs font-bold text-[#164220] hover:underline"
                >
                  Show All Products ({allProducts.length})
                </button>
              )}
            </div>

            {catalogLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : heroProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {heroProducts.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    quantityInCart={cartQuantityMap[product.id] ?? 0}
                    isWishlisted={wishlistIds.has(product.id)}
                    busy={cartBusyProductId === product.id}
                    onAdd={(item) => void handleAddToCart(item)}
                    onUpdateQty={(id, qty) => void changeCartQuantity(id, qty)}
                    onToggleWishlist={(item) => void handleToggleWishlist(item)}
                    onClickProduct={(item) => {
                      setSelectedProductSlug(item.slug)
                      window.location.hash = `/product/${item.slug}`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Category Sidebar (Right Column on Desktop - Image 1) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-3 sticky top-20">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="font-display text-base font-extrabold text-slate-900 border-b-2 border-[#164220] pb-1 inline-block mb-3">
                Category
              </h3>
              <div className="space-y-1.5">
                {ALL_SIDEBAR_CATEGORIES.map((catName) => {
                  const catSlug = catName.toLowerCase().replace(/[^a-z0-9]/g, '-')
                  const isSelected = selectedCategorySlug.toLowerCase() === catSlug
                  return (
                    <button
                      key={catName}
                      onClick={() => {
                        if (isSelected) setSelectedCategorySlug('')
                        else setSelectedCategorySlug(catSlug)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                        isSelected
                          ? 'border-[#164220] bg-[#eaf5ee] text-[#164220] font-bold shadow-xs'
                          : 'border-slate-100 bg-white text-slate-700 hover:border-[#164220]/40 hover:bg-[#f4f7f5] hover:text-[#164220]'
                      }`}
                    >
                      {catName}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* Farmers Section */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6A7B67]">Transparency</span>
              <h2 className="text-lg font-extrabold text-[#2D382C] tracking-tight">Meet Your Organic Growers</h2>
            </div>
          </div>

          {farmersLoading ? (
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 w-44 animate-pulse rounded-2xl bg-white/60" />
              ))}
            </div>
          ) : farmers.length === 0 ? (
            <div className="rounded-2xl border border-[#6A7B67]/20 bg-white p-6 text-center text-xs text-slate-500 font-semibold">
              Farmers onboarding in progress.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 pr-2 app-scrollbar-none">
              {farmers.map((farmer) => (
                <article
                  key={farmer.id}
                  onClick={() => setSelectedFarmer(farmer)}
                  className="min-w-[210px] flex-1 rounded-2xl border border-[#6A7B67]/30 bg-white p-4 shadow-sm hover:border-[#164220] hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ECE5D1] to-[#6A7B67]/30 text-[#2D382C] overflow-hidden group-hover:scale-105 transition flex-shrink-0">
                      {farmer.photoUrl ? (
                        <img src={farmer.photoUrl} alt={farmer.name} className="h-full w-full object-cover" />
                      ) : (
                        <IconSprout className="w-6 h-6 text-[#6A7B67]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#2D382C] group-hover:text-[#164220] transition">{farmer.name}</h4>
                      <p className="text-[10px] font-medium text-slate-500">
                        {farmer.village ? `${farmer.village}, ` : ''}{farmer.district ?? 'India'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#ECE5D1] pt-2">
                    <span className="flex items-center gap-1 rounded-full bg-[#6A7B67]/15 px-2.5 py-0.5 text-[10px] font-bold capitalize text-[#2D382C] border border-[#6A7B67]/30">
                      <IconCheck className="w-3 h-3 text-[#6A7B67]" />
                      <span>{farmer.certificationStatus}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-[#164220] group-hover:underline">View Profile →</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  // Render Search View Content
  function renderSearch() {
    const q = debouncedSearchQuery.toLowerCase().trim()
    const searchResults = allProducts.filter((p) => {
      const matchesCat = !selectedCategorySlug || p.categoryId === selectedCategorySlug || p.categorySlug === selectedCategorySlug
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      return matchesCat && matchesQuery
    })

    return (
      <div className="space-y-4 pb-24">
        {/* Search Header Input */}
        <div className="relative">
          <div className="flex items-center rounded-2xl border border-[#6A7B67]/40 bg-white px-4 py-3 shadow-md focus-within:border-[#6A7B67] focus-within:ring-2 focus-within:ring-[#6A7B67]/30 transition">
            <IconSearch className="mr-2 w-5 h-5 text-[#6A7B67]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farm fresh millets, pulses, ghee, spices..."
              className="w-full bg-transparent text-sm font-semibold text-[#2D382C] placeholder-slate-400 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 rounded-full bg-slate-100 p-1 text-xs text-slate-500 hover:bg-slate-200"
              >
                <IconCross className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 app-scrollbar-none">
          <button
            onClick={() => setSelectedCategorySlug('')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              !selectedCategorySlug
                ? 'bg-[#6A7B67] text-white shadow-md'
                : 'bg-white border border-[#6A7B67]/30 text-[#2D382C] hover:bg-[#ECE5D1]/50'
            }`}
          >
            All Products ({searchResults.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedCategorySlug === cat.slug
                  ? 'bg-[#6A7B67] text-white shadow-md'
                  : 'bg-white border border-[#6A7B67]/30 text-[#2D382C] hover:bg-[#ECE5D1]/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Results Grid */}
        {searchResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#6A7B67]/40 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6A7B67]/15 text-[#6A7B67] mb-3">
              <IconSprout className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D382C]">No items match your search</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Try searching for &quot;millets&quot;, &quot;toor dal&quot;, or &quot;ghee&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {searchResults.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                quantityInCart={cartQuantityMap[product.id] ?? 0}
                isWishlisted={wishlistIds.has(product.id)}
                busy={cartBusyProductId === product.id}
                onAdd={(item) => void handleAddToCart(item)}
                onUpdateQty={(id, qty) => void changeCartQuantity(id, qty)}
                onToggleWishlist={(item) => void handleToggleWishlist(item)}
                onClickProduct={(item) => {
                  setSelectedProductSlug(item.slug)
                  window.location.hash = `/product/${item.slug}`
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render Farmers / Growers Directory View
  function renderFarmersView() {
    return (
      <div className="space-y-6 pb-24">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#2D382C] via-[#3A4939] to-[#1E261D] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#ECE5D1] border border-white/20">
              <IconCheck className="w-3.5 h-3.5 text-[#ECE5D1]" />
              100% Verified Organic Growers Network
            </span>
            <h2 className="text-2xl font-black text-[#ECE5D1] tracking-tight">
              Meet Our Organic Farmers & Cultivators
            </h2>
            <p className="text-xs text-[#ECE5D1]/80 leading-relaxed">
              Explore profiles of our verified organic growers. Click any farmer profile to view their farm story, land area, organic certifications, and direct harvest.
            </p>
          </div>
        </div>

        {/* Farmers Grid */}
        {farmersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-white/60" />
            ))}
          </div>
        ) : farmers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#6A7B67]/40 bg-white p-12 text-center text-xs text-slate-500 font-semibold">
            Farmers onboarding in progress.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {farmers.map((farmer) => {
              const farmerProds = allProducts.filter(
                (p) => p.farmerName.toLowerCase().trim() === farmer.name.toLowerCase().trim()
              )
              const defaultBanner = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
              const defaultAvatar = 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=300&q=80'

              return (
                <article
                  key={farmer.id}
                  onClick={() => setSelectedFarmer(farmer)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm hover:border-[#164220] hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  {/* Cover Header */}
                  <div className="h-24 w-full overflow-hidden bg-emerald-950 relative">
                    <img
                      src={farmer.bannerUrl || defaultBanner}
                      alt={farmer.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>

                  {/* Body Info */}
                  <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between">
                    <div>
                      {/* Avatar Overlay */}
                      <div className="-mt-10 mb-3 flex items-end justify-between">
                        <img
                          src={farmer.photoUrl || defaultAvatar}
                          alt={farmer.name}
                          className="h-16 w-16 rounded-full border-2 border-white shadow-md bg-white object-cover flex-shrink-0"
                        />
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-[#164220] border border-emerald-200">
                          {farmerProds.length} Harvest Items
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-[#164220] transition flex items-center gap-1.5">
                        <span>{farmer.name}</span>
                        <IconCheck className="w-3.5 h-3.5 text-[#164220]" />
                      </h3>

                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {[farmer.village, farmer.district, farmer.state || 'Telangana'].filter(Boolean).join(', ')}
                      </p>

                      <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-2 leading-relaxed">
                        {farmer.bio || 'Dedicated organic cultivator using 100% natural, pesticide-free regenerative farming methods.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#164220] group-hover:underline flex items-center gap-1">
                        <span>View LinkedIn Profile</span>
                        <IconArrowRight className="w-3.5 h-3.5 text-[#164220]" />
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render Orders View with NimbusPost Live Status
  function renderOrders() {
    if (!session) {
      return (
        <div className="rounded-3xl border border-[#6A7B67]/30 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6A7B67]/15 text-[#6A7B67] mb-3">
            <IconOrders className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#2D382C]">Track Your Orders & NimbusPost Status</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">Please login to view real-time NimbusPost shipment updates.</p>
          <button
            onClick={() => {
              setPostLoginTarget('orders')
              setShowLogin(true)
            }}
            className="mt-5 rounded-xl bg-[#6A7B67] px-6 py-3 text-xs font-extrabold text-white shadow-glow-sage hover:bg-[#536250] transition flex items-center justify-center gap-2 mx-auto"
          >
            <span>Login to View Orders</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6 pb-24">
        <div>
          <h2 className="text-xl font-extrabold text-[#2D382C] tracking-tight">Orders & NimbusPost Live Tracking</h2>
          <p className="text-xs text-slate-600 font-medium">Real-time delivery status synced directly with NimbusPost logistics</p>
        </div>

        {ordersLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#6A7B67]/40 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6A7B67]/15 text-[#6A7B67] mb-3">
              <IconCart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D382C]">No orders placed yet</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">Explore farm fresh organic products and place your first order.</p>
            <button
              onClick={() => setActiveView('Home')}
              className="mt-4 rounded-xl bg-[#6A7B67] px-5 py-2.5 text-xs font-bold text-white shadow-glow-sage inline-flex items-center gap-2"
            >
              <span>Start Shopping Now</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Orders List */}
            <div className="space-y-3 lg:col-span-5">
              {orders.map((ord) => {
                const isSelected = activeOrderDetail?.order.id === ord.id
                return (
                  <button
                    key={ord.id}
                    onClick={() => void fetchOrderDetail(ord.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#6A7B67] bg-[#2D382C] text-white shadow-lg'
                        : 'border-[#6A7B67]/25 bg-white text-[#2D382C] hover:border-[#6A7B67] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold ${isSelected ? 'text-[#ECE5D1]' : 'text-[#2D382C]'}`}>
                        Order #{ord.orderNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          ord.status === 'delivered'
                            ? 'bg-[#6A7B67]/40 text-[#ECE5D1] border border-[#6A7B67]'
                            : ord.status === 'out_for_delivery'
                              ? 'bg-amber-500/30 text-amber-200 border border-amber-400 animate-pulse'
                              : 'bg-blue-500/30 text-blue-200 border border-blue-400'
                        }`}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-700/30 pt-2 text-xs">
                      <span className={isSelected ? 'text-[#ECE5D1]/70' : 'text-slate-500'}>
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-extrabold">{formatCurrency(ord.total)}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected Order Details & NimbusPost Tracker */}
            <div className="lg:col-span-7">
              {loadingOrderDetail ? (
                <div className="h-64 animate-pulse rounded-3xl bg-white/60" />
              ) : activeOrderDetail ? (
                <div className="rounded-3xl border border-[#6A7B67]/30 bg-white p-6 shadow-md space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[#ECE5D1] pb-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6A7B67]">
                        NimbusPost Order Details
                      </span>
                      <h3 className="text-lg font-extrabold text-[#2D382C]">Order #{activeOrderDetail.order.orderNumber}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium">Payment Status</p>
                      <span className="text-xs font-bold capitalize text-[#6A7B67]">
                        {activeOrderDetail.order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* NimbusPost Card */}
                  <div className="rounded-2xl bg-[#2D382C] p-4 text-white space-y-3">
                    <div className="flex items-center justify-between border-b border-[#6A7B67]/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-[#6A7B67] animate-pulse" />
                        <span className="text-xs font-bold text-[#ECE5D1]">NimbusPost Integrated Dispatch</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#ECE5D1]/70">
                        Courier: {activeOrderDetail.shipment?.courierName ?? 'NimbusPost Logistics'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-[#ECE5D1]/60">AWB Tracking Reference</p>
                        <p className="font-mono font-extrabold text-[#ECE5D1]">
                          {activeOrderDetail.shipment?.awbNumber ? activeOrderDetail.shipment.awbNumber : 'Pending Admin Dispatch'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#ECE5D1]/60">Current Status</p>
                        <p className="font-extrabold text-[#ECE5D1] uppercase tracking-wider">
                          {activeOrderDetail.shipment?.status ? activeOrderDetail.shipment.status : activeOrderDetail.order.status === 'confirmed' ? 'Awaiting Dispatch' : activeOrderDetail.order.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Live Delivery Timeline</h4>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECE5D1]">
                      {[
                        { label: 'Order Placed & Confirmed', key: 'confirmed', desc: 'Received at Farm Hub' },
                        { label: 'Sent to NimbusPost Logistics', key: 'shipped', desc: activeOrderDetail.shipment?.awbNumber ? `AWB: ${activeOrderDetail.shipment.awbNumber} (${activeOrderDetail.shipment.courierName || 'NimbusPost'})` : 'Awaiting Admin Dispatch' },
                        { label: 'Out for Delivery', key: 'out_for_delivery', desc: 'NimbusPost agent out for delivery' },
                        { label: 'Delivered', key: 'delivered', desc: 'Handed over to customer' },
                      ].map((step) => {
                        const statusSequence = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']
                        const currentStatusIdx = statusSequence.indexOf(activeOrderDetail.order.status)
                        const stepIdx = statusSequence.indexOf(step.key)
                        const isDone = currentStatusIdx >= stepIdx && currentStatusIdx !== -1
                        const isCurrent = activeOrderDetail.order.status === step.key

                        return (
                          <div key={step.key} className="relative flex items-start justify-between">
                            <span
                              className={`absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white transition ${
                                isDone ? 'bg-[#6A7B67] shadow-glow-sage' : 'bg-[#ECE5D1]'
                              }`}
                            >
                              {isDone ? <IconCheck className="w-2.5 h-2.5 text-white" /> : ''}
                            </span>
                            <div>
                              <p className={`text-xs font-extrabold ${isCurrent ? 'text-[#6A7B67]' : isDone ? 'text-[#2D382C]' : 'text-slate-400'}`}>
                                {step.label}
                              </p>
                              <p className="text-[10px] text-slate-500">{step.desc}</p>
                            </div>
                            {isCurrent && (
                              <span className="rounded-full bg-[#6A7B67]/20 px-2 py-0.5 text-[10px] font-bold text-[#2D382C] animate-pulse">
                                Live Status
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-[#ECE5D1] pt-4 space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Ordered Products</h4>
                    <div className="divide-y divide-[#ECE5D1]">
                      {activeOrderDetail.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                          <div>
                            <p className="font-bold text-[#2D382C]">{item.productName}</p>
                            <p className="text-[10px] text-slate-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                          </div>
                          <span className="font-extrabold text-[#2D382C]">
                            {formatCurrency(Number(item.unitPrice) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-[#6A7B67]/20 bg-white p-8 text-center text-xs text-slate-500 font-semibold">
                  Select an order from the list to view live tracking details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render Profile View
  function renderProfile() {
    if (!session) {
      return (
        <div className="rounded-3xl border border-[#6A7B67]/30 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6A7B67]/15 text-[#6A7B67] mb-3">
            <IconUser className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#2D382C]">Your Account</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">Log in to manage delivery addresses and saved preferences.</p>
          <button
            onClick={() => {
              setPostLoginTarget('profile')
              setShowLogin(true)
            }}
            className="mt-5 rounded-xl bg-[#6A7B67] px-6 py-3 text-xs font-extrabold text-white shadow-glow-sage hover:bg-[#536250] transition flex items-center justify-center gap-2 mx-auto"
          >
            <span>Login to Profile</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6 pb-24">
        {/* User Card */}
        <div className="rounded-3xl border border-[#6A7B67]/40 bg-[#2D382C] p-6 text-white shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6A7B67] text-2xl font-extrabold text-white shadow-glow-sage">
              <IconUser className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#ECE5D1]">{session.user.name || 'Organic Buyer'}</h2>
              <p className="text-xs text-[#ECE5D1]/80 font-medium">+91 {session.user.phone}</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearSession()
              setSession(null)
              setNotice('Logged out successfully')
            }}
            className="rounded-xl bg-[#1d241c] px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/50 transition border border-[#6A7B67]/30"
          >
            Logout
          </button>
        </div>

        {/* Saved Addresses */}
        <div className="rounded-3xl border border-[#6A7B67]/30 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#2D382C]">Saved Addresses</h3>
              <p className="text-xs text-slate-500 font-medium">Your delivery locations with receiver contact details</p>
            </div>
          </div>

          {addresses.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No saved addresses yet. Add one below.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddressId(addr.id)
                    if (addr.pincode) setCurrentPincode(addr.pincode)
                  }}
                  className={`rounded-2xl border p-4 cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? 'border-[#6A7B67] bg-[#ECE5D1]/50 text-[#2D382C] ring-2 ring-[#6A7B67]/20'
                      : 'border-[#6A7B67]/20 bg-white text-slate-700 hover:border-[#6A7B67]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#ECE5D1] px-2 py-0.5 text-[10px] font-extrabold text-[#2D382C]">
                      {addr.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditAddress(addr)
                      }}
                      className="text-xs font-bold text-[#6A7B67] hover:underline"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#2D382C]">{addr.line1}</p>
                  {addr.line2 && <p className="text-xs text-slate-500">{addr.line2}</p>}
                  <p className="text-xs text-slate-500">{addr.city}, {addr.state} - {addr.pincode}</p>

                  {(addr.receiverName || addr.receiverPhone) && (
                    <p className="mt-2 text-[11px] font-semibold text-[#6A7B67] border-t border-slate-100 pt-1.5 flex items-center gap-1">
                      <span>👤 Receiver: {addr.receiverName || 'Recipient'}</span>
                      {addr.receiverPhone && <span>({addr.receiverPhone})</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Address Form (Add / Edit Mode) */}
          <form onSubmit={saveAddress} className="border-t border-[#ECE5D1] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6A7B67] flex items-center gap-1.5">
                <IconLocation className="w-4 h-4 text-[#6A7B67]" />
                <span>{editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address (Ola Maps Autocomplete)'}</span>
              </h4>
              {editingAddressId && (
                <button
                  type="button"
                  onClick={cancelEditAddress}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Ola Maps Search Input */}
            <div className="relative">
              <div className="flex items-center rounded-xl border border-[#6A7B67] bg-[#ECE5D1]/40 px-3.5 py-2.5 text-xs font-medium focus-within:ring-2 focus-within:ring-[#6A7B67]/30">
                <IconSearch className="w-4 h-4 text-[#6A7B67] mr-2" />
                <input
                  type="text"
                  placeholder="Search street, area or landmark via Ola Maps (e.g. Jubilee Hills, Hyderabad)..."
                  value={olaSearchInput}
                  onChange={(e) => setOlaSearchInput(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#2D382C] placeholder-slate-500 outline-none"
                />
                {olaLoading && <span className="text-[10px] font-bold text-[#6A7B67]">Searching...</span>}
              </div>

              {/* Ola Maps Predictions Dropdown */}
              {olaPredictions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#6A7B67]/40 bg-white p-1.5 shadow-2xl space-y-1">
                  {olaPredictions.map((pred) => (
                    <button
                      type="button"
                      key={pred.place_id}
                      onClick={() => handleSelectOlaPrediction(pred)}
                      className="w-full rounded-lg p-2 text-left hover:bg-[#ECE5D1]/60 transition flex items-center gap-2 text-xs font-semibold text-[#2D382C]"
                    >
                      <IconLocation className="w-3.5 h-3.5 text-[#6A7B67] flex-shrink-0" />
                      <span className="truncate">{pred.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields: Receiver Details + Address Details */}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Receiver Full Name (e.g. Rahul Sharma)"
                value={addressForm.receiverName}
                onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Receiver Mobile Number (10-digit)"
                value={addressForm.receiverPhone}
                onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value.replace(/\D/g, '') })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
              <input
                type="text"
                placeholder="Label (e.g. Home, Work)"
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
              <input
                type="text"
                placeholder="Flat / House / Street (Line 1)"
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
              <input
                type="text"
                placeholder="Landmark / Area (Line 2)"
                value={addressForm.line2}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
              />
              <input
                type="text"
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
              <input
                type="text"
                placeholder="Pincode"
                value={addressForm.pincode}
                onChange={(e) => {
                  setAddressForm({ ...addressForm, pincode: e.target.value })
                  if (e.target.value.length === 6) setCurrentPincode(e.target.value)
                }}
                className="rounded-xl border border-slate-300 bg-[#ECE5D1]/30 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67]"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={addressBusy}
                className="rounded-xl bg-[#6A7B67] px-5 py-2.5 text-xs font-bold text-white shadow-glow-sage hover:bg-[#536250] transition"
              >
                {addressBusy ? 'Processing...' : editingAddressId ? '✓ Update Address' : '+ Save Address'}
              </button>
              {editingAddressId && (
                <button
                  type="button"
                  onClick={cancelEditAddress}
                  className="rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Render Our Story Page Content
  function renderOurStory() {
    return (
      <div className="space-y-8 py-6 max-w-4xl mx-auto text-gray-800 pb-20">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-[#164220] p-8 text-white text-center shadow-lg relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Millet Amma Inspired</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 mb-3">Our Story & Organic Harvest Philosophy</h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Connect to Farm was founded with a mission: to bridge the gap between verified local organic farmers in Mandya & Guntur and health-conscious families, delivering unpolished, lab-certified millets straight from harvest.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
            <span className="text-3xl mb-3 block">🌾</span>
            <h3 className="text-sm font-bold text-gray-900 mb-1">100% Unpolished Millets</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Zero mineral oil polish. Retains natural dietary fiber, essential vitamins, and anti-oxidants.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
            <span className="text-3xl mb-3 block">👨‍🌾</span>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Direct Farmer Profits</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Eliminating middlemen ensures fair wages for farming families and unadulterated food for you.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
            <span className="text-3xl mb-3 block">🧪</span>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Lab Tested Organic</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Every batch undergoes rigorous quality testing to guarantee zero pesticides and zero chemical additives.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-[#164220] selection:text-white">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-2 rounded-2xl bg-[#164220] px-4 py-2.5 text-xs font-bold text-white shadow-2xl border border-[#164220] animate-bounce">
            <IconSparkles className="w-4 h-4 text-white" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* Sticky Header - Organic Mandya / Connect to Farm Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Left & Desktop Category Button */}
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              aria-label="Open Navigation Menu"
            >
              <IconMenu className="w-5 h-5" />
            </button>

            {/* Desktop Browse All Categories Button */}
            <button
              onClick={() => {
                setActiveView('Search')
                setSelectedCategorySlug('')
              }}
              className="hidden lg:flex items-center gap-2 bg-[#164220] hover:bg-[#103318] text-white px-4 py-2 rounded-lg text-xs font-bold font-display shadow-xs transition"
            >
              <span className="text-sm">▦</span>
              <span>Browse All Categories</span>
              <span className="text-[10px]">▼</span>
            </button>

            {/* Location Selector Pill */}
            <button
              onClick={() => {
                setShowLocationModal(true)
                window.location.hash = '/location'
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#164220] transition"
            >
              <IconLocation className="w-4 h-4 text-[#164220]" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">Deliver to {currentPincode || '500086'}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>
          </div>

          {/* Center Search Input or Logo */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (activeView !== 'Search') setActiveView('Search')
                }}
                placeholder="organic search..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 pr-9 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#164220] focus:ring-1 focus:ring-[#164220]"
              />
              <IconSearch className="pointer-events-none absolute right-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Logo Center (Mobile & Desktop Accent) */}
          <button
            onClick={() => {
              setActiveView('Home')
              setSelectedCategorySlug('')
              window.location.hash = '/'
            }}
            className="flex items-center gap-1.5 font-display"
          >
            <span className="text-base sm:text-xl font-black text-[#164220] tracking-tight">Connect To Farm</span>
            <span className="hidden sm:inline-block text-[9px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-300 pl-1.5">
              PURE ROOTS
            </span>
          </button>

          {/* Far-Right Icons (Wishlist, Cart, Log in) */}
          <div className="flex items-center gap-3 sm:gap-5 text-slate-700 font-semibold text-xs">
            {/* Wishlist */}
            <button
              onClick={() => {
                if (!session) {
                  setNotice('Please sign in to view your wishlist')
                  setShowLogin(true)
                } else {
                  setWishlistOpen(true)
                }
              }}
              className="hidden sm:flex items-center gap-1 hover:text-[#164220] transition relative"
            >
              <IconHeart className={`w-4 h-4 ${wishlistIds.size > 0 ? 'text-[#164220] fill-[#164220]' : ''}`} />
              <span>Wishlist</span>
              {wishlistIds.size > 0 && (
                <span className="ml-0.5 rounded-full bg-[#164220] px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {wishlistIds.size}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-1 hover:text-[#164220] transition relative"
            >
              <IconCart className="w-5 h-5 text-slate-800" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="rounded-full bg-[#164220] px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Log in / User */}
            <button
              onClick={() => {
                if (session) setActiveView('Profile')
                else setShowLogin(true)
              }}
              className="flex items-center gap-1 hover:text-[#164220] transition"
            >
              <IconUser className="w-4 h-4 text-slate-700" />
              <span>{session ? session.user.name.split(' ')[0] : 'Log in'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 pt-5">
        {activeView === 'Home' && renderHome()}
        {activeView === 'Search' && renderSearch()}
        {activeView === 'OurStory' && renderOurStory()}
        {activeView === 'Farmers' && renderFarmersView()}
        {activeView === 'Orders' && renderOrders()}
        {activeView === 'Profile' && renderProfile()}
      </main>

      {/* Floating Cart Bottom Pill Bar */}
      {cartItemCount > 0 && !cartOpen && (
        <div className="fixed bottom-16 inset-x-0 z-40 flex justify-center px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full max-w-md items-center justify-between rounded-2xl bg-[#2D382C] px-5 py-3.5 text-white shadow-2xl border border-[#6A7B67] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6A7B67] text-white font-black text-sm">
                {cartItemCount}
              </span>
              <div className="text-left">
                <p className="text-xs font-black text-[#ECE5D1]">{formatCurrency(cartTotal)}</p>
                <p className="text-[10px] font-bold text-[#ECE5D1]/80">
                  NimbusPost Express Dispatch
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#ECE5D1] uppercase tracking-wider">
              <span>View Cart</span>
              <IconArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Responsive Navigation Sidebar Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-[#1d241c]/70 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="relative flex h-full w-4/5 max-w-xs sm:max-w-sm flex-col bg-white text-[#2D382C] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#6A7B67]/30 bg-gradient-to-r from-[#2D382C] via-[#3A4939] to-[#1E261D] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-[#184E28] shadow-md">
                  <IconSprout className="w-4 h-4 fill-current" />
                </span>
                <div>
                  <h3 className="text-sm font-black tracking-wider text-[#ECE5D1] uppercase">Connect To Farm</h3>
                  <p className="text-[10px] text-[#ECE5D1]/80 font-semibold">Verified Organic Harvest</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#ECE5D1] hover:bg-white/20 transition"
                aria-label="Close navigation sidebar"
              >
                <IconCross className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile / Login Card */}
            <div className="bg-[#ECE5D1]/40 border-b border-[#6A7B67]/20 p-4">
              {session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#164220] text-[#ECE5D1] font-black text-sm shadow-md">
                      {session.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-[#2D382C] truncate">{session.user.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 truncate">{session.user.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setActiveView('Profile')
                        window.location.hash = '/profile'
                      }}
                      className="rounded-xl border border-[#6A7B67]/40 bg-white py-1.5 px-2 text-[11px] font-bold text-[#164220] hover:bg-emerald-50 transition text-center"
                    >
                      👤 Account
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setActiveView('Orders')
                        window.location.hash = '/orders'
                      }}
                      className="rounded-xl border border-[#6A7B67]/40 bg-white py-1.5 px-2 text-[11px] font-bold text-[#164220] hover:bg-emerald-50 transition text-center"
                    >
                      📦 Orders
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#164220]/15 text-[#164220]">
                      <IconUser className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#2D382C]">Welcome Guest</p>
                      <p className="text-[10px] font-medium text-slate-500">Sign in for orders & checkout</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setShowLogin(true)
                    }}
                    className="rounded-full bg-[#164220] px-3.5 py-1.5 text-xs font-black text-[#ECE5D1] shadow-md hover:bg-[#123C1E] transition whitespace-nowrap"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary Pages Nav */}
              <div className="space-y-1">
                <p className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Navigation</p>
                
                <button
                  onClick={() => {
                    setActiveView('Home')
                    setSelectedCategorySlug('')
                    setMobileMenuOpen(false)
                    window.location.hash = '/'
                  }}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeView === 'Home'
                      ? 'bg-[#164220] text-white shadow-md'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-[#164220]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <IconHome className="w-4 h-4" />
                    <span>Home</span>
                  </span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => {
                    setActiveView('Search')
                    setMobileMenuOpen(false)
                    window.location.hash = '/search'
                  }}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeView === 'Search'
                      ? 'bg-[#164220] text-white shadow-md'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-[#164220]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <IconSearch className="w-4 h-4" />
                    <span>Search Products</span>
                  </span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => {
                    setActiveView('OurStory')
                    setSelectedCategorySlug('')
                    setMobileMenuOpen(false)
                    window.location.hash = '/our-story'
                  }}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeView === 'OurStory'
                      ? 'bg-[#164220] text-white shadow-md'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-[#164220]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <IconSprout className="w-4 h-4" />
                    <span>Our Story</span>
                  </span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => {
                    setActiveView('Farmers')
                    setSelectedCategorySlug('')
                    setMobileMenuOpen(false)
                    window.location.hash = '/farmers'
                  }}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                    activeView === 'Farmers'
                      ? 'bg-[#164220] text-white shadow-md'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-[#164220]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <IconCheck className="w-4 h-4" />
                    <span>Verified Organic Farmers</span>
                  </span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    if (!session) {
                      setNotice('Please sign in to view your wishlist')
                      setShowLogin(true)
                    } else {
                      setWishlistOpen(true)
                    }
                  }}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#164220] transition"
                >
                  <span className="flex items-center gap-3">
                    <IconHeart className={`w-4 h-4 ${wishlistIds.size > 0 ? 'fill-current text-[#164220]' : ''}`} />
                    <span>My Wishlist</span>
                  </span>
                  <span className="rounded-full bg-[#164220] px-2 py-0.5 text-[10px] font-extrabold text-white">
                    {wishlistIds.size}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setShowLocationModal(true)
                  }}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#164220] transition"
                >
                  <span className="flex items-center gap-3 truncate">
                    <IconLocation className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    Change
                  </span>
                </button>
              </div>

              {/* Categories Shortcuts */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Explore Categories</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        setSelectedCategorySlug(cat.slug)
                        setActiveView('Home')
                        setMobileMenuOpen(false)
                        window.location.hash = `/category/${cat.slug}`
                      }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition text-left ${
                        selectedCategorySlug === cat.slug
                          ? 'bg-[#ECE5D1] text-[#164220] border border-[#6A7B67]/40'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] font-normal text-slate-400">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-gray-200 text-xs font-bold text-[#164220] shadow-sm">
                <IconShield className="w-4 h-4 text-[#164220] flex-shrink-0" />
                <span className="text-[11px] leading-tight">100% Certified Organic & Direct Farm Sourced</span>
              </div>
              {session && (
                <button
                  onClick={() => {
                    clearSession()
                    setSession(null)
                    setMobileMenuOpen(false)
                    setNotice('You have been logged out')
                  }}
                  className="w-full rounded-xl border border-red-200 bg-white py-2 text-center text-xs font-bold text-red-600 hover:bg-red-50 transition"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Wishlist Sidebar Drawer */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1d241c]/70 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="relative flex h-full w-full max-w-md flex-col bg-white text-[#2D382C] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#6A7B67]/30 bg-gradient-to-r from-[#2D382C] to-[#1E261D] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECE5D1]/20 text-[#ECE5D1] border border-[#ECE5D1]/30">
                  <IconHeart className="w-5 h-5 fill-current text-[#ECE5D1]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-[#ECE5D1]">Liked Products</h3>
                  <p className="text-[11px] text-[#ECE5D1]/80 font-medium">
                    {wishlistIds.size} {wishlistIds.size === 1 ? 'item' : 'items'} saved in your wishlist
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWishlistOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#ECE5D1] hover:bg-white/20 transition"
              >
                <IconCross className="w-4 h-4" />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {wishlistedProducts.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECE5D1]/60 text-[#164220] border border-[#6A7B67]/30 shadow-inner">
                    <IconHeart className="w-8 h-8 fill-current text-[#164220]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2D382C]">Your wishlist is empty</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Explore our farm-fresh organic products and tap the ❤️ heart icon to save your favorites here!
                    </p>
                  </div>
                </div>
              ) : (
                wishlistedProducts.map((product) => {
                  const quantityInCart = cartQuantityMap[product.id] ?? 0
                  const imageUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
                  const busy = cartBusyProductId === product.id

                  return (
                    <div
                      key={product.id}
                      className="group relative flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm hover:border-[#6A7B67] hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-16 w-16 rounded-xl object-contain border border-gray-100 bg-gray-50 p-1 flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-[#2D382C] line-clamp-1">{product.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Sourced from {product.farmerName || 'Verified Farmer'}</p>
                          <p className="text-xs font-extrabold text-[#164220] mt-0.5">
                            Rs. {product.price}.00 <span className="text-[10px] text-slate-400 font-normal">/ {product.unit}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAddToCart(product)}
                          disabled={product.stock < 1 || busy}
                          className="rounded-xl bg-[#164220] hover:bg-[#103318] text-white px-3 py-1.5 text-xs font-extrabold shadow-sm transition disabled:opacity-50"
                        >
                          {quantityInCart > 0 ? `In Cart (${quantityInCart})` : 'Add to Cart'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleWishlist(product)}
                          title="Remove from wishlist"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-[#164220] hover:text-white hover:border-[#164220] transition"
                        >
                          <IconCross className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {wishlistedProducts.length > 0 && (
              <div className="border-t border-[#ECE5D1] bg-[#ECE5D1]/30 p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleAddAllWishlistToCart()}
                  className="w-full rounded-2xl bg-[#164220] hover:bg-[#103318] py-3.5 text-xs font-extrabold text-white shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <IconCart className="w-4 h-4 text-white" />
                  <span>Add All Liked Items to Cart & Clear Wishlist</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1d241c]/70 backdrop-blur-sm transition-opacity">
          <div className="relative flex h-full w-full max-w-md flex-col bg-white text-[#2D382C] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#6A7B67]/30 bg-[#2D382C] p-4 text-white">
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-[#ECE5D1]">Express Farm Cart</h3>
                <p className="text-[11px] text-[#ECE5D1]/80 font-medium flex items-center gap-1">
                  <IconTruck className="w-3.5 h-3.5 text-[#ECE5D1]" />
                  <span>NimbusPost EDD: {eddInfo ? eddInfo.edd : 'Tomorrow'}</span>
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d241c] text-[#ECE5D1] hover:bg-[#6A7B67]"
              >
                <IconCross className="w-4 h-4" />
              </button>
            </div>

            {/* Free Delivery Progress */}
            <div className="bg-[#ECE5D1]/50 p-3.5 border-b border-[#6A7B67]/20">
              <div className="flex items-center justify-between text-xs font-bold text-[#2D382C] mb-1.5">
                <span>
                  {cartSubtotal >= FREE_DELIVERY_THRESHOLD
                    ? 'Unlocked FREE Express Delivery!'
                    : `Add ${formatCurrency(FREE_DELIVERY_THRESHOLD - cartSubtotal)} more for FREE Delivery`}
                </span>
                <span className="text-[10px]">Threshold: {formatCurrency(FREE_DELIVERY_THRESHOLD)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#6A7B67]/20">
                <div
                  className="h-full bg-[#6A7B67] transition-all duration-500"
                  style={{ width: `${Math.min(100, (cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartLoading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6A7B67]/15 text-[#6A7B67] mb-2">
                    <IconCart className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-[#2D382C]">Your cart is empty</p>
                  <p className="text-xs">Add fresh farm produce to continue.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-2xl border border-[#6A7B67]/25 p-3 shadow-sm"
                  >
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[#2D382C]">{item.name}</h4>
                      <p className="text-[11px] font-semibold text-[#6A7B67]">
                        {formatCurrency(item.price)} / {item.unit}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center rounded-xl bg-[#2D382C] px-1 py-1 text-white">
                      <button
                        onClick={() => void changeCartQuantity(item.productId, item.quantity - 1)}
                        disabled={cartBusyProductId === item.productId}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[#6A7B67] text-xs font-extrabold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => void changeCartQuantity(item.productId, item.quantity + 1)}
                        disabled={cartBusyProductId === item.productId}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[#6A7B67] text-xs font-extrabold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Address Selector */}
              {cartItems.length > 0 && (
                <div className="mt-4 rounded-2xl border border-[#6A7B67]/30 bg-[#ECE5D1]/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#2D382C]">
                    <span className="flex items-center gap-1">
                      <IconLocation className="w-3.5 h-3.5 text-[#6A7B67]" />
                      <span>Delivery Address</span>
                    </span>
                    <button
                      onClick={() => {
                        setCartOpen(false)
                        setActiveView('Profile')
                      }}
                      className="text-[10px] text-[#6A7B67] underline font-bold"
                    >
                      + Add / Edit Address
                    </button>
                  </div>
                  {addresses.length === 0 ? (
                    <p className="text-xs text-rose-600 font-medium">Please add a delivery address in Profile to proceed.</p>
                  ) : (
                    <select
                      value={selectedAddressId ?? ''}
                      onChange={(e) => {
                        const id = e.target.value
                        setSelectedAddressId(id)
                        const found = addresses.find((a) => a.id === id)
                        if (found?.pincode) setCurrentPincode(found.pincode)
                      }}
                      className="w-full rounded-xl border border-[#6A7B67]/40 bg-white px-3 py-2 text-xs font-medium outline-none"
                    >
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}: {a.receiverName ? `${a.receiverName} - ` : ''}{a.line1}, {a.city} ({a.pincode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Cart Footer Breakdown */}
            {cartItems.length > 0 && (
              <div className="border-t border-[#ECE5D1] bg-[#ECE5D1]/30 p-4 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Item Total</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? 'font-bold text-[#6A7B67]' : ''}>
                      {deliveryFee === 0 ? 'FREE' : formatCurrency(FLAT_DELIVERY_FEE)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6A7B67] font-extrabold bg-[#6A7B67]/15 p-2.5 rounded-xl border border-[#6A7B67]/30 my-1">
                    <span className="flex items-center gap-1.5">
                      <IconTruck className="w-4 h-4 text-[#6A7B67]" />
                      <span>Expected Delivery (NimbusPost)</span>
                    </span>
                    <span>{eddLoading ? 'Calculating...' : eddInfo ? eddInfo.edd : 'Tomorrow'}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#6A7B67]/20 pt-2 text-sm font-extrabold text-[#2D382C]">
                    <span>Grand Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {cartError && <p className="text-xs text-rose-500 font-medium">{cartError}</p>}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || cartItems.length === 0}
                  className="w-full rounded-2xl bg-[#6A7B67] py-3.5 text-sm font-extrabold text-white shadow-glow-sage hover:bg-[#536250] disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>{placingOrder ? 'Initiating Razorpay Checkout...' : `Proceed to Pay ${formatCurrency(cartTotal)}`}</span>
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Scroll-to-Top Button (↑) - Image 1, 2, 4, 5 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className="fixed bottom-16 right-4 z-40 h-10 w-10 rounded-full border-2 border-[#164220] bg-white text-[#164220] shadow-md flex items-center justify-center font-extrabold text-base hover:bg-emerald-50 transition active:scale-90"
      >
        ↑
      </button>

      {/* Navigation Footer Dock (Mobile Nav Bar matching Images 2-5) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 text-slate-600 shadow-md">
        <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 px-2">
          {[
            { id: 'Home', slug: '#/', label: 'Home', icon: IconHome },
            { id: 'Co-Op', slug: '#/our-story', label: 'Co-Op', icon: IconSparkles },
            { id: 'Search', slug: '#/search', label: 'Lab Reports', icon: IconShield },
            { id: 'Farmers', slug: '#/farmers', label: 'FaaS', icon: IconSprout },
            { id: 'Profile', slug: '#/profile', label: 'User', icon: IconUser },
          ].map((nav) => {
            const isActive = activeView === nav.id || (nav.id === 'Co-Op' && activeView === 'OurStory')
            const Icon = nav.icon
            return (
              <button
                key={nav.label}
                onClick={() => {
                  if (nav.id === 'Co-Op') setActiveView('OurStory')
                  else setActiveView(nav.id as NavView)
                  window.location.hash = nav.slug
                }}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition ${
                  isActive ? 'text-[#164220] font-bold' : 'text-slate-500 hover:text-[#164220]'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-50 text-[#164220]' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#164220]' : 'text-slate-500'}`} />
                </div>
                <span>{nav.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Product Detail Modal Overlay (URL Slug: #/product/:slug) */}
      {selectedProductSlug && (() => {
        const selectedProduct = allProducts.find((p) => p.slug === selectedProductSlug)
        if (!selectedProduct) return null
        const quantityInCart = cartQuantityMap[selectedProduct.id] ?? 0
        const busy = cartBusyProductId === selectedProduct.id
        const imageUrl = selectedProduct.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
        const coopPrice = (Number(selectedProduct.price) * 0.9).toFixed(2)
        const coopSavings = (Number(selectedProduct.price) * 0.1).toFixed(2)

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-gray-100 max-h-[92vh] overflow-y-auto">
              {/* Header Search & Breadcrumbs */}
              <div className="space-y-2 border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1.5 w-full max-w-sm">
                    <IconSearch className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400">search...</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProductSlug(null)
                      window.location.hash = '/'
                    }}
                    className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition ml-2"
                  >
                    <IconCross className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Home / {selectedProduct.categorySlug || 'Harvest'} / <span className="text-slate-800 font-semibold">{selectedProduct.name}</span>
                </p>
              </div>

              {/* Image & Thumbnails */}
              <div className="space-y-2">
                <div className="rounded-2xl bg-[#f4f5f6] p-6 flex items-center justify-center h-64 sm:h-72">
                  <img src={imageUrl} alt={selectedProduct.name} className="max-h-full object-contain drop-shadow-sm" />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <div className="h-14 w-14 rounded-xl border-2 border-[#164220] p-1 bg-white flex items-center justify-center cursor-pointer">
                    <img src={imageUrl} alt="Thumbnail 1" className="max-h-full object-contain" />
                  </div>
                  <div className="h-14 w-14 rounded-xl border border-gray-200 p-1 bg-gray-50 flex items-center justify-center cursor-pointer opacity-60 hover:opacity-100">
                    <img src={imageUrl} alt="Thumbnail 2" className="max-h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Title & Rating */}
              <div className="space-y-1 pt-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {selectedProduct.name}
                </h1>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500 font-bold">★★★★☆</span>
                  <span className="text-slate-500 font-medium">(2 reviews)</span>
                </div>
              </div>

              {/* Price & Stock */}
              <div className="flex items-center gap-3 font-numeric">
                <span className="text-2xl font-extrabold text-slate-950">₹ {selectedProduct.price}.00</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#164220] border border-emerald-200 flex items-center gap-1">
                  ✓ {selectedProduct.stock > 0 ? `${selectedProduct.stock} Items In stock` : 'In Stock'}
                </span>
              </div>

              {/* Co-Op Member Highlight Container */}
              <div className="rounded-2xl bg-[#0a3a1b] p-4 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      🍃 CO-OP MEMBER
                    </span>
                    <span className="text-sm font-extrabold text-white">₹{coopPrice}</span>
                    <span className="text-xs text-emerald-200 font-medium">· save ₹{coopSavings}</span>
                  </div>
                  <a href="#coop" className="text-xs font-bold text-emerald-300 hover:underline">
                    Join now &gt;
                  </a>
                </div>
              </div>

              {/* Co-Op Note Banner */}
              <div className="rounded-xl bg-[#eaf5ee] border border-[#d2e9da] p-3 text-xs text-[#164220] flex items-start gap-2">
                <span className="text-sm text-emerald-700">★</span>
                <span>
                  Co-Op members: an even bigger discount is applied automatically once you're logged in at checkout — the price shown here doesn't yet reflect it.
                </span>
              </div>

              {/* Size Option Selector */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-slate-500">Size</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-[#164220] bg-[#eaf5ee] p-3 text-center cursor-pointer shadow-xs">
                    <p className="text-xs font-bold text-[#164220]">{selectedProduct.unit || '100g'}</p>
                    <p className="text-[11px] font-numeric text-emerald-800">₹ {selectedProduct.price}.00</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center cursor-pointer hover:border-slate-300">
                    <p className="text-xs font-semibold text-slate-700">200g</p>
                    <p className="text-[11px] font-numeric text-slate-500">₹ {(Number(selectedProduct.price) * 1.95).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {quantityInCart > 0 ? (
                  <div className="flex-1 flex items-center justify-between rounded-xl bg-[#164220] px-4 py-3 text-white shadow-md">
                    <button
                      onClick={() => changeCartQuantity(selectedProduct.id, quantityInCart - 1)}
                      disabled={busy}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#103318] text-sm font-bold disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="text-sm font-numeric font-bold">{busy ? '...' : quantityInCart}</span>
                    <button
                      onClick={() => changeCartQuantity(selectedProduct.id, quantityInCart + 1)}
                      disabled={busy || quantityInCart >= selectedProduct.stock}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#103318] text-sm font-bold disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={selectedProduct.stock < 1 || busy}
                    className="flex-1 rounded-xl bg-[#164220] hover:bg-[#103318] text-white py-3 px-4 font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{selectedProduct.stock < 1 ? 'Out of Stock' : busy ? 'Adding...' : 'Add'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (quantityInCart === 0) {
                      void handleAddToCart(selectedProduct)
                    }
                    setCartOpen(true)
                  }}
                  className="flex-1 rounded-xl border-2 border-[#164220] text-[#164220] hover:bg-emerald-50 bg-white py-3 px-4 font-bold text-sm transition text-center"
                >
                  Buy Now
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5 border-t border-gray-100 pt-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description ||
                    `${selectedProduct.name} are naturally grown organic items known for soft texture, rich natural taste, and essential nutrients.`}
                </p>
                <button className="text-xs font-bold text-[#164220] underline">Read more</button>
              </div>

              {/* Key Highlights Section */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <h3 className="font-display text-sm font-bold text-slate-900">Key Highlights</h3>
                <div className="space-y-2">
                  {[
                    'Produced without Synthetic Pesticides',
                    'Naturally sweet, soft, and chewy texture',
                    'Rich in fiber, iron, potassium, and antioxidants',
                    'Provides quick natural energy boost',
                    'Ideal for cooking, baking, and snacking',
                    'Carefully sourced and sun-dried for quality',
                  ].map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border border-emerald-600 bg-emerald-50 text-[10px] font-bold text-[#164220]">
                        ✓
                      </span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Location Selector UI/UX Modal Overlay */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#164220]">Delivery Hub</span>
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Select Delivery Location</h2>
              </div>
              <button
                onClick={() => {
                  setShowLocationModal(false)
                  window.location.hash = '/'
                }}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition"
              >
                <IconCross className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              onClick={handleDetectGpsLocation}
              disabled={locatingInProgress}
              className="w-full rounded-2xl bg-[#164220] hover:bg-[#103318] text-white p-4 font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                  <IconLocation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Use Current GPS Location</p>
                  <p className="text-[10px] text-emerald-200 font-medium">Auto-detect city, area & pincode</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#D4AF37] group-hover:translate-x-1 transition">
                {locatingInProgress ? 'Detecting...' : 'Detect 🎯'}
              </span>
            </button>

            {/* Ola Maps Search */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Search Address or Landmark via Ola Maps</label>
              <div className="relative">
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium focus-within:ring-2 focus-within:ring-[#164220]/30 focus-within:border-[#164220]">
                  <IconSearch className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Type area (e.g. Jubilee Hills, Madhapur, LB Nagar)..."
                    value={olaSearchInput}
                    onChange={(e) => setOlaSearchInput(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-gray-900 placeholder-gray-400 outline-none"
                  />
                  {olaLoading && <span className="text-[10px] font-bold text-[#164220]">Searching...</span>}
                </div>

                {/* Predictions Dropdown */}
                {olaPredictions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl space-y-1">
                    {olaPredictions.map((pred) => (
                      <button
                        type="button"
                        key={pred.place_id}
                        onClick={() => {
                          handleSelectOlaPrediction(pred)
                          handleSelectLocationPincode(pred.description, currentPincode)
                        }}
                        className="w-full rounded-lg p-2 text-left hover:bg-emerald-50 transition flex items-center gap-2 text-xs font-semibold text-gray-800"
                      >
                        <IconLocation className="w-3.5 h-3.5 text-[#164220] flex-shrink-0" />
                        <span className="truncate">{pred.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Pincode Quick Input */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <label className="text-xs font-bold text-gray-700">Enter Delivery Pincode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={currentPincode}
                  onChange={(e) => setCurrentPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 500081"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#164220]"
                />
                <button
                  onClick={() => handleSelectLocationPincode(`Pincode ${currentPincode}`, currentPincode)}
                  className="rounded-xl bg-[#164220] hover:bg-[#103318] text-white px-5 py-2.5 text-xs font-bold transition shadow-sm"
                >
                  Set Pincode
                </button>
              </div>
            </div>

            {/* Popular Hyderabad Hub Quick Select Chips */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Popular Express Delivery Hubs</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'LB Nagar Main Hub', pincode: '500074' },
                  { label: 'Jubilee Hills', pincode: '500033' },
                  { label: 'Madhapur & Hitech', pincode: '500081' },
                  { label: 'Gachibowli', pincode: '500032' },
                  { label: 'Banjara Hills', pincode: '500034' },
                  { label: 'Kukatpally', pincode: '500072' },
                ].map((hub) => (
                  <button
                    key={hub.pincode}
                    onClick={() => handleSelectLocationPincode(`${hub.label} (${hub.pincode})`, hub.pincode)}
                    className="rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-[#164220] hover:border-emerald-200 border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition"
                  >
                    📍 {hub.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d241c]/80 p-4 backdrop-blur-md">
          <Login
            onSuccess={() => {
              setShowLogin(false)
              setSession(getSession())
              setNotice('Welcome to Connect to Farm!')
              if (postLoginTarget === 'cart') setCartOpen(true)
              if (postLoginTarget === 'orders') setActiveView('Orders')
              if (postLoginTarget === 'profile') setActiveView('Profile')
            }}
            onCancel={() => setShowLogin(false)}
          />
        </div>
      )}

      {/* LinkedIn Farmer Profile Modal Overlay */}
      {selectedFarmer && (
        <FarmerProfileModal
          farmer={selectedFarmer}
          farmerProducts={allProducts.filter(
            (p) =>
              p.farmerName.toLowerCase().trim() === selectedFarmer.name.toLowerCase().trim() ||
              (selectedFarmer.village &&
                p.farmerVillage &&
                p.farmerVillage.toLowerCase().trim() === selectedFarmer.village.toLowerCase().trim())
          )}
          cartQuantityMap={cartQuantityMap}
          cartBusyProductId={cartBusyProductId}
          wishlistIds={wishlistIds}
          onClose={() => setSelectedFarmer(null)}
          onAddToCart={(item) => void handleAddToCart(item)}
          onUpdateQty={(id, qty) => void changeCartQuantity(id, qty)}
          onToggleWishlist={(item) => void handleToggleWishlist(item)}
        />
      )}
    </div>
  )
}

export default App
