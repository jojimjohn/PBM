import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Droplet, Banknote, TrendingUp, ShoppingCart, FileText, BarChart3, AlertTriangle, Package } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import useProjects from '../../../hooks/useProjects'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Alert from '../../../components/ui/Alert'
import { ProgressBar, Skeleton, SkeletonCard } from '../../../components/ui/Progress'
import { Button } from '../../../components/ui/Button'
import { gridContainerVariants, gridItemVariants, fadeUpVariants } from '../../../config/animations'
import '../styles/Dashboard.css'
import '../styles/DashboardModern.css'

const OilTradingDashboard = () => {
  const { user, selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { selectedProjectId, getProjectQueryParam, isProjectRequired, initialized: projectsInitialized } = useProjects()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for project context to be fully initialized
    if (!projectsInitialized) return

    // For non-admin users, wait until a project is selected (auto-selection happens in ProjectContext)
    if (isProjectRequired && !selectedProjectId) return

    // Load dashboard data when company or project changes
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        // Get project filter params for API calls
        const projectParams = getProjectQueryParam()

        // TODO: Fetch real dashboard data with project filter
        // const stats = await dashboardService.getStats(projectParams)

        // Simulate loading for now
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, selectedProjectId, projectsInitialized, isProjectRequired])
  
  // Skeleton loading state
  if (loading) {
    return (
      <div className="oil-dashboard-page">
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
    <div className="oil-dashboard-page">
      {/* Page Header */}
      <motion.div
        className="page-header-modern"
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="page-title">{t('oilTrading')} {t('dashboard')}</h1>
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
          {/* Total Customers Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper customers-icon">
                  <Users className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{t('totalCustomers')}</p>
                  <h3 className="stat-value">156</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+12% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fuel Inventory Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper fuel-icon">
                  <Droplet className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{t('fuelInventory')}</p>
                  <h3 className="stat-value">45,230 L</h3>
                  <p className="stat-trend negative">
                    <TrendingUp size={16} className="rotate-180" />
                    <span>-5% {t('fromLastMonth')}</span>
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
                  <Banknote className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{t('monthlyRevenue')}</p>
                  <h3 className="stat-value">OMR 128,450</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+18% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Profit Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="stat-card-modern">
                <div className="stat-icon-wrapper profit-icon">
                  <BarChart3 className="stat-icon" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{t('totalProfit')}</p>
                  <h3 className="stat-value">18.6%</h3>
                  <p className="stat-trend positive">
                    <TrendingUp size={16} />
                    <span>+2.3% {t('fromLastMonth')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        
        {/* Modern Alert Section */}
        <motion.div
          className="alerts-section-modern"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <Alert
            variant="warning"
            title={t('lowStock')}
            description="Engine Oil 20W-50 is running low (150L remaining). Consider reordering soon."
            icon={<AlertTriangle />}
            action={
              <Button size="small" variant="warning">
                {t('createOrder')}
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
              icon={<Banknote />}
              fullWidth
              className="action-button-modern"
            >
              {t('sales')}
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<ShoppingCart />}
              fullWidth
              className="action-button-modern"
            >
              {t('purchase')}
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<FileText />}
              fullWidth
              className="action-button-modern"
            >
              {t('invoice')}
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<BarChart3 />}
              fullWidth
              className="action-button-modern"
            >
              {t('reports')}
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
          {/* Fuel Inventory Card */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle as="h2">
                  <Package size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  {t('fuelInventory')}
                </CardTitle>
                <CardDescription>Current stock levels and capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="fuel-list-modern">
                  {/* Diesel */}
                  <div className="fuel-item-modern">
                    <div className="fuel-header">
                      <div>
                        <h4 className="fuel-name">Diesel</h4>
                        <p className="fuel-grade">Commercial Grade</p>
                      </div>
                      <span className="fuel-status available">{ t('available')}</span>
                    </div>
                    <ProgressBar
                      value={15500}
                      max={20000}
                      variant="success"
                      label="15,500L / 20,000L capacity"
                      showValue
                      size="md"
                    />
                  </div>

                  {/* Petrol 95 */}
                  <div className="fuel-item-modern">
                    <div className="fuel-header">
                      <div>
                        <h4 className="fuel-name">Petrol 95</h4>
                        <p className="fuel-grade">Premium Unleaded</p>
                      </div>
                      <span className="fuel-status available">{t('available')}</span>
                    </div>
                    <ProgressBar
                      value={8200}
                      max={15000}
                      variant="primary"
                      label="8,200L / 15,000L capacity"
                      showValue
                      size="md"
                    />
                  </div>

                  {/* Engine Oil - Low Stock */}
                  <div className="fuel-item-modern">
                    <div className="fuel-header">
                      <div>
                        <h4 className="fuel-name">Engine Oil 20W-50</h4>
                        <p className="fuel-grade">Multi-Grade</p>
                      </div>
                      <span className="fuel-status low-stock">{t('lowStock')}</span>
                    </div>
                    <ProgressBar
                      value={150}
                      max={1000}
                      variant="warning"
                      label="150L / 1,000L capacity"
                      showValue
                      size="md"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Recent Orders Card */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle as="h2">
                  <FileText size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  {t('recentTransactions')}
                </CardTitle>
                <CardDescription>Latest sales orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="orders-list-modern">
                  {/* Order 1 */}
                  <div className="order-item-modern">
                    <div className="order-header">
                      <h4 className="order-number">SO-2024-089</h4>
                      <span className="order-status delivered">{t('delivered')}</span>
                    </div>
                    <p className="order-customer">Al Maha Petroleum</p>
                    <div className="order-footer">
                      <span className="order-product">Diesel - 500L</span>
                      <span className="order-amount">OMR 225.00</span>
                    </div>
                    <p className="order-date">Today, 2:30 PM</p>
                  </div>

                  {/* Order 2 */}
                  <div className="order-item-modern">
                    <div className="order-header">
                      <h4 className="order-number">SO-2024-088</h4>
                      <span className="order-status pending">{t('pending')}</span>
                    </div>
                    <p className="order-customer">Gulf Construction LLC</p>
                    <div className="order-footer">
                      <span className="order-product">Engine Oil - 20L</span>
                      <span className="order-amount">OMR 50.00</span>
                    </div>
                    <p className="order-date">Today, 11:15 AM</p>
                  </div>

                  {/* Order 3 */}
                  <div className="order-item-modern">
                    <div className="order-header">
                      <h4 className="order-number">SO-2024-087</h4>
                      <span className="order-status delivered">{t('delivered')}</span>
                    </div>
                    <p className="order-customer">Oman Logistics</p>
                    <div className="order-footer">
                      <span className="order-product">Petrol 95 - 300L</span>
                      <span className="order-amount">OMR 180.00</span>
                    </div>
                    <p className="order-date">Yesterday, 4:45 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Price Tracker Card */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle as="h2">
                  <TrendingUp size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  {t('standardPrice')}
                </CardTitle>
                <CardDescription>Current market prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="price-list-modern">
                  {/* Crude Oil */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Crude Oil (Brent)</h4>
                      <p className="price-unit">per barrel</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 31.75</span>
                      <span className="price-change positive">
                        <TrendingUp size={14} />
                        +1.2%
                      </span>
                    </div>
                  </div>

                  {/* Diesel */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Diesel Wholesale</h4>
                      <p className="price-unit">per liter</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 0.385</span>
                      <span className="price-change negative">
                        <TrendingUp size={14} className="rotate-180" />
                        -0.5%
                      </span>
                    </div>
                  </div>

                  {/* Petrol 95 */}
                  <div className="price-item-modern">
                    <div className="price-info">
                      <h4 className="price-name">Petrol 95</h4>
                      <p className="price-unit">per liter</p>
                    </div>
                    <div className="price-value">
                      <span className="current-price">OMR 0.415</span>
                      <span className="price-change positive">
                        <TrendingUp size={14} />
                        +0.8%
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

export default OilTradingDashboard