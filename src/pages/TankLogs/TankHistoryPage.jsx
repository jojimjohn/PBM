import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import tankLogService from '../../services/tankLogService'
import { ArrowLeft, RefreshCw } from 'lucide-react'

const TankHistoryPage = () => {
  const { tankId } = useParams()
  const navigate = useNavigate()

  // Default: last 30 days
  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date()
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const thirtyAgoStr = thirtyAgo.toISOString().split('T')[0]

  const [fromDate, setFromDate] = useState(thirtyAgoStr)
  const [toDate, setToDate] = useState(todayStr)
  const [tank, setTank] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    const result = await tankLogService.getTankHistory(tankId, fromDate, toDate)
    if (result.success && result.data) {
      setTank(result.data.tank)
      setLogs(result.data.logs)
    } else {
      navigate('/tank-logs')
    }
    setLoading(false)
  }, [tankId, fromDate, toDate, navigate])

  useEffect(() => { loadHistory() }, [loadHistory])

  const numClass = "text-right font-mono text-sm"

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tank-logs')} className="btn btn-outline btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{tank?.tank_number || 'Tank'} — History</h1>
            <p className="text-xs text-slate-500">{tank?.material_type || 'No material'} · {tank?.location || 'No location'}</p>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="px-6 pb-4 flex items-center gap-3">
        <div className="form-group" style={{ width: 160 }}>
          <label>From</label>
          <input type="date" value={fromDate} max={toDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ width: 160 }}>
          <label>To</label>
          <input type="date" value={toDate} max={todayStr} onChange={e => setToDate(e.target.value)} />
        </div>
        <button className="btn btn-outline btn-sm mt-4" onClick={loadHistory}><RefreshCw size={14} /> Load</button>
      </div>

      {/* History Table */}
      <div className="px-6 pb-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opening</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Collections</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Closing</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sales</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Net Closing</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No logs for this period</td></tr>
              ) : logs.map(log => {
                const colTotal = (log.collections || []).reduce((s, c) => s + parseFloat(c.collected_quantity || 0), 0)
                const net = parseFloat(log.closing_stock) - parseFloat(log.sales)
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm font-mono text-slate-800">{log.log_date}</td>
                    <td className={`px-4 py-2.5 ${numClass} text-slate-600`}>{parseFloat(log.opening_stock).toFixed(3)}</td>
                    <td className={`px-4 py-2.5 ${numClass} text-emerald-600`}>{colTotal.toFixed(3)}</td>
                    <td className={`px-4 py-2.5 ${numClass} text-slate-600`}>{parseFloat(log.closing_stock).toFixed(3)}</td>
                    <td className={`px-4 py-2.5 ${numClass} text-red-600`}>{parseFloat(log.sales).toFixed(3)}</td>
                    <td className={`px-4 py-2.5 ${numClass} font-bold text-slate-900`}>{net.toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{log.client_type?.replace('_', ' ') || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TankHistoryPage
