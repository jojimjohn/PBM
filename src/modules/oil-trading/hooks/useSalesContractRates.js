/**
 * useSalesContractRates Hook
 *
 * Manages contract rate calculations specifically for sales order forms.
 * Handles rate lookups, validity checking, and rate override workflows.
 *
 * Different from useContractRates which is for viewing/editing contracts.
 *
 * @module hooks/useSalesContractRates
 */

import { useState, useCallback, useMemo } from 'react'

/**
 * @typedef {import('../types/sales.types').ContractRate} ContractRate
 * @typedef {import('../types/sales.types').EffectiveRateResult} EffectiveRateResult
 */

/**
 * Contract rate types supported by the system
 */
export const CONTRACT_RATE_TYPES = {
  FIXED_RATE: 'fixed_rate',
  DISCOUNT_PERCENTAGE: 'discount_percentage',
  MINIMUM_PRICE_GUARANTEE: 'minimum_price_guarantee'
}

/**
 * Warning types for rate-related notifications
 */
export const RATE_WARNING_TYPES = {
  CONTRACT_EXPIRED: 'contract_expired',
  RATE_APPLIED: 'contract_rate_applied',
  RATE_ABOVE_MARKET: 'contract_rate_above_market',
  RATE_OVERRIDE: 'rate_override_applied'
}

/**
 * Hook for managing contract rates in sales order forms
 *
 * @param {Object} options - Configuration options
 * @param {Array} options.customers - Available customers with contract details
 * @param {Array} options.materials - Available materials with standard prices
 * @returns {Object} Contract rate state and operations
 */
