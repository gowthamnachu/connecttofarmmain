import { useEffect, useState } from 'react'
import { getAdminOrders, getOrderShippingLabel, sendOrderToNimbuspost, updateOrderStatus, type Order } from '../lib/api'
import { IconDownload, IconTruck, IconRefresh, IconSearch } from './Icons'
import { useDebounce } from '../lib/useDebounce'

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [downloadingLabelId, setDownloadingLabelId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 250)
  const [statusFilter, setStatusFilter] = useState('all')

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
      setNotice(`Order status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDownloadLabel(orderId: string, existingLabelUrl?: string | null) {
    setDownloadingLabelId(orderId)
    try {
      let targetUrl = existingLabelUrl
      if (!targetUrl) {
        const res = await getOrderShippingLabel(orderId)
        targetUrl = res.labelUrl
      }
      if (targetUrl) {
        window.open(targetUrl, '_blank')
      } else {
        setError('Shipping label not generated yet')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch shipping label')
    } finally {
      setDownloadingLabelId(null)
    }
  }

  const [dispatchingId, setDispatchingId] = useState<string | null>(null)

  async function handleSendToNimbuspost(orderId: string, orderNumber: string) {
    setDispatchingId(orderId)
    setError(null)
    setNotice(null)
    try {
      const res = await sendOrderToNimbuspost(orderId)
      setNotice(`Order ${orderNumber} successfully sent to NimbusPost! AWB: ${res.awbNumber}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send order to NimbusPost')
    } finally {
      setDispatchingId(null)
    }
  }

  const filteredOrders = orders.filter((ord) => {
    const q = debouncedSearchQuery.toLowerCase().trim()
    const matchesSearch =
      q === '' ||
      ord.orderNumber.toLowerCase().includes(q) ||
      (ord.address?.receiverName && ord.address.receiverName.toLowerCase().includes(q)) ||
      (ord.address?.receiverPhone && ord.address.receiverPhone.includes(q)) ||
      (ord.shipment?.awbNumber && ord.shipment.awbNumber.toLowerCase().includes(q))

    if (!matchesSearch) return false
    if (statusFilter !== 'all' && ord.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#164220]">NimbusPost Dispatch</span>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Orders & Fulfillment Datatable ({orders.length})</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage quick commerce fulfillment, AWB shipping labels, and status updates</p>
        </div>
        <button
          onClick={load}
          className="rounded-full bg-[#164220] hover:bg-[#123C1E] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <IconRefresh className="w-4 h-4" />
          <span>Refresh Orders</span>
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

      {/* Orders Filter & Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-xs text-gray-900">
          <IconSearch className="w-4 h-4 text-[#164220] mr-2" />
          <input
            type="text"
            placeholder="Search orders by order #, receiver name, phone or AWB number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold placeholder-gray-400 outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto text-xs font-bold">
          {['all', ...STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3.5 py-1.5 transition whitespace-nowrap uppercase ${
                statusFilter === st
                  ? 'bg-[#164220] text-white shadow-sm font-extrabold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {st === 'all' ? `All Orders (${orders.length})` : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Datatable */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading NimbusPost order stream...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">No orders found matching the filter criteria.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Order # & Date</th>
                <th className="px-5 py-3.5">Customer & Delivery</th>
                <th className="px-5 py-3.5">Total & Payment</th>
                <th className="px-5 py-3.5">NimbusPost AWB</th>
                <th className="px-5 py-3.5">Dispatch Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-extrabold text-gray-900">{ord.orderNumber}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {new Date(ord.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </td>

                  <td className="px-5 py-3.5">
                    {ord.address ? (
                      <div>
                        <p className="font-bold text-gray-900">{ord.address.receiverName || 'Customer'}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                          📞 {ord.address.receiverPhone || 'N/A'} · 📍 {ord.address.city || ord.address.pincode}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Direct Purchase</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-extrabold text-gray-900">₹{ord.total}</p>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase mt-0.5 ${
                        ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-gray-800">
                      <IconTruck className="w-3.5 h-3.5 text-[#164220]" />
                      <span>{ord.shipment?.awbNumber || 'AWB Pending'}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{ord.shipment?.courierName || 'NimbusPost Logistics'}</p>
                  </td>

                  <td className="px-5 py-3.5">
                    <select
                      value={ord.status}
                      disabled={updatingId === ord.id}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-[#164220] uppercase"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-3.5 text-right font-medium">
                    {ord.shipment?.awbNumber ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadLabel(ord.id, ord.shipment?.labelUrl)}
                        disabled={downloadingLabelId === ord.id}
                        className="rounded-lg bg-[#164220] hover:bg-[#123C1E] text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <IconDownload className="w-3.5 h-3.5" />
                        <span>{downloadingLabelId === ord.id ? 'Loading...' : '📄 Shipping Label'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendToNimbuspost(ord.id, ord.orderNumber)}
                        disabled={dispatchingId === ord.id}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-md transition disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <IconTruck className="w-4 h-4" />
                        <span>{dispatchingId === ord.id ? 'Sending...' : '📦 Send to NimbusPost'}</span>
                      </button>
                    )}
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
