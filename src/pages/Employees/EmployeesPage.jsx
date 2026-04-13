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
import { Plus, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react'

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

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, employeeId: null })

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    const result = await employeeService.getAll({ limit: 200 })
    if (result.success) setEmployees(Array.isArray(result.data) ? result.data.filter(Boolean) : [])
    setLoading(false)
  }, [])

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
      label: 'Code',
      sortable: true,
      width: '100px',
      render: (row) => row ? <span className="font-mono text-xs">{row.employee_code}</span> : null
    },
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (row) => row ? <span className="font-medium">{row.full_name}</span> : null
    },
    {
      key: 'designation',
      label: 'Designation',
      sortable: true,
      render: (row) => row?.designation || '—'
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (row) => row?.department || '—'
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (row) => row ? (
        <div>
          <div>{row.phone || '—'}</div>
          {row.email && <div className="text-xs text-slate-400">{row.email}</div>}
        </div>
      ) : '—'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => row ? (
        <span className={STATUS_BADGE[row.status] || 'badge'}>
          {row.status?.toUpperCase()}
        </span>
      ) : null
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (row) => !row ? null : (
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
