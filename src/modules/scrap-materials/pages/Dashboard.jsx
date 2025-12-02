import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Package, DollarSign, TrendingUp, ShoppingCart, Scale, Activity, Info, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Alert from '../../../components/ui/Alert'
import { Skeleton, SkeletonCard } from '../../../components/ui/Progress'
import { Button } from '../../../components/ui/Button'
import { gridContainerVariants, gridItemVariants, fadeUpVariants } from '../../../config/animations'
import '../styles/Dashboard.css'
import '../styles/DashboardModern.css'

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

  // Skeleton loading state
  if (loading) {
    return (
      <div className="scrap-dashboard-page">
        <div className="page-header">
          <Skeleton variant="text" width="300px" height="36px" />
          <Skeleton variant="text" width="400px" height="20px" />
        </div>

        <div className="dashboard-content">
          <div className="stats-grid">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="dashboard-grid-modern">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="scrap-dashboard-page">
      {/* Page Header */}
      <motion.div
        className="page-header-modern"
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="page-title">{t('scrapMaterials')} {t('dashboard')}</h1>
          <p className="page-subtitle">Welcome back to {selectedCompany?.name}, {user?.name}</p>
        </div>
      </motion.div>

      <div className="dashboard-content">
        {/* Stats Grid with Modern Cards */}
        <motion.div
          className="stats-grid-modern"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Total Suppliers Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper suppliers-icon">
                  <Users className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{t('suppliers')}</p>
                  <h3 className="stat-value">89</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+7% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Material Weight Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper inventory-icon">
                  <Package className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Material Weight</p>
                  <h3 className="stat-value">12,340 KG</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+15% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Revenue Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper revenue-icon">
                  <DollarSign className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Monthly Revenue</p>
                  <h3 className="stat-value">OMR 45,780</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+22% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Materials Processed Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper processed-icon">
                  <Activity className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Materials Processed</p>
                  <h3 className="stat-value">8,950 KG</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+28% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Modern Alerts Section */}
        <motion.div
          className="alerts-section-modern"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <Alert
            variant="info"
            title="Market Update"
            description="Copper prices have increased by 5.2% today. Consider selling copper inventory while prices are high."
            icon={<Info />}
            action={
              <Button size="small" variant="secondary">
                View Details
              </Button>
            }
          />
        </motion.div>

        <motion.div
          className="alerts-section-modern"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <Alert
            variant="warning"
            title="Storage Capacity Alert"
            description="Warehouse A is at 85% capacity. Consider processing or selling materials to free up space."
            icon={<AlertTriangle />}
            action={
              <Button size="small" variant="warning">
                Manage Storage
              </Button>
            }
          />
        </motion.div>

        {/* Quick Actions Row */}
        <motion.div
          className="quick-actions-modern"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={gridItemVariants}>
            <Button
              variant="primary"
              size="large"
              icon={<ShoppingCart />}
              fullWidth
              className="action-button-modern"
            >
              Purchase
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<DollarSign />}
              fullWidth
              className="action-button-modern"
            >
              Sell
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<Scale />}
              fullWidth
              className="action-button-modern"
            >
              Weigh
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<Activity />}
              fullWidth
              className="action-button-modern"
            >
              Reports
            </Button>
          </motion.div>
        </motion.div>


        {/* Main Content Grid */}
        <motion.div
          className="dashboard-grid-modern"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Material Inventory Card */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle as="h2">
                  <Package size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  Material Inventory
                </CardTitle>
                <CardDescription>Current stock levels and values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="material-list-modern">
                  {/* Copper Wire */}
                  <div className="material-item-modern">
                    <div className="material-header">
                      <div>
                        <h4 className="material-name">Copper Wire</h4>
                        <p className="material-grade">Grade A</p>
                      </div>
                      <span className="material-status high-value">High Value</span>
                    </div>
                    <div className="material-details">
                      <span className="material-weight">1,250 KG</span>
                      <span className="material-rate">OMR 3.20/KG</span>
                      <span className="material-value">OMR 4,000</span>
                    </div>
                  </div>

                  {/* Aluminum Cans */}
                  <div className="material-item-modern">
                    <div className="material-header">
                      <div>
                        <h4 className="material-name">Aluminum Cans</h4>
                        <p className="material-grade">Recycled</p>
                      </div>
                      <span className="material-status ready">Ready to Sell</span>
                    </div>
                    <div className="material-details">
                      <span className="material-weight">2,800 KG</span>
                      <span className="material-rate">OMR 1.50/KG</span>
                      <span className="material-value">OMR 4,200</span>
                    </div>
                  </div>

                  {/* Steel Scrap */}
                  <div className="material-item-modern">
                    <div className="material-header">
                      <div>
                        <h4 className="material-name">Steel Scrap</h4>
                        <p className="material-grade">Mixed Grade</p>
                      </div>
                      <span className="material-status processing">Processing</span>
                    </div>
                    <div className="material-details">
                      <span className="material-weight">4,200 KG</span>
                      <span className="material-rate">OMR 0.85/KG</span>
                      <span className="material-value">OMR 3,570</span>
                    </div>
                  </div>

                  {/* Brass Fittings */}
                  <div className="material-item-modern">
                    <div className="material-header">
                      <div>
                        <h4 className="material-name">Brass Fittings</h4>
                        <p className="material-grade">Clean</p>
                      </div>
                      <span className="material-status high-value">High Value</span>
                    </div>
                    <div className="material-details">
                      <span className="material-weight">890 KG</span>
                      <span className="material-rate">OMR 2.80/KG</span>
                      <span className="material-value">OMR 2,492</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>


          {/* Recent Transactions Card */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle as="h2">
                  <Activity size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Latest material activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="transactions-list-modern">
                  {/* Purchase Transaction */}
                  <div className="transaction-item-modern">
                    <div className="transaction-header">
                      <h4 className="transaction-title">Material Purchase</h4>
                      <span className="transaction-type purchase">Purchase</span>
                    </div>
                    <p className="transaction-party">Al Noor Scrap Collectors</p>
                    <div className="transaction-footer">
                      <span className="transaction-material">Copper Wire - 150 KG</span>
                      <span className="transaction-amount purchase">-OMR 480</span>
                    </div>
                    <p className="transaction-time">1 hour ago</p>
                  </div>

                  {/* Sale Transaction */}
                  <div className="transaction-item-modern">
                    <div className="transaction-header">
                      <h4 className="transaction-title">Material Sale</h4>
                      <span className="transaction-type sale">Sale</span>
                    </div>
                    <p className="transaction-party">Emirates Recycling</p>
                    <div className="transaction-footer">
                      <span className="transaction-material">Aluminum Cans - 200 KG</span>
                      <span className="transaction-amount sale">+OMR 300</span>
                    </div>
                    <p className="transaction-time">3 hours ago</p>
                  </div>

                  {/* Processing Transaction */}
                  <div className="transaction-item-modern">
                    <div className="transaction-header">
                      <h4 className="transaction-title">Material Processing</h4>
                      <span className="transaction-type processing">Processing</span>
                    </div>
                    <p className="transaction-party">Sorting & Cleaning</p>
                    <div className="transaction-footer">
                      <span className="transaction-material">Steel Scrap - 500 KG</span>
                      <span className="transaction-status">In Progress</span>
                    </div>
                    <p className="transaction-time">5 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>


          {/* Market Prices Card */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle as="h2">
                  <TrendingUp size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  Current Market Prices
                </CardTitle>
                <CardDescription>Real-time material pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="price-list-modern">
                  {/* Copper */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Copper</h4>
                      <p className="price-unit">per kilogram</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 3.25</span>
                      <span className="price-change positive">
                        <TrendingUp size={14} />
                        +5.2%
                      </span>
                    </div>
                  </div>

                  {/* Aluminum */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Aluminum</h4>
                      <p className="price-unit">per kilogram</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 1.48</span>
                      <span className="price-change neutral">±0.1%</span>
                    </div>
                  </div>

                  {/* Steel */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Steel</h4>
                      <p className="price-unit">per kilogram</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 0.82</span>
                      <span className="price-change negative">
                        <TrendingUp size={14} className="rotate-180" />
                        -2.8%
                      </span>
                    </div>
                  </div>

                  {/* Brass */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Brass</h4>
                      <p className="price-unit">per kilogram</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 2.85</span>
                      <span className="price-change positive">
                        <TrendingUp size={14} />
                        +3.1%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ScrapMaterialsDashboard