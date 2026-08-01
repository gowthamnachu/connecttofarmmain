import { useEffect, useState } from 'react'
import { onboardFarmer, getFarmers, type Farmer } from '../lib/api'

export default function FarmersTab() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('')

  function load() {
    setLoading(true)
    getFarmers()
      .then(setFarmers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load farmers'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setSaving(true)
    setError(null)
    setTempPassword(null)
    try {
      const result = await onboardFarmer({
        name: name.trim(),
        phone: phone.trim(),
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
      })
      setTempPassword(result.tempPassword)
      setName('')
      setPhone('')
      setVillage('')
      setDistrict('')
      setState('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not onboard farmer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Farmer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            type="tel"
            placeholder="10-digit phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Village"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary text-white py-2 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Onboarding…' : 'Onboard farmer'}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {tempPassword && (
        <p className="text-xs bg-surface rounded-lg px-3 py-2 mb-3 text-neutral-700">
          Farmer created. One-time password to share with them: <span className="font-mono font-semibold">{tempPassword}</span>
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : farmers.length === 0 ? (
        <p className="text-sm text-neutral-500">No farmers onboarded yet.</p>
      ) : (
        <ul className="space-y-2">
          {farmers.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <div>
                <p className="text-sm font-medium text-neutral-800">{f.name}</p>
                <p className="text-xs text-neutral-500">
                  {f.phone} · {[f.village, f.district].filter(Boolean).join(', ') || 'No location'}
                </p>
              </div>
              <span className="text-xs font-medium text-neutral-600">{f.certificationStatus}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
