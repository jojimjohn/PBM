import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useLocalization } from '../../context/LocalizationContext'
import vehicleExpenseSheetService from '../../services/vehicleExpenseSheetService'
import DataTable from '../../components/ui/DataTable'
import showToast from '../../components/ui/Toast'
import { Plus, RefreshCw, Eye } from 'lucide-react'

const STATUS_BADGE = {
  open: 'badge badge-info',
  submitted: 'badge badge-pending',
  approved: 'badge badge-active',
  closed: 'badge badge-neutral'
}

const ExpenseSheetsPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { t } = useLocalization()
  const canManage = hasPermission('MANAGE_EXPENSE_SHEETS')

  const [sheets, setSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadSheets = useCallback(async () => {
    setLoading(true)
    const result = await vehicleExpenseSheetService.getAll({ limit: 100 })
    if (result.success) setSheets(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadSheets() }, [loadSheets])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadSheets()
    setIsRefreshing(false)
  }, [loadSheets])

  const columns = [
    {
      key: 'sheet_date', header: 'Date', sortable: true, width: '110px',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'vehicle_plate', header: 'Vehicle', sortable: true,
      render: (value, row) => (
        <div>
          <span className="font-mono font-bold text-sm">{value}</span>
          {row?.vehicle_make && <span className="text-xs text-slate-400 ml-2">{row.vehicle_make} {row.vehicle_model || ''}</span>}
        </div>
      )
    },
    {
      key: 'driver_name', header: 'Driver', sortable: true,
      render: (value) => value || '—'
    },
    {
      key: 'advance_given', header: 'Advance', sortable: true,
      render: (value) => <span className="font-mono text-sm">{parseFloat(value || 0).toFixed(3)}</span>
    },
    {
      key: 'total_expenses', header: 'Expenses', sortable: true,
      render: (value) => <span className="font-mono text-sm text-red-600">{parseFloat(value || 0).toFixed(3)}</span>
    },
    {
      key: 'closing_balance', header: 'Balance', sortable: true,
      render: (value) => {
        const bal = parseFloat(value || 0)
        return <span className={`font-mono text-sm font-bold ${bal < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{bal.toFixed(3)}</span>
      }
    },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (value) => <span className={STATUS_BADGE[value] || 'badge'}>{value?.toUpperCase()}</span>
    },
    {
      key: 'actions', header: '', width: '60px',
      render: (value, row) => (
        <button className="btn-icon" onClick={e => { e.stopPropagation(); navigate(`/expense-sheets/${row.id}`) }} title="View/Edit">
          <Eye size={14} />
        </button>
      )
    }
  ]

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      <div className="p-6">
        <DataTable
          data={sheets} columns={columns}
          title={t('expenseSheets', 'Expense Sheets')}
          subtitle={`Daily vehicle expense tracking — ${sheets.length} sheets`}
          headerActions={
            <div className="flex items-center gap-2">
              <button className="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              {canManage && (
                <button className="btn btn-primary" onClick={() => navigate('/expense-sheets/new')}>
                  <Plus size={16} /> New Sheet
                </button>
              )}
            </div>
          }
          loading={loading} searchable sortable paginated filterable
          onRowClick={row => navigate(`/expense-sheets/${row.id}`)}
          emptyMessage="No expense sheets found" initialPageSize={15} stickyHeader
        />
      </div>
    </div>
  )
}

export default ExpenseSheetsPage
