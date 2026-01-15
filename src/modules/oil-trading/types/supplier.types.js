/**
 * Supplier Type Definitions
 *
 * JSDoc type definitions for the suppliers module.
 * Provides type safety without TypeScript migration.
 */

/**
 * @typedef {Object} SupplierPerformance
 * @property {number} monthlyVolume - Average monthly collection volume in liters
 * @property {number} averageRate - Average purchase rate per liter
 * @property {number} reliability - Reliability score (0-100)
 * @property {number} qualityScore - Quality score (0-100)
 */

/**
 * @typedef {Object} PurchaseHistory
 * @property {number} totalTransactions - Total number of purchase transactions
 * @property {number} totalValue - Total purchase value in OMR
 * @property {number} totalWeight - Total weight purchased in KG/Liters
 */

/**
 * Database schema for suppliers table
 * @typedef {Object} Supplier
 * @property {number} id - Primary key
 * @property {string} code - Unique supplier code (e.g., AR-SUP-001)
 * @property {string} name - Supplier name
 * @property {string} [type] - Supplier type code (business, individual, workshop, factory)
 * @property {string} [businessRegistration] - Commercial registration number
 * @property {string} [contactPerson] - Primary contact name
 * @property {string} [nationalId] - National ID for individuals
 * @property {string} [phone] - Phone number
 * @property {string} [email] - Email address
 * @property {string} [vatRegistration] - VAT registration number
 * @property {string} [address] - Street address
 * @property {string} [city] - City name
 * @property {number|null} [region_id] - FK to regions table
 * @property {number} [paymentTermDays] - Payment terms in days
 * @property {string} [specialization] - Comma-separated category IDs
 * @property {string} [taxNumber] - Tax identification number
 * @property {string} [bankName] - Bank name for payments
 * @property {string} [accountNumber] - Bank account number
 * @property {string} [iban] - International Bank Account Number
 * @property {string} [notes] - Additional notes
 * @property {boolean|number} isActive - Active status
 * @property {number} [creditBalance] - Current credit balance
 * @property {string} [createdAt] - ISO date string
 * @property {string} [updated_at] - ISO date string
 * @property {string|null} [lastTransaction] - Last transaction date
 * @property {SupplierPerformance} [performance] - Performance metrics
 * @property {PurchaseHistory} [purchaseHistory] - Purchase history summary
 */

/**
 * Form data structure for supplier create/edit forms
 * Matches form field names (may differ from database schema)
 * @typedef {Object} SupplierFormData
 * @property {number} [id] - Supplier ID (only for edits)
 * @property {string} code - Supplier code
 * @property {string} name - Supplier name
 * @property {string} type - Supplier type code
 * @property {string} businessRegistration - Business registration number
 * @property {string} contactPerson - Contact person name
 * @property {string} nationalId - National ID
 * @property {string} phone - Phone number
 * @property {string} email - Email address
 * @property {string} vatRegistrationNumber - VAT registration (form field name differs from DB)
 * @property {string} address - Street address
 * @property {string} city - City
 * @property {number|null} region_id - Region foreign key
 * @property {number} paymentTerms - Payment terms in days (form field name differs from DB)
 * @property {Array<number|string>} specialization - Array of category IDs
 * @property {string} taxNumber - Tax number
 * @property {string} bankName - Bank name
 * @property {string} accountNumber - Account number
 * @property {string} iban - IBAN
 * @property {string} notes - Notes
 * @property {boolean} isActive - Active status
 */

/**
 * Supplier type definition (from types API)
 * @typedef {Object} SupplierType
 * @property {number} id - Type ID
 * @property {string} code - Type code (business, individual, etc.)
 * @property {string} name - Display name
 * @property {string} [description] - Type description
 */

/**
 * Region definition
 * @typedef {Object} Region
 * @property {number} id - Region ID
 * @property {string} name - Region name
 * @property {string} governorate - Governorate name
 */

/**
 * Material category/specialization
 * @typedef {Object} Specialization
 * @property {number} id - Category ID
 * @property {string} name - Category name
 * @property {string} [description] - Category description
 */

/**
 * Supplier status configuration
 * @typedef {Object} SupplierStatus
 * @property {string} name - Display name
 * @property {string} color - CSS color value
 */

/**
 * File attachment metadata
 * @typedef {Object} SupplierAttachment
 * @property {string} id - File ID
 * @property {string} originalFilename - Original file name
 * @property {string} contentType - MIME type
 * @property {number} fileSize - File size in bytes
 * @property {string} downloadUrl - S3 download URL
 */

/**
 * API service result
 * @template T
 * @typedef {Object} ServiceResult
 * @property {boolean} success - Whether operation succeeded
 * @property {T} [data] - Response data
 * @property {string} [error] - Error message if failed
 */

export default {}
