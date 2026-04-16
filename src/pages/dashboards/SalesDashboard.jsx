import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../../services/dashboardService'
import { Banknote, Receipt, Users, Package, AlertTriangle, RefreshCw } from 'lucide-react'

const formatOMR = (n) => `OMR ${parseFloat(n || 0).toFixed(3)}`

const statusBadge = {
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700'
}

const SalesDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await dashboardService.getSales()
    if (result.success) setData(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-slate-500">Loading sales dashboard...</div>
  if (!data) return <div className="p-8 text-slate-500">No data available</div>

  const { sales, pendingInvoices, topCustomers, recentSales, lowStock } = data

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Today's activity · top customers · inventory alerts</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-slate-200 bg-white rounded-xl p-5 cursor-pointer hover:shadow" onClick={() => navigate('/sales')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Today's Sales</div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">{formatOMR(sales.todayTotal)}</div>
          <div className="mt-1 text-xs text-slate-400">{sales.todayCount} orders</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-5 cursor-pointer hover:shadow" onClick={() => navigate('/sales')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Month to Date</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-700">{formatOMR(sales.mtdTotal)}</div>
          <div className="mt-1 text-xs text-slate-400">{sales.mtdCount} orders</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Year to Date</div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-700">{formatOMR(sales.ytdTotal)}</div>
          <div className="mt-1 text-xs text-slate-400">{sales.ytdCount} orders</div>
        </div>
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-5 cursor-pointer hover:shadow" onClick={() => navigate('/reports')}>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-700">Pending Invoices</div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-800">{formatOMR(pendingInvoices.total)}</div>
          <div className="mt-1 text-xs text-amber-600">{pendingInvoices.count} unpaid</div>
        </div>
      </div>

      {/* Top Customers + Recent Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Top Customers YTD</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          <table className="w-full text-sm">
            <tbody>
              {topCustomers.length === 0 ? (
                <tr><td className="px-6 py-4 text-slate-400 text-center">No sales yet</td></tr>
              ) : topCustomers.map((c, i) => (
                <tr key={c.id || i} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold">{i + 1}</span>
                      <span className="font-medium">{c.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 text-right">{c.orderCount} orders</td>
                  <td className="px-6 py-3 font-mono font-bold text-right">{formatOMR(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Recent Sales</h3>
            <Receipt size={16} className="text-slate-400" />
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td className="px-6 py-4 text-slate-400 text-center">No sales yet</td></tr>
              ) : recentSales.map(s => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50" onClick={() => navigate('/sales')}>
                  <td className="px-6 py-3">
                    <div className="font-mono text-xs">{s.orderNumber}</div>
                    <div className="text-xs text-slate-500">{s.customerName || 'Unknown'} · {s.orderDate}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${statusBadge[s.paymentStatus] || 'bg-slate-100'}`}>
                      {s.paymentStatus?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono font-bold text-right">{formatOMR(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl">
          <div className="px-6 py-3 border-b border-red-200 bg-red-50 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-700">Low Stock Alerts</h3>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-2 text-left text-[10px] font-bold uppercase text-slate-600">Material</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase text-slate-600">Current Stock</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase text-slate-600">Minimum</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((l, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50" onClick={() => navigate('/inventory')}>
                  <td className="px-6 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-700 font-bold">{l.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{l.minimumStockLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SalesDashboard
