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
import './WastageAnalytics.css'

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
        <div className="chart-tooltip">
          <p className="tooltip-label">{data.wasteType}</p>
          <p className="tooltip-value">Count: {data.count}</p>
          <p className="tooltip-value">Cost: {formatCurrency(data.totalCost)}</p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">Cost: {formatCurrency(payload[0].value)}</p>
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
      className="wastage-analytics-modal"
    >
      <div className="wastage-analytics">
        {/* Header with Date Filter and Export */}
        <div className="analytics-header">
          <div className="date-filter">
            <Calendar size={18} />
            <Select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="date-range-select"
            >
              {dateRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            {dateRange === 'custom' && (
              <div className="custom-date-pickers">
                <DateInput
                  value={customDateFrom}
                  onChange={setCustomDateFrom}
                  maxDate={customDateTo || new Date().toISOString().split('T')[0]}
                />
                <span className="date-separator">-</span>
                <DateInput
                  value={customDateTo}
                  onChange={setCustomDateTo}
                  minDate={customDateFrom}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          <button className="btn btn-outline export-btn" onClick={handleExport} disabled={loading}>
            <Download size={16} />
            {t('exportAnalytics', 'Export to CSV')}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="analytics-loading">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="analytics-error">
            <AlertTriangle size={48} />
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchAnalytics}>
              <RefreshCw size={16} />
              {t('retry', 'Retry')}
            </button>
          </div>
        )}

        {/* Analytics Content */}
        {!loading && !error && (
          <>
            {/* Summary Metric Cards */}
            <div className="analytics-metrics">
              <div className="metric-card">
                <div className="metric-icon total">
                  <TrendingUp size={20} />
                </div>
                <div className="metric-content">
                  <span className="metric-value">{summary.totalWastages}</span>
                  <span className="metric-label">{t('totalWastagesCard', 'Total Wastages')}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon cost">
                  <DollarSign size={20} />
                </div>
                <div className="metric-content">
                  <span className="metric-value">{formatCurrency(summary.totalCost)}</span>
                  <span className="metric-label">{t('totalWasteCostCard', 'Total Waste Cost')}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon pending">
                  <Clock size={20} />
                </div>
                <div className="metric-content">
                  <span className="metric-value">{summary.pendingCount}</span>
                  <span className="metric-label">{t('pendingApprovalsCard', 'Pending Approvals')}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon approved">
                  <CheckCircle size={20} />
                </div>
                <div className="metric-content">
                  <span className="metric-value">{summary.approvedCount}</span>
                  <span className="metric-label">{t('approvedWastagesCard', 'Approved')}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon rejected">
                  <XCircle size={20} />
                </div>
                <div className="metric-content">
                  <span className="metric-value">{summary.rejectedCount}</span>
                  <span className="metric-label">{t('rejectedWastagesCard', 'Rejected')}</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="analytics-charts">
              {/* Monthly Trends Bar Chart */}
              <div className="chart-container">
                <h4 className="chart-title">{t('monthlyTrendsChart', 'Monthly Trends')}</h4>
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
                  <div className="no-chart-data">
                    {t('noAnalyticsData', 'No analytics data available for selected period')}
                  </div>
                )}
              </div>

              {/* Wastage by Type Pie Chart */}
              <div className="chart-container">
                <h4 className="chart-title">{t('wastageByTypeChart', 'Wastage by Type')}</h4>
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
                  <div className="no-chart-data">
                    {t('noAnalyticsData', 'No analytics data available for selected period')}
                  </div>
                )}
              </div>
            </div>

            {/* Top Materials Table */}
            <div className="analytics-table">
              <h4 className="table-title">
                <Package size={18} />
                {t('topMaterialsTable', 'Top Materials by Wastage Cost')}
              </h4>
              {analyticsData.topMaterials.length > 0 ? (
                <table className="top-materials-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('materialCode', 'Material Code')}</th>
                      <th>{t('materialName', 'Material Name')}</th>
                      <th>{t('count', 'Count')}</th>
                      <th>{t('totalCost', 'Total Cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topMaterials.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.materialCode}</td>
                        <td>{item.materialName}</td>
                        <td>{item.count}</td>
                        <td>{formatCurrency(item.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-table-data">
                  {t('noAnalyticsData', 'No analytics data available for selected period')}
                </div>
              )}
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default WastageAnalytics
