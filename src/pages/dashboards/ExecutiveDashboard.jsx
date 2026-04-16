import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../../services/dashboardService'
import { Banknote, TrendingUp, Users, Truck, AlertTriangle, Clock, RefreshCw } from 'lucide-react'

const formatOMR = (n) => `OMR ${parseFloat(n || 0).toFixed(3)}`

const StatCard = ({ icon, label, value, subtext, color = 'slate', onClick }) => {
  const colors = {
    slate: 'border-slate-200 bg-white',
    green: 'border-emerald-200 bg-emerald-50',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50'
  }
  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-5 transition-colors ${colors[color]} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold font-mono text-slate-900">{value}</div>
      {subtext && <div className="mt-1 text-xs text-slate-500">{subtext}</div>}
    </div>
  )
}

const ExecutiveDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await dashboardService.getExecutive()
    if (result.success) setData(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-slate-500">Loading executive dashboard...</div>
  if (!data) return <div className="p-8 text-slate-500">No data available</div>

  const k = data.kpis

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Company-wide KPIs · Real-time view</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Banknote size={24} />} label="Today's Revenue" value={formatOMR(k.todayRevenue)} color="green" onClick={() => navigate('/sales')} />
        <StatCard icon={<TrendingUp size={24} />} label="Month to Date" value={formatOMR(k.mtdRevenue)} subtext={`Gross Profit: ${formatOMR(k.mtdGrossProfit)}`} color="blue" />
        <StatCard icon={<Banknote size={24} />} label="Year to Date" value={formatOMR(k.ytdRevenue)} color="purple" />
        <StatCard icon={<Clock size={24} />} label="Outstanding Receivables" value={formatOMR(k.outstandingReceivables)} color="amber" onClick={() => navigate('/reports')} />
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<AlertTriangle size={20} className="text-amber-600" />}
          label="WCN Pending Finalization"
          value={k.pendingWcn}
          color={k.pendingWcn > 0 ? 'amber' : 'slate'}
          onClick={() => navigate('/purchase')}
        />
        <StatCard
          icon={<AlertTriangle size={20} className="text-red-600" />}
          label="Expiring Documents (30d)"
          value={k.expiringDocuments}
          color={k.expiringDocuments > 0 ? 'red' : 'slate'}
          onClick={() => navigate('/employees')}
        />
        <StatCard
          icon={<Truck size={20} className="text-blue-600" />}
          label="Active Vehicles"
          value={`${data.vehicles.active}/${(data.vehicles.active + data.vehicles.inactive + data.vehicles.under_maintenance)}`}
          subtext={`${data.vehicles.under_maintenance} in maintenance`}
          color="blue"
          onClick={() => navigate('/vehicles')}
        />
      </div>

      {/* Top Customers + Top Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Top Customers (MTD)</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          <table className="w-full">
            <tbody>
              {data.topCustomers.length === 0 ? (
                <tr><td className="px-6 py-4 text-sm text-slate-400 text-center">No sales this month</td></tr>
              ) : data.topCustomers.map((c, i) => (
                <tr key={c.id || i} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold">{i + 1}</span>
                      <span className="font-medium">{c.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500 text-right">{c.orderCount} orders</td>
                  <td className="px-6 py-3 text-sm font-mono font-bold text-right">{formatOMR(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Top Suppliers (MTD)</h3>
            <Truck size={16} className="text-slate-400" />
          </div>
          <table className="w-full">
            <tbody>
              {data.topSuppliers.length === 0 ? (
                <tr><td className="px-6 py-4 text-sm text-slate-400 text-center">No purchases this month</td></tr>
              ) : data.topSuppliers.map((s, i) => (
                <tr key={s.id || i} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold">{i + 1}</span>
                      <span className="font-medium">{s.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500 text-right">{s.orderCount} orders</td>
                  <td className="px-6 py-3 text-sm font-mono font-bold text-right">{formatOMR(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Trend */}
      {data.revenueTrend && data.revenueTrend.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Revenue Trend (Last 6 Months)</h3>
          <div className="flex items-end gap-2 h-40">
            {data.revenueTrend.map((r, i) => {
              const maxRev = Math.max(...data.revenueTrend.map(x => x.revenue)) || 1
              const height = (r.revenue / maxRev) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                      style={{ height: `${height}%` }}
                      title={formatOMR(r.revenue)}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{r.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExecutiveDashboard
