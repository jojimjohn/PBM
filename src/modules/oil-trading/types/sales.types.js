/**
 * Sales Module Type Definitions
 *
 * JSDoc types for the oil trading sales module.
 * Provides type safety and documentation without TypeScript migration.
 */

// ============================================================================
// SALES ORDER TYPES
// ============================================================================

/**
 * @typedef {Object} SalesOrderItem
 * @property {number} [id] - Item ID (exists for saved items)
 * @property {number|string} materialId - Material reference
 * @property {string} [materialName] - Material display name
 * @property {string} [materialCode] - Material code
 * @property {number} quantity - Order quantity
 * @property {string} unit - Unit of measure (L, KG, etc.)
 * @property {number} unitPrice - Price per unit
 * @property {number} [marketPrice] - Current market price for comparison
 * @property {number} [contractRate] - Applied contract rate if any
 * @property {string} [rateType] - Contract rate type applied
 * @property {boolean} [isOverridden] - Whether rate was manually overridden
 * @property {string} [overrideReason] - Reason for rate override
 * @property {number} [overriddenBy] - User ID who approved override
 * @property {number} subtotal - Line item total (quantity * unitPrice)
 * @property {number} [discount] - Line item discount amount
 * @property {number} [tax] - Line item tax amount
 * @property {number} total - Final line total
 */

/**
 * @typedef {Object} SalesOrder
 * @property {number} id - Order ID
 * @property {string} orderNumber - Unique order number (SO-YYYYMMDD-XXXX)
 * @property {number} customerId - Customer reference
 * @property {string} [customerName] - Customer display name
 * @property {string} [customerCode] - Customer code
 * @property {string} orderDate - ISO date string
 * @property {string} [deliveryDate] - Expected delivery date
 * @property {string} status - Order status (draft|confirmed|processing|delivered|cancelled)
 * @property {SalesOrderItem[]} items - Order line items
 * @property {number} subtotal - Sum of item subtotals
 * @property {number} [discountAmount] - Order-level discount
 * @property {number} [taxAmount] - Order-level tax
 * @property {number} totalAmount - Final order total
 * @property {string} [paymentTerms] - Payment terms
 * @property {string} [notes] - Order notes
 * @property {string} [deliveryAddress] - Delivery location
 * @property {number} [invoiceId] - Generated invoice reference
 * @property {string} [invoiceNumber] - Invoice number if generated
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {number} [createdBy] - User who created
 */

/**
 * @typedef {'draft'|'confirmed'|'processing'|'delivered'|'cancelled'} SalesOrderStatus
 */

// ============================================================================
// FORM STATE TYPES
// ============================================================================

/**
 * @typedef {Object} SalesOrderFormItem
 * @property {string} tempId - Temporary client-side ID for new items
 * @property {number|string} materialId - Selected material
 * @property {number} quantity - Entered quantity
 * @property {number} unitPrice - Price (may be contract rate or manual)
 * @property {number} [marketPrice] - Market price for comparison
 * @property {number} [contractRate] - Active contract rate if any
 * @property {string} [rateType] - Type of rate applied
 * @property {boolean} [isOverridden] - Manual override flag
 * @property {string} [overrideReason] - Override justification
 */

/**
 * @typedef {Object} SalesOrderFormData
 * @property {number|string} customerId - Selected customer
 * @property {string} orderDate - Order date
 * @property {string} [deliveryDate] - Delivery date
 * @property {string} [paymentTerms] - Payment terms
 * @property {string} [deliveryAddress] - Delivery address
 * @property {string} [notes] - Order notes
 * @property {SalesOrderFormItem[]} items - Form line items
 * @property {number} [discountPercent] - Order discount percentage
 * @property {number} [discountAmount] - Calculated discount amount
 */

// ============================================================================
// CONTRACT RATE TYPES
// ============================================================================

/**
 * @typedef {'fixed_rate'|'discount_percentage'|'minimum_price_guarantee'} ContractRateType
 */

/**
 * @typedef {Object} ContractRate
 * @property {ContractRateType} type - Rate calculation type
 * @property {number} [contractRate] - Fixed rate value
 * @property {number} [discountPercent] - Discount percentage (0-100)
 * @property {number} [guaranteedMinPrice] - Minimum price guarantee
 * @property {string} [description] - Rate description
 * @property {string} [validFrom] - Rate validity start
 * @property {string} [validUntil] - Rate validity end
 */

/**
 * @typedef {Object} CustomerContract
 * @property {number} id - Contract ID
 * @property {number} customerId - Customer reference
 * @property {string} contractNumber - Contract identifier
 * @property {string} startDate - Contract start
 * @property {string} endDate - Contract end
 * @property {boolean} isActive - Active status
 * @property {Object.<string, ContractRate>} rates - Material ID to rate mapping
 */

/**
 * @typedef {Object} EffectiveRateResult
 * @property {number} effectiveRate - Calculated rate to use
 * @property {number} marketPrice - Current market price
 * @property {number} [contractRate] - Contract rate if applicable
 * @property {string} [rateType] - Type of rate applied
 * @property {number} [savings] - Amount saved vs market price
 * @property {boolean} isContractRate - Whether contract rate was used
 * @property {boolean} isExpired - Whether contract has expired
 * @property {string} [expiryDate] - Contract expiry date
 */

// ============================================================================
// STOCK & INVENTORY TYPES
// ============================================================================

/**
 * @typedef {Object} StockInfo
 * @property {number} materialId - Material reference
 * @property {string} materialName - Material name
 * @property {number} availableQuantity - Current available stock
 * @property {number} reservedQuantity - Stock reserved for other orders
 * @property {number} totalQuantity - Total in inventory
 * @property {string} unit - Unit of measure
 */

/**
 * @typedef {Object} FIFOBatch
 * @property {number} batchId - Batch identifier
 * @property {string} batchNumber - Batch reference number
 * @property {number} quantity - Quantity from this batch
 * @property {number} costPerUnit - Cost per unit from this batch
 * @property {string} receivedDate - When batch was received
 * @property {string} [sourceType] - wcn_auto, manual_po, etc.
 * @property {number} [sourceId] - Reference to source document
 */

/**
 * @typedef {Object} FIFOAllocationPreview
 * @property {number} materialId - Material being allocated
 * @property {string} materialName - Material name
 * @property {number} requestedQuantity - Quantity requested
 * @property {number} allocatedQuantity - Quantity that can be allocated
 * @property {boolean} isFullyAllocated - Whether full quantity available
 * @property {number} shortfall - Quantity shortfall if any
 * @property {FIFOBatch[]} batches - Batches to be used
 * @property {number} totalCost - Total COGS for allocation
 * @property {number} averageCost - Weighted average cost
 */

/**
 * @typedef {Object} StockValidationResult
 * @property {boolean} isValid - Overall validation result
 * @property {StockValidationItem[]} items - Per-item validation
 * @property {string[]} errors - Validation error messages
 * @property {string[]} warnings - Validation warnings
 */

/**
 * @typedef {Object} StockValidationItem
 * @property {number} materialId - Material reference
 * @property {string} materialName - Material name
 * @property {number} requestedQuantity - Quantity in order
 * @property {number} availableQuantity - Available stock
 * @property {boolean} hasStock - Whether sufficient stock exists
 * @property {number} [shortfall] - Quantity shortfall
 */

// ============================================================================
// RATE OVERRIDE TYPES
// ============================================================================

/**
 * @typedef {Object} RateOverrideRequest
 * @property {number} itemIndex - Index of item being overridden
 * @property {number} materialId - Material reference
 * @property {string} materialName - Material name
 * @property {number} currentRate - Current rate (contract or market)
 * @property {number} proposedRate - New rate being requested
 * @property {number} marketPrice - Market price for reference
 * @property {number} [contractRate] - Contract rate if exists
 */

/**
 * @typedef {Object} RateOverrideApproval
 * @property {number} itemIndex - Item that was approved
 * @property {number} approvedRate - Rate that was approved
 * @property {string} reason - Justification for override
 * @property {number} approvedBy - User who approved
 * @property {string} approvedAt - Approval timestamp
 */

// ============================================================================
// INVOICE TYPES
// ============================================================================

/**
 * @typedef {Object} SalesInvoice
 * @property {number} id - Invoice ID
 * @property {string} invoiceNumber - Invoice number (INV-YYYYMMDD-XXXX)
 * @property {number} salesOrderId - Source sales order
 * @property {string} orderNumber - Source order number
 * @property {number} customerId - Customer reference
 * @property {string} customerName - Customer name
 * @property {string} invoiceDate - Invoice date
 * @property {string} dueDate - Payment due date
 * @property {string} status - Invoice status (draft|sent|paid|overdue|cancelled)
 * @property {SalesOrderItem[]} items - Invoice line items
 * @property {number} subtotal - Items subtotal
 * @property {number} [discountAmount] - Applied discount
 * @property {number} [taxAmount] - Applied tax
 * @property {number} totalAmount - Invoice total
 * @property {number} [paidAmount] - Amount paid
 * @property {number} [balanceDue] - Remaining balance
 * @property {string} [paymentTerms] - Payment terms
 * @property {string} [notes] - Invoice notes
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {'draft'|'sent'|'paid'|'overdue'|'cancelled'} InvoiceStatus
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * @typedef {Object} SalesOrdersResponse
 * @property {boolean} success - Request success status
 * @property {SalesOrder[]} [data] - Sales orders array
 * @property {PaginationInfo} [pagination] - Pagination metadata
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} SalesOrderResponse
 * @property {boolean} success - Request success status
 * @property {SalesOrder} [data] - Single sales order
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 * @property {number} total - Total items
 * @property {number} pages - Total pages
 */

