import { useState } from 'react'
import { clearSession, farmerLogin, getSession, saveSession } from './lib/api'

function App() {
  const [session, setSession] = useState(() => getSession())
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  if (session) {
    return (
      <div className="min-h-full flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200/80 shadow-md p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#164220] text-white font-extrabold text-xl mb-4 shadow-sm">
            🌾
          </div>
          <h1 className="font-display text-xl font-extrabold text-neutral-900 tracking-tight mb-1">
            Welcome, {session.farmer.name}
          </h1>
          <p className="text-xs text-neutral-600 mb-6 flex items-center gap-1.5 font-medium">
            <span>Certification status:</span>
            <span className="font-bold text-[#164220] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {session.farmer.certificationStatus}
            </span>
          </p>
          <div className="rounded-xl bg-amber-50/60 p-3.5 border border-amber-200/60 mb-6">
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              Product listing, direct harvest dispatch, and payout management tools are synced with ConnectToFarm ERP.
            </p>
          </div>
          <button
            onClick={() => {
              clearSession()
              setSession(null)
            }}
            className="w-full rounded-xl border border-neutral-300 text-neutral-800 py-2.5 text-xs font-bold hover:bg-neutral-50 transition"
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200/80 shadow-md p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#164220] text-white font-extrabold text-xl mb-4 shadow-sm">
          🌱
        </div>
        <h1 className="font-display text-xl font-extrabold text-neutral-900 tracking-tight mb-1">Farmer Portal</h1>
        <p className="text-xs text-neutral-500 mb-6 font-medium leading-relaxed">Login with your verified mobile number and security credentials.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-semibold text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-semibold text-neutral-900 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20 transition"
            />
          </div>
          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#164220] hover:bg-[#103318] text-white py-3 text-xs font-bold shadow-md transition disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in to Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App

