/**
 * Financial Service
 * Handles all financial transaction recording and profit calculations
 */

class FinancialService {
  constructor() {
    this.transactions = []
    this.loadTransactions()
  }

  async loadTransactions() {
    try {
      // Use API service to load transactions
      const authService = await import('./authService')
      const response = await authService.default.makeAuthenticatedRequest('/api/transactions')
      this.transactions = response.data || []
      return this.transactions
    } catch (error) {
      console.error('Error loading transactions:', error)
      this.transactions = []
      return []
    }
  }

  /**
   * Record a sales transaction
   * @param {object} salesOrder - Sales order data
   * @param {string} companyId - Company identifier
   * @returns {object} Transaction record
   */
  recordSalesTransaction(salesOrder, companyId) {
    try {
      // Calculate totals
      const grossAmount = salesOrder.items.reduce((sum, item) => 
        sum + (item.quantity * item.rate), 0
      )
      
      const discountAmount = salesOrder.discountAmount || 0
      const netAmount = grossAmount - discountAmount

      // Create sales transaction
      const transaction = {
        id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'sales',
        companyId: companyId,
        referenceId: salesOrder.orderNumber || salesOrder.id,
        referenceType: 'sales_order',
        
        // Transaction details
        date: new Date().toISOString(), // July 25, 2025
        description: `Sales to ${salesOrder.customer?.name || 'Customer'}`,
        
        // Financial amounts
        grossAmount: grossAmount,
        discountAmount: discountAmount,
        netAmount: netAmount,
        
        // Customer information
        customerId: salesOrder.customer?.id,
        customerName: salesOrder.customer?.name,
        customerType: salesOrder.customer?.type,
        
        // Item details for analysis
        items: salesOrder.items.map(item => ({
          materialId: item.materialId,
          materialName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.quantity * item.rate
        })),
        
        // Metadata
        status: 'recorded',
        createdAt: new Date().toISOString(),
        createdBy: 'system' // TODO: Get from auth context
      }

      // Add to transactions
      this.transactions.push(transaction)
      
      console.log('Sales transaction recorded:', transaction.id)
      return transaction

    } catch (error) {
      console.error('Error recording sales transaction:', error)
      throw new Error(`Failed to record sales transaction: ${error.message}`)
    }
  }

  /**
   * Record a purchase transaction
   * @param {object} purchaseOrder - Purchase order data
   * @param {string} companyId - Company identifier
   * @returns {object} Transaction record
   */
  recordPurchaseTransaction(purchaseOrder, companyId) {
    try {
      // Calculate totals
      const grossAmount = purchaseOrder.items.reduce((sum, item) => 
        sum + (item.quantity * item.rate), 0
      )

      // Create purchase transaction
      const transaction = {
        id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'purchase',
        companyId: companyId,
        referenceId: purchaseOrder.id,
        referenceType: 'purchase_order',
        
        // Transaction details
        date: purchaseOrder.receivedDate || new Date().toISOString(),
        description: `Purchase from ${purchaseOrder.supplier}`,
        
        // Financial amounts
        grossAmount: grossAmount,
        discountAmount: 0, // TODO: Add purchase discounts if needed
        netAmount: grossAmount,
        
        // Supplier information
        supplierId: purchaseOrder.supplierId || null,
        supplierName: purchaseOrder.supplier,
        
        // Item details for cost analysis
        items: purchaseOrder.items.map(item => ({
          materialId: item.materialId,
          materialName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          cost: item.rate,
          amount: item.quantity * item.rate
        })),
        
        // Metadata
        status: 'recorded',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      }

      // Add to transactions
      this.transactions.push(transaction)
      
      console.log('Purchase transaction recorded:', transaction.id)
      return transaction

    } catch (error) {
      console.error('Error recording purchase transaction:', error)
      throw new Error(`Failed to record purchase transaction: ${error.message}`)
    }
  }

  /**
   * Record an expense transaction
   * @param {object} expense - Expense data
   * @param {string} companyId - Company identifier
   * @returns {object} Transaction record
   */
  recordExpenseTransaction(expense, companyId) {
    try {
      const transaction = {
        id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'expense',
        companyId: companyId,
        referenceId: expense.id,
        referenceType: 'expense',
        
        // Transaction details
        date: expense.date || new Date().toISOString(),
        description: expense.description || 'Business expense',
        
        // Financial amounts
        grossAmount: expense.amount,
        discountAmount: 0,
        netAmount: expense.amount,
        
        // Expense details
        category: expense.category,
        expenseType: expense.type || 'operational',
        
        // Metadata
        status: 'recorded',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      }

      this.transactions.push(transaction)
      
      console.log('Expense transaction recorded:', transaction.id)
      return transaction

    } catch (error) {
      console.error('Error recording expense transaction:', error)
      throw new Error(`Failed to record expense transaction: ${error.message}`)
    }
  }

