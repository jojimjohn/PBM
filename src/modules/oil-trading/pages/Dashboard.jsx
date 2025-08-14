import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import '../../../styles/Dashboard.css'
import '../styles/Dashboard.css'

const OilTradingDashboard = () => {
  const { user, selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message={t('loading')} size="large" />
      </div>
    )
  }
  
  return (
    <div className="oil-dashboard-page">
      <div className="page-header">
        <h1>{t('oilTrading')} {t('dashboard')}</h1>
        <p>Welcome back to {selectedCompany?.name}, {user?.name}</p>
      </div>
      
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon customers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>{t('totalCustomers')}</h3>
              <p className="stat-value">156</p>
              <p className="stat-change positive">+12% {t('fromLastMonth')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon fuel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2.04 4.6 4.14 5.93s3.83 2.34 4.36 4.05c0 3.22-2.23 5.99-5.5 5.99c-3.75 0-2.5-3-2.5-3s1.14-2 0-5.39z" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>{t('fuelInventory')}</h3>
              <p className="stat-value">45,230 L</p>
              <p className="stat-change negative">-5% {t('fromLastMonth')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon sales">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>{t('monthlyRevenue')}</h3>
              <p className="stat-value">OMR 128,450</p>
              <p className="stat-change positive">+18% {t('fromLastMonth')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon profit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>{t('totalProfit')}</h3>
              <p className="stat-value">18.6%</p>
              <p className="stat-change positive">+2.3% {t('fromLastMonth')}</p>
            </div>
          </div>
        </div>
        
        {/* Alerts and Quick Actions Row */}
        <div className="alerts-actions-row">
          <div className="alerts-section">
            <div className="alert warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="alert-content">
                <h4>{t('lowStock')}</h4>
                <p>Engine Oil 20W-50 is running low (150L remaining). Consider reordering soon.</p>
              </div>
              <button className="alert-action">{t('createOrder')}</button>
            </div>
          </div>
          
          <div className="quick-actions-card">
            <div className="quick-actions-header">
              <h3>{t('recentTransactions')}</h3>
            </div>
            <div className="action-tiles-grid">
              <button className="action-tile primary">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span>{t('sales')}</span>
              </button>
              
              <button className="action-tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <span>{t('purchase')}</span>
              </button>
              
              <button className="action-tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <span>{t('invoice')}</span>
              </button>
              
              <button className="action-tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                  </svg>
                </div>
                <span>{t('reports')}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="oil-dashboard-grid">
          <div className="dashboard-card fuel-inventory">
            <h2>{t('fuelInventory')}</h2>
            <div className="fuel-list">
              <div className="fuel-item">
                <div className="fuel-info">
                  <h4>Diesel</h4>
                  <p className="fuel-grade">Commercial Grade</p>
                </div>
                <div className="fuel-quantity">
                  <span className="current">15,500L</span>
                  <div className="fuel-bar">
                    <div className="fuel-level" style={{width: '78%'}}></div>
                  </div>
                  <span className="capacity">20,000L capacity</span>
                </div>
                <div className="fuel-status in-stock">{t('available')}</div>
              </div>
              
              <div className="fuel-item">
                <div className="fuel-info">
                  <h4>Petrol 95</h4>
                  <p className="fuel-grade">Premium Unleaded</p>
                </div>
                <div className="fuel-quantity">
                  <span className="current">8,200L</span>
                  <div className="fuel-bar">
                    <div className="fuel-level" style={{width: '55%'}}></div>
                  </div>
                  <span className="capacity">15,000L capacity</span>
                </div>
                <div className="fuel-status in-stock">{t('available')}</div>
              </div>
              
              <div className="fuel-item">
                <div className="fuel-info">
                  <h4>Engine Oil 20W-50</h4>
                  <p className="fuel-grade">Multi-Grade</p>
                </div>
                <div className="fuel-quantity">
                  <span className="current">150L</span>
                  <div className="fuel-bar">
                    <div className="fuel-level low" style={{width: '15%'}}></div>
                  </div>
                  <span className="capacity">1,000L capacity</span>
                </div>
                <div className="fuel-status low-stock">{t('lowStock')}</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card recent-orders">
            <h2>{t('recentTransactions')}</h2>
            <div className="orders-list">
              <div className="order-item">
                <div className="order-info">
                  <h4>SO-2024-089</h4>
                  <p className="customer">Al Maha Petroleum</p>
                  <p className="order-date">Today, 2:30 PM</p>
                </div>
                <div className="order-details">
                  <p className="product">Diesel - 500L</p>
                  <p className="amount">OMR 225.00</p>
                </div>
                <div className="order-status delivered">{t('delivered')}</div>
              </div>
              
              <div className="order-item">
                <div className="order-info">
                  <h4>SO-2024-088</h4>
                  <p className="customer">Gulf Construction LLC</p>
                  <p className="order-date">Today, 11:15 AM</p>
                </div>
                <div className="order-details">
                  <p className="product">Engine Oil - 20L</p>
                  <p className="amount">OMR 50.00</p>
                </div>
                <div className="order-status pending">{t('pending')}</div>
              </div>
              
              <div className="order-item">
                <div className="order-info">
                  <h4>SO-2024-087</h4>
                  <p className="customer">Oman Logistics</p>
                  <p className="order-date">Yesterday, 4:45 PM</p>
                </div>
                <div className="order-details">
                  <p className="product">Petrol 95 - 300L</p>
                  <p className="amount">OMR 180.00</p>
                </div>
                <div className="order-status delivered">{t('delivered')}</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card price-tracker">
            <h2>{t('standardPrice')}</h2>
            <div className="price-list">
              <div className="price-item">
                <div className="price-info">
                  <h4>Crude Oil (Brent)</h4>
                  <p className="price-unit">per barrel</p>
                </div>
                <div className="price-value">
                  <span className="current-price">$82.45</span>
                  <span className="price-change positive">+1.2%</span>
                </div>
              </div>
              
              <div className="price-item">
                <div className="price-info">
                  <h4>Diesel Wholesale</h4>
                  <p className="price-unit">per liter</p>
                </div>
                <div className="price-value">
                  <span className="current-price">OMR 0.385</span>
                  <span className="price-change negative">-0.5%</span>
                </div>
              </div>
              
              <div className="price-item">
                <div className="price-info">
                  <h4>Petrol 95</h4>
                  <p className="price-unit">per liter</p>
                </div>
                <div className="price-value">
                  <span className="current-price">OMR 0.415</span>
                  <span className="price-change positive">+0.8%</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default OilTradingDashboard