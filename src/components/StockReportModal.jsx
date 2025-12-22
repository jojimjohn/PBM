import React, { useRef } from 'react'
import Modal from './ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import {
  Printer,
  Download,
  Package,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calendar,
  X
} from 'lucide-react'
import './StockReportModal.css'

/**
 * Stock Report Modal
 * Displays a printable stock valuation report with summary statistics
 * and detailed inventory breakdown by material
 */
const StockReportModal = ({
  isOpen,
  onClose,
  inventory,       // Object keyed by materialId with stock data
  materials,       // Array of all materials
  t = (key, fallback) => fallback || key,
  formatCurrency = (val) => `OMR ${(parseFloat(val) || 0).toFixed(3)}`
}) => {
  const { selectedCompany, user } = useAuth()
  const { formatDate: systemFormatDate } = useSystemSettings()
  const reportRef = useRef(null)

  const formatDate = systemFormatDate || ((date) => date ? new Date(date).toLocaleDateString() : '-')
  const today = new Date().toISOString().split('T')[0]

  // Calculate report statistics
  const getReportStats = () => {
    const inventoryItems = Object.values(inventory || {})
    const totalMaterials = materials?.length || 0
    const materialsWithStock = inventoryItems.filter(item => item.currentStock > 0).length
    const totalValue = inventoryItems.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0)
    const lowStockCount = inventoryItems.filter(item =>
      item.currentStock > 0 &&
      item.reorderLevel > 0 &&
      item.currentStock <= item.reorderLevel
    ).length
    const outOfStockCount = inventoryItems.filter(item => item.currentStock === 0).length

    return {
      totalMaterials,
      materialsWithStock,
      totalValue,
      lowStockCount,
      outOfStockCount
    }
  }

  // Get materials with inventory data for the report
  const getReportData = () => {
    return (materials || []).map(material => {
      const stock = inventory?.[Number(material.id)] || {}
      const currentStock = parseFloat(stock.currentStock) || 0
      const unitCost = parseFloat(material.standardPrice) || parseFloat(stock.averageCost) || 0
      const totalValue = currentStock * unitCost

      let status = 'good'
      if (currentStock === 0) status = 'out-of-stock'
      else if (stock.reorderLevel && currentStock <= stock.reorderLevel * 0.5) status = 'critical'
      else if (stock.reorderLevel && currentStock <= stock.reorderLevel) status = 'low'

      return {
        id: material.id,
        name: material.name,
        code: material.code,
        category: material.category,
        unit: material.unit,
        currentStock,
        reorderLevel: stock.reorderLevel || material.minimumStockLevel || 0,
        unitCost,
        totalValue,
        status
      }
    }).sort((a, b) => b.totalValue - a.totalValue) // Sort by value descending
  }

  const stats = getReportStats()
  const reportData = getReportData()

  // Handle print functionality
  const handlePrint = () => {
    const printContents = reportRef.current?.innerHTML
    if (!printContents) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stock Valuation Report - ${selectedCompany?.name || 'Company'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; color: #1f2937; }
            .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
            .company-name { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
            .report-title { font-size: 18px; color: #6b7280; margin-bottom: 8px; }
            .report-date { font-size: 14px; color: #9ca3af; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
            .summary-value { font-size: 24px; font-weight: 700; color: #1f2937; }
            .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .summary-card.warning .summary-value { color: #d97706; }
            .summary-card.danger .summary-value { color: #dc2626; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .report-table th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
            .report-table td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            .report-table tr:nth-child(even) { background: #f9fafb; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
            .status-good { background: #d1fae5; color: #047857; }
            .status-low { background: #fef3c7; color: #92400e; }
            .status-critical { background: #fee2e2; color: #b91c1c; }
            .status-out-of-stock { background: #f3f4f6; color: #6b7280; }
            .text-right { text-align: right; }
            .report-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; display: flex; justify-content: space-between; }
            @media print {
              body { padding: 0; }
              .summary-grid { grid-template-columns: repeat(4, 1fr); }
              .report-table { font-size: 11px; }
              .report-table th, .report-table td { padding: 6px 4px; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ['Material Code', 'Material Name', 'Category', 'Current Stock', 'Unit', 'Reorder Level', 'Unit Cost', 'Total Value', 'Status']
    const rows = reportData.map(item => [
      item.code,
      item.name,
      item.category,
      item.currentStock,
      item.unit,
      item.reorderLevel,
      item.unitCost.toFixed(3),
      item.totalValue.toFixed(3),
      item.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `stock-report-${today}.csv`
    link.click()
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'good': return t('inStock', 'In Stock')
      case 'low': return t('lowStock', 'Low Stock')
      case 'critical': return t('critical', 'Critical')
      case 'out-of-stock': return t('outOfStock', 'Out of Stock')
      default: return status
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="stock-report-modal-title">
          <Package size={24} />
          <span>{t('stockValuationReport', 'Stock Valuation Report')}</span>
        </div>
      }
      size="xl"
      className="stock-report-modal"
    >
      <div className="stock-report-content">
        {/* Action Buttons */}
        <div className="report-actions">
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} />
            {t('print', 'Print')}
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={16} />
            {t('exportCSV', 'Export CSV')}
          </button>
        </div>

        {/* Printable Report Content */}
        <div ref={reportRef} className="report-printable">
          {/* Report Header */}
          <div className="report-header">
            <div className="company-name">
              <Building2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              {selectedCompany?.name || 'Company'}
            </div>
            <div className="report-title">{t('stockValuationReport', 'Stock Valuation Report')}</div>
            <div className="report-date">
              <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Generated: {formatDate(today)}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-value">{stats.totalMaterials}</div>
              <div className="summary-label">{t('totalMaterials', 'Total Materials')}</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{formatCurrency(stats.totalValue)}</div>
              <div className="summary-label">{t('totalInventoryValue', 'Total Value')}</div>
            </div>
            <div className={`summary-card ${stats.lowStockCount > 0 ? 'warning' : ''}`}>
              <div className="summary-value">{stats.lowStockCount}</div>
              <div className="summary-label">{t('lowStockItems', 'Low Stock Items')}</div>
            </div>
            <div className={`summary-card ${stats.outOfStockCount > 0 ? 'danger' : ''}`}>
              <div className="summary-value">{stats.outOfStockCount}</div>
              <div className="summary-label">{t('outOfStock', 'Out of Stock')}</div>
            </div>
          </div>

          {/* Detailed Table */}
          <table className="report-table">
            <thead>
              <tr>
                <th>{t('code', 'Code')}</th>
                <th>{t('material', 'Material')}</th>
                <th>{t('category', 'Category')}</th>
                <th className="text-right">{t('currentStock', 'Current Stock')}</th>
                <th className="text-right">{t('reorderLevel', 'Reorder Level')}</th>
                <th className="text-right">{t('unitCost', 'Unit Cost')}</th>
                <th className="text-right">{t('totalValue', 'Total Value')}</th>
                <th>{t('status', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.code}</strong></td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td className="text-right">{item.currentStock} {item.unit}</td>
                  <td className="text-right">{item.reorderLevel} {item.unit}</td>
                  <td className="text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="text-right"><strong>{formatCurrency(item.totalValue)}</strong></td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 600 }}>
                <td colSpan="6" className="text-right">{t('grandTotal', 'Grand Total')}:</td>
                <td className="text-right"><strong>{formatCurrency(stats.totalValue)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Report Footer */}
          <div className="report-footer">
            <span>Generated by: {user?.name || user?.username || 'System'}</span>
            <span>{selectedCompany?.name} - Petroleum Business Management System</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="report-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={16} />
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default StockReportModal
