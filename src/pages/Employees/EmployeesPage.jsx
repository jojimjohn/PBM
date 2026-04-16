import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useLocalization } from '../../context/LocalizationContext'
import employeeService from '../../services/employeeService'
import DataTable from '../../components/ui/DataTable'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import showToast from '../../components/ui/Toast'
import EmployeeFormModal from './components/EmployeeFormModal'
import DocumentExpiryBadge from './components/DocumentExpiryBadge'
import { Plus, RefreshCw, Eye, Edit, Trash2, MapPin } from 'lucide-react'

const STATUS_BADGE = {
  active: 'badge badge-active',
  inactive: 'badge badge-pending',
  terminated: 'badge badge-error'
}

const EmployeesPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { t } = useLocalization()
  const canManage = hasPermission('MANAGE_EMPLOYEES')
  const canDelete = hasPermission('DELETE_EMPLOYEES')

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [managersOnly, setManagersOnly] = useState(false)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, employeeId: null })

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    const params = { limit: 200 }
    if (managersOnly) params.is_manager = true
    const result = await employeeService.getAll(params)
    if (result.success) setEmployees(Array.isArray(result.data) ? result.data.filter(Boolean) : [])
    setLoading(false)
  }, [managersOnly])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadEmployees()
    setIsRefreshing(false)
  }, [loadEmployees])

  const handleSave = useCallback(async (formData) => {
    setSaving(true)
    const result = selectedEmployee
      ? await employeeService.update(selectedEmployee.id, formData)
      : await employeeService.create(formData)

    if (result.success) {
      showToast.success(selectedEmployee ? 'Employee updated' : 'Employee created')
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedEmployee(null)
      loadEmployees()
    } else {
      showToast.error(result.error || 'Failed to save employee')
    }
    setSaving(false)
  }, [selectedEmployee, loadEmployees])

  const handleDelete = useCallback(async () => {
    if (!confirmDialog.employeeId) return
    const result = await employeeService.delete(confirmDialog.employeeId)
    if (result.success) {
      showToast.success('Employee deactivated')
      loadEmployees()
    } else {
      showToast.error(result.error || 'Failed to deactivate')
    }
    setConfirmDialog({ isOpen: false, employeeId: null })
  }, [confirmDialog.employeeId, loadEmployees])

  // Table columns
  const columns = [
    {
      key: 'employee_code',
      header: 'Code',
      sortable: true,
      width: '100px',
      render: (value) => <span className="font-mono text-xs">{value}</span>
    },
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true,
      render: (value) => value || '—'
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (value) => value || '—'
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (value, row) => (
        <div>
          <div>{value || '—'}</div>
          {row?.email && <div className="text-xs text-slate-400">{row.email}</div>}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <span className={STATUS_BADGE[value] || 'badge'}>
          {value?.toUpperCase()}
        </span>
      )
    },
    {
      key: 'in_charge_count',
      header: 'Managing',
      sortable: true,
      width: '110px',
      render: (value) => {
        const count = parseInt(value) || 0
        if (count === 0) return <span className="text-xs text-slate-400">—</span>
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
            <MapPin size={10} />
            {count} location{count > 1 ? 's' : ''}
          </span>
        )
      }
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (value, row) => !row ? null : (
        <div className="flex items-center gap-1">
          <button
            className="btn-icon"
            onClick={(e) => { e.stopPropagation(); navigate(`/employees/${row.id}`) }}
            title="View details"
          >
            <Eye size={14} />
          </button>
          {canManage && (
            <button
              className="btn-icon"
              onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row); setShowEditModal(true) }}
              title="Edit"
            >
              <Edit size={14} />
            </button>
          )}
          {canDelete && row.status !== 'terminated' && (
            <button
              className="btn-icon text-red-500"
              onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, employeeId: row.id }) }}
              title="Deactivate"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      <div className="p-6">
        <DataTable
          data={employees}
          columns={columns}
          title={t('employees', 'Employees')}
          subtitle={`Manage employee records, documents, and assignments — ${employees.length} employees`}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                className={`btn btn-sm ${managersOnly ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setManagersOnly(m => !m)}
                title="Show only employees who are in charge of at least one location"
              >
                <MapPin size={14} />
                {managersOnly ? 'Managers Only' : 'All Employees'}
              </button>
              <button
                className="btn btn-outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              {canManage && (
                <button className="btn btn-primary" onClick={() => { setSelectedEmployee(null); setShowAddModal(true) }}>
                  <Plus size={16} />
                  Add Employee
                </button>
              )}
            </div>
          }
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
          emptyMessage="No employees found"
          initialPageSize={10}
          stickyHeader={true}
        />
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <EmployeeFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
          employee={null}
          loading={saving}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EmployeeFormModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedEmployee(null) }}
          onSave={handleSave}
          employee={selectedEmployee}
          loading={saving}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, employeeId: null })}
        onConfirm={handleDelete}
        title="Deactivate Employee"
        message="This will set the employee status to terminated. This action can be reversed by editing the employee."
        confirmText="Deactivate"
        type="danger"
      />
    </div>
  )
}

export default EmployeesPage
