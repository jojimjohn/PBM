import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../../services/dashboardService'
import { Banknote, Receipt, Clock, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

const formatOMR = (n) => `OMR ${parseFloat(n || 0).toFixed(3)}`

const AccountantDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await dashboardService.getAccountant()
    if (result.success) setData(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-slate-500">Loading accountant dashboard...</div>
  if (!data) return <div className="p-8 text-slate-500">No data available</div>

  const { receivables, vat, pendingApprovals, todayCashFlow } = data

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accountant Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Receivables · VAT · pending approvals · cash flow</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-slate-200 bg-white rounded-xl p-5 cursor-pointer hover:shadow" onClick={() => navigate('/reports')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Receivables</div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">{formatOMR(receivables.total)}</div>
          <div className="mt-1 text-xs text-slate-400">All unpaid invoices</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-5 cursor-pointer hover:shadow" onClick={() => navigate('/reports')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">MTD Output VAT</div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">{formatOMR(vat.mtdOutputVat)}</div>
          <div className="mt-1 text-xs text-slate-400">From sales</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-5 cursor-pointer hover:shadow" onClick={() => navigate('/reports')}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">MTD Input VAT</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-700">{formatOMR(vat.mtdInputVat)}</div>
          <div className="mt-1 text-xs text-slate-400">From purchases</div>
        </div>
        <div className="border border-slate-200 bg-white rounded-xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Net VAT Payable</div>
          <div className={`mt-2 text-2xl font-bold font-mono ${vat.mtdNetVat >= 0 ? 'text-purple-700' : 'text-emerald-700'}`}>
            {formatOMR(Math.abs(vat.mtdNetVat))}
          </div>
          <div className="mt-1 text-xs text-slate-400">{vat.mtdNetVat >= 0 ? 'We owe' : 'Refund'}</div>
        </div>
      </div>

      {/* Receivables Aging Buckets */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Receivables Aging</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/reports')}>View Full Report</button>
        </div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-slate-200">
          <div className="p-5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">0-30 days</div>
            <div className="mt-2 text-xl font-bold font-mono">{formatOMR(receivables.buckets.current)}</div>
          </div>
          <div className="p-5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">31-60 days</div>
            <div className="mt-2 text-xl font-bold font-mono">{formatOMR(receivables.buckets.bucket_31_60)}</div>
          </div>
          <div className="p-5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600">61-90 days</div>
            <div className="mt-2 text-xl font-bold font-mono">{formatOMR(receivables.buckets.bucket_61_90)}</div>
          </div>
          <div className="p-5 text-center bg-red-50">
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-600">90+ days</div>
            <div className="mt-2 text-xl font-bold font-mono text-red-700">{formatOMR(receivables.buckets.bucket_90_plus)}</div>
          </div>
        </div>
      </div>

      {/* Overdue list + Pending approvals + Today's cash flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue invoices list */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-700">Most Overdue (90+ days)</h3>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          {receivables.overdueList.length === 0 ? (
            <div className="px-6 py-6 text-center text-sm text-slate-400">No overdue invoices 🎉</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {receivables.overdueList.map(o => (
                  <tr key={o.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3">
                      <div className="font-mono text-xs">{o.orderNumber}</div>
                      <div className="text-xs text-slate-500">{o.customerName || 'Unknown'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600 text-right">{o.ageDays} days</td>
                    <td className="px-6 py-3 font-mono font-bold text-right">{formatOMR(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pending approvals + Today's cash flow */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-6 py-3 border-b border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Pending Your Approval</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => navigate('/petty-cash')}>
                <span className="text-sm">Petty Cash Expenses</span>
                <span className="font-mono font-bold text-blue-700">{pendingApprovals.pettyCash}</span>
              </div>
              <div className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => navigate('/expense-sheets')}>
                <span className="text-sm">Vehicle Expense Sheets</span>
                <span className="font-mono font-bold text-purple-700">{pendingApprovals.expenseSheets}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-6 py-3 border-b border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Today's Cash Flow</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-emerald-700"><TrendingUp size={14} /> Receipts</span>
                <span className="font-mono font-bold">{formatOMR(todayCashFlow.receipts)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-red-600"><TrendingDown size={14} /> Payments</span>
                <span className="font-mono font-bold">({formatOMR(todayCashFlow.payments)})</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm font-bold">Net</span>
                <span className={`font-mono font-bold ${todayCashFlow.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatOMR(todayCashFlow.net)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountantDashboard
