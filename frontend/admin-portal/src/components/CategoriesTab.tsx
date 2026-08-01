import { useEffect, useState } from 'react'
import { createCategory, updateCategory, deleteCategory, getCategories, type Category } from '../lib/api'

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Form states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState<number>(1)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreateModal() {
    setEditingId(null)
    setName('')
    setSlug('')
    setSortOrder(categories.length + 1)
    setShowAddModal(true)
  }

  function openEditModal(cat: Category) {
    setEditingId(cat.id)
    setName(cat.name)
    setSlug(cat.slug)
    setSortOrder(cat.sortOrder)
    setShowAddModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const generatedSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), slug: generatedSlug, sortOrder })
        setNotice(`Category "${name}" updated successfully!`)
      } else {
        await createCategory({ name: name.trim(), slug: generatedSlug, sortOrder })
        setNotice(`Category "${name}" created successfully!`)
      }
      setShowAddModal(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(cat: Category) {
    try {
      if (cat.isActive) {
        await deleteCategory(cat.id, false) // Soft-disable
        setNotice(`Category "${cat.name}" disabled.`)
      } else {
        await updateCategory(cat.id, { isActive: true })
        setNotice(`Category "${cat.name}" enabled.`)
      }
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update category status')
    }
  }

  async function handlePermanentDelete(cat: Category) {
    if (!window.confirm(`Are you sure you want to permanently delete category "${cat.name}" from the database?`)) return
    try {
      await deleteCategory(cat.id, true) // Permanent DB deletion
      setNotice(`Category "${cat.name}" permanently deleted from database.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category')
    }
  }

  const activeCount = categories.filter((c) => c.isActive).length
  const disabledCount = categories.length - activeCount

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#164220]">Catalog Management</span>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Category Inventory ({categories.length})</h2>
          <div className="mt-1 flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● {activeCount} Active Storefront Categories
            </span>
            {disabledCount > 0 && (
              <span className="text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                ● {disabledCount} Disabled
              </span>
            )}
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-full bg-[#164220] hover:bg-[#123C1E] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>+ Create New Category</span>
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

      {/* Add / Edit Category Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">{editingId ? 'Edit Category' : 'Create New Category'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. MILLET BASKET"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!editingId) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                    }
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. millets"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-xs font-mono text-gray-800 outline-none focus:border-[#164220] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220] focus:bg-white transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#164220] hover:bg-[#123C1E] text-white py-3 text-xs font-bold shadow-sm transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? '✓ Update Category' : '+ Create Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories CRUD Datatable */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">No categories found. Click + Create New Category to add one.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Sort</th>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">CRUD Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-5 py-3.5 font-bold text-gray-400">#{cat.sortOrder}</td>
                  <td className="px-5 py-3.5 font-extrabold text-gray-900">{cat.name}</td>
                  <td className="px-5 py-3.5 font-mono text-gray-600">{cat.slug}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        cat.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      <span>{cat.isActive ? 'Active' : 'Disabled'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        cat.isActive
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {cat.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(cat)}
                      className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-bold transition"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
