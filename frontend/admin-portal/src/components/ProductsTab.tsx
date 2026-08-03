import { useEffect, useState, useRef } from 'react'
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getCategories,
  getFarmers,
  updateProductPatch,
  uploadImage,
  type Category,
  type Farmer,
  type Product,
} from '../lib/api'
import { IconRefresh, IconSearch } from './Icons'
import { useDebounce } from '../lib/useDebounce'

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const productImageFileRef = useRef<HTMLInputElement | null>(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'active'>('all')

  // Form State
  const [categoryId, setCategoryId] = useState('')
  const [farmerId, setFarmerId] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState('50')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [harvestDate, setHarvestDate] = useState('December 2025')
  const [gradeTag, setGradeTag] = useState('Grade A Unpolished')
  const [processTag, setProcessTag] = useState('Single De-husked & Hand Sorted')

  // Quick Edit Buffers
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({})
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({})

  function load() {
    setLoading(true)
    Promise.all([getAdminProducts(), getCategories(), getFarmers()])
      .then(([p, c, f]) => {
        setProducts(p)
        setCategories(c)
        setFarmers(f)
        const sEdits: Record<string, number> = {}
        const pEdits: Record<string, string> = {}
        p.forEach((prod) => {
          sEdits[prod.id] = prod.stock
          pEdits[prod.id] = prod.price
        })
        setStockEdits(sEdits)
        setPriceEdits(pEdits)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load products'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleProductImageUpload(file: File) {
    setUploadingImage(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      setImageUrl(url)
      setNotice('Product image uploaded to R2 bucket!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload to R2 failed')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId || !farmerId || !name.trim() || !price || stock === '') return
    setSaving(true)
    setError(null)
    try {
      const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`
      await createProduct({
        categoryId,
        farmerId,
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        price,
        unit,
        stock: Number(stock),
        images: imageUrl ? [imageUrl] : [],
        harvestDate: harvestDate.trim() || 'December 2025',
        gradeTag: gradeTag.trim() || 'Grade A Unpolished',
        processTag: processTag.trim() || 'Single De-husked',
        isCertifiedNoPesticides: true,
      })
      setName('')
      setPrice('')
      setStock('50')
      setImageUrl('')
      setShowAddForm(false)
      setNotice(`Product "${name}" added to inventory datatable!`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create product')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveStock(id: string) {
    const newStock = stockEdits[id]
    if (newStock === undefined) return
    setBusyProductId(id)
    try {
      await updateProductPatch(id, { stock: newStock })
      setNotice('Product stock level saved!')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save stock')
    } finally {
      setBusyProductId(null)
    }
  }

  async function handleSavePrice(id: string) {
    const newPrice = priceEdits[id]
    if (!newPrice) return
    setBusyProductId(id)
    try {
      await updateProductPatch(id, { price: newPrice })
      setNotice('Product price updated!')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save price')
    } finally {
      setBusyProductId(null)
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setBusyProductId(id)
    try {
      await updateProductPatch(id, { isActive: !currentActive })
      setNotice(`Product status set to ${!currentActive ? 'Active' : 'Hidden'}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not toggle product status')
    } finally {
      setBusyProductId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return
    setBusyProductId(id)
    try {
      await deleteProduct(id)
      setNotice('Product deactivated.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete product')
    } finally {
      setBusyProductId(null)
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = debouncedSearch.toLowerCase().trim()
    const matchesSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      (p.farmerName && p.farmerName.toLowerCase().includes(q)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q))

    if (!matchesSearch) return false

    if (stockFilter === 'active') return p.isActive
    if (stockFilter === 'low') return p.stock > 0 && p.stock < 10
    if (stockFilter === 'out') return p.stock <= 0
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Banner Header & Add Toggle */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#164220]">Enterprise Catalog</span>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Inventory & Product Datatable ({products.length})</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage organic harvest products, R2 images, stock steppers, and pricing</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full bg-[#164220] hover:bg-[#123C1E] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>{showAddForm ? '✕ Close Form' : '+ Add New Product'}</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {/* Hidden File Input for R2 Image Upload */}
      <input
        ref={productImageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleProductImageUpload(file)
        }}
      />

      {/* Add Product Form Drawer */}
      {showAddForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">+ Add New Harvest Product to Inventory</h3>
            <button onClick={() => setShowAddForm(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">✕ Close</button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220] focus:bg-white"
                required
              >
                <option value="">-- Select Product Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220] focus:bg-white"
                required
              >
                <option value="">-- Select Verified Farmer --</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.village || f.district || 'Mandya'})</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Product Name (e.g. Organic Unpolished Foxtail Millet)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220] focus:bg-white"
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Price (₹)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
                required
              />
              <input
                type="text"
                placeholder="Unit (kg, g, 500g)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
                required
              />
              <input
                type="number"
                placeholder="Initial Stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
                required
              />
            </div>

            {/* Organic Harvest Entities */}
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Harvest Date (e.g. December 2025)"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <input
                type="text"
                placeholder="Grade Tag (e.g. Grade A Unpolished)"
                value={gradeTag}
                onChange={(e) => setGradeTag(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <input
                type="text"
                placeholder="Process Tag (e.g. Hand Sorted)"
                value={processTag}
                onChange={(e) => setProcessTag(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
            </div>

            {/* R2 Image Upload */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Product Image Cloudflare R2 URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <button
                type="button"
                onClick={() => productImageFileRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-xl bg-[#164220] hover:bg-[#123C1E] text-white px-4 py-2.5 text-xs font-bold shadow-sm transition whitespace-nowrap"
              >
                {uploadingImage ? 'Uploading R2...' : '📷 Upload R2 Image'}
              </button>
            </div>

            <textarea
              placeholder="Harvest description & organic farming details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-xs font-medium outline-none focus:border-[#164220]"
            />

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="w-full rounded-xl bg-[#164220] hover:bg-[#123C1E] text-white py-3 text-xs font-bold shadow-sm transition disabled:opacity-60"
            >
              {saving ? 'Creating Product...' : '+ Add Product to Inventory'}
            </button>
          </form>
        </div>
      )}

      {/* Inventory Filters Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-xs text-gray-900">
            <IconSearch className="w-4 h-4 text-[#164220] mr-2" />
            <input
              type="text"
              placeholder="Search products by name, farmer or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold placeholder-gray-400 outline-none"
            />
          </div>
          <button
            onClick={load}
            className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto text-xs font-bold">
          {[
            { id: 'all', label: `All Products (${products.length})` },
            { id: 'active', label: 'Active Storefront' },
            { id: 'low', label: `Low Stock (${products.filter((p) => p.stock > 0 && p.stock < 10).length})` },
            { id: 'out', label: `Out of Stock (${products.filter((p) => p.stock <= 0).length})` },
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setStockFilter(flt.id as never)}
              className={`rounded-full px-3.5 py-1.5 transition whitespace-nowrap ${
                stockFilter === flt.id
                  ? 'bg-[#164220] text-white shadow-sm font-extrabold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Products Datatable */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading inventory datatable...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">No products match the selected filter.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Product & Media</th>
                <th className="px-5 py-3.5">Category & Farmer</th>
                <th className="px-5 py-3.5">Price / Unit</th>
                <th className="px-5 py-3.5">Inventory Stock Stepper</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filteredProducts.map((p) => {
                const currentStockEdit = stockEdits[p.id] ?? p.stock
                const currentPriceEdit = priceEdits[p.id] ?? p.price
                const isStockChanged = currentStockEdit !== p.stock
                const isPriceChanged = currentPriceEdit !== p.price

                return (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80'}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-200 bg-white flex-shrink-0"
                        />
                        <div>
                          <p className="font-extrabold text-gray-900">{p.name}</p>
                          <p className="text-[10px] text-[#184E28] font-bold mt-0.5">
                            📅 {p.harvestDate || 'December 2025'} · {p.gradeTag || 'Grade A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-800">{p.categoryName || 'Organic Harvest'}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{p.farmerName || 'Direct Farm'}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-700">₹</span>
                        <input
                          type="text"
                          value={currentPriceEdit}
                          onChange={(e) => setPriceEdits({ ...priceEdits, [p.id]: e.target.value })}
                          className="w-16 h-7 rounded border border-gray-300 px-2 text-xs font-bold text-gray-900 outline-none focus:border-[#184E28]"
                        />
                        <span className="text-[10px] text-gray-400">/{p.unit}</span>
                        {isPriceChanged && (
                          <button
                            onClick={() => handleSavePrice(p.id)}
                            disabled={busyProductId === p.id}
                            className="h-7 px-2 rounded bg-[#184E28] text-white text-[10px] font-bold shadow-sm"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                          <button
                            onClick={() => setStockEdits((prev) => ({ ...prev, [p.id]: Math.max(0, currentStockEdit - 10) }))}
                            className="h-6 px-1.5 rounded bg-gray-200 text-[10px] font-bold text-gray-700 hover:bg-gray-300"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => setStockEdits((prev) => ({ ...prev, [p.id]: Math.max(0, currentStockEdit - 1) }))}
                            className="h-6 w-6 rounded bg-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={currentStockEdit}
                            onChange={(e) => setStockEdits({ ...stockEdits, [p.id]: Number(e.target.value) })}
                            className="w-14 h-6 text-center text-xs font-extrabold outline-none bg-transparent text-gray-900"
                          />
                          <button
                            onClick={() => setStockEdits((prev) => ({ ...prev, [p.id]: currentStockEdit + 1 }))}
                            className="h-6 w-6 rounded bg-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => setStockEdits((prev) => ({ ...prev, [p.id]: currentStockEdit + 10 }))}
                            className="h-6 px-1.5 rounded bg-gray-200 text-[10px] font-bold text-gray-700 hover:bg-gray-300"
                          >
                            +10
                          </button>
                        </div>
                        {isStockChanged && (
                          <button
                            onClick={() => handleSaveStock(p.id)}
                            disabled={busyProductId === p.id}
                            className="h-7 px-2.5 rounded bg-[#184E28] text-white text-[10px] font-bold shadow-sm"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          p.stock <= 0
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : p.stock < 10
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${p.stock <= 0 ? 'bg-rose-500' : p.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span>{p.stock <= 0 ? 'Out of Stock' : p.stock < 10 ? `Low (${p.stock})` : 'In Stock'}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(p.id, p.isActive)}
                        disabled={busyProductId === p.id}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {p.isActive ? 'Active Store' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={busyProductId === p.id}
                        className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 text-xs font-bold transition"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