  /**
   * Calculate profit for a given period
   * @param {string} companyId - Company identifier
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {object} Profit calculation
   */
  calculateProfit(companyId, startDate = null, endDate = null) {
    try {
      // Filter transactions by company and date range
      let filteredTransactions = this.transactions.filter(txn => 
        txn.companyId === companyId
      )

      if (startDate) {
        filteredTransactions = filteredTransactions.filter(txn => 
          new Date(txn.date) >= new Date(startDate)
        )
      }

      if (endDate) {
        filteredTransactions = filteredTransactions.filter(txn => 
          new Date(txn.date) <= new Date(endDate)
        )
      }

      // Calculate revenue (sales)
      const salesTransactions = filteredTransactions.filter(txn => txn.type === 'sales')
      const totalRevenue = salesTransactions.reduce((sum, txn) => sum + txn.netAmount, 0)

      // Calculate cost of goods sold (purchases)
      const purchaseTransactions = filteredTransactions.filter(txn => txn.type === 'purchase')
      const totalCOGS = purchaseTransactions.reduce((sum, txn) => sum + txn.netAmount, 0)

      // Calculate operating expenses
      const expenseTransactions = filteredTransactions.filter(txn => txn.type === 'expense')
      const totalExpenses = expenseTransactions.reduce((sum, txn) => sum + txn.netAmount, 0)

      // Calculate profit metrics
      const grossProfit = totalRevenue - totalCOGS
      const netProfit = grossProfit - totalExpenses
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      return {
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Current',
          companyId: companyId
        },
        revenue: {
          total: totalRevenue,
          transactionCount: salesTransactions.length
        },
        costs: {
          cogs: totalCOGS,
          expenses: totalExpenses,
          total: totalCOGS + totalExpenses
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          grossMargin: grossMargin,
          netMargin: netMargin
        },
        transactions: {
          total: filteredTransactions.length,
          sales: salesTransactions.length,
          purchases: purchaseTransactions.length,
          expenses: expenseTransactions.length
        }
      }

    } catch (error) {
      console.error('Error calculating profit:', error)
      return {
        period: { startDate, endDate, companyId },
        revenue: { total: 0, transactionCount: 0 },
        costs: { cogs: 0, expenses: 0, total: 0 },
        profit: { gross: 0, net: 0, grossMargin: 0, netMargin: 0 },
        transactions: { total: 0, sales: 0, purchases: 0, expenses: 0 }
      }
    }
  }

  /**
   * Get transactions by type and company
   * @param {string} companyId - Company identifier
   * @param {string} type - Transaction type (sales, purchase, expense)
   * @param {number} limit - Number of transactions to return
   * @returns {array} Filtered transactions
   */
  getTransactions(companyId, type = null, limit = null) {
    let filtered = this.transactions.filter(txn => txn.companyId === companyId)
    
    if (type) {
      filtered = filtered.filter(txn => txn.type === type)
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    if (limit) {
      filtered = filtered.slice(0, limit)
    }
    
    return filtered
  }

  /**
   * Get financial summary for dashboard
   * @param {string} companyId - Company identifier
   * @returns {object} Financial summary
   */
  getFinancialSummary(companyId) {
    try {
      // Current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      
      const monthlyProfit = this.calculateProfit(companyId, startOfMonth, endOfMonth)
      const totalProfit = this.calculateProfit(companyId)
      
      // Recent transactions
      const recentTransactions = this.getTransactions(companyId, null, 5)
      
      return {
        monthly: monthlyProfit,
        total: totalProfit,
        recentTransactions: recentTransactions,
        summary: {
          totalRevenue: totalProfit.revenue.total,
          totalExpenses: totalProfit.costs.total,
          netProfit: totalProfit.profit.net,
          transactionCount: totalProfit.transactions.total
        }
      }
      
    } catch (error) {
      console.error('Error getting financial summary:', error)
      return {
        monthly: { profit: { net: 0 } },
        total: { profit: { net: 0 } },
        recentTransactions: [],
        summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, transactionCount: 0 }
      }
    }
  }

  /**
   * Generate financial report data
   * @param {string} companyId - Company identifier
   * @param {string} period - Period type (monthly, quarterly, yearly)
   * @returns {object} Report data
   */
  generateReport(companyId, period = 'monthly') {
    // This would generate detailed financial reports
    // Implementation can be extended based on specific reporting needs
    const summary = this.getFinancialSummary(companyId)
    
    return {
      period: period,
      companyId: companyId,
      generatedAt: new Date().toISOString(),
      ...summary
    }
  }
}

// Create and export a singleton instance
const financialService = new FinancialService()
export default financialService