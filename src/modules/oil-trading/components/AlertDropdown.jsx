/**
 * AlertDropdown Component
 * Displays stock alerts in a dropdown menu
 *
 * @module components/AlertDropdown
 */
import React from 'react'
import { AlertTriangle, ChevronDown, X, ShoppingCart } from 'lucide-react'

/**
 * @typedef {import('../types/inventory.types').StockAlert} StockAlert
 */

/**
 * AlertDropdown component for displaying stock alerts
 *
 * @param {Object} props
 * @param {StockAlert[]} props.alerts - Array of stock alerts
 * @param {number} props.criticalAlerts - Count of critical alerts
 * @param {boolean} props.isOpen - Whether dropdown is open
 * @param {Function} props.onToggle - Toggle dropdown callback
 * @param {Function} props.onClose - Close dropdown callback
 * @param {Function} props.onCreatePurchaseOrder - Create PO callback (receives alert id)
 * @returns {JSX.Element|null}
 */
const AlertDropdown = ({
  alerts,
  criticalAlerts,
  isOpen,
  onToggle,
  onClose,
  onCreatePurchaseOrder
}) => {
  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="alert-dropdown-container">
      <button
        className={`btn btn-outline alert-trigger ${criticalAlerts > 0 ? 'has-critical' : ''}`}
        onClick={onToggle}
      >
        <AlertTriangle size={16} />
        <span>{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</span>
        {criticalAlerts > 0 && <span className="critical-badge">{criticalAlerts}</span>}
        <ChevronDown size={14} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="alert-dropdown">
          <div className="alert-dropdown-header">
            <span>Stock Alerts</span>
            <button className="close-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
          <div className="alert-dropdown-list">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`alert-dropdown-item ${alert.severity}`}>
                <div className="alert-item-content">
                  <span className={`alert-severity-dot ${alert.severity}`}></span>
                  <div className="alert-item-info">
                    <span className="alert-item-material">{alert.material}</span>
                    <span className="alert-item-stock">
                      {alert.currentStock} / {alert.reorderLevel} {alert.unit}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    onCreatePurchaseOrder(alert.id)
                    onClose()
                  }}
                >
                  <ShoppingCart size={12} />
                </button>
              </div>
            ))}
          </div>
          {alerts.length > 5 && (
            <div className="alert-dropdown-footer">
              <span className="more-alerts">+{alerts.length - 5} more alerts</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AlertDropdown
