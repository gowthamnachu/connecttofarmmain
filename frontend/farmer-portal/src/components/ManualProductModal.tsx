import { useState } from 'react'
import {
  createFarmerProduct,
  type CategoryItem,
  type FarmerProduct,
} from '../lib/api'
import { getCropImage } from '../lib/cropImages'
import {
  XIcon,
  PackageIcon,
  LeafIcon,
  TagIcon,
  BoxesIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from './Icons'

interface ManualProductModalProps {
  isOpen: boolean
  categories: CategoryItem[]
  onClose: () => void
  onProductAdded: (product: FarmerProduct) => void
}

export function ManualProductModal({
  isOpen,
  categories,
  onClose,
  onProductAdded,
}: ManualProductModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState<number>(50)
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0])
  const [gradeTag, setGradeTag] = useState('Grade A')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  // Live preview image based on crop name
  const previewImage = getCropImage(name)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide a crop or produce name')
      return
    }
    if (!categoryId) {
      setError('Please select a category')
      return
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please provide a valid price per unit')
      return
    }

    setLoading(true)
    try {
      const created = await createFarmerProduct('', {
        name: name.trim(),
        categoryId,
        price: Number(price).toFixed(2),
        unit,
        stock: Number(stock) || 0,
        harvestDate,
        gradeTag,
        description: description.trim() || `${name.trim()} freshly harvested by certified farmer.`,
      })
      onProductAdded(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#164220] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200">
              <PackageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base tracking-tight leading-tight">
                Add Produce to Storefront
              </h3>
              <p className="text-[11px] text-emerald-200/90 font-normal">
                Sync live produce with customer marketplace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Smart Crop Image Preview */}
          <div className="relative h-32 rounded-2xl overflow-hidden border border-neutral-200 shadow-inner group">
            <img
              src={previewImage}
              alt="Crop preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-white text-xs font-medium flex items-center gap-1.5 drop-shadow">
                  <LeafIcon className="w-3.5 h-3.5 text-emerald-400" />
                  {name ? `${name} (Auto Matched Image)` : 'Dynamic Crop Image Preview'}
                </span>
                <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  100% Certified
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-800 mb-1 flex items-center gap-1.5">
              <LeafIcon className="w-3.5 h-3.5 text-[#164220]" />
              Crop / Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Toor Dal (కందులు), Moong Dal, Organic Tomatoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>

          {/* Category & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-[#164220]" />
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-xs font-medium text-neutral-900 bg-white outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-[#164220]" />
                Quality Grade
              </label>
              <select
                value={gradeTag}
                onChange={(e) => setGradeTag(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-xs font-medium text-neutral-900 bg-white outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
              >
                <option value="Grade A">Grade A (Premium Organic)</option>
                <option value="Export Quality">Export Quality</option>
                <option value="Farm Fresh Standard">Farm Fresh Standard</option>
              </select>
            </div>
          </div>

          {/* Price, Stock & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                placeholder="120"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1 flex items-center gap-1">
                <BoxesIcon className="w-3 h-3 text-[#164220]" />
                Stock Qty *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-xs font-medium text-neutral-900 bg-white outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="bag">bag (25kg)</option>
                <option value="ton">ton</option>
              </select>
            </div>
          </div>

          {/* Harvest Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-800 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#164220]" />
              Harvest Date
            </label>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-800 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Chemical-free toor dal grown organically, sun-dried and cleaned."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-medium hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#164220] hover:bg-[#103318] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? 'Adding…' : 'Publish Produce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
