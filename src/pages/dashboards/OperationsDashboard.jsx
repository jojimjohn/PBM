import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../../services/dashboardService'
import { Truck, Clock, CheckCircle, AlertTriangle, Users, RefreshCw, Package } from 'lucide-react'

const formatOMR = (n) => `OMR ${parseFloat(n || 0).toFixed(3)}`

const OperationsDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await dashboardService.getOperations()
    if (result.success) setData(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-slate-500">Loading operations dashboard...</div>
  if (!data) return <div className="p-8 text-slate-500">No data available</div>

  const { todaySchedule, pendingApprovals, vehicles, driverProductivity } = data

  const statusColor = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-500'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Today's schedule · pending approvals · fleet status</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Pending Approvals Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`border rounded-xl p-4 ${pendingApprovals.total > 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Pending</div>
          <div className="mt-1 text-3xl font-bold font-mono">{pendingApprovals.total}</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-4 cursor-pointer hover:shadow" onClick={() => navigate('/purchase')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">WCN Finalization</div>
          <div className="mt-1 text-3xl font-bold font-mono text-amber-700">{pendingApprovals.wcn}</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-4 cursor-pointer hover:shadow" onClick={() => navigate('/wastage')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Wastage Approvals</div>
          <div className="mt-1 text-3xl font-bold font-mono text-red-600">{pendingApprovals.wastage}</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-4 cursor-pointer hover:shadow" onClick={() => navigate('/expense-sheets')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Expense Sheets</div>
          <div className="mt-1 text-3xl font-bold font-mono text-purple-700">{pendingApprovals.expenseSheets}</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-4 cursor-pointer hover:shadow" onClick={() => navigate('/petty-cash')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Petty Cash</div>
          <div className="mt-1 text-3xl font-bold font-mono text-blue-700">{pendingApprovals.pettyCash}</div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Today's Collection Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">{todaySchedule.length} orders scheduled</p>
          </div>
          <Clock size={16} className="text-slate-400" />
        </div>
        {todaySchedule.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">No collections scheduled for today</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-600">Order #</th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-600">Driver</th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-600">Vehicle</th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-600">Status</th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-600">WCN</th>
              </tr>
            </thead>
            <tbody>
              {todaySchedule.map(o => (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/purchase`)}>
                  <td className="px-4 py-2 font-mono text-xs">{o.orderNumber}</td>
                  <td className="px-4 py-2">{o.driver_full_name || o.driverName || '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs">{o.vehiclePlate || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColor[o.status] || 'bg-slate-100'}`}>
                      {o.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {o.is_finalized ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle size={12} /> Finalized</span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Fleet status + Driver productivity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Fleet Status</h3>
            <Truck size={16} className="text-slate-400" />
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active</span>
              <span className="font-mono font-bold text-emerald-700">{vehicles.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Under Maintenance</span>
              <span className="font-mono font-bold text-amber-700">{vehicles.under_maintenance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Inactive</span>
              <span className="font-mono font-bold text-slate-500">{vehicles.inactive}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-sm font-bold">Total Fleet</span>
              <span className="font-mono font-bold text-slate-900">{vehicles.total}</span>
            </div>
            <button className="btn btn-outline btn-sm w-full mt-2" onClick={() => navigate('/vehicles')}>
              View All Vehicles
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Driver Productivity (7 days)</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          {driverProductivity.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No driver data yet</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {driverProductivity.map((d, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold">{i + 1}</span>
                        <span className="font-medium">{d.driver_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{d.collections} runs</td>
                    <td className="px-6 py-3 font-mono font-bold text-right">{formatOMR(d.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default OperationsDashboard
