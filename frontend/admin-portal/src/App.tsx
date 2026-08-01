import { useState } from 'react'
import { adminLogin, clearSession, getSession, saveSession } from './lib/api'
import CategoriesTab from './components/CategoriesTab'
import FarmersTab from './components/FarmersTab'
import ProductsTab from './components/ProductsTab'
import OrdersTab from './components/OrdersTab'

const TABS = ['Categories', 'Farmers', 'Products', 'Orders'] as const
type Tab = (typeof TABS)[number]

function App() {
  const [session, setSession] = useState(() => getSession())
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Categories')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const auth = await adminLogin(phone, password)
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
      <div className="min-h-full bg-surface">
        <header className="bg-primary text-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-semibold">Connect to Farm — Admin</p>
            <p className="text-xs text-white/80">
              {session.admin.name} · {session.admin.role}
            </p>
          </div>
          <button
            onClick={() => {
              clearSession()
              setSession(null)
            }}
            className="text-xs bg-white/20 rounded-full px-3 py-1.5"
          >
            Log out
          </button>
        </header>

        <nav className="flex gap-2 px-4 py-3 bg-white shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                activeTab === tab ? 'bg-primary text-white' : 'bg-surface text-neutral-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <main className="p-4 max-w-lg mx-auto">
          {activeTab === 'Categories' && <CategoriesTab />}
          {activeTab === 'Farmers' && <FarmersTab />}
          {activeTab === 'Products' && <ProductsTab />}
          {activeTab === 'Orders' && <OrdersTab />}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm bg-white rounded-card shadow-sm p-6">
        <h1 className="text-xl font-semibold text-primary-dark mb-1">Connect to Farm — Admin</h1>
        <p className="text-sm text-neutral-500 mb-6">Sign in to manage categories, products, farmers and orders.</p>

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