export const useSalesContractRates = ({ customers = [], materials = [] }) => {
  const [contractRates, setContractRates] = useState({})
  const [warnings, setWarnings] = useState([])
  const [overrideRequests, setOverrideRequests] = useState({})
  const [currentCustomerId, setCurrentCustomerId] = useState(null)

  /**
   * Load contract rates for a customer
   */
  const loadContractRates = useCallback((customerId) => {
    if (!customerId) {
      setContractRates({})
      setWarnings([])
      setCurrentCustomerId(null)
      return null
    }

    setCurrentCustomerId(customerId)
    const customer = customers.find(c => c.id === customerId)

    if (!customer?.contractDetails?.rates) {
      setContractRates({})
      return null
    }

    const contract = customer.contractDetails
    setContractRates(contract.rates)

    // Check overall contract validity
    const today = new Date()
    const endDate = new Date(contract.endDate)

    if (endDate < today) {
      setWarnings([{
        type: RATE_WARNING_TYPES.CONTRACT_EXPIRED,
        message: `Customer contract expired on ${contract.endDate}. Standard rates will apply.`
      }])
    } else {
      setWarnings([])
    }

    return contract
  }, [customers])

  /**
   * Check if a material's contract rate is active
   */
  const isContractActive = useCallback((materialId) => {
    const contractInfo = contractRates[materialId]
    if (!contractInfo) return false

    // Check individual rate expiry if available
    if (typeof contractInfo === 'object' && contractInfo.endDate) {
      const today = new Date()
      const endDate = new Date(contractInfo.endDate)
      return endDate >= today && contractInfo.status === 'active'
    }

    // Legacy contracts without expiry are considered active
    return true
  }, [contractRates])

  /**
   * Check if material has any contract rate (active or expired)
   */
  const hasContractRate = useCallback((materialId) => {
    return !!contractRates[materialId]
  }, [contractRates])

  /**
   * Calculate effective rate for a material based on contract type
   * @returns {EffectiveRateResult}
   */
  const getEffectiveRate = useCallback((materialId, customMarketPrice = null) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) {
      return {
        effectiveRate: 0,
        marketPrice: 0,
        isContractRate: false,
        isExpired: false
      }
    }

    const standardPrice = customMarketPrice ?? material.standardPrice ?? 0
    const contractInfo = contractRates[materialId]
    const isActive = isContractActive(materialId)

    // No contract or expired contract - use market price
    if (!contractInfo || !isActive) {
      return {
        effectiveRate: standardPrice,
        marketPrice: standardPrice,
        contractRate: contractInfo?.contractRate || null,
        rateType: null,
        savings: 0,
        isContractRate: false,
        isExpired: !!contractInfo && !isActive,
        expiryDate: contractInfo?.endDate || null
      }
    }

    // Calculate rate based on contract type
    let effectiveRate = standardPrice
    let rateType = null

    if (typeof contractInfo === 'object') {
      rateType = contractInfo.type

      switch (contractInfo.type) {
        case CONTRACT_RATE_TYPES.FIXED_RATE:
          effectiveRate = contractInfo.contractRate
          break

        case CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE:
          const discountAmount = (standardPrice * contractInfo.discountPercentage) / 100
          effectiveRate = Math.max(0, standardPrice - discountAmount)
          break

        case CONTRACT_RATE_TYPES.MINIMUM_PRICE_GUARANTEE:
          // Customer gets the lower of market or contract price
          effectiveRate = Math.min(standardPrice, contractInfo.contractRate)
          break

        default:
          effectiveRate = contractInfo.contractRate || standardPrice
      }
    } else {
      // Legacy: simple number (fixed rate)
      effectiveRate = contractInfo
      rateType = CONTRACT_RATE_TYPES.FIXED_RATE
    }

    const savings = standardPrice - effectiveRate

    return {
      effectiveRate,
      marketPrice: standardPrice,
      contractRate: typeof contractInfo === 'object' ? contractInfo.contractRate : contractInfo,
      rateType,
      savings: Math.max(0, savings),
      isContractRate: true,
      isExpired: false,
      expiryDate: contractInfo?.endDate || null,
      discountPercentage: contractInfo?.discountPercentage || null
    }
  }, [contractRates, materials, isContractActive])

  /**
   * Get detailed rate information for UI display
   */
  const getRateDetails = useCallback((materialId) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return null

    const rateResult = getEffectiveRate(materialId)
    const contractInfo = contractRates[materialId]

    if (!contractInfo) {
      return {
        description: `Standard market rate: OMR ${rateResult.marketPrice.toFixed(3)}`,
        hasContract: false,
        isActive: false,
        warningType: null
      }
    }

    const isActive = isContractActive(materialId)

    // Expired contract
    if (!isActive) {
      return {
        description: `Contract EXPIRED on ${contractInfo?.endDate || 'unknown'}. Using standard rate: OMR ${rateResult.marketPrice.toFixed(3)}. Renewal pending.`,
        hasContract: true,
        isActive: false,
        wasExpired: true,
        warningType: RATE_WARNING_TYPES.CONTRACT_EXPIRED
      }
    }

    // Active contract - generate description based on type
    let description = ''
    let warningType = RATE_WARNING_TYPES.RATE_APPLIED

    if (typeof contractInfo === 'object') {
      const expiryInfo = contractInfo.endDate ? ` - Active until ${contractInfo.endDate}` : ''

      switch (contractInfo.type) {
        case CONTRACT_RATE_TYPES.FIXED_RATE: {
          const diff = rateResult.marketPrice - rateResult.effectiveRate
          if (diff > 0) {
            const savingsPercent = ((diff / rateResult.marketPrice) * 100).toFixed(1)
            description = `Fixed contract rate: OMR ${rateResult.effectiveRate.toFixed(3)} (${savingsPercent}% savings vs market OMR ${rateResult.marketPrice.toFixed(3)})${expiryInfo}`
          } else if (diff < 0) {
            const premiumPercent = ((Math.abs(diff) / rateResult.marketPrice) * 100).toFixed(1)
            description = `Fixed contract rate: OMR ${rateResult.effectiveRate.toFixed(3)} (${premiumPercent}% above market OMR ${rateResult.marketPrice.toFixed(3)})${expiryInfo}`
            warningType = RATE_WARNING_TYPES.RATE_ABOVE_MARKET
          } else {
            description = `Fixed contract rate: OMR ${rateResult.effectiveRate.toFixed(3)} (matches market rate)${expiryInfo}`
          }
          break
        }

        case CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE:
          description = `Contract discount: ${contractInfo.discountPercentage}% off market rate (OMR ${rateResult.effectiveRate.toFixed(3)} vs OMR ${rateResult.marketPrice.toFixed(3)})${expiryInfo}`
          break

        case CONTRACT_RATE_TYPES.MINIMUM_PRICE_GUARANTEE:
          if (rateResult.effectiveRate === contractInfo.contractRate) {
            description = `Price guarantee: Using contract rate OMR ${rateResult.effectiveRate.toFixed(3)} (market: OMR ${rateResult.marketPrice.toFixed(3)})${expiryInfo}`
          } else {
            description = `Price guarantee: Using market rate OMR ${rateResult.effectiveRate.toFixed(3)} (contract allows up to OMR ${contractInfo.contractRate.toFixed(3)})${expiryInfo}`
          }
          break

        default:
          description = `Contract rate: OMR ${rateResult.effectiveRate.toFixed(3)}${expiryInfo}`
      }
    } else {
      const diff = rateResult.marketPrice - rateResult.effectiveRate
      if (diff > 0) {
        const savingsPercent = ((diff / rateResult.marketPrice) * 100).toFixed(1)
        description = `Fixed contract rate: OMR ${rateResult.effectiveRate.toFixed(3)} (${savingsPercent}% savings)`
      } else {
        description = `Contract rate: OMR ${rateResult.effectiveRate.toFixed(3)}`
      }
    }

    return {
      description,
      hasContract: true,
      isActive: true,
      rateType: contractInfo?.type || CONTRACT_RATE_TYPES.FIXED_RATE,
      savings: rateResult.savings,
      warningType
    }
  }, [contractRates, materials, getEffectiveRate, isContractActive])

  /**
   * Check if rate is locked (active contract, no override applied)
   */
  const isRateLocked = useCallback((materialId) => {
    return hasContractRate(materialId) &&
           isContractActive(materialId) &&
           !overrideRequests[materialId]
  }, [hasContractRate, isContractActive, overrideRequests])

  /**
   * Apply rate override after manager approval
   */
  const applyOverride = useCallback((materialId, overrideData) => {
    setOverrideRequests(prev => ({
      ...prev,
      [materialId]: {
        ...overrideData,
        approvedAt: new Date().toISOString()
      }
    }))

    // Add override warning
    addWarning({
      type: RATE_WARNING_TYPES.RATE_OVERRIDE,
      materialId,
      message: `Rate overridden: OMR ${overrideData.overrideRate.toFixed(3)} (was OMR ${overrideData.originalRate.toFixed(3)}) - ${overrideData.reason}`
    })
  }, [])

  /**
   * Clear override for a material
   */
  const clearOverride = useCallback((materialId) => {
    setOverrideRequests(prev => {
      const { [materialId]: removed, ...rest } = prev
      return rest
    })
    clearWarning(materialId)
  }, [])

  /**
   * Get discount info for display
   */
  const getDiscountInfo = useCallback((materialId) => {
    const contractInfo = contractRates[materialId]

    if (contractInfo?.type === CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE) {
      return {
        hasDiscount: true,
        percentage: contractInfo.discountPercentage,
        description: contractInfo.description
      }
    }

    return { hasDiscount: false }
  }, [contractRates])

  /**
   * Add warning message
   */
  const addWarning = useCallback((warning) => {
    setWarnings(prev => {
      const filtered = prev.filter(w => w.materialId !== warning.materialId)
      return [...filtered, warning]
    })
  }, [])

  /**
   * Clear warning for material
   */
  const clearWarning = useCallback((materialId) => {
    setWarnings(prev => prev.filter(w => w.materialId !== materialId))
  }, [])

  /**
   * Clear all warnings
   */
  const clearAllWarnings = useCallback(() => {
    setWarnings([])
  }, [])

  /**
   * Reset all contract state (when changing customers)
   */
  const resetContractState = useCallback(() => {
    setContractRates({})
    setWarnings([])
    setOverrideRequests({})
    setCurrentCustomerId(null)
  }, [])

  /**
   * Get contract summary for current customer
   */
  const contractSummary = useMemo(() => {
    const materialIds = Object.keys(contractRates)
    if (materialIds.length === 0) return null

    const activeCount = materialIds.filter(id => isContractActive(id)).length
    const expiredCount = materialIds.length - activeCount
    const overrideCount = Object.keys(overrideRequests).length

    return {
      totalMaterials: materialIds.length,
      activeRates: activeCount,
      expiredRates: expiredCount,
      overriddenRates: overrideCount,
      hasActiveContract: activeCount > 0
    }
  }, [contractRates, overrideRequests, isContractActive])

  return {
    // State
    contractRates,
    warnings,
    overrideRequests,
    currentCustomerId,
    contractSummary,

    // Rate operations
    loadContractRates,
    getEffectiveRate,
    getRateDetails,
    getDiscountInfo,

    // Status checks
    isContractActive,
    hasContractRate,
    isRateLocked,

    // Override management
    applyOverride,
    clearOverride,

    // Warning management
    addWarning,
    clearWarning,
    clearAllWarnings,

    // Reset
    resetContractState
  }
}

export default useSalesContractRates
