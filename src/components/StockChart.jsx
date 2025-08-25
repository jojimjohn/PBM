import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react'
import { useLocalization } from '../context/LocalizationContext'
import './StockChart.css'

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

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-entry" style={{ color: entry.color }}>
              {entry.dataKey === 'totalValue' 
                ? `${entry.name}: OMR ${entry.value?.toFixed(2)}` 
                : `${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="currentStock" fill="#0088FE" name={labels.currentStock} />
        <Bar dataKey="openingStock" fill="#00C49F" name={labels.openingStock} />
        <Bar dataKey="reorderLevel" fill="#FF8042" name={labels.reorderLevel} />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="currentStock" stroke="#0088FE" name={labels.currentStock} strokeWidth={2} />
        <Line type="monotone" dataKey="openingStock" stroke="#00C49F" name={labels.openingStock} strokeWidth={2} />
        <Line type="monotone" dataKey="reorderLevel" stroke="#FF8042" name={labels.reorderLevel} strokeWidth={2} strokeDasharray="5 5" />
      </LineChart>
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
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="totalValue"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  return (
    <div className="stock-chart-container">
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="chart-controls">
          <button
            className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title={t('barChart', 'Bar Chart')}
          >
            <BarChart3 size={16} />
          </button>
          <button
            className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
            title={t('lineChart', 'Line Chart')}
          >
            <TrendingUp size={16} />
          </button>
          <button
            className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title={t('pieChart', 'Pie Chart')}
          >
            <PieChartIcon size={16} />
          </button>
        </div>
      </div>
      
      <div className="chart-content">
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'line' && renderLineChart()}
        {chartType === 'pie' && renderPieChart()}
      </div>
    </div>
  )
}

export default StockChart