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
      <div className="min-h-full flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm bg-white rounded-card shadow-sm p-6">
          <h1 className="text-xl font-semibold text-primary-dark mb-1">Welcome, {session.farmer.name}</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Certification status: <span className="font-medium">{session.farmer.certificationStatus}</span>
          </p>
          <p className="text-sm text-neutral-500 mb-6">Product listing and order management tools are coming soon.</p>
          <button
            onClick={() => {
              clearSession()
              setSession(null)
            }}
            className="w-full rounded-lg border border-surface-dark text-neutral-700 py-2 text-sm font-semibold"
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm bg-white rounded-card shadow-sm p-6">
        <h1 className="text-xl font-semibold text-primary-dark mb-1">Farmer Portal</h1>
        <p className="text-sm text-neutral-500 mb-6">Login with the phone number and password issued by your admin.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Phone number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-white py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App

