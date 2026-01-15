/**
 * CompositeAdjustModal Component
 * Modal for adjusting stock levels of composite material components
 *
 * @module components/CompositeAdjustModal
 */
import React from 'react'
import Modal from '../../../components/ui/Modal'
import { AlertTriangle } from 'lucide-react'

/**
 * @typedef {import('../types/inventory.types').CompositeAdjustData} CompositeAdjustData
 */

/**
 * CompositeAdjustModal component for adjusting composite material component stocks
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal callback
 * @param {CompositeAdjustData} props.adjustData - Composite adjustment data
 * @param {Function} props.onUpdateStock - Update component stock callback (index, newValue)
 * @param {Function} props.onSave - Save all changes callback
 * @param {boolean} props.saving - Saving state
 * @returns {JSX.Element|null}
 */
const CompositeAdjustModal = ({
  isOpen,
  onClose,
  adjustData,
  onUpdateStock,
  onSave,
  saving
}) => {
  if (!isOpen || !adjustData) {
    return null
  }

  const { compositeMaterial, components } = adjustData

  return (
    <Modal
      isOpen={true}
      title={`Adjust Component Stocks - ${compositeMaterial.name}`}
      onClose={onClose}
      size="lg"
    >
      <div className="composite-adjust-modal">
        <div className="composite-info-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>Composite Material</strong>
            <p>This material is composed of multiple components. Adjust each component's stock level below.</p>
          </div>
        </div>

        <div className="composite-summary">
          <div className="summary-item">
            <label>Composite Material</label>
            <span>{compositeMaterial.name}</span>
          </div>
          <div className="summary-item">
            <label>Material Code</label>
            <span>{compositeMaterial.code}</span>
          </div>
        </div>

        <div className="component-stocks">
          <h4>Component Stock Levels</h4>
          <table className="component-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Type</th>
                <th className="text-right">Current Stock</th>
                <th className="text-right">New Stock</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp, index) => (
                <tr key={comp.componentId}>
                  <td>
                    <div className="component-info">
                      <span className="name">{comp.componentName}</span>
                      <span className="code">{comp.componentCode}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`component-type-badge ${comp.componentType}`}>
                      {comp.componentType === 'container' ? 'Container' : 'Content'}
                    </span>
                  </td>
                  <td className="text-right muted">{comp.currentStock} {comp.unit}</td>
                  <td className="text-right">
                    <div className="stock-input">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={comp.newStock}
                        onChange={(e) => onUpdateStock(index, e.target.value)}
                      />
                      <span className="unit">{comp.unit}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CompositeAdjustModal
