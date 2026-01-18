/**
 * StockHistoryModal Component
 * Displays stock movement history for a material
 *
 * @module components/StockHistoryModal
 */
import React from 'react'
import Modal from '../../../components/ui/Modal'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

/**
 * @typedef {import('../types/inventory.types').StockMovement} StockMovement
 * @typedef {import('../types/inventory.types').Material} Material
 */

/**
 * StockHistoryModal component for displaying material movement history
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal callback
 * @param {Material} props.material - Selected material
 * @param {StockMovement[]} props.movements - Movement history
 * @param {boolean} props.loading - Loading state
 * @param {number} props.currentStock - Current stock level
 * @param {string} props.stockStatus - Stock status ('good', 'low', 'critical', 'out-of-stock')
 * @param {Function} props.onAdjustStock - Adjust stock callback
 * @param {Function} props.t - Translation function
 * @param {Function} props.formatDate - Date formatter
 * @returns {JSX.Element|null}
 */
const StockHistoryModal = ({
  isOpen,
  onClose,
  material,
  movements,
  loading,
  currentStock,
  stockStatus,
  onAdjustStock,
  t,
  formatDate
}) => {
  if (!isOpen || !material) {
    return null
  }

  const modalFooter = (
    <>
      <button className="btn btn-outline" onClick={onClose}>
        {t('close')}
      </button>
      <button
        className="btn btn-primary"
        onClick={() => {
          onClose()
          onAdjustStock(material)
        }}
      >
        {t('adjustStock')}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={true}
      title={`Stock History - ${material.name}`}
      onClose={onClose}
      size="lg"
      footer={modalFooter}
    >
      <div className="history-summary">
        <div className="summary-item">
          <label>Material Code</label>
          <span>{material.code}</span>
        </div>
        <div className="summary-item">
          <label>Current Stock</label>
          <span className="stock-value">
            {currentStock} {material.unit}
          </span>
        </div>
        <div className="summary-item">
          <label>Status</label>
          <span className={`status-badge ${stockStatus}`}>
            {stockStatus}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>{t('loading')}</p>
        </div>
      ) : movements.length > 0 ? (
        <div className="movements-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>{t('type')}</th>
                <th className="text-right">{t('quantity')}</th>
                <th className="text-right">Balance</th>
                <th>{t('reason')}</th>
                <th>{t('reference')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement, index) => (
                <tr key={movement.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                  <td>
                    <span className={`movement-type-badge ${movement.type}`}>
                      {movement.type === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {movement.type === 'in' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className={`text-right quantity ${movement.type}`}>
                    {movement.type === 'in' ? '+' : '-'}{movement.quantity} {material.unit}
                  </td>
                  <td className="text-right balance">
                    {movement.runningBalance !== undefined
                      ? `${movement.runningBalance.toFixed(2)} ${material.unit}`
                      : '-'}
                  </td>
                  <td className="reason">{movement.reason || '-'}</td>
                  <td>
                    {movement.reference ? <code className="reference-code">{movement.reference}</code> : '-'}
                  </td>
                  <td className="date">{movement.date ? formatDate(new Date(movement.date)) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Clock size={48} />
          <p>{t('noMovementsFound')}</p>
        </div>
      )}
    </Modal>
  )
}

export default StockHistoryModal
