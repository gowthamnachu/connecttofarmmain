import { useState, useEffect, useMemo } from 'react'
import { Orb } from 'orb-ui'
import {
  clearSession,
  farmerLogin,
  getSession,
  saveSession,
  fetchFarmerProducts,
  updateProductStock,
  fetchCategories,
  type FarmerProduct,
  type CategoryItem,
} from './lib/api'
import { VoiceCallModal } from './components/VoiceCallModal'
import { ManualProductModal } from './components/ManualProductModal'
import { FarmerProfileModal } from './components/FarmerProfileModal'
import { getCropImage, HERO_FARM_BANNER, FARMER_AVATAR_IMAGE } from './lib/cropImages'
import {
  LeafIcon,
  PhoneCallIcon,
  PlusIcon,
  MinusIcon,
  BoxesIcon,
  PackageIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  SearchIcon,
  LogOutIcon,
  GridIcon,
  ListIcon,
  RefreshCwIcon,
  SparklesIcon,
  UserIcon,
  StoreIcon,
  ArrowUpRightIcon,
  AlertCircleIcon,
} from './components/Icons'

type ViewMode = 'grid' | 'list'
type StockFilter = 'all' | 'in_stock' | 'low_stock'
type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'stock_desc'
type AppTab = 'store' | 'analytics' | 'profile'

