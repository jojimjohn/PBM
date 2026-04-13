import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useLocalization } from '../../context/LocalizationContext'
import vehicleService from '../../services/vehicleService'
import vehicleTypeService from '../../services/vehicleTypeService'
import DataTable from '../../components/ui/DataTable'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import showToast from '../../components/ui/Toast'
import VehicleFormModal from './components/VehicleFormModal'
import { Plus, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react'

const STATUS_BADGE = {
  active: 'badge badge-active',
  inactive: 'badge badge-error',
  under_maintenance: 'badge badge-pending'
}

const STATUS_LABEL = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  under_maintenance: 'MAINTENANCE'
}

const VehiclesPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { t } = useLocalization()
  const canManage = hasPermission('MANAGE_VEHICLES')

  const [vehicles, setVehicles] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, vehicleId: null })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [vResult, vtResult] = await Promise.all([
      vehicleService.getAll(),
      vehicleTypeService.getAll()
    ])
    if (vResult.success) setVehicles(vResult.data)
    if (vtResult.success) setVehicleTypes(vtResult.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }, [loadData])

  const handleSave = useCallback(async (formData) => {
    setSaving(true)
    const result = selectedVehicle
      ? await vehicleService.update(selectedVehicle.id, formData)
      : await vehicleService.create(formData)
    if (result.success) {
      showToast.success(selectedVehicle ? 'Vehicle updated' : 'Vehicle created')
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedVehicle(null)
      loadData()
    } else {
      showToast.error(result.error || 'Failed to save')
    }
    setSaving(false)
  }, [selectedVehicle, loadData])

  const handleDelete = useCallback(async () => {
    if (!confirmDialog.vehicleId) return
    const result = await vehicleService.delete(confirmDialog.vehicleId)
    if (result.success) { showToast.success('Vehicle deactivated'); loadData() }
    else showToast.error(result.error || 'Failed to deactivate')
    setConfirmDialog({ isOpen: false, vehicleId: null })
  }, [confirmDialog.vehicleId, loadData])

  const columns = [
    {
      key: 'vehicle_plate', label: 'Plate', sortable: true, width: '120px',
      render: (row) => <span className="font-mono font-bold text-sm">{row.vehicle_plate}</span>
    },
    {
      key: 'vehicle_type_name', label: 'Type', sortable: true,
      render: (row) => row.vehicle_type_name || '—'
    },
    {
      key: 'make', label: 'Make / Model', sortable: true,
      render: (row) => [row.make, row.model].filter(Boolean).join(' ') || '—'
    },
    {
      key: 'year', label: 'Year', sortable: true, width: '80px',
      render: (row) => row.year || '—'
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (row) => <span className={STATUS_BADGE[row.status] || 'badge'}>{STATUS_LABEL[row.status] || row.status}</span>
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button className="btn-icon" onClick={e => { e.stopPropagation(); navigate(`/vehicles/${row.id}`) }} title="Details"><Eye size={14} /></button>
          {canManage && <button className="btn-icon" onClick={e => { e.stopPropagation(); setSelectedVehicle(row); setShowEditModal(true) }} title="Edit"><Edit size={14} /></button>}
          {canManage && row.status !== 'inactive' && (
            <button className="btn-icon text-red-500" onClick={e => { e.stopPropagation(); setConfirmDialog({ isOpen: true, vehicleId: row.id }) }} title="Deactivate"><Trash2 size={14} /></button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      <div className="p-6">
        <DataTable
          data={vehicles} columns={columns}
          title={t('vehicles', 'Vehicles')}
          subtitle={`Manage company fleet — ${vehicles.length} vehicles`}
          headerActions={
            <div className="flex items-center gap-2">
              <button className="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing} title="Refresh">
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              {canManage && (
                <button className="btn btn-primary" onClick={() => { setSelectedVehicle(null); setShowAddModal(true) }}>
                  <Plus size={16} /> Add Vehicle
                </button>
              )}
            </div>
          }
          loading={loading} searchable sortable paginated filterable
          onRowClick={row => navigate(`/vehicles/${row.id}`)}
          emptyMessage="No vehicles found" initialPageSize={10} stickyHeader
        />
      </div>

      {showAddModal && <VehicleFormModal isOpen onClose={() => setShowAddModal(false)} onSave={handleSave} vehicleTypes={vehicleTypes} loading={saving} />}
      {showEditModal && selectedVehicle && <VehicleFormModal isOpen onClose={() => { setShowEditModal(false); setSelectedVehicle(null) }} onSave={handleSave} vehicle={selectedVehicle} vehicleTypes={vehicleTypes} loading={saving} />}
      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, vehicleId: null })} onConfirm={handleDelete} title="Deactivate Vehicle" message="Set this vehicle to inactive?" confirmText="Deactivate" type="danger" />
    </div>
  )
}

export default VehiclesPage
