/**
 * Contract Rates Table Component
 *
 * Displays material rates for a contract with calculated savings.
 * Reusable in both view and edit contexts.
 */

import React from 'react'
import { calculateActualRate, calculateSavings } from '../../hooks/useContractRates'
import { CONTRACT_RATE_TYPES } from '../../types/customer.types'

/**
 * Rate type badge with appropriate styling
 */
const RateTypeBadge = ({ type }) => {
  const labels = {
    [CONTRACT_RATE_TYPES.FIXED_RATE]: 'Fixed Rate',
    [CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE]: 'Discount %',
    [CONTRACT_RATE_TYPES.MINIMUM_PRICE_GUARANTEE]: 'Min Price Guarantee'
  }

  return (
    <span className={`rate-type-badge ${type}`}>
      {labels[type] || type}
    </span>
  )
}

/**
 * Discount badge with color based on savings amount
 */
const DiscountBadge = ({ savings }) => {
  const savingsNum = parseFloat(savings)
  const level = savingsNum >= 10 ? 'high' : savingsNum >= 5 ? 'medium' : 'low'

  return (
    <div className={`discount-badge ${level}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
      {savings}%
    </div>
  )
}

/**
 * Contract rates table for viewing
 *
 * @param {Object} props
 * @param {Array} props.materialsWithRates - Materials with rate calculations
 * @param {number} props.totalCount - Total count of rated materials
 */
export const ContractRatesTable = ({ materialsWithRates, totalCount }) => {
  if (!materialsWithRates || materialsWithRates.length === 0) {
    return <EmptyRatesState />
  }

  return (
    <div className="rates-section">
      <table className="rates-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Standard Rate</th>
            <th>Contract Rate</th>
            <th>Discount</th>
          </tr>
        </thead>
        <tbody>
          {materialsWithRates.map(material => (
            <tr key={material.id}>
              <td>
                <div className="material-info">
                  <span className="material-name">{material.name}</span>
                  <span className="material-unit">per {material.unit}</span>
                </div>
              </td>
              <td className="rate-cell standard">
                <span className="currency">OMR</span>
                <span className="amount">{material.standardRate.toFixed(3)}</span>
              </td>
              <td className="rate-cell contract">
                <span className="currency">OMR</span>
                <span className="amount">{material.actualRate.toFixed(3)}</span>
              </td>
              <td className="discount-cell">
                <DiscountBadge savings={material.savings} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="rates-summary">
              <div className="summary-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <path d="M12 18V6" />
                </svg>
                <span>{totalCount} materials with special pricing</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * Empty state when no rates are configured
 */
export const EmptyRatesState = () => (
  <div className="empty-rates">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
    <h3>No Special Rates Configured</h3>
    <p>This contract doesn't have any special material rates. Standard pricing will apply.</p>
  </div>
)

/**
 * Editable rates table for contract form
 *
 * @param {Object} props
 * @param {Array} props.contractMaterials - Materials with current rates
 * @param {Function} props.updateRate - Function to update a rate field
 * @param {Function} props.removeMaterialRate - Function to remove a material rate
 */
export const EditableRatesTable = ({
  contractMaterials,
  updateRate,
  removeMaterialRate
}) => {
  if (contractMaterials.length === 0) {
    return (
      <div className="empty-rates">
        <p>No material rates configured. Use the dropdown above to add rates.</p>
      </div>
    )
  }

  return (
    <div className="rates-editor">
      {contractMaterials.map(({ id, name, rateInfo }) => (
        <RateEditorItem
          key={id}
          materialId={id}
          materialName={name}
          rateInfo={rateInfo}
          updateRate={updateRate}
          onRemove={() => removeMaterialRate(id)}
        />
      ))}
    </div>
  )
}

/**
 * Individual rate editor item
 */
const RateEditorItem = ({ materialId, materialName, rateInfo, updateRate, onRemove }) => {
  const rateField = rateInfo.type === CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE
    ? 'discountPercentage'
    : 'contractRate'

  const rateLabel = rateInfo.type === CONTRACT_RATE_TYPES.FIXED_RATE
    ? 'Contract Rate (OMR)'
    : rateInfo.type === CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE
      ? 'Discount (%)'
      : 'Maximum Rate (OMR)'

  return (
    <div className="rate-item">
      <div className="rate-header">
        <h4>{materialName}</h4>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label>Rate Type</label>
          <select
            value={rateInfo.type}
            onChange={(e) => updateRate(materialId, 'type', e.target.value)}
          >
            <option value={CONTRACT_RATE_TYPES.FIXED_RATE}>Fixed Rate</option>
            <option value={CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE}>Discount Percentage</option>
            <option value={CONTRACT_RATE_TYPES.MINIMUM_PRICE_GUARANTEE}>Minimum Price Guarantee</option>
          </select>
        </div>
        <div className="form-group">
          <label>{rateLabel}</label>
          <input
            type="number"
            step="0.001"
            value={rateInfo[rateField] || 0}
            onChange={(e) => updateRate(materialId, rateField, parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group full-width">
          <label>Description</label>
          <input
            type="text"
            value={rateInfo.description || ''}
            onChange={(e) => updateRate(materialId, 'description', e.target.value)}
            placeholder="Rate description..."
          />
        </div>
      </div>
    </div>
  )
}

export default ContractRatesTable
