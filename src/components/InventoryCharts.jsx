import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Calendar, Filter, TrendingUp, BarChart3, RefreshCw, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { useLocalization } from '../context/LocalizationContext'
import inventoryService from '../services/inventoryService'

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
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="font-semibold text-slate-700 text-sm mb-2 pb-2 border-b border-slate-100">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-800 ml-auto">
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
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="font-semibold text-slate-700 text-sm mb-2 pb-2 border-b border-slate-100">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-800 ml-auto">
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
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date Range Selector */}
          <div className="flex-1 min-w-[280px]">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar size={16} className="text-slate-500" />
              {t('dateRange', 'Date Range')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {datePresets.map(preset => (
                <button
                  key={preset.value}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    datePreset === preset.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  onClick={() => setDatePreset(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-slate-500 text-sm">to</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Material Selector */}
          <div className="relative min-w-[200px]">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Filter size={16} className="text-slate-500" />
              {t('selectMaterials', 'Select Materials')} ({selectedMaterials.length}/5)
            </label>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-left bg-white border border-slate-300 rounded-md hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
              >
                <span className="text-slate-700">
                  {selectedMaterials.length === 0
                    ? t('selectMaterials', 'Select Materials')
                    : `${selectedMaterials.length} ${t('selected', 'selected')}`}
                </span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${showMaterialDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showMaterialDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[300px] overflow-hidden">
                  <div className="flex items-center gap-2 p-2 border-b border-slate-100 bg-slate-50">
                    <button
                      onClick={selectAllMaterials}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {t('selectAll', 'Select All')}
                    </button>
                    <button
                      onClick={clearMaterialSelection}
                      className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      {t('clearSelection', 'Clear')}
                    </button>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto p-1">
                    {(chartData?.allMaterials || []).map(material => (
                      <label
                        key={material.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(material.id)}
                          onChange={() => toggleMaterial(material.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: material.color }}
                        />
                        <span className="text-slate-700 truncate">
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={fetchChartData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {t('refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {chartData?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="block text-xs font-medium text-emerald-600 uppercase tracking-wide">{t('receipts', 'Receipts')}</span>
              <span className="text-lg font-bold text-emerald-700">+{chartData.summary.totalReceipts.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <div>
              <span className="block text-xs font-medium text-blue-600 uppercase tracking-wide">{t('sales', 'Sales & Allocations')}</span>
              <span className="text-lg font-bold text-blue-700">-{chartData.summary.totalSales.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg">
              <RefreshCw size={20} />
            </div>
            <div>
              <span className="block text-xs font-medium text-red-600 uppercase tracking-wide">{t('wastage', 'Wastage')}</span>
              <span className="text-lg font-bold text-red-700">-{chartData.summary.totalWastage.toFixed(2)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            chartData.summary.netChange >= 0
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
              chartData.summary.netChange >= 0
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span className={`block text-xs font-medium uppercase tracking-wide ${
                chartData.summary.netChange >= 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>{t('netChange', 'Net Change')}</span>
              <span className={`text-lg font-bold ${
                chartData.summary.netChange >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {chartData.summary.netChange >= 0 ? '+' : ''}{chartData.summary.netChange.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-700">{error}</p>
          <button
            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            onClick={fetchChartData}
          >
            {t('retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
          <p>{t('loadingCharts', 'Loading charts...')}</p>
        </div>
      )}

      {/* Charts Grid */}
      {!loading && chartData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          {/* Stock Level Trends Chart */}
          <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <CardHeader className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700">
                <TrendingUp size={20} className="text-blue-600" />
                <CardTitle className="text-base font-semibold">{t('stockLevelTrends', 'Stock Level Trends')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
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
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <BarChart3 size={48} className="mb-4 opacity-50" />
                  <p>{t('noDataForPeriod', 'No data available for selected period')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movement Analysis Chart */}
          <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <CardHeader className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700">
                <BarChart3 size={20} className="text-purple-600" />
                <CardTitle className="text-base font-semibold">{t('movementAnalysis', 'Movement Analysis')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
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
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <BarChart3 size={48} className="mb-4 opacity-50" />
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
          className="fixed inset-0 z-40"
          onClick={() => setShowMaterialDropdown(false)}
        />
      )}
    </div>
  )
}

export default InventoryCharts
