/**
 * Customer Module Type Definitions
 *
 * JSDoc types for type safety without TypeScript migration.
 * These types document the data structures used throughout the customer module.
 */

/**
 * @typedef {Object} Address
 * @property {string} street
 * @property {string} city
 * @property {string} region
 * @property {string} country
 */

/**
 * @typedef {Object} ContactInfo
 * @property {string} phone
 * @property {string} email
 * @property {string} vatRegistrationNumber
 * @property {Address} address
 */

/**
 * @typedef {Object} SalesHistory
 * @property {number} totalOrders
 * @property {number} totalValue
 * @property {string|null} lastOrderDate
 */

/**
 * @typedef {'fixed_rate' | 'discount_percentage' | 'minimum_price_guarantee'} ContractRateType
 */

/**
 * @typedef {Object} ContractRate
 * @property {ContractRateType} type
 * @property {number} [contractRate] - For fixed_rate and minimum_price_guarantee
 * @property {number} [discountPercentage] - For discount_percentage type
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {string} [status]
 * @property {string} [description]
 */

/**
 * @typedef {Object} ContractDetails
 * @property {string} contractId
 * @property {string} startDate
 * @property {string} endDate
 * @property {'active' | 'expired' | 'suspended' | 'cancelled'} status
 * @property {string} [specialTerms]
 * @property {Record<string, ContractRate>} rates - Material ID to rate mapping
 */

/**
 * @typedef {'individual' | 'business' | 'project' | 'contract'} CustomerType
 */

/**
 * @typedef {Object} Customer
 * @property {number} id
 * @property {string} code
 * @property {string} name
 * @property {CustomerType} type
 * @property {string} [contactPerson]
 * @property {ContactInfo} contact
 * @property {number} creditLimit
 * @property {number} paymentTerms
 * @property {boolean} is_taxable
 * @property {boolean} isActive
 * @property {string} [createdAt]
 * @property {string} [lastUpdated]
 * @property {SalesHistory} salesHistory
 * @property {ContractDetails|null} contractDetails
 */

/**
 * @typedef {Object} CustomerFormData
 * @property {string} name
 * @property {CustomerType} type
 * @property {string} [contactPerson]
 * @property {string} phone
 * @property {string} email
 * @property {string} [vatRegistrationNumber]
 * @property {string} [street]
 * @property {string} [city]
 * @property {string} [region]
 * @property {string} [country]
 * @property {number} creditLimit
 * @property {number} paymentTerms
 * @property {string} [specialTerms]
 * @property {boolean} isTaxable
 */

/**
 * @typedef {Object} CustomerType_Option
 * @property {number} id
 * @property {string} code
 * @property {string} name
 */

/**
 * @typedef {Object} FileAttachment
 * @property {string} id
 * @property {string} originalFilename
 * @property {string} contentType
 * @property {number} fileSize
 * @property {string} downloadUrl
 */

/**
 * @typedef {Object} Material
 * @property {string} id
 * @property {string} name
 * @property {string} unit
 * @property {number} [standardPrice]
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [error]
 * @property {string} [message]
 */

export const CUSTOMER_TYPES = /** @type {const} */ ({
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  PROJECT: 'project',
  CONTRACT: 'contract'
})

export const CONTRACT_STATUS = /** @type {const} */ ({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled'
})

export const CONTRACT_RATE_TYPES = /** @type {const} */ ({
  FIXED_RATE: 'fixed_rate',
  DISCOUNT_PERCENTAGE: 'discount_percentage',
  MINIMUM_PRICE_GUARANTEE: 'minimum_price_guarantee'
})
