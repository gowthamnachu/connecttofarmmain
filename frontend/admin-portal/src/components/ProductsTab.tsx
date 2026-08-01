import { useEffect, useState } from 'react'
import { createProduct, getCategories, getFarmers, getProducts, type Category, type Farmer, type Product } from '../lib/api'

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [categoryId, setCategoryId] = useState('')
  const [farmerId, setFarmerId] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState('')

  function load() {
    setLoading(true)
    Promise.all([getProducts(), getCategories(), getFarmers()])
      .then(([p, c, f]) => {
        setProducts(p)
        setCategories(c)
        setFarmers(f)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load products'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId || !farmerId || !name.trim() || !price || !stock) return
    setSaving(true)
    setError(null)
    try {
      const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`
      await createProduct({
        categoryId,
        farmerId,
        name: name.trim(),
        slug,
        price,
        unit,
        stock: Number(stock),
        images: [],
      })
      setName('')
      setPrice('')
      setStock('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create product')
    } finally {
      setSaving(false)
    }
  }

  const hasPrerequisites = categories.length > 0 && farmers.length > 0

  return (
    <div>
      {!loading && !hasPrerequisites && (
        <p className="text-xs bg-surface rounded-lg px-3 py-2 mb-3 text-neutral-700">
          Add at least one category and one farmer before creating products.
        </p>
      )}

      {hasPrerequisites && (
        <form onSubmit={handleAdd} className="space-y-2 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Farmer</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Price (₹)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Unit (kg, g...)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary text-white py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add product'}
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products yet.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <span className="text-sm font-medium text-neutral-800">{p.name}</span>
              <span className="text-xs text-neutral-500">
                ₹{p.price}/{p.unit} · stock {p.stock}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
