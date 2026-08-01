import { useEffect, useState } from 'react'
import { getAdminOrders, updateOrderStatus, type Order } from '../lib/api'

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getAdminOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-card bg-white p-4 shadow-sm text-center">
          <p className="text-sm text-neutral-500">No orders placed yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-card bg-white p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm font-semibold text-primary-dark">₹{order.total}</p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-dark">
                <span className="text-xs text-neutral-600">Payment: <strong className="capitalize">{order.paymentStatus}</strong></span>
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="text-xs rounded-lg border border-surface-dark px-2 py-1 bg-surface text-neutral-800 font-medium outline-none"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
