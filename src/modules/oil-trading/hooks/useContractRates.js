/**
 * useContractRates Hook
 *
 * Manages contract rate calculations and material rate editing.
 * Centralizes the rate calculation logic used in contract views.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import materialService from '../../../services/materialService'
import { CONTRACT_RATE_TYPES } from '../types/customer.types'

/**
 * @typedef {import('../types/customer.types').ContractRate} ContractRate
 * @typedef {import('../types/customer.types').Material} Material
 * @typedef {import('../types/customer.types').ContractDetails} ContractDetails
 */

/**
 * Calculate actual rate based on contract rate type
 * @param {ContractRate} rateInfo - Contract rate configuration
 * @param {number} standardRate - Standard market rate
 * @returns {number} Calculated rate
 */
export const calculateActualRate = (rateInfo, standardRate) => {
  if (!rateInfo) return standardRate

  switch (rateInfo.type) {
    case CONTRACT_RATE_TYPES.FIXED_RATE:
      return rateInfo.contractRate || 0

    case CONTRACT_RATE_TYPES.DISCOUNT_PERCENTAGE:
      return standardRate * (1 - (rateInfo.discountPercentage || 0) / 100)

    case CONTRACT_RATE_TYPES.MINIMUM_PRICE_GUARANTEE:
      return Math.min(standardRate, rateInfo.contractRate || standardRate)

    default:
      return standardRate
  }
}

/**
 * Calculate savings percentage
 * @param {number} standardRate - Standard market rate
 * @param {number} contractRate - Contract rate
 * @returns {string} Savings percentage formatted to 1 decimal
 */
export const calculateSavings = (standardRate, contractRate) => {
  if (standardRate <= 0) return '0.0'
  return ((standardRate - contractRate) / standardRate * 100).toFixed(1)
}

/**
 * Hook for loading materials and calculating contract rates
 * @param {ContractDetails|null} contract - Contract details with rates
 * @returns {Object} Materials with rate calculations
 */
export const useContractRates = (contract) => {
  /** @type {[Material[], Function]} */
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadMaterials = async () => {
      if (!contract) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await materialService.getAll()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch materials')
        }

        setMaterials(result.data || [])
      } catch (err) {
        console.error('Error loading materials:', err)
        setError(err.message)
        setMaterials([])
      } finally {
        setLoading(false)
      }
    }

    loadMaterials()
  }, [contract])

  /**
   * Materials with contract rates, including calculated values
   */
  const materialsWithRates = useMemo(() => {
    if (!contract?.rates) return []

    return materials
      .filter(m => contract.rates[m.id])
      .map(material => {
        const rateInfo = contract.rates[material.id]
        const standardRate = material.standardPrice || 0
        const actualRate = calculateActualRate(rateInfo, standardRate)
        const savings = calculateSavings(standardRate, actualRate)

        return {
          ...material,
          rateInfo,
          standardRate,
          actualRate,
          savings
        }
      })
  }, [materials, contract?.rates])

  /**
   * Count of materials with special pricing
   */
  const ratedMaterialsCount = materialsWithRates.length

  return {
    materials,
    materialsWithRates,
    ratedMaterialsCount,
    loading,
    error
  }
}

/**
 * Hook for editing contract rates
 * @param {ContractDetails|null} initialContract - Initial contract data
 * @returns {Object} Contract form state and handlers
 */
export const useContractEditor = (initialContract) => {
  const [formData, setFormData] = useState({
    contractId: initialContract?.contractId || '',
    startDate: initialContract?.startDate || '',
    endDate: initialContract?.endDate || '',
    status: initialContract?.status || 'active',
    specialTerms: initialContract?.specialTerms || '',
    rates: initialContract?.rates || {}
  })

  /** @type {[Material[], Function]} */
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const result = await materialService.getAll()
        setMaterials(result.success ? (result.data || []) : [])
      } catch (err) {
        console.error('Error loading materials:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMaterials()
  }, [])

  /**
   * Update a single form field
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Update a material rate field
   */
  const updateRate = useCallback((materialId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [materialId]: {
          ...prev.rates[materialId],
          [field]: value
        }
      }
    }))
  }, [])

  /**
   * Add a new material rate
   */
  const addMaterialRate = useCallback((materialId) => {
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [materialId]: {
          type: CONTRACT_RATE_TYPES.FIXED_RATE,
          contractRate: 0,
          startDate: prev.startDate,
          endDate: prev.endDate,
          status: 'active',
          description: ''
        }
      }
    }))
  }, [])

  /**
   * Remove a material rate
   */
  const removeMaterialRate = useCallback((materialId) => {
    setFormData(prev => ({
      ...prev,
      rates: Object.fromEntries(
        Object.entries(prev.rates).filter(([key]) => key !== materialId)
      )
    }))
  }, [])

  /**
   * Materials not yet added to contract
   */
  const availableMaterials = useMemo(() => {
    return materials.filter(m => !formData.rates[m.id])
  }, [materials, formData.rates])

  /**
   * Materials currently in contract
   */
  const contractMaterials = useMemo(() => {
    return Object.entries(formData.rates)
      .map(([materialId, rateInfo]) => {
        const material = materials.find(m => m.id === materialId)
        return material ? { ...material, rateInfo } : null
      })
      .filter(Boolean)
  }, [materials, formData.rates])

  return {
    formData,
    setFormData,
    updateField,
    updateRate,
    addMaterialRate,
    removeMaterialRate,
    materials,
    availableMaterials,
    contractMaterials,
    loading
  }
}

export default useContractRates
