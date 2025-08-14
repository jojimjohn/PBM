import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import '../../../styles/Dashboard.css'
import '../styles/Dashboard.css'

const ScrapMaterialsDashboard = () => {
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
    <div className="scrap-dashboard-page">
      <div className="page-header">
        <h1>{t('scrapMaterials')} {t('dashboard')}</h1>
        <p>Welcome back to {selectedCompany?.name}, {user?.name}</p>
      </div>
      
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon suppliers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>{t('suppliers')}</h3>
              <p className="stat-value">89</p>
              <p className="stat-change positive">+7% {t('fromLastMonth')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon inventory">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>Total Material Weight</h3>
              <p className="stat-value">12,340 KG</p>
              <p className="stat-change positive">+15% {t('fromLastMonth')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon revenue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>Monthly Revenue</h3>
              <p className="stat-value">OMR 45,780</p>
              <p className="stat-change positive">+22% {t('fromLastMonth')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon processed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
                <path d="M2 11h20" />
                <path d="M2 16h20" />
                <path d="M6 19h12" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>Materials Processed</h3>
              <p className="stat-value">8,950 KG</p>
              <p className="stat-change positive">+28% {t('fromLastMonth')}</p>
            </div>
          </div>
        </div>
        
        {/* Alerts and Quick Actions Row */}
        <div className="alerts-actions-row">
          <div className="alerts-section">
            <div className="alert info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div className="alert-content">
                <h4>Market Update</h4>
                <p>Copper prices have increased by 5.2% today. Consider selling copper inventory while prices are high.</p>
              </div>
              <button className="alert-action">View Details</button>
            </div>
            
            <div className="alert warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="alert-content">
                <h4>Storage Capacity Alert</h4>
                <p>Warehouse A is at 85% capacity. Consider processing or selling materials to free up space.</p>
              </div>
              <button className="alert-action">Manage Storage</button>
            </div>
          </div>
          
          <div className="quick-actions-card">
            <div className="quick-actions-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="action-tiles-grid">
              <button className="action-tile primary">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <span>Purchase</span>
              </button>
              
              <button className="action-tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span>Sell</span>
              </button>
              
              <button className="action-tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 9h6v6H9z" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <span>Weigh</span>
              </button>
              
              <button className="action-tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                  </svg>
                </div>
                <span>Reports</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="scrap-dashboard-grid">
          <div className="dashboard-card material-inventory">
            <h2>Material Inventory</h2>
            <div className="material-list">
              <div className="material-item">
                <div className="material-info">
                  <h4>Copper Wire</h4>
                  <p className="material-grade">Grade A</p>
                </div>
                <div className="material-quantity">
                  <span className="weight">1,250 KG</span>
                  <span className="rate">OMR 3.20/KG</span>
                  <span className="value">OMR 4,000</span>
                </div>
                <div className="material-status high-value">High Value</div>
              </div>
              
              <div className="material-item">
                <div className="material-info">
                  <h4>Aluminum Cans</h4>
                  <p className="material-grade">Recycled</p>
                </div>
                <div className="material-quantity">
                  <span className="weight">2,800 KG</span>
                  <span className="rate">OMR 1.50/KG</span>
                  <span className="value">OMR 4,200</span>
                </div>
                <div className="material-status ready">Ready to Sell</div>
              </div>
              
              <div className="material-item">
                <div className="material-info">
                  <h4>Steel Scrap</h4>
                  <p className="material-grade">Mixed Grade</p>
                </div>
                <div className="material-quantity">
                  <span className="weight">4,200 KG</span>
                  <span className="rate">OMR 0.85/KG</span>
                  <span className="value">OMR 3,570</span>
                </div>
                <div className="material-status processing">Processing</div>
              </div>
              
              <div className="material-item">
                <div className="material-info">
                  <h4>Brass Fittings</h4>
                  <p className="material-grade">Clean</p>
                </div>
                <div className="material-quantity">
                  <span className="weight">890 KG</span>
                  <span className="rate">OMR 2.80/KG</span>
                  <span className="value">OMR 2,492</span>
                </div>
                <div className="material-status high-value">High Value</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card recent-transactions">
            <h2>Recent Transactions</h2>
            <div className="transactions-list">
              <div className="transaction-item purchase">
                <div className="transaction-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <div className="transaction-details">
                  <h4>Material Purchase</h4>
                  <p className="supplier">Al Noor Scrap Collectors</p>
                  <p className="material">Copper Wire - 150 KG</p>
                  <p className="time">1 hour ago</p>
                </div>
                <div className="transaction-amount purchase">
                  -OMR 480
                </div>
              </div>
              
              <div className="transaction-item sale">
                <div className="transaction-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="transaction-details">
                  <h4>Material Sale</h4>
                  <p className="buyer">Emirates Recycling</p>
                  <p className="material">Aluminum Cans - 200 KG</p>
                  <p className="time">3 hours ago</p>
                </div>
                <div className="transaction-amount sale">
                  +OMR 300
                </div>
              </div>
              
              <div className="transaction-item processing">
                <div className="transaction-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
                    <path d="M2 11h20" />
                    <path d="M2 16h20" />
                  </svg>
                </div>
                <div className="transaction-details">
                  <h4>Material Processing</h4>
                  <p className="process">Sorting & Cleaning</p>
                  <p className="material">Steel Scrap - 500 KG</p>
                  <p className="time">5 hours ago</p>
                </div>
                <div className="transaction-status">
                  In Progress
                </div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card market-prices">
            <h2>Current Market Prices</h2>
            <div className="prices-list">
              <div className="price-item">
                <div className="price-info">
                  <h4>Copper</h4>
                  <p className="price-trend up">Trending Up</p>
                </div>
                <div className="price-details">
                  <span className="current-price">OMR 3.25/KG</span>
                  <span className="price-change positive">+5.2%</span>
                </div>
              </div>
              
              <div className="price-item">
                <div className="price-info">
                  <h4>Aluminum</h4>
                  <p className="price-trend stable">Stable</p>
                </div>
                <div className="price-details">
                  <span className="current-price">OMR 1.48/KG</span>
                  <span className="price-change neutral">±0.1%</span>
                </div>
              </div>
              
              <div className="price-item">
                <div className="price-info">
                  <h4>Steel</h4>
                  <p className="price-trend down">Declining</p>
                </div>
                <div className="price-details">
                  <span className="current-price">OMR 0.82/KG</span>
                  <span className="price-change negative">-2.8%</span>
                </div>
              </div>
              
              <div className="price-item">
                <div className="price-info">
                  <h4>Brass</h4>
                  <p className="price-trend up">Trending Up</p>
                </div>
                <div className="price-details">
                  <span className="current-price">OMR 2.85/KG</span>
                  <span className="price-change positive">+3.1%</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default ScrapMaterialsDashboard