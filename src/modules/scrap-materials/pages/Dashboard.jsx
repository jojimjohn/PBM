import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Package, Banknote, TrendingUp, ShoppingCart, Scale, Activity, Info, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import useProjects from '../../../hooks/useProjects'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Alert from '../../../components/ui/Alert'
import { Skeleton, SkeletonCard } from '../../../components/ui/Progress'
import { Button } from '../../../components/ui/Button'
import { gridContainerVariants, gridItemVariants, fadeUpVariants } from '../../../config/animations'

const ScrapMaterialsDashboard = () => {
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
      <div className="p-0">
        <div className="mb-8">
          <Skeleton variant="text" width="300px" height="36px" />
          <Skeleton variant="text" width="400px" height="20px" />
        </div>

        <div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6 max-lg:grid-cols-1">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-0">
      {/* Page Header */}
      <motion.div
        className="mb-8"
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight max-md:text-3xl">{t('scrapMaterials')} {t('dashboard')}</h1>
          <p className="text-lg text-gray-600 leading-normal max-md:text-base">Welcome back to {selectedCompany?.name}, {user?.name}</p>
        </div>
      </motion.div>

      <div>
        {/* Stats Grid with Modern Cards */}
        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8 max-md:grid-cols-1 max-md:gap-4"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Total Suppliers Stat */}
          <motion.div variants={gridItemVariants}>
            <Card variant="elevated" hoverable animate>
              <CardContent className="flex items-start gap-4 !p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t('suppliers')}</p>
                  <h3 className="text-3xl font-bold text-gray-900 leading-none tabular-nums max-md:text-2xl">89</h3>
                  <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
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
              <CardContent className="flex items-start gap-4 !p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <Package className="w-7 h-7" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Material Weight</p>
                  <h3 className="text-3xl font-bold text-gray-900 leading-none tabular-nums max-md:text-2xl">12,340 KG</h3>
                  <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
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
              <CardContent className="flex items-start gap-4 !p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <Banknote className="w-7 h-7" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Monthly Revenue</p>
                  <h3 className="text-3xl font-bold text-gray-900 leading-none tabular-nums max-md:text-2xl">OMR 45,780</h3>
                  <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
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
              <CardContent className="flex items-start gap-4 !p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Materials Processed</p>
                  <h3 className="text-3xl font-bold text-gray-900 leading-none tabular-nums max-md:text-2xl">8,950 KG</h3>
                  <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
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
          className="mb-6"
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
          className="mb-6"
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
          className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8 max-md:grid-cols-2 max-sm:grid-cols-1"
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
              className="h-20 text-base font-semibold max-sm:h-[60px]"
            >
              Purchase
            </Button>
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <Button
              variant="secondary"
              size="large"
              icon={<Banknote />}
              fullWidth
              className="h-20 text-base font-semibold max-sm:h-[60px]"
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
              className="h-20 text-base font-semibold max-sm:h-[60px]"
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
              className="h-20 text-base font-semibold max-sm:h-[60px]"
            >
              Reports
            </Button>
          </motion.div>
        </motion.div>


        {/* Main Content Grid */}
        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6 max-lg:grid-cols-1"
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
                <div className="flex flex-col gap-6">
                  {/* Copper Wire */}
                  <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Copper Wire</h4>
                        <p className="text-sm text-gray-600">Grade A</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">High Value</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 max-md:flex-col max-md:items-start">
                      <span className="text-sm font-semibold text-gray-700">1,250 KG</span>
                      <span className="text-sm text-gray-600">OMR 3.20/KG</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">OMR 4,000</span>
                    </div>
                  </div>

                  {/* Aluminum Cans */}
                  <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Aluminum Cans</h4>
                        <p className="text-sm text-gray-600">Recycled</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">Ready to Sell</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 max-md:flex-col max-md:items-start">
                      <span className="text-sm font-semibold text-gray-700">2,800 KG</span>
                      <span className="text-sm text-gray-600">OMR 1.50/KG</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">OMR 4,200</span>
                    </div>
                  </div>

                  {/* Steel Scrap */}
                  <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Steel Scrap</h4>
                        <p className="text-sm text-gray-600">Mixed Grade</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">Processing</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 max-md:flex-col max-md:items-start">
                      <span className="text-sm font-semibold text-gray-700">4,200 KG</span>
                      <span className="text-sm text-gray-600">OMR 0.85/KG</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">OMR 3,570</span>
                    </div>
                  </div>

                  {/* Brass Fittings */}
                  <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Brass Fittings</h4>
                        <p className="text-sm text-gray-600">Clean</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">High Value</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 max-md:flex-col max-md:items-start">
                      <span className="text-sm font-semibold text-gray-700">890 KG</span>
                      <span className="text-sm text-gray-600">OMR 2.80/KG</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">OMR 2,492</span>
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
                <div className="flex flex-col gap-4">
                  {/* Purchase Transaction */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-base font-semibold text-gray-900">Material Purchase</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">Purchase</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Al Noor Scrap Collectors</p>
                    <div className="flex justify-between items-center mb-2 max-sm:flex-col max-sm:items-start">
                      <span className="text-sm text-gray-600">Copper Wire - 150 KG</span>
                      <span className="text-base font-bold text-red-600 tabular-nums">-OMR 480</span>
                    </div>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>

                  {/* Sale Transaction */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-base font-semibold text-gray-900">Material Sale</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">Sale</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Emirates Recycling</p>
                    <div className="flex justify-between items-center mb-2 max-sm:flex-col max-sm:items-start">
                      <span className="text-sm text-gray-600">Aluminum Cans - 200 KG</span>
                      <span className="text-base font-bold text-emerald-600 tabular-nums">+OMR 300</span>
                    </div>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>

                  {/* Processing Transaction */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-base font-semibold text-gray-900">Material Processing</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">Processing</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Sorting & Cleaning</p>
                    <div className="flex justify-between items-center mb-2 max-sm:flex-col max-sm:items-start">
                      <span className="text-sm text-gray-600">Steel Scrap - 500 KG</span>
                      <span className="text-sm font-semibold text-blue-600">In Progress</span>
                    </div>
                    <p className="text-xs text-gray-500">5 hours ago</p>
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
                <div className="flex flex-col gap-4">
                  {/* Copper */}
                  <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Copper</h4>
                      <p className="text-xs text-gray-600">per kilogram</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 max-sm:flex-col max-sm:items-start">
                      <span className="text-xl font-bold text-gray-900 tabular-nums max-md:text-lg">OMR 3.25</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">
                        <TrendingUp size={14} />
                        +5.2%
                      </span>
                    </div>
                  </div>

                  {/* Aluminum */}
                  <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Aluminum</h4>
                      <p className="text-xs text-gray-600">per kilogram</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 max-sm:flex-col max-sm:items-start">
                      <span className="text-xl font-bold text-gray-900 tabular-nums max-md:text-lg">OMR 1.48</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">±0.1%</span>
                    </div>
                  </div>

                  {/* Steel */}
                  <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Steel</h4>
                      <p className="text-xs text-gray-600">per kilogram</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 max-sm:flex-col max-sm:items-start">
                      <span className="text-xl font-bold text-gray-900 tabular-nums max-md:text-lg">OMR 0.82</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700">
                        <TrendingUp size={14} className="rotate-180" />
                        -2.8%
                      </span>
                    </div>
                  </div>

                  {/* Brass */}
                  <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Brass</h4>
                      <p className="text-xs text-gray-600">per kilogram</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 max-sm:flex-col max-sm:items-start">
                      <span className="text-xl font-bold text-gray-900 tabular-nums max-md:text-lg">OMR 2.85</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">
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