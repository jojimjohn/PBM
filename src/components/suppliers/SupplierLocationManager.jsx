/**
 * Supplier Location Manager Component
 *
 * Main page for managing supplier collection locations.
 * Refactored from 686-line monolith to ~150 lines using composition.
 *
 * Architecture:
 * - useSupplierLocations hook: CRUD operations via supplierLocationService
 * - getLocationColumns: Table column definitions
 * - LocationFormModal: Create/edit modal
 */

import React, { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
import DataTable from '../ui/DataTable'
import LocationFormModal from './LocationFormModal'
import { getLocationColumns } from './locationsTableConfig'
import { useSupplierLocations } from '../../modules/oil-trading/hooks/useSupplierLocations'
import '../../modules/oil-trading/styles/Suppliers.css'

/**
 * Supplier Location Manager
 * Displays and manages supplier collection points
 */
const SupplierLocationManager = () => {
  const { t } = useLocalization()

  // Location data and operations from hook
  const {
    locations,
    suppliers,
    regions,
    loading,
    createLocation,
    updateLocation,
    deleteLocation,
    reactivateLocation,
    generateLocationCode
  } = useSupplierLocations()

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [saving, setSaving] = useState(false)

  // Event handlers
  const handleAddLocation = useCallback(() => {
    setSelectedLocation(null)
    setShowModal(true)
  }, [])

  const handleEditLocation = useCallback((location) => {
    setSelectedLocation(location)
    setShowModal(true)
  }, [])

  const handleDeleteLocation = useCallback(async (location) => {
    if (!confirm(t('confirmDelete', 'Are you sure you want to delete this location?'))) {
      return
    }

    const result = await deleteLocation(location.id)
    if (!result.success) {
      alert(result.error || t('errorDeleting', 'Failed to delete location'))
    }
  }, [deleteLocation, t])

  const handleReactivateLocation = useCallback(async (location) => {
    const result = await reactivateLocation(location.id, {
      supplierId: location.supplierId,
      locationName: location.locationName,
      locationCode: location.locationCode,
      address: location.address || '',
      contactPerson: location.contactPerson || '',
      contactPhone: location.contactPhone || '',
      coordinates: location.coordinates || '',
      region_id: location.region_id || undefined,
      notes: location.notes || ''
    })

    if (!result.success) {
      alert(result.error || t('errorReactivating', 'Failed to reactivate location'))
    }
  }, [reactivateLocation, t])

  const handleSaveLocation = useCallback(async (locationData, isEdit, locationId) => {
    setSaving(true)
    try {
      const result = isEdit
        ? await updateLocation(locationId, locationData)
        : await createLocation(locationData)

      if (result.success) {
        setShowModal(false)
        setSelectedLocation(null)
      } else {
        alert(result.error || t('errorSaving', 'Failed to save location'))
      }
    } finally {
      setSaving(false)
    }
  }, [createLocation, updateLocation, t])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setSelectedLocation(null)
  }, [])

  // Table columns
  const columns = getLocationColumns({
    t,
    onEdit: handleEditLocation,
    onDelete: handleDeleteLocation,
    onReactivate: handleReactivateLocation
  })

  return (
    <div className="supplier-locations-page">
      {/* Data Table */}
      <div className="locations-table-container">
        <DataTable
          data={locations}
          columns={columns}
          title={t('supplierLocations', 'Supplier Locations')}
          subtitle={`${t('manageCollectionPointsSubtitle', 'View and manage all supplier collection points')} - ${locations.length} ${t('locations', 'locations')}`}
          headerActions={
            <button className="btn btn-primary" onClick={handleAddLocation}>
              <Plus size={16} />
              {t('addLocation', 'Add Location')}
            </button>
          }
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          onRowClick={handleEditLocation}
          emptyMessage={t('noLocationsFound', 'No supplier locations found')}
          className="locations-table"
          initialPageSize={10}
        />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <LocationFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveLocation}
          location={selectedLocation}
          suppliers={suppliers}
          regions={regions}
          generateLocationCode={generateLocationCode}
          loading={saving}
          t={t}
        />
      )}
    </div>
  )
}

export default SupplierLocationManager
