import React, { useState, useEffect } from 'react'
import {
  Users,
  Droplet,
  Banknote,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  Package,
  FileText,
  Clock,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import '../styles/DashboardRefined.css'

/**
 * Refined Dashboard - Design Principles Applied
 *
 * Design Direction: Sophistication & Trust + Data & Analysis
 * - Cool slate/blue-gray foundation for professional gravitas
 * - Borders-only depth strategy (like Linear, Stripe)
 * - Monospace numbers with tabular alignment
 * - Dense but readable information hierarchy
 * - 4px grid system throughout
 */

const DashboardRefined = () => {
  const { user, selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="dashboard-refined">
        <div className="dashboard-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
          </div>
          <div className="skeleton-metrics">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
          <div className="skeleton-content">
            <div className="skeleton-card skeleton-large" />
            <div className="skeleton-card skeleton-large" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-refined">
      {/* Header Section */}
      <header className="dashboard-header-refined">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">
              {t('dashboard')}
            </h1>
            <p className="dashboard-subtitle">
              {selectedCompany?.name}
            </p>
          </div>
          <div className="header-right">
            <div className="header-meta">
              <span className="meta-time">{formatTime(currentTime)}</span>
              <span className="meta-date">{formatDate(currentTime)}</span>
            </div>
            <div className="header-user">
              <span className="user-greeting">Welcome back,</span>
              <span className="user-name">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {/* Total Customers */}
          <article className="metric-card">
            <div className="metric-header">
              <div className="metric-icon metric-icon-blue">
                <Users size={18} strokeWidth={1.5} />
              </div>
              <span className="metric-trend trend-up">
                <TrendingUp size={12} />
                <span>+12%</span>
              </span>
            </div>
            <div className="metric-body">
              <span className="metric-value">156</span>
              <span className="metric-label">{t('totalCustomers')}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-comparison">vs last month</span>
            </div>
          </article>

          {/* Fuel Inventory */}
          <article className="metric-card">
            <div className="metric-header">
              <div className="metric-icon metric-icon-amber">
                <Droplet size={18} strokeWidth={1.5} />
              </div>
              <span className="metric-trend trend-down">
                <TrendingDown size={12} />
                <span>-5%</span>
              </span>
            </div>
            <div className="metric-body">
              <span className="metric-value">45,230</span>
              <span className="metric-unit">L</span>
              <span className="metric-label">{t('fuelInventory')}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-comparison">vs last month</span>
            </div>
          </article>

          {/* Monthly Revenue */}
          <article className="metric-card">
            <div className="metric-header">
              <div className="metric-icon metric-icon-green">
                <Banknote size={18} strokeWidth={1.5} />
              </div>
              <span className="metric-trend trend-up">
                <TrendingUp size={12} />
                <span>+18%</span>
              </span>
            </div>
            <div className="metric-body">
              <span className="metric-currency">OMR</span>
              <span className="metric-value">128,450</span>
              <span className="metric-label">{t('monthlyRevenue')}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-comparison">vs last month</span>
            </div>
          </article>

          {/* Profit Margin */}
          <article className="metric-card">
            <div className="metric-header">
              <div className="metric-icon metric-icon-violet">
                <TrendingUp size={18} strokeWidth={1.5} />
              </div>
              <span className="metric-trend trend-up">
                <TrendingUp size={12} />
                <span>+2.3%</span>
              </span>
            </div>
            <div className="metric-body">
              <span className="metric-value">18.6</span>
              <span className="metric-unit">%</span>
              <span className="metric-label">{t('totalProfit')}</span>
            </div>
            <div className="metric-footer">
              <span className="metric-comparison">vs last month</span>
            </div>
          </article>
        </div>
      </section>

      {/* Alert Banner */}
      <section className="alert-section">
        <div className="alert-banner alert-warning">
          <div className="alert-icon">
            <AlertCircle size={18} />
          </div>
          <div className="alert-content">
            <span className="alert-title">{t('lowStock')}</span>
            <span className="alert-message">
              Engine Oil 20W-50 is running low (150L remaining)
            </span>
          </div>
          <button className="alert-action">
            {t('createOrder')}
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Inventory Status */}
        <section className="content-card">
          <div className="card-header">
            <div className="card-title-group">
              <Package size={18} className="card-icon" />
              <h2 className="card-title">{t('fuelInventory')}</h2>
            </div>
            <button className="card-action">
              View All
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="inventory-list">
              {/* Diesel */}
              <div className="inventory-item">
                <div className="inventory-info">
                  <span className="inventory-name">Diesel</span>
                  <span className="inventory-grade">Commercial Grade</span>
                </div>
                <div className="inventory-data">
                  <div className="inventory-bar">
                    <div className="inventory-fill" style={{ width: '77.5%' }} data-status="good" />
                  </div>
                  <div className="inventory-stats">
                    <span className="inventory-current">15,500L</span>
                    <span className="inventory-capacity">/ 20,000L</span>
                  </div>
                </div>
                <span className="inventory-badge badge-available">{t('available')}</span>
              </div>

              {/* Petrol 95 */}
              <div className="inventory-item">
                <div className="inventory-info">
                  <span className="inventory-name">Petrol 95</span>
                  <span className="inventory-grade">Premium Unleaded</span>
                </div>
                <div className="inventory-data">
                  <div className="inventory-bar">
                    <div className="inventory-fill" style={{ width: '54.7%' }} data-status="good" />
                  </div>
                  <div className="inventory-stats">
                    <span className="inventory-current">8,200L</span>
                    <span className="inventory-capacity">/ 15,000L</span>
                  </div>
                </div>
                <span className="inventory-badge badge-available">{t('available')}</span>
              </div>

              {/* Engine Oil - Low Stock */}
              <div className="inventory-item">
                <div className="inventory-info">
                  <span className="inventory-name">Engine Oil 20W-50</span>
                  <span className="inventory-grade">Multi-Grade</span>
                </div>
                <div className="inventory-data">
                  <div className="inventory-bar">
                    <div className="inventory-fill" style={{ width: '15%' }} data-status="low" />
                  </div>
                  <div className="inventory-stats">
                    <span className="inventory-current inventory-low">150L</span>
                    <span className="inventory-capacity">/ 1,000L</span>
                  </div>
                </div>
                <span className="inventory-badge badge-low">{t('lowStock')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="content-card">
          <div className="card-header">
            <div className="card-title-group">
              <FileText size={18} className="card-icon" />
              <h2 className="card-title">{t('recentTransactions')}</h2>
            </div>
            <button className="card-action">
              View All
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="transaction-list">
              {/* Transaction 1 */}
              <div className="transaction-item">
                <div className="transaction-primary">
                  <span className="transaction-id">SO-2024-089</span>
                  <span className="transaction-status status-delivered">{t('delivered')}</span>
                </div>
                <div className="transaction-secondary">
                  <span className="transaction-customer">Al Maha Petroleum</span>
                </div>
                <div className="transaction-details">
                  <span className="transaction-product">Diesel - 500L</span>
                  <span className="transaction-amount">OMR 225.00</span>
                </div>
                <div className="transaction-meta">
                  <Clock size={12} />
                  <span>Today, 2:30 PM</span>
                </div>
              </div>

              {/* Transaction 2 */}
              <div className="transaction-item">
                <div className="transaction-primary">
                  <span className="transaction-id">SO-2024-088</span>
                  <span className="transaction-status status-pending">{t('pending')}</span>
                </div>
                <div className="transaction-secondary">
                  <span className="transaction-customer">Gulf Construction LLC</span>
                </div>
                <div className="transaction-details">
                  <span className="transaction-product">Engine Oil - 20L</span>
                  <span className="transaction-amount">OMR 50.00</span>
                </div>
                <div className="transaction-meta">
                  <Clock size={12} />
                  <span>Today, 11:15 AM</span>
                </div>
              </div>

              {/* Transaction 3 */}
              <div className="transaction-item">
                <div className="transaction-primary">
                  <span className="transaction-id">SO-2024-087</span>
                  <span className="transaction-status status-delivered">{t('delivered')}</span>
                </div>
                <div className="transaction-secondary">
                  <span className="transaction-customer">Oman Logistics</span>
                </div>
                <div className="transaction-details">
                  <span className="transaction-product">Petrol 95 - 300L</span>
                  <span className="transaction-amount">OMR 180.00</span>
                </div>
                <div className="transaction-meta">
                  <Clock size={12} />
                  <span>Yesterday, 4:45 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Prices */}
        <section className="content-card content-card-full">
          <div className="card-header">
            <div className="card-title-group">
              <TrendingUp size={18} className="card-icon" />
              <h2 className="card-title">{t('standardPrice')}</h2>
            </div>
            <span className="card-badge">Live</span>
          </div>
          <div className="card-body">
            <div className="price-grid">
              {/* Crude Oil */}
              <div className="price-card">
                <div className="price-header">
                  <span className="price-name">Crude Oil (Brent)</span>
                  <span className="price-unit">per barrel</span>
                </div>
                <div className="price-body">
                  <span className="price-value">
                    <span className="price-currency">OMR</span>
                    <span className="price-amount">31.75</span>
                  </span>
                  <span className="price-change change-up">
                    <TrendingUp size={14} />
                    +1.2%
                  </span>
                </div>
              </div>

              {/* Diesel Wholesale */}
              <div className="price-card">
                <div className="price-header">
                  <span className="price-name">Diesel Wholesale</span>
                  <span className="price-unit">per liter</span>
                </div>
                <div className="price-body">
                  <span className="price-value">
                    <span className="price-currency">OMR</span>
                    <span className="price-amount">0.385</span>
                  </span>
                  <span className="price-change change-down">
                    <TrendingDown size={14} />
                    -0.5%
                  </span>
                </div>
              </div>

              {/* Petrol 95 */}
              <div className="price-card">
                <div className="price-header">
                  <span className="price-name">Petrol 95</span>
                  <span className="price-unit">per liter</span>
                </div>
                <div className="price-body">
                  <span className="price-value">
                    <span className="price-currency">OMR</span>
                    <span className="price-amount">0.415</span>
                  </span>
                  <span className="price-change change-up">
                    <TrendingUp size={14} />
                    +0.8%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardRefined
