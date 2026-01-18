import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity, Layers } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { useLocalization } from '../context/LocalizationContext'
import { fadeUpVariants } from '../config/animations'
// CSS moved to global index.css Tailwind

const StockChart = ({ inventoryData, title = "Inventory Overview", height = 400, fieldLabels }) => {
  const { t } = useLocalization()
  const [chartType, setChartType] = useState('bar') // 'bar', 'line', 'pie'
  
  // Default field labels for inventory context
  const defaultLabels = {
    currentStock: t('currentStock', 'Current Stock'),
    openingStock: t('openingStock', 'Opening Stock'),
    reorderLevel: t('reorderLevel', 'Reorder Level'),
    totalValue: t('totalValue', 'Total Value')
  }
  
  // Use provided labels or fall back to defaults
  const labels = fieldLabels || defaultLabels

  if (!inventoryData || inventoryData.length === 0) {
    return (
      <div className="stock-chart-container">
        <div className="chart-header">
          <h3>{title}</h3>
        </div>
        <div className="no-data">
          <Activity size={48} color="#ccc" />
          <p>{t('noDataAvailable', 'No data available')}</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = inventoryData.map(item => ({
    name: item.materialCode || item.name,
    currentStock: item.currentStock || 0,
    openingStock: item.openingStock || 0,
    totalValue: item.totalValue || 0,
    reorderLevel: item.reorderLevel || 0
  }))

  // Modern color palette matching design system
  const COLORS = {
    primary: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    indigo: '#6366F1'
  }

  const PIE_COLORS = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.purple,
    COLORS.cyan,
    COLORS.pink,
    COLORS.error,
    COLORS.indigo
  ]

  // Enhanced tooltip with modern styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          className="custom-tooltip-modern"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <p className="tooltip-label-modern">{label}</p>
          <div className="tooltip-entries">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-entry-modern">
                <span
                  className="tooltip-indicator"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="tooltip-name">{entry.name}:</span>
                <span className="tooltip-value">
                  {entry.dataKey === 'totalValue'
                    ? `OMR ${entry.value?.toFixed(2)}`
                    : entry.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )
    }
    return null
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: '#6B7280', fontSize: 12 }}
        />
        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Bar dataKey="currentStock" fill={COLORS.primary} name={labels.currentStock} radius={[8, 8, 0, 0]} />
        <Bar dataKey="openingStock" fill={COLORS.success} name={labels.openingStock} radius={[8, 8, 0, 0]} />
        <Bar dataKey="reorderLevel" fill={COLORS.warning} name={labels.reorderLevel} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: '#6B7280', fontSize: 12 }}
        />
        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Line
          type="monotone"
          dataKey="currentStock"
          stroke={COLORS.primary}
          name={labels.currentStock}
          strokeWidth={3}
          dot={{ r: 5, fill: COLORS.primary }}
          activeDot={{ r: 7 }}
        />
        <Line
          type="monotone"
          dataKey="openingStock"
          stroke={COLORS.success}
          name={labels.openingStock}
          strokeWidth={3}
          dot={{ r: 5, fill: COLORS.success }}
          activeDot={{ r: 7 }}
        />
        <Line
          type="monotone"
          dataKey="reorderLevel"
          stroke={COLORS.warning}
          name={labels.reorderLevel}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 4, fill: COLORS.warning }}
        />
      </LineChart>
    </ResponsiveContainer>
  )

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <defs>
          <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorOpening" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: '#6B7280', fontSize: 12 }}
        />
        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Area
          type="monotone"
          dataKey="currentStock"
          stroke={COLORS.primary}
          fillOpacity={1}
          fill="url(#colorCurrent)"
          name={labels.currentStock}
        />
        <Area
          type="monotone"
          dataKey="openingStock"
          stroke={COLORS.success}
          fillOpacity={1}
          fill="url(#colorOpening)"
          name={labels.openingStock}
        />
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="totalValue"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  return (
    <Card variant="elevated" className="stock-chart-card-modern">
      <CardHeader className="chart-header-modern">
        <div className="chart-title-wrapper">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {chartType === 'bar' && 'Bar comparison view'}
            {chartType === 'line' && 'Trend line view'}
            {chartType === 'area' && 'Area comparison view'}
            {chartType === 'pie' && 'Distribution view'}
          </CardDescription>
        </div>
        <div className="chart-controls-modern">
          <button
            className={`chart-type-btn-modern ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title={t('barChart', 'Bar Chart')}
          >
            <BarChart3 size={18} />
          </button>
          <button
            className={`chart-type-btn-modern ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
            title={t('lineChart', 'Line Chart')}
          >
            <TrendingUp size={18} />
          </button>
          <button
            className={`chart-type-btn-modern ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
            title="Area Chart"
          >
            <Layers size={18} />
          </button>
          <button
            className={`chart-type-btn-modern ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title={t('pieChart', 'Pie Chart')}
          >
            <PieChartIcon size={18} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="chart-content-modern">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartType}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'line' && renderLineChart()}
            {chartType === 'area' && renderAreaChart()}
            {chartType === 'pie' && renderPieChart()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default StockChart