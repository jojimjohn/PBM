import React, { useState, useEffect, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import DateInput from '../../../components/ui/DateInput'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { useLocalization } from '../../../context/LocalizationContext'
import wastageService from '../../../services/wastageService'
import { WASTAGE_TYPE_COLORS } from '../pages/Wastage'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Download,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Package
} from 'lucide-react'

const WastageAnalytics = ({ isOpen, onClose }) => {
  const { t } = useLocalization()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('last30')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalWastages: 0,
      totalCost: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0
    },
    byType: [],
    topMaterials: [],
    monthlyTrends: []
  })

  // Date range options
  const dateRangeOptions = [
    { value: 'last30', label: t('last30Days', 'Last 30 Days') },
    { value: 'last90', label: t('last90Days', 'Last 90 Days') },
    { value: 'last12months', label: t('last12Months', 'Last 12 Months') },
    { value: 'custom', label: t('customRange', 'Custom Range') }
  ]

  // Calculate date parameters based on range selection
  const getDateParams = useMemo(() => {
    const today = new Date()
    let dateFrom, dateTo

    switch (dateRange) {
      case 'last30':
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 30)
        dateTo = today
        break
      case 'last90':
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 90)
        dateTo = today
        break
      case 'last12months':
        dateFrom = new Date(today)
        dateFrom.setFullYear(dateFrom.getFullYear() - 1)
        dateTo = today
        break
      case 'custom':
        dateFrom = customDateFrom ? new Date(customDateFrom) : null
        dateTo = customDateTo ? new Date(customDateTo) : null
        break
      default:
        dateFrom = new Date(today)
        dateFrom.setDate(dateFrom.getDate() - 30)
        dateTo = today
    }

    return {
      dateFrom: dateFrom?.toISOString().split('T')[0],
      dateTo: dateTo?.toISOString().split('T')[0]
    }
  }, [dateRange, customDateFrom, customDateTo])

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (dateRange === 'custom' && (!customDateFrom || !customDateTo)) {
      return // Don't fetch if custom dates are incomplete
    }

    setLoading(true)
    setError(null)

    try {
      const params = getDateParams
      const result = await wastageService.getAnalytics(params)

      if (result.success && result.data) {
        setAnalyticsData({
          summary: result.data.summary || {
            totalWastages: 0,
            totalCost: 0,
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0
          },
          byType: result.data.byType || [],
          topMaterials: result.data.topMaterials || [],
          monthlyTrends: result.data.monthlyTrends || []
        })
      } else {
        setError(result.error || t('analyticsLoadError', 'Failed to load analytics. Please try again.'))
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(t('analyticsLoadError', 'Failed to load analytics. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Load data when modal opens or date range changes
  useEffect(() => {
    if (isOpen) {
      fetchAnalytics()
    }
  }, [isOpen, dateRange, customDateFrom, customDateTo])

  // Handle date range change
  const handleDateRangeChange = (value) => {
    setDateRange(value)
    if (value !== 'custom') {
      setCustomDateFrom('')
      setCustomDateTo('')
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return `OMR ${num.toFixed(3)}`
  }

  // Prepare pie chart data with colors
  // Note: MySQL returns decimal values as strings, so we need parseFloat()
  const pieChartData = useMemo(() => {
    return analyticsData.byType.map(item => ({
      ...item,
      name: item.wasteType,
      value: parseFloat(item.totalCost) || 0,
      color: WASTAGE_TYPE_COLORS[item.wasteType] || WASTAGE_TYPE_COLORS.other
    }))
  }, [analyticsData.byType])

  // Format month for bar chart
  const formatMonth = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  // Prepare bar chart data
  // Note: MySQL returns decimal values as strings, so we need parseFloat()
  const barChartData = useMemo(() => {
    return analyticsData.monthlyTrends.map(item => ({
      ...item,
      monthLabel: formatMonth(item.month),
      cost: parseFloat(item.totalCost) || 0
    }))
  }, [analyticsData.monthlyTrends])

  // Export to CSV
  const handleExport = () => {
    const { summary, topMaterials } = analyticsData
    const dateStr = new Date().toISOString().split('T')[0]

    // Build CSV content
    let csv = 'Wastage Analytics Report\n'
    csv += `Generated: ${dateStr}\n`
    csv += `Period: ${dateRange === 'custom' ? `${customDateFrom} to ${customDateTo}` : dateRangeOptions.find(o => o.value === dateRange)?.label}\n\n`

    // Summary section
    csv += 'Summary\n'
    csv += `Total Wastages,${summary.totalWastages}\n`
    csv += `Total Cost (OMR),${summary.totalCost.toFixed(3)}\n`
    csv += `Pending,${summary.pendingCount}\n`
    csv += `Approved,${summary.approvedCount}\n`
    csv += `Rejected,${summary.rejectedCount}\n\n`

    // Top Materials section
    csv += 'Top Materials by Wastage Cost\n'
    csv += 'Rank,Material Code,Material Name,Count,Total Cost (OMR)\n'
    topMaterials.forEach((item, index) => {
      csv += `${index + 1},${item.materialCode},${item.materialName},${item.count},${(item.totalCost || 0).toFixed(3)}\n`
    })

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wastage-analytics-${dateStr}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-lg">
          <p className="text-xs font-semibold text-gray-700 m-0 mb-1">{data.wasteType}</p>
          <p className="text-xs text-gray-500 m-0">Count: {data.count}</p>
          <p className="text-xs text-gray-500 m-0">Cost: {formatCurrency(data.totalCost)}</p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-lg">
          <p className="text-xs font-semibold text-gray-700 m-0 mb-1">{label}</p>
          <p className="text-xs text-gray-500 m-0">Cost: {formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const { summary } = analyticsData

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('wastageAnalytics', 'Wastage Analytics')}
      className="max-w-[1400px] w-[98vw] min-w-[900px] max-h-[90vh] max-md:min-w-0"
    >
      <div className="flex flex-col gap-6">
        {/* Header with Date Filter and Export */}
        <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-gray-200 max-md:flex-col max-md:items-start">
          <div className="flex items-center gap-3 flex-wrap max-md:flex-col max-md:items-start max-md:w-full">
            <Calendar size={18} className="text-gray-500" />
            <Select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="min-w-[150px] max-md:w-full"
            >
              {dateRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 max-md:w-full">
                <DateInput
                  value={customDateFrom}
                  onChange={setCustomDateFrom}
                  maxDate={customDateTo || new Date().toISOString().split('T')[0]}
                />
                <span className="text-gray-500">-</span>
                <DateInput
                  value={customDateTo}
                  onChange={setCustomDateTo}
                  minDate={customDateFrom}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          <button className="btn btn-outline flex items-center gap-2 max-md:w-full max-md:justify-center" onClick={handleExport} disabled={loading}>
            <Download size={16} />
            {t('exportAnalytics', 'Export to CSV')}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center text-red-600">
            <AlertTriangle size={48} />
            <p className="text-gray-700 m-0">{error}</p>
            <button className="btn btn-primary flex items-center gap-2" onClick={fetchAnalytics}>
              <RefreshCw size={16} />
              {t('retry', 'Retry')}
            </button>
          </div>
        )}

        {/* Analytics Content */}
        {!loading && !error && (
          <>
            {/* Summary Metric Cards */}
            <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              <div className="summary-card">
                <div className="summary-icon bg-blue-100 text-blue-600">
                  <TrendingUp size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.totalWastages}</span>
                  <span className="summary-label">{t('totalWastagesCard', 'Total Wastages')}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon bg-amber-100 text-amber-600">
                  <DollarSign size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{formatCurrency(summary.totalCost)}</span>
                  <span className="summary-label">{t('totalWasteCostCard', 'Total Waste Cost')}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon bg-yellow-100 text-yellow-600">
                  <Clock size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.pendingCount}</span>
                  <span className="summary-label">{t('pendingApprovalsCard', 'Pending Approvals')}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon bg-emerald-100 text-emerald-600">
                  <CheckCircle size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.approvedCount}</span>
                  <span className="summary-label">{t('approvedWastagesCard', 'Approved')}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon bg-red-100 text-red-600">
                  <XCircle size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.rejectedCount}</span>
                  <span className="summary-label">{t('rejectedWastagesCard', 'Rejected')}</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
              {/* Monthly Trends Bar Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 m-0 mb-4 pb-2 border-b border-gray-200">{t('monthlyTrendsChart', 'Monthly Trends')}</h4>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthLabel" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
                    {t('noAnalyticsData', 'No analytics data available for selected period')}
                  </div>
                )}
              </div>

              {/* Wastage by Type Pie Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 m-0 mb-4 pb-2 border-b border-gray-200">{t('wastageByTypeChart', 'Wastage by Type')}</h4>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
                    {t('noAnalyticsData', 'No analytics data available for selected period')}
                  </div>
                )}
              </div>
            </div>

            {/* Top Materials Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-4 pb-2 border-b border-gray-200">
                <Package size={18} />
                {t('topMaterialsTable', 'Top Materials by Wastage Cost')}
              </h4>
              {analyticsData.topMaterials.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b-2 border-gray-200 w-[50px] text-center max-md:py-2 max-md:px-2 max-md:text-xs">#</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b-2 border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{t('materialCode', 'Material Code')}</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b-2 border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{t('materialName', 'Material Name')}</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b-2 border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{t('count', 'Count')}</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b-2 border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{t('totalCost', 'Total Cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topMaterials.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-500 border-b border-gray-200 text-center max-md:py-2 max-md:px-2 max-md:text-xs">{index + 1}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 border-b border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{item.materialCode}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 border-b border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{item.materialName}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 border-b border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{item.count}</td>
                        <td className="py-3 px-4 text-sm font-medium text-emerald-600 border-b border-gray-200 max-md:py-2 max-md:px-2 max-md:text-xs">{formatCurrency(item.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
                  {t('noAnalyticsData', 'No analytics data available for selected period')}
                </div>
              )}
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
          <button className="btn btn-primary" onClick={onClose}>
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default WastageAnalytics
