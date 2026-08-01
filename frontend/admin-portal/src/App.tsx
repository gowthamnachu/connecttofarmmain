import { useEffect, useState } from 'react'
import { adminLogin, clearSession, getSession, saveSession } from './lib/api'
import DashboardTab from './components/DashboardTab'
import CategoriesTab from './components/CategoriesTab'
import FarmersTab from './components/FarmersTab'
import ProductsTab from './components/ProductsTab'
import OrdersTab from './components/OrdersTab'
import {
  IconDashboard,
  IconPackage,
  IconOrders,
  IconFarmers,
  IconCategory,
  IconSearch,
  IconTruck,
  IconBuilding,
} from './components/Icons'

const TABS = [
  { id: 'Dashboard', label: 'Dashboard', icon: IconDashboard },
  { id: 'Products', label: 'Inventory & Products', icon: IconPackage },
  { id: 'Orders', label: 'Orders & Dispatch', icon: IconOrders },
  { id: 'Farmers', label: 'Farmers Network', icon: IconFarmers },
  { id: 'Categories', label: 'Categories', icon: IconCategory },
] as const

type Tab = (typeof TABS)[number]['id']

function App() {
  const [session, setSession] = useState(() => getSession())
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')

  useEffect(() => {
    function handleUnauthorized() {
      clearSession()
      setSession(null)
      setError('Your session has expired or is invalid. Please log in again.')
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

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
      <div className="flex h-screen w-full bg-white text-[#111827] overflow-hidden font-sans">
        {/* Left Enterprise Navigation Sidebar */}
        <aside className="w-64 bg-[#6A7B67] text-white flex flex-col justify-between border-r border-[#566356] flex-shrink-0">
          <div>
            {/* Enterprise Brand Header */}
            <div className="p-5 border-b border-white/15 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECE5D1] text-[#6A7B67] shadow-sm font-black text-base">
                🌱
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-white uppercase">Connect to Farm</h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ECE5D1]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Enterprise ERP v2.4
                </span>
              </div>
            </div>

            {/* Hub Dispatch Info */}
            <div className="mx-3 mt-4 rounded-2xl bg-black/15 p-3.5 border border-white/15 text-xs text-white/90 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#ECE5D1]">
                <span>Dispatch Center</span>
                <span className="text-emerald-300 font-extrabold">Active</span>
              </div>
              <p className="font-bold text-white text-xs flex items-center gap-1.5">
                <IconBuilding className="w-3.5 h-3.5 text-[#ECE5D1]" />
                <span>LB Nagar Warehouse</span>
              </p>
              <p className="text-[11px] text-[#ECE5D1]/80 font-medium">Pincode 500074 · Hyderabad</p>
            </div>

            {/* Navigation Tabs */}
            <nav className="mt-4 px-3 space-y-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#566356] text-white font-extrabold shadow-sm border-l-4 border-[#ECE5D1]'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ECE5D1]' : 'text-white/70'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Admin User Profile Bottom Footer */}
          <div className="p-4 border-t border-white/15 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ECE5D1] text-[#6A7B67] font-black text-xs">
                  {session.admin.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{session.admin.name}</p>
                  <p className="text-[11px] text-[#ECE5D1] font-medium capitalize">{session.admin.role} Manager</p>
                </div>
              </div>
              <button
                onClick={() => {
                  clearSession()
                  setSession(null)
                }}
                title="Sign out of ERP system"
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-950/60 transition border border-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Top ERP Executive Header Bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div>
              <h2 className="text-base font-black text-[#164220] tracking-tight">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-[11px] font-medium text-gray-500">
                Connect to Farm Quick Commerce & Logistics Management
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* NimbusPost System Status Badge */}
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200">
                <IconTruck className="w-3.5 h-3.5 text-emerald-700" />
                <span>NimbusPost Status: Active</span>
              </div>

              {/* Global ERP Search Input */}
              <div className="relative">
                <div className="flex items-center rounded-full border border-gray-300 bg-gray-50 px-3.5 py-1.5 text-xs text-gray-900">
                  <IconSearch className="w-3.5 h-3.5 text-[#164220] mr-2" />
                  <input
                    type="text"
                    placeholder="Search SKU, order #, farmer..."
                    className="bg-transparent text-xs font-semibold placeholder-gray-400 outline-none w-48"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* ERP Main Scrollable Workspace */}
          <main className="flex-1 overflow-y-auto erp-scrollbar p-6 bg-white">
            <div className="max-w-7xl mx-auto space-y-6">
              {activeTab === 'Dashboard' && <DashboardTab />}
              {activeTab === 'Products' && <ProductsTab />}
              {activeTab === 'Orders' && <OrdersTab />}
              {activeTab === 'Farmers' && <FarmersTab />}
              {activeTab === 'Categories' && <CategoriesTab />}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Modern Enterprise Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E261D] via-[#2D382C] to-[#6A7B67] p-4 text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-[#1E261D] border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6A7B67] via-emerald-500 to-[#ECE5D1]" />

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6A7B67] text-white shadow-sm font-bold text-lg">
            🌱
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#1E261D]">Connect to Farm</h1>
            <p className="text-xs font-medium text-[#6A7B67]">Enterprise ERP Portal</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-normal mb-6">
          Sign in with authorized administrator credentials to manage inventory, catalog, and NimbusPost logistics dispatch.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-[#F4F3EE] px-4 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67] focus:ring-2 focus:ring-[#6A7B67]/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-[#F4F3EE] px-4 py-2.5 text-xs font-medium outline-none focus:border-[#6A7B67] focus:ring-2 focus:ring-[#6A7B67]/20"
              required
            />
          </div>
          {error && <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#6A7B67] text-white py-3 text-xs font-semibold shadow-sm hover:bg-[#566356] transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