function App() {
  const [session, setSession] = useState(() => getSession())
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Products and Category State
  const [products, setProducts] = useState<FarmerProduct[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null)

  // Modals state
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<AppTab>('store')

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null)
      setError('Session expired. Please sign in again.')
    }
    window.addEventListener('farmer:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('farmer:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    if (session?.accessToken) {
      loadProducts(session.accessToken)
      fetchCategories().then(setCategories)
    }
  }, [session])

  async function loadProducts(token: string) {
    setLoadingProducts(true)
    try {
      const items = await fetchFarmerProducts(token)
      setProducts(items)
    } catch (err) {
      console.error('Failed to load farmer products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const auth = await farmerLogin(phone, password)
      saveSession(auth)
      setSession(getSession())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoFill() {
    setPhone('1234567890')
    setPassword('Test@123')
  }

  async function handleQuickStock(productId: string, currentStock: number, delta: number) {
    if (!session) return
    const newStock = Math.max(0, currentStock + delta)
    setUpdatingStockId(productId)
    try {
      const updated = await updateProductStock(session.accessToken, productId, newStock)
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)))
    } catch (err) {
      console.error('Failed to update stock:', err)
    } finally {
      setUpdatingStockId(null)
    }
  }

  function handleProductAdded(newProduct: FarmerProduct) {
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)])
  }

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchName = p.name.toLowerCase().includes(q)
          const matchDesc = (p.description || '').toLowerCase().includes(q)
          const matchGrade = (p.gradeTag || '').toLowerCase().includes(q)
          if (!matchName && !matchDesc && !matchGrade) return false
        }

        // Category filter
        if (selectedCategory !== 'all') {
          const cat = categories.find((c) => c.id === selectedCategory)
          if (cat) {
            const catLower = cat.name.toLowerCase()
            const prodLower = p.name.toLowerCase()
            const matchSlug = p.categoryId === cat.id || prodLower.includes(catLower)
            if (!matchSlug) return false
          }
        }

        // Stock filter
        if (stockFilter === 'in_stock' && p.stock <= 0) return false
        if (stockFilter === 'low_stock' && (p.stock > 25 || p.stock === 0)) return false

        return true
      })
      .sort((a, b) => {
        if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price)
        if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price)
        if (sortOption === 'stock_desc') return b.stock - a.stock
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [products, searchQuery, selectedCategory, stockFilter, sortOption, categories])

  // Analytics Metrics
  const totalStockKg = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock || 0), 0)
  }, [products])

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (parseFloat(p.price) || 0) * (p.stock || 0), 0)
  }, [products])

  if (session) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 flex flex-col antialiased pb-24 sm:pb-8 overflow-x-hidden w-full max-w-full">
        {/* Mobile & Desktop Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-3.5 sm:px-8 py-2.5 sm:py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Brand Logo & Farm Location Tag */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#164220] text-white flex items-center justify-center shadow-xs shrink-0">
                <LeafIcon className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-base sm:text-lg text-neutral-900 tracking-tight truncate">
                    ConnectToFarm
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Farm App
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium truncate">
                  <span>🌾 {session.farmer.village || 'Warangal Hub'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-emerald-700">100% Certified Direct</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Customer Marketplace Link (Desktop) */}
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs font-medium transition cursor-pointer"
                title="View customer-facing storefront"
              >
                <StoreIcon className="w-3.5 h-3.5 text-[#164220]" />
                <span>Customer Store</span>
                <ArrowUpRightIcon className="w-3 h-3 text-neutral-400" />
              </a>

              {/* Call Voice Assistant Action (Desktop / Tablet) */}
              <button
                type="button"
                onClick={() => setIsVoiceCallOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#164220] hover:bg-[#103318] text-white text-xs font-semibold shadow-xs hover:shadow transition cursor-pointer"
              >
                <PhoneCallIcon className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Call Voice Assistant</span>
              </button>

              {/* Add Produce Manually (Desktop / Tablet) */}
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#164220] border border-emerald-200 text-xs font-semibold transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Produce</span>
              </button>

              {/* Farmer Profile Avatar Pill */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full sm:rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 transition cursor-pointer shadow-2xs"
                title="View Farmer Profile"
              >
                <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full sm:rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-emerald-600/30">
                  <img
                    src={FARMER_AVATAR_IMAGE}
                    alt={session.farmer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-neutral-800 leading-tight">
                    {session.farmer.name}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700">
                    {session.farmer.certificationStatus || 'Certified Organic'}
                  </span>
                </div>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  clearSession()
                  setSession(null)
                }}
                className="p-2 rounded-xl border border-neutral-200 hover:border-neutral-300 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
                title="Log out"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-8 py-4 sm:py-5 flex-1 flex flex-col gap-4 sm:gap-5">
          {/* E-Commerce App Hero Card: Hands-Free Telugu Phone Call Assistant */}
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white shadow-md group">
            <img
              src={HERO_FARM_BANNER}
              alt="Farm fields"
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px] scale-105 group-hover:scale-100 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#164220] via-[#1b5028]/95 to-[#12361a]/90"></div>

            <div className="relative z-10 p-4 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-2 border border-white/20">
                  <SparklesIcon className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                  <span>Native Telugu AI Voice Assistant • Sarvam AI</span>
                </div>

                <h1 className="text-lg sm:text-2xl font-semibold tracking-tight mb-1.5 text-white leading-snug">
                  Add Farm Produce Like Making a Phone Call
                </h1>
                <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-3 font-normal">
                  Speak naturally in Telugu (<span className="text-white font-medium bg-white/10 px-1.5 py-0.5 rounded">"నా దగ్గర 50 కేజీల కందులు ఉన్నాయి"</span>). The assistant replies in spoken Telugu, remembers your details across turns, and syncs directly to the customer store!
                </p>

                {/* Spoken conversational step chips */}
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  <span className="text-[10px] sm:text-[11px] font-medium text-emerald-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                    1️⃣ "నా దగ్గర 50 కేజీల కందులు ఉన్నాయి"
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-emerald-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                    2️⃣ "కిలో 120 రూపాయలు"
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-emerald-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                    3️⃣ "సరే, చేర్చండి"
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsVoiceCallOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white text-[#164220] hover:bg-emerald-50 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <PhoneCallIcon className="w-4 h-4 text-[#164220]" />
                    <span>Start Voice Call (కాల్ చేయండి)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium border border-white/20 transition cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Manual Entry</span>
                  </button>
                </div>
              </div>

              {/* Status Engine Card with Live Voice Orb (Desktop only) */}
              <div className="hidden lg:flex flex-col gap-2.5 w-80 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                    <span className="text-xs font-semibold text-white">Sarvam Indic Engine</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Live
                  </span>
                </div>

                {/* Interactive Mini Voice Orb Preview */}
                <button
                  type="button"
                  onClick={() => setIsVoiceCallOpen(true)}
                  className="flex flex-col items-center justify-center py-1 group cursor-pointer"
                  title="Click to start Telugu Voice Call"
                >
                  <div className="relative rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    <Orb
                      signal={{ state: 'listening', inputVolume: 0.45 }}
                      theme="cloud"
                      size={105}
                      aria-label="Click to start Telugu Voice Call"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium mt-1 group-hover:text-white transition flex items-center gap-1">
                    <span>🎙️ Click to Speak in Telugu</span>
                  </span>
                </button>

                <div className="text-[11px] text-emerald-200/90 space-y-1 pt-1 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/60">Voice Model:</span>
                    <span className="font-medium text-white">Kavitha (కవిత)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Dialogue Memory:</span>
                    <span className="font-medium text-emerald-300">Active Slot-Filling</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Continuous VAD:</span>
                    <span className="font-medium text-white">Hands-Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Commerce Metrics Bar (KPIs) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Active Listings */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-0.5 truncate">
                  Active Listings
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-semibold text-neutral-900">
                    {products.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Live
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#164220] flex items-center justify-center border border-emerald-200/60 shrink-0">
                <PackageIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Total Stock Volume */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-0.5 truncate">
                  Total Inventory
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-semibold text-[#164220]">
                    {totalStockKg}
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium text-neutral-500">kg ready</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#164220] flex items-center justify-center border border-emerald-200/60 shrink-0">
                <BoxesIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Total Inventory Value */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-0.5 truncate">
                  Market Value
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-semibold text-neutral-900 truncate">
                    ₹{totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shrink-0">
                <TrendingUpIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Farm Status */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-0.5 truncate">
                  Farm Status
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 flex items-center gap-1 truncate">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  100% Direct
                </span>
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-normal block truncate">
                  Zero Middlemen
                </span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#164220] flex items-center justify-center border border-emerald-200/60 shrink-0">
                <LeafIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Category Filter Story Pills (Clean horizontal scroll without scrollbar) */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-[#164220] text-white shadow-xs font-semibold'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <span>🌾 All Produce ({products.length})</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#164220] text-white shadow-xs font-semibold'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Search, Filter & View Controls (Responsive Mobile Layout) */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs space-y-2.5">
            {/* Search Bar */}
            <div className="relative w-full">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search produce by name (వరి, కందులు, wheat)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition bg-neutral-50/50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Switcher Row */}
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-1/2 min-w-0 px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800 bg-white outline-none focus:border-[#164220] truncate cursor-pointer"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="stock_desc">Highest Stock</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                  className="w-1/2 min-w-0 px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800 bg-white outline-none focus:border-[#164220] truncate cursor-pointer"
                >
                  <option value="all">Stock: All</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* View Mode Toggle */}
                <div className="flex items-center rounded-xl border border-neutral-200 p-0.5 bg-neutral-100">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#164220] shadow-2xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    title="Grid View"
                  >
                    <GridIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-[#164220] shadow-2xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    title="List View"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => loadProducts(session.accessToken)}
                  className="p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition cursor-pointer"
                  title="Refresh Inventory"
                >
                  <RefreshCwIcon className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Produce Products Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-neutral-900 tracking-tight flex items-center gap-1.5">
                  <span>Farm Inventory Listings</span>
                  <span className="text-[10px] sm:text-xs font-medium text-neutral-500 bg-neutral-200/70 px-2 py-0.5 rounded-full">
                    {filteredProducts.length} items
                  </span>
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500 font-normal">
                  Live sync with customer storefront • Adjust stock in 1-tap
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoiceCallOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#164220] border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition cursor-pointer"
                >
                  <PhoneCallIcon className="w-3.5 h-3.5 text-[#164220]" />
                  <span>Call to Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold transition cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Manual Add</span>
                </button>
              </div>
            </div>

            {loadingProducts ? (
              <div className="py-20 text-center text-xs text-neutral-400 font-medium">
                Loading your farm inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-8 sm:p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#164220] mx-auto flex items-center justify-center mb-3">
                  <PackageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-1">
                  {searchQuery ? 'No produce matching your search' : 'No produce listed yet'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4 font-normal">
                  {searchQuery
                    ? 'Try clearing your search query or choosing another category.'
                    : 'Start selling directly to customers by starting a voice call with our vernacular assistant.'}
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsVoiceCallOpen(true)}
                    className="px-4 py-2 rounded-2xl bg-[#164220] text-white text-xs font-semibold shadow-md hover:bg-[#103318] transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PhoneCallIcon className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Call Voice Assistant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="px-4 py-2 rounded-2xl bg-white border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition cursor-pointer"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* E-Commerce Grid View (2 columns on mobile, 3 on tablet, 4 on desktop) */
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {filteredProducts.map((item) => {
                  const cropImg = getCropImage(item.name, item.images)
                  const isLowStock = item.stock <= 25 && item.stock > 0
                  const isOutOfStock = item.stock === 0
                  const isUpdating = updatingStockId === item.id

                  return (
                    <article
                      key={item.id}
                      className="group bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:border-[#164220]/40 transition-all duration-300 flex flex-col justify-between min-w-0"
                    >
                      <div>
                        {/* High-Resolution Product Image with Overlays */}
                        <div className="relative h-32 sm:h-44 overflow-hidden bg-neutral-100">
                          <img
                            src={cropImg}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

                          {/* Certification Badge */}
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-white bg-[#164220]/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20">
                              🍃 {item.gradeTag || 'Grade A'}
                            </span>
                          </div>

                          {/* Live Stock Pill */}
                          <div className="absolute top-2 right-2">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-rose-100 bg-rose-700/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full">
                                Out
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-amber-100 bg-amber-600/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full">
                                {item.stock}{item.unit}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-emerald-100 bg-emerald-800/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full">
                                ✓ {item.stock}{item.unit}
                              </span>
                            )}
                          </div>

                          {/* Price Tag Overlay */}
                          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-medium text-white drop-shadow">
                            <span className="bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] truncate max-w-[85px] sm:max-w-[130px]">
                              🌾 Live Store
                            </span>
                            <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-300 font-semibold text-[9px] sm:text-[10px]">
                              ₹{item.price}/{item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Card Info Body */}
                        <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2.5">
                          {/* Title */}
                          <div>
                            <h3 className="font-display text-xs sm:text-sm font-semibold text-neutral-900 group-hover:text-[#164220] transition line-clamp-1">
                              {item.name}
                            </h3>
                            <p className="hidden sm:block text-[11px] text-neutral-500 line-clamp-1 mt-0.5 font-normal">
                              {item.description || 'Pure unpolished organic harvest, certified direct.'}
                            </p>
                          </div>

                          {/* Price & Stock Meter */}
                          <div className="pt-1 border-t border-neutral-100 space-y-1">
                            <div className="flex items-baseline justify-between text-[11px] sm:text-xs">
                              <span className="text-neutral-500 font-normal">Price:</span>
                              <span className="text-sm sm:text-base font-semibold text-[#164220]">
                                ₹{item.price}{' '}
                                <span className="text-[10px] sm:text-[11px] font-normal text-neutral-500">
                                  / {item.unit}
                                </span>
                              </span>
                            </div>

                            {/* Stock Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500 mb-0.5">
                                <span>Stock</span>
                                <span className="font-semibold text-neutral-800">
                                  {item.stock} {item.unit}
                                </span>
                              </div>
                              <div className="w-full h-1 sm:h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOutOfStock
                                      ? 'bg-rose-500 w-0'
                                      : isLowStock
                                      ? 'bg-amber-500 w-1/4'
                                      : 'bg-emerald-500 w-3/4'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: 1-Tap Quick Stock Adjusters */}
                      <div className="p-2 sm:p-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between gap-1 sm:gap-2">
                        <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
                          Quick:
                        </span>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <button
                            type="button"
                            disabled={isUpdating || item.stock <= 0}
                            onClick={() => handleQuickStock(item.id, item.stock, -10)}
                            className="px-2 py-0.5 sm:py-1 rounded-lg bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-700 text-[10px] sm:text-xs font-semibold hover:bg-neutral-100 disabled:opacity-40 transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                            title="Subtract 10kg"
                          >
                            <MinusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span>10</span>
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleQuickStock(item.id, item.stock, 10)}
                            className="px-2 py-0.5 sm:py-1 rounded-lg bg-[#164220] text-white hover:bg-[#103318] text-[10px] sm:text-xs font-semibold disabled:opacity-40 transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                            title="Add 10kg"
                          >
                            <PlusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-300" />
                            <span>10</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              /* Modern List View */
              <div className="bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-2xs divide-y divide-neutral-100">
                {filteredProducts.map((item) => {
                  const cropImg = getCropImage(item.name, item.images)
                  const isLowStock = item.stock <= 25 && item.stock > 0
                  const isOutOfStock = item.stock === 0
                  const isUpdating = updatingStockId === item.id

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 hover:bg-neutral-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={cropImg}
                          alt={item.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                              {item.name}
                            </h3>
                            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              {item.gradeTag || 'Grade A'}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-neutral-500 truncate mt-0.5 font-normal">
                            {item.description || 'Harvested fresh by certified organic farmer.'}
                          </p>
                          <div className="flex items-center gap-2 text-xs mt-1 text-neutral-600 font-medium">
                            <span className="text-[#164220] font-semibold">
                              ₹{item.price}/{item.unit}
                            </span>
                            <span>•</span>
                            <span className={isOutOfStock ? 'text-rose-600 font-semibold' : isLowStock ? 'text-amber-600 font-semibold' : 'text-neutral-700'}>
                              Stock: {item.stock}{item.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-xs text-neutral-500 font-medium">Stock:</span>
                        <button
                          type="button"
                          disabled={isUpdating || item.stock <= 0}
                          onClick={() => handleQuickStock(item.id, item.stock, -10)}
                          className="px-2.5 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                        >
                          -10kg
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleQuickStock(item.id, item.stock, 10)}
                          className="px-2.5 py-1 rounded-lg bg-[#164220] hover:bg-[#103318] text-white text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                        >
                          +10kg
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>

        {/* Floating Action Button (FAB) - Desktop only, never covers content on mobile */}
        <div className="hidden sm:flex fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsVoiceCallOpen(true)}
            className="flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-full bg-[#164220] text-white shadow-2xl hover:bg-[#103318] hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-emerald-400 group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
              <PhoneCallIcon className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold block leading-tight">
                AI Voice Call
              </span>
              <span className="text-[10px] text-emerald-200 block">
                తెలుగులో మాట్లాడండి
              </span>
            </div>
          </button>
        </div>

        {/* Modern Mobile App Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 pt-1.5 pb-2 sm:hidden shadow-lg flex items-center justify-around">
          <button
            type="button"
            onClick={() => {
              setActiveTab('store')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition cursor-pointer min-w-[60px] ${
              activeTab === 'store' ? 'text-[#164220] font-semibold' : 'text-neutral-500'
            }`}
          >
            <StoreIcon className="w-5 h-5" />
            <span>Storefront</span>
          </button>

          {/* Elevated Central Hero Voice Call Action */}
          <button
            type="button"
            onClick={() => setIsVoiceCallOpen(true)}
            className="flex flex-col items-center -mt-5 transition cursor-pointer group min-w-[60px]"
          >
            <div className="w-13 h-13 rounded-full bg-[#164220] border-2 border-emerald-400 text-white flex items-center justify-center shadow-xl group-hover:scale-105 active:scale-95 transition">
              <PhoneCallIcon className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <span className="text-[10px] font-semibold text-[#164220] mt-0.5">Voice Call</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-neutral-500 hover:text-neutral-800 transition cursor-pointer min-w-[60px]"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Produce</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-neutral-500 hover:text-neutral-800 transition cursor-pointer min-w-[60px]"
          >
            <UserIcon className="w-5 h-5" />
            <span>Farmer</span>
          </button>
        </nav>

        {/* Modals */}
        <VoiceCallModal
          isOpen={isVoiceCallOpen}
          onClose={() => setIsVoiceCallOpen(false)}
          onProductAdded={handleProductAdded}
        />

        <ManualProductModal
          isOpen={isManualModalOpen}
          categories={categories}
          onClose={() => setIsManualModalOpen(false)}
          onProductAdded={handleProductAdded}
        />

        <FarmerProfileModal
          isOpen={isProfileModalOpen}
          farmerName={session.farmer.name}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    )
  }

  // Modernized E-Commerce Farmer Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4 py-8 sm:py-12 relative overflow-hidden">
      <img
        src={HERO_FARM_BANNER}
        alt="Organic Farm"
        className="absolute inset-0 w-full h-full object-cover opacity-15 filter blur-[2px]"
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#FAF8F5]/80 to-[#FAF8F5]"></div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-neutral-200/90 shadow-2xl overflow-hidden p-6 sm:p-9">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#164220] text-white flex items-center justify-center shadow-xs">
            <LeafIcon className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-neutral-900 tracking-tight leading-tight">
              ConnectToFarm
            </h1>
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">
              Farmer Commerce App
            </span>
          </div>
        </div>

        <h2 className="text-base font-semibold text-neutral-800 tracking-tight mb-1">
          Welcome back, Producer!
        </h2>
        <p className="text-xs text-neutral-500 mb-5 font-normal leading-relaxed">
          Sign in to manage your inventory, sync produce with the customer marketplace, and speak with the Vernacular Voice AI.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Registered Mobile Number
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#164220] hover:bg-[#103318] text-white py-3 text-xs font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in…' : 'Sign in to Farmer Portal'}
          </button>
        </form>

        {/* Quick Demo Fill & Features */}
        <div className="mt-5 pt-4 border-t border-neutral-100 space-y-3">
          <button
            type="button"
            onClick={handleDemoFill}
            className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡ Fill Test Credentials (1234567890 / Test@123)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 font-normal text-center">
            <span className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
              🗣️ Telugu Voice Assistant
            </span>
            <span className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
              🌾 Direct Customer Marketplace
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
