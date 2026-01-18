/**
 * BatchDetailsModal Component
 * Displays inventory batch details for a material
 *
 * @module components/BatchDetailsModal
 */
import React from 'react'
import Modal from '../../../components/ui/Modal'
import { Layers } from 'lucide-react'

/**
 * @typedef {import('../types/inventory.types').InventoryBatch} InventoryBatch
 * @typedef {import('../types/inventory.types').Material} Material
 */

/**
 * BatchDetailsModal component for displaying FIFO batch information
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.batchData - Batch data object
 * @param {Material} props.batchData.material - The material
 * @param {InventoryBatch[]} props.batchData.batches - Batch records
 * @param {number} props.batchData.totalStock - Total stock across batches
 * @param {string} props.batchData.unit - Unit of measurement
 * @returns {JSX.Element|null}
 */
const BatchDetailsModal = ({
  isOpen,
  onClose,
  batchData
}) => {
  if (!isOpen || !batchData) {
    return null
  }

  const { material, batches, totalStock, unit } = batchData

  // Calculate total value across all batches
  const totalValue = batches.reduce((sum, b) =>
    sum + (parseFloat(b.quantity || b.currentStock || 0) * parseFloat(b.averageCost || b.lastPurchasePrice || 0)), 0
  )

  const modalFooter = (
    <button className="btn btn-outline" onClick={onClose}>
      Close
    </button>
  )

  return (
    <Modal
      isOpen={true}
      title={`Inventory Batches - ${material.name}`}
      onClose={onClose}
      size="lg"
      footer={modalFooter}
    >
      <div className="batch-summary">
        <div className="summary-item">
          <label>Material Code</label>
          <span>{material.code}</span>
        </div>
        <div className="summary-item">
          <label>Total Stock</label>
          <span className="stock-value">
            {totalStock} {unit}
          </span>
        </div>
        <div className="summary-item">
          <label>Batches</label>
          <span>{batches.length}</span>
        </div>
      </div>

      <div className="batch-table-container">
        <table className="batch-table">
          <thead>
            <tr>
              <th>Batch Number</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Cost/Unit</th>
              <th className="text-right">Total Value</th>
              <th>Location</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch, index) => {
              const quantity = parseFloat(batch.quantity || batch.currentStock || 0)
              const costPerUnit = parseFloat(batch.averageCost || batch.lastPurchasePrice || 0)
              const batchValue = quantity * costPerUnit

              return (
                <tr key={batch.id || index} className={index % 2 === 0 ? 'even' : 'odd'}>
                  <td><code className="batch-code">{batch.batchNumber || 'N/A'}</code></td>
                  <td className="text-right">{quantity.toFixed(2)} {unit}</td>
                  <td className="text-right">OMR {costPerUnit.toFixed(3)}</td>
                  <td className="text-right">OMR {batchValue.toFixed(3)}</td>
                  <td className="location">{batch.location || 'Main Warehouse'}</td>
                  <td className="notes">{batch.notes || '-'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="text-right">{totalStock} {unit}</td>
              <td></td>
              <td className="text-right">OMR {totalValue.toFixed(3)}</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {batches.length === 0 && (
        <div className="empty-state">
          <Layers size={48} />
          <p>No batch records found for this material.</p>
        </div>
      )}
    </Modal>
  )
}

export default BatchDetailsModal
