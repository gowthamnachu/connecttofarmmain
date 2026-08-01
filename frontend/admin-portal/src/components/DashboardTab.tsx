import { useEffect, useState } from 'react'
import { getAdminOrders, getAdminProducts, getFarmers, type Order, type Product } from '../lib/api'
import { IconTrendingUp, IconTruck, IconPackage, IconFarmers, IconCheck, IconDownload } from './Icons'

export default function DashboardTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [farmerCount, setFarmerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminOrders(), getAdminProducts(), getFarmers()])
      .then(([ordList, prodList, farmList]) => {
        setOrders(ordList)
        setProducts(prodList)
        setFarmerCount(farmList.length)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalRevenue = orders.reduce((sum, o) => (o.paymentStatus === 'paid' ? sum + Number(o.total) : sum), 0)
  const pendingShipments = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
  const lowStockProducts = products.filter((p) => p.stock < 10)
  const outOfStockProducts = products.filter((p) => p.stock <= 0)

  return (
    <div className="space-y-6">
      {/* Executive KPI Header Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Gross Sales Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <IconTrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-gray-900">
              ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="mt-1 text-[11px] font-bold text-emerald-700">
              Razorpay Confirmed Payments
            </p>
          </div>
        </div>

        {/* Active Dispatch */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">NimbusPost Dispatch</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <IconTruck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-gray-900">{pendingShipments} Active</h3>
            <p className="mt-1 text-[11px] font-bold text-blue-700">
              Live AWB Tracking Sync
            </p>
          </div>
        </div>

        {/* Catalog SKUs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Catalog SKUs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#184E28]/10 text-[#184E28]">
              <IconPackage className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-gray-900">{products.length} SKUs</h3>
            <p className="mt-1 text-[11px] font-bold text-amber-700">
              {outOfStockProducts.length > 0 ? `⚠️ ${outOfStockProducts.length} Out of Stock` : 'Healthy Inventory'}
            </p>
          </div>
        </div>

        {/* Certified Farmers */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Direct Growers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <IconFarmers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-gray-900">{farmerCount} Certified</h3>
            <p className="mt-1 text-[11px] font-bold text-gray-500">Mandya & Guntur Network</p>
          </div>
        </div>
      </div>

      {/* Fulfillment Pipeline & Restock Datatables */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Fulfillment Pipeline Datatable */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">NimbusPost Orders Fulfillment Pipeline</h3>
              <p className="text-xs text-gray-500">Live order status & AWB shipping labels stream</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              Hub: LB Nagar (500074)
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-xs text-gray-500 py-4 font-semibold">Loading orders datatable...</p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center font-semibold">No orders recorded in system.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2.5">Order #</th>
                    <th className="px-3 py-2.5">AWB Number</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 6).map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50 transition font-medium text-gray-800">
                      <td className="px-3 py-2.5 font-bold text-gray-900">{ord.orderNumber}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{ord.shipment?.awbNumber || 'AWB Pending'}</td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">₹{ord.total}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {ord.shipment?.labelUrl ? (
                          <a
                            href={ord.shipment.labelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-[#184E28] hover:bg-[#123C1E] text-white px-2.5 py-1 text-[10px] font-bold shadow-sm inline-flex items-center gap-1"
                          >
                            <IconDownload className="w-3 h-3" />
                            <span>Label</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Restock Inventory Datatable */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Inventory Restock Radar</h3>
              <p className="text-xs text-gray-500">Products requiring restock attention</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {lowStockProducts.length} Items
            </span>
          </div>

          <div className="overflow-x-auto">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 font-semibold">
                <IconCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span>All product stock levels are healthy!</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2.5">SKU Name</th>
                    <th className="px-3 py-2.5">Price</th>
                    <th className="px-3 py-2.5 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/50 transition">
                      <td className="px-3 py-2.5 font-bold text-gray-900">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600">₹{p.price}/{p.unit}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold">
                          {p.stock} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
