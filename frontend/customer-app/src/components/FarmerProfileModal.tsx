import type { PublicFarmer, Product } from '../lib/api'
import { IconCheck, IconCross, IconLocation, IconPhone, IconSprout, IconCart, IconHeart } from './Icons'

export default function FarmerProfileModal({
  farmer,
  farmerProducts,
  cartQuantityMap,
  cartBusyProductId,
  wishlistIds,
  onClose,
  onAddToCart,
  onUpdateQty,
  onToggleWishlist,
}: {
  farmer: PublicFarmer
  farmerProducts: Product[]
  cartQuantityMap: Record<string, number>
  cartBusyProductId: string | null
  wishlistIds: Set<string>
  onClose: () => void
  onAddToCart: (product: Product) => void
  onUpdateQty: (productId: string, quantity: number) => void
  onToggleWishlist: (product: Product) => void
}) {
  const defaultBanner = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
  const defaultAvatar = 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=400&q=80'

  const bannerSrc = farmer.bannerUrl || defaultBanner
  const avatarSrc = farmer.photoUrl || defaultAvatar

  const locationText = [farmer.village, farmer.district, farmer.state || 'Telangana', 'India']
    .filter(Boolean)
    .join(', ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d241c]/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#F4F1EA] text-[#2D382C] shadow-2xl border border-gray-200 my-auto max-h-[92vh] flex flex-col font-sans">
        
        {/* Sticky Header Close Button Bar */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70 hover:scale-105 transition shadow-lg"
            title="Close profile"
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-8 app-scrollbar">
          
          {/* LinkedIn Cover Banner Card */}
          <div className="relative bg-white shadow-sm border-b border-gray-200">
            {/* Banner Photo */}
            <div className="h-44 sm:h-56 w-full overflow-hidden bg-emerald-950 relative">
              <img
                src={bannerSrc}
                alt={`${farmer.name} Farm Banner`}
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <div className="absolute bottom-3 right-4 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20">
                <IconSprout className="w-3.5 h-3.5 text-[#ECE5D1]" />
                <span>Verified Organic Farm</span>
              </div>
            </div>

            {/* Profile Avatar & Main Info */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
                {/* Avatar with White LinkedIn-style Border */}
                <div className="relative">
                  <img
                    src={avatarSrc}
                    alt={farmer.name}
                    className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-white shadow-xl bg-white object-cover flex-shrink-0"
                  />
                  <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#164220] text-white border-2 border-white shadow-md" title="Certified Organic">
                    <IconCheck className="w-4 h-4 text-[#ECE5D1]" />
                  </span>
                </div>

                {/* LinkedIn Action Buttons */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <a
                    href="#farmer-products-section"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('farmer-products-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="rounded-xl bg-[#164220] hover:bg-[#103318] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition active:scale-95 flex items-center gap-2"
                  >
                    <IconCart className="w-4 h-4 text-[#ECE5D1]" />
                    <span>View Harvest ({farmerProducts.length})</span>
                  </a>
                  {farmer.phone && (
                    <a
                      href={`tel:${farmer.phone}`}
                      className="rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-extrabold text-gray-800 shadow-sm transition active:scale-95 flex items-center gap-1.5"
                    >
                      <IconPhone className="w-4 h-4 text-[#164220]" />
                      <span>Contact</span>
                    </a>
                  )}
                </div>
              </div>

              {/* LinkedIn Headline & Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#2D382C] tracking-tight">
                    {farmer.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#164220]/10 px-3 py-1 text-xs font-extrabold text-[#164220] border border-[#164220]/20">
                    <IconCheck className="w-3.5 h-3.5 text-[#164220]" />
                    <span>{farmer.certificationStatus || 'Certified Organic'}</span>
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-700 leading-snug max-w-2xl">
                  Natural Organic Grower & Cultivator • Direct-to-Consumer Regenerative Farming Specialist
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[#164220] font-bold">
                    <IconLocation className="w-4 h-4 text-[#164220]" />
                    {locationText}
                  </span>
                  {farmer.pincode && <span className="text-slate-400">• Pincode {farmer.pincode}</span>}
                </div>

                {/* Metrics Pill Bar */}
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  {farmer.landAreaAcres && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 text-xs font-extrabold text-[#164220] flex items-center gap-1.5">
                      <span>🌾 {farmer.landAreaAcres} Acres Farm</span>
                    </div>
                  )}
                  {farmer.experienceYears && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <span>⏳ {farmer.experienceYears}+ Years Farming</span>
                    </div>
                  )}
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-1.5 text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <span>🛡️ 100% Pesticide-Free Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mx-4 sm:mx-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-[#2D382C] border-b border-gray-100 pb-2 flex items-center gap-2">
              <span>About {farmer.name}</span>
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-line">
              {farmer.bio ||
                `${farmer.name} is a verified organic farmer dedicated to natural farming methods in ${
                  farmer.village || 'Telangana'
                }. All produce is grown without synthetic pesticides, chemical fertilizers, or GMOs, ensuring pure, nutrient-dense harvest directly delivered from the farm.`}
            </p>
          </div>

          {/* Farm Experience & Practices Details */}
          <div className="mx-4 sm:mx-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-[#2D382C] border-b border-gray-100 pb-2">
              Farming Practices & Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Methodology</span>
                <p className="font-extrabold text-gray-800">Natural & Organic Zero-Chemical Cultivation</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Soil & Water</span>
                <p className="font-extrabold text-gray-800">Compost Enriched & Rainfed Irrigation</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certification</span>
                <p className="font-extrabold text-[#164220]">Verified by Connect To Farm Quality Audit</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Traceability</span>
                <p className="font-extrabold text-gray-800">Direct Express Shipping with QR Provenance</p>
              </div>
            </div>
          </div>

          {/* Featured Produce / Harvest Section (LinkedIn Activity / Featured Layout) */}
          <div id="farmer-products-section" className="mx-4 sm:mx-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h3 className="text-base font-extrabold text-[#2D382C]">
                  Harvest Sourced from {farmer.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Freshly harvested produce available for direct home delivery
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-[#164220] border border-emerald-200">
                {farmerProducts.length} Products Available
              </span>
            </div>

            {farmerProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold">
                No active produce listings from this farmer at the moment. Check back soon for fresh seasonal harvest!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farmerProducts.map((product) => {
                  const qty = cartQuantityMap[product.id] ?? 0
                  const isBusy = cartBusyProductId === product.id
                  const isWishlisted = wishlistIds.has(product.id)
                  const imageUrl =
                    product.images?.[0] ||
                    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'

                  return (
                    <div
                      key={product.id}
                      className="group relative flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm hover:border-[#6A7B67] hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-16 w-16 rounded-xl object-contain border border-gray-100 bg-gray-50 p-1 flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-extrabold text-[#2D382C] line-clamp-1">{product.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            Rs. {product.price}.00 <span className="font-normal text-slate-400">/ {product.unit}</span>
                          </p>
                          <p className="text-[9px] text-[#164220] font-extrabold mt-1">
                            {product.stock > 0 ? `In Stock (${product.stock} ${product.unit} left)` : 'Out of Stock'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(product)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                            isWishlisted
                              ? 'bg-[#ECE5D1] border-[#6A7B67]/50 text-[#164220]'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-[#164220]'
                          }`}
                          title="Save to wishlist"
                        >
                          <IconHeart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#164220]' : ''}`} />
                        </button>

                        {qty > 0 ? (
                          <div className="flex items-center rounded-xl border border-[#6A7B67]/30 bg-emerald-50 px-2 py-1 gap-1">
                            <button
                              onClick={() => onUpdateQty(product.id, qty - 1)}
                              disabled={isBusy}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-black text-gray-800 shadow-sm disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-black text-[#164220]">{qty}</span>
                            <button
                              onClick={() => onUpdateQty(product.id, qty + 1)}
                              disabled={isBusy || qty >= product.stock}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#164220] text-xs font-black text-white shadow-sm disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddToCart(product)}
                            disabled={product.stock < 1 || isBusy}
                            className="rounded-xl bg-[#164220] hover:bg-[#103318] text-white px-3 py-2 text-xs font-extrabold shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <IconCart className="w-3.5 h-3.5 text-[#ECE5D1]" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
