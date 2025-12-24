import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Calendar, Filter, TrendingUp, BarChart3, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { useLocalization } from '../context/LocalizationContext'
import inventoryService from '../services/inventoryService'
import './InventoryCharts.css'

const InventoryCharts = ({ materials = [] }) => {
  const { t } = useLocalization()

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState(null)

  // Date range state
  const [datePreset, setDatePreset] = useState('30days')
  const [customRange, setCustomRange] = useState({
    start: '',
    end: ''
  })

  // Material selection state
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false)
  const userHasInteracted = useRef(false) // Track if user manually changed selection

  // Date presets
  const datePresets = [
    { value: '7days', label: t('last7Days', 'Last 7 Days'), days: 7 },
    { value: '30days', label: t('last30Days', 'Last 30 Days'), days: 30 },
    { value: '90days', label: t('last90Days', 'Last 90 Days'), days: 90 },
    { value: 'thisMonth', label: t('thisMonth', 'This Month'), days: 0 },
    { value: 'custom', label: t('customRange', 'Custom Range'), days: 0 }
  ]

  // Calculate date range based on preset
  const getDateRange = useCallback(() => {
    const end = new Date()
    let start = new Date()

    if (datePreset === 'custom') {
      return {
        start: customRange.start,
        end: customRange.end
      }
    }

    if (datePreset === 'thisMonth') {
      start = new Date(end.getFullYear(), end.getMonth(), 1)
    } else {
      const preset = datePresets.find(p => p.value === datePreset)
      if (preset) {
        start.setDate(end.getDate() - preset.days)
      }
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }, [datePreset, customRange])

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const dateRange = getDateRange()

      // Don't fetch if custom range is incomplete
      if (datePreset === 'custom' && (!dateRange.start || !dateRange.end)) {
        setLoading(false)
        return
      }

      const response = await inventoryService.getChartData({
        startDate: dateRange.start,
        endDate: dateRange.end,
        materialIds: selectedMaterials.length > 0 ? selectedMaterials : undefined
      })

      if (response.success) {
        setChartData(response.data)

        // Auto-select first 5 materials ONLY on initial load (user hasn't interacted yet)
        if (!userHasInteracted.current && selectedMaterials.length === 0 && response.data.allMaterials) {
          const initialSelection = response.data.allMaterials
            .slice(0, 5)
            .map(m => m.id)
          setSelectedMaterials(initialSelection)
        }
      } else {
        setError(response.error || 'Failed to load chart data')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [getDateRange, selectedMaterials, datePreset])

  // Initial load
  useEffect(() => {
    fetchChartData()
  }, []) // Only on mount

  // Refetch when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (datePreset !== 'custom' || (customRange.start && customRange.end)) {
        fetchChartData()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [datePreset, customRange.start, customRange.end, selectedMaterials])

  // Toggle material selection
  const toggleMaterial = (materialId) => {
    userHasInteracted.current = true // User manually changed selection
    setSelectedMaterials(prev => {
      if (prev.includes(materialId)) {
        return prev.filter(id => id !== materialId)
      }
      if (prev.length >= 5) {
        // Replace oldest selection
        return [...prev.slice(1), materialId]
      }
      return [...prev, materialId]
    })
  }

  // Select/Clear all materials
  const selectAllMaterials = () => {
    userHasInteracted.current = true // User manually changed selection
    const allIds = (chartData?.allMaterials || []).slice(0, 5).map(m => m.id)
    setSelectedMaterials(allIds)
  }

  const clearMaterialSelection = () => {
    userHasInteracted.current = true // User manually cleared selection
    setSelectedMaterials([])
  }

  // Custom tooltip for line chart
  const StockLevelTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null

    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-items">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span
                className="tooltip-color"
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-label">{entry.name}:</span>
              <span className="tooltip-value">
                {parseFloat(entry.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Custom tooltip for bar chart
  const MovementTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null

    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-items">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span
                className="tooltip-color"
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-label">{entry.name}:</span>
              <span className="tooltip-value">
                {parseFloat(entry.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Get material info for chart lines
  const getSelectedMaterialInfo = () => {
    if (!chartData?.materialInfo) return []
    return chartData.materialInfo.filter(m => selectedMaterials.includes(m.id))
  }

  return (
    <div className="inventory-charts-dashboard">
      {/* Filter Bar */}
      <div className="charts-filter-bar">
        {/* Date Range Selector */}
        <div className="filter-group">
          <label className="filter-label">
            <Calendar size={16} />
            {t('dateRange', 'Date Range')}
          </label>
          <div className="date-preset-buttons">
            {datePresets.map(preset => (
              <button
                key={preset.value}
                className={`preset-btn ${datePreset === preset.value ? 'active' : ''}`}
                onClick={() => setDatePreset(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {datePreset === 'custom' && (
            <div className="custom-date-inputs">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="date-input"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="date-input"
              />
            </div>
          )}
        </div>

        {/* Material Selector */}
        <div className="filter-group">
          <label className="filter-label">
            <Filter size={16} />
            {t('selectMaterials', 'Select Materials')} ({selectedMaterials.length}/5)
          </label>
          <div className="material-selector">
            <button
              className="material-dropdown-trigger"
              onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
            >
              {selectedMaterials.length === 0
                ? t('selectMaterials', 'Select Materials')
                : `${selectedMaterials.length} ${t('selected', 'selected')}`}
            </button>
            {showMaterialDropdown && (
              <div className="material-dropdown">
                <div className="dropdown-actions">
                  <button onClick={selectAllMaterials} className="action-btn">
                    {t('selectAll', 'Select All')}
                  </button>
                  <button onClick={clearMaterialSelection} className="action-btn">
                    {t('clearSelection', 'Clear')}
                  </button>
                </div>
                <div className="material-list">
                  {(chartData?.allMaterials || []).map(material => (
                    <label key={material.id} className="material-option">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material.id)}
                        onChange={() => toggleMaterial(material.id)}
                      />
                      <span
                        className="material-color"
                        style={{ backgroundColor: material.color }}
                      />
                      <span className="material-name">
                        {material.code} - {material.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          className="refresh-btn"
          onClick={fetchChartData}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {t('refresh', 'Refresh')}
        </button>
      </div>

      {/* Summary Stats */}
      {chartData?.summary && (
        <div className="charts-summary">
          <div className="summary-card receipts">
            <span className="summary-label">{t('receipts', 'Receipts')}</span>
            <span className="summary-value">+{chartData.summary.totalReceipts.toFixed(2)}</span>
          </div>
          <div className="summary-card sales">
            <span className="summary-label">{t('sales', 'Sales')}</span>
            <span className="summary-value">-{chartData.summary.totalSales.toFixed(2)}</span>
          </div>
          <div className="summary-card wastage">
            <span className="summary-label">{t('wastage', 'Wastage')}</span>
            <span className="summary-value">-{chartData.summary.totalWastage.toFixed(2)}</span>
          </div>
          <div className={`summary-card net ${chartData.summary.netChange >= 0 ? 'positive' : 'negative'}`}>
            <span className="summary-label">{t('netChange', 'Net Change')}</span>
            <span className="summary-value">
              {chartData.summary.netChange >= 0 ? '+' : ''}{chartData.summary.netChange.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="charts-error">
          <p>{error}</p>
          <button onClick={fetchChartData}>{t('retry', 'Retry')}</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="charts-loading">
          <RefreshCw size={24} className="spinning" />
          <p>{t('loadingCharts', 'Loading charts...')}</p>
        </div>
      )}

      {/* Charts Grid */}
      {!loading && chartData && (
        <div className="charts-grid">
          {/* Stock Level Trends Chart */}
          <Card className="chart-card">
            <CardHeader className="chart-header">
              <div className="chart-title-row">
                <TrendingUp size={20} />
                <CardTitle>{t('stockLevelTrends', 'Stock Level Trends')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="chart-content">
              {chartData.stockLevels && chartData.stockLevels.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={chartData.stockLevels}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip content={<StockLevelTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {getSelectedMaterialInfo().map(material => (
                      <Line
                        key={material.id}
                        type="monotone"
                        dataKey={material.code}
                        name={material.name}
                        stroke={material.color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: material.color }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">
                  <p>{t('noDataForPeriod', 'No data available for selected period')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movement Analysis Chart */}
          <Card className="chart-card">
            <CardHeader className="chart-header">
              <div className="chart-title-row">
                <BarChart3 size={20} />
                <CardTitle>{t('movementAnalysis', 'Movement Analysis')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="chart-content">
              {chartData.movements && chartData.movements.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={chartData.movements}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip content={<MovementTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar
                      dataKey="receipts"
                      name={t('receipts', 'Receipts')}
                      fill="#22C55E"
                      stackId="stack"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="sales"
                      name={t('sales', 'Sales')}
                      fill="#3B82F6"
                      stackId="stack"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="wastage"
                      name={t('wastage', 'Wastage')}
                      fill="#EF4444"
                      stackId="stack"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="adjustments"
                      name={t('adjustments', 'Adjustments')}
                      fill="#6B7280"
                      stackId="stack"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">
                  <p>{t('noDataForPeriod', 'No data available for selected period')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Click outside handler for dropdown */}
      {showMaterialDropdown && (
        <div
          className="dropdown-backdrop"
          onClick={() => setShowMaterialDropdown(false)}
        />
      )}
    </div>
  )
}

export default InventoryCharts
