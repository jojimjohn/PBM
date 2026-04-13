import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useLocalization } from '../../context/LocalizationContext'
import employeeService from '../../services/employeeService'
import DocumentExpiryBadge from './components/DocumentExpiryBadge'
import { Search, UserPlus, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' }
]

const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400',
  inactive: 'bg-amber-500/15 text-amber-400',
  terminated: 'bg-red-500/15 text-red-400'
}

const EmployeesPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { t } = useLocalization()
  const canManage = hasPermission('MANAGE_EMPLOYEES')

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 })

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    const result = await employeeService.getAll({
      search: search || undefined,
      status: statusFilter || undefined,
      page: pagination.page,
      limit: pagination.limit
    })
    if (result.success) {
      setEmployees(result.data)
      if (result.pagination) setPagination(prev => ({ ...prev, ...result.pagination }))
    }
    setLoading(false)
  }, [search, statusFilter, pagination.page, pagination.limit])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPagination(p => ({ ...p, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Employees</h1>
          <p className="text-sm text-gray-400 mt-1">Manage employee records, documents, and assignments</p>
        </div>
        {canManage && (
          <button
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, code, phone, or email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Designation</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No employees found</td></tr>
            ) : (
              employees.map(emp => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-white/3 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{emp.full_name}</p>
                      <p className="text-xs text-gray-500">{emp.employee_code}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{emp.designation || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{emp.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-300">{emp.phone || '—'}</div>
                    {emp.email && <div className="text-xs text-gray-500">{emp.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_COLORS[emp.status] || ''}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {emp.employment_start_date || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeesPage
