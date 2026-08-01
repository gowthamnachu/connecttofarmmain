import { useEffect, useState } from 'react'
import { createCategory, getCategories, type Category } from '../lib/api'

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      await createCategory({ name: name.trim(), slug, sortOrder: categories.length + 1 })
      setName('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-neutral-500">No categories yet.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <span className="text-sm font-medium text-neutral-800">{cat.name}</span>
              <span className="text-xs text-neutral-500">{cat.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
