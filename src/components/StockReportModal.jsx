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
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase; }
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

  const getStatusClasses = (status) => {
    switch (status) {
      case 'good': return 'bg-emerald-100 text-emerald-700'
      case 'low': return 'bg-amber-100 text-amber-700'
      case 'critical': return 'bg-red-100 text-red-700'
      case 'out-of-stock': return 'bg-slate-100 text-slate-500'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
            <Package size={22} />
          </div>
          <span className="text-xl font-bold text-slate-800">{t('stockValuationReport', 'Stock Valuation Report')}</span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            onClick={handlePrint}
          >
            <Printer size={16} />
            {t('print', 'Print')}
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            onClick={handleExport}
          >
            <Download size={16} />
            {t('exportCSV', 'Export to CSV')}
          </button>
        </div>

        {/* Printable Report Content */}
        <div ref={reportRef}>
          {/* Report Header */}
          <div className="report-header text-center pb-4 mb-6 border-b-2 border-slate-200">
            <div className="company-name flex items-center justify-center gap-2 text-xl font-bold text-slate-800 mb-1">
              <Building2 size={20} className="text-slate-600" />
              {selectedCompany?.name || 'Company'}
            </div>
            <div className="report-title text-base text-slate-500 mb-2">{t('stockValuationReport', 'Stock Valuation Report')}</div>
            <div className="report-date flex items-center justify-center gap-1 text-sm text-slate-400">
              <Calendar size={14} />
              Generated: {formatDate(today)}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="summary-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="summary-card bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              <div className="summary-value text-2xl font-bold text-slate-800">{stats.totalMaterials}</div>
              <div className="summary-label text-xs font-medium text-blue-600 uppercase tracking-wide mt-1">{t('totalMaterials', 'Total Materials')}</div>
            </div>
            <div className="summary-card bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <div className="summary-value text-2xl font-bold text-slate-800">{formatCurrency(stats.totalValue)}</div>
              <div className="summary-label text-xs font-medium text-emerald-600 uppercase tracking-wide mt-1">{t('totalInventoryValue', 'Total Inventory Value')}</div>
            </div>
            <div className={`summary-card rounded-lg p-4 text-center ${stats.lowStockCount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
              <div className={`summary-value text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{stats.lowStockCount}</div>
              <div className={`summary-label text-xs font-medium uppercase tracking-wide mt-1 ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{t('lowStockItems', 'Low Stock Items')}</div>
            </div>
            <div className={`summary-card rounded-lg p-4 text-center ${stats.outOfStockCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
              <div className={`summary-value text-2xl font-bold ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.outOfStockCount}</div>
              <div className={`summary-label text-xs font-medium uppercase tracking-wide mt-1 ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>{t('outOfStock', 'Out of Stock')}</div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <table className="report-table w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('code', 'Code')}</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('material', 'Material')}</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('category', 'Category')}</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('currentStock', 'Current Stock')}</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('reorderLevel', 'Reorder Level')}</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('unitCost', 'Unit Cost')}</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('totalValue', 'Total Value')}</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-3 py-2.5 font-mono text-sm font-medium text-slate-800">{item.code}</td>
                    <td className="px-3 py-2.5 text-slate-700">{item.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.category}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 tabular-nums">{item.currentStock} {item.unit}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums">{item.reorderLevel} {item.unit}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 tabular-nums">{formatCurrency(item.unitCost)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">{formatCurrency(item.totalValue)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`status-badge inline-block px-2 py-0.5 text-xs font-medium rounded-full uppercase tracking-wide ${getStatusClasses(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-200">
                  <td colSpan="6" className="px-3 py-3 text-right text-sm font-semibold text-slate-700">{t('grandTotal', 'Grand Total')}:</td>
                  <td className="px-3 py-3 text-right text-base font-bold text-slate-800 tabular-nums">{formatCurrency(stats.totalValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Report Footer */}
          <div className="report-footer flex items-center justify-between mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400">
            <span>Generated by: {user?.name || user?.username || 'System'}</span>
            <span>{selectedCompany?.name} - Petroleum Business Management System</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-start pt-4 border-t border-slate-200">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
            onClick={onClose}
          >
            <X size={16} />
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default StockReportModal