/**
 * @typedef {Object} StockCheckResponse
 * @property {boolean} success - Request success status
 * @property {StockInfo[]} [data] - Stock information
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} FIFOPreviewResponse
 * @property {boolean} success - Request success status
 * @property {FIFOAllocationPreview[]} [data] - FIFO allocation preview
 * @property {string} [error] - Error message if failed
 */

// ============================================================================
// SUMMARY STATS TYPES
// ============================================================================

/**
 * @typedef {Object} SalesSummaryStats
 * @property {number} totalOrders - Total sales orders count
 * @property {number} pendingOrders - Orders pending delivery
 * @property {number} deliveredOrders - Completed orders
 * @property {number} totalRevenue - Total revenue (delivered orders)
 * @property {number} pendingRevenue - Revenue from pending orders
 * @property {number} averageOrderValue - Average order value
 * @property {number} totalInvoices - Total invoices generated
 * @property {number} paidInvoices - Paid invoices count
 * @property {number} overdueInvoices - Overdue invoices count
 */

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * @typedef {Object} UseSalesOrdersReturn
 * @property {SalesOrder[]} orders - Sales orders list
 * @property {SalesInvoice[]} invoices - Invoices list
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message
 * @property {PaginationInfo} pagination - Pagination state
 * @property {function(number): Promise<void>} setPage - Change page
 * @property {function(): Promise<Object>} loadOrders - Reload orders
 * @property {function(number): Promise<Object>} loadOrder - Load single order
 * @property {function(Object): Promise<Object>} createOrder - Create new order
 * @property {function(number, Object): Promise<Object>} updateOrder - Update order
 * @property {function(number): Promise<Object>} deleteOrder - Delete order
 * @property {function(number, string): Promise<Object>} updateStatus - Update order status
 * @property {function(number): Promise<Object>} generateInvoice - Generate invoice
 * @property {function(): SalesSummaryStats} getSummaryStats - Calculate summary stats
 */

/**
 * @typedef {Object} UseContractRatesReturn
 * @property {Object.<number, CustomerContract>} contracts - Customer contracts map
 * @property {boolean} loading - Loading state
 * @property {function(number): Promise<void>} loadContractRates - Load rates for customer
 * @property {function(number, number, number): EffectiveRateResult} getEffectiveRate - Calculate effective rate
 * @property {function(number): boolean} isContractActive - Check if contract is active
 * @property {function(number, number): boolean} hasContractRate - Check if material has contract rate
 */

/**
 * @typedef {Object} UseStockValidationReturn
 * @property {Object.<number, StockInfo>} stockLevels - Stock info by material
 * @property {FIFOAllocationPreview[]} fifoPreview - FIFO allocation preview
 * @property {boolean} loading - Loading state
 * @property {function(number[]): Promise<void>} loadStockLevels - Load stock for materials
 * @property {function(SalesOrderFormItem[]): Promise<void>} loadFIFOPreview - Load FIFO preview
 * @property {function(SalesOrderFormItem[]): StockValidationResult} validateStock - Validate stock availability
 * @property {function(number): number} getAvailableStock - Get available quantity for material
 */

/**
 * @typedef {Object} UseSalesOrderFormReturn
 * @property {SalesOrderFormData} formData - Current form state
 * @property {Object.<string, string>} errors - Validation errors
 * @property {boolean} isDirty - Whether form has unsaved changes
 * @property {function(string, any): void} setField - Update single field
 * @property {function(SalesOrderFormItem): void} addItem - Add line item
 * @property {function(number): void} removeItem - Remove line item
 * @property {function(number, string, any): void} updateItem - Update line item field
 * @property {function(): boolean} validate - Validate form
 * @property {function(): SalesOrderFormData} getCleanData - Get sanitized form data
 * @property {function(): void} reset - Reset form to initial state
 * @property {function(SalesOrder): void} populateFromOrder - Populate form from existing order
 */

export default {}
