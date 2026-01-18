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
    <div className="relative">
      <button
        className={`btn btn-outline flex items-center gap-2 ${
          criticalAlerts > 0
            ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
            : ''
        }`}
        onClick={onToggle}
      >
        <AlertTriangle size={16} />
        <span>{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</span>
        {criticalAlerts > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-[11px] font-bold rounded-full">
            {criticalAlerts}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-md:w-72 max-md:-right-12">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="font-semibold text-sm text-slate-700">Stock Alerts</span>
            <button
              className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 ${
                  alert.severity === 'critical' ? 'bg-red-50' :
                  alert.severity === 'warning' ? 'bg-amber-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate">{alert.material}</span>
                    <span className="text-xs text-slate-500">
                      {alert.currentStock} / {alert.reorderLevel} {alert.unit}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-primary shrink-0"
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
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">+{alerts.length - 5} more alerts</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AlertDropdown
