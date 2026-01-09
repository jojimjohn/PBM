import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'

// ============================================================================
// EAGERLY LOADED - Dashboard pages (first page after login, instant display)
// ============================================================================
import WorkflowDashboard from '../modules/oil-trading/pages/WorkflowDashboard'
import ScrapMaterialsDashboard from '../modules/scrap-materials/pages/Dashboard'

// ============================================================================
// LAZY LOADED - Oil Trading Module Components
// ============================================================================
const OilTradingDashboard = lazy(() => import('../modules/oil-trading/pages/Dashboard'))
const OilTradingCustomers = lazy(() => import('../modules/oil-trading/pages/Customers'))
const OilTradingSuppliers = lazy(() => import('../modules/oil-trading/pages/Suppliers'))
const OilTradingInventory = lazy(() => import('../modules/oil-trading/pages/Inventory'))
const OilTradingContracts = lazy(() => import('../modules/oil-trading/pages/Contracts'))
const OilTradingPurchase = lazy(() => import('../modules/oil-trading/pages/Purchase'))
const OilTradingSales = lazy(() => import('../modules/oil-trading/pages/Sales'))
const OilTradingWastage = lazy(() => import('../modules/oil-trading/pages/Wastage'))
const OilTradingPettyCash = lazy(() => import('../modules/oil-trading/pages/PettyCash'))
const OilTradingSettings = lazy(() => import('../modules/oil-trading/pages/Settings'))
const OilTradingStockAdjustment = lazy(() => import('../modules/oil-trading/pages/StockAdjustment'))

// ============================================================================
// LAZY LOADED - Scrap Materials Module Components
// ============================================================================
const ScrapMaterialsSuppliers = lazy(() => import('../modules/scrap-materials/pages/Suppliers'))
const ScrapMaterialsInventory = lazy(() => import('../modules/scrap-materials/pages/Inventory'))
const ScrapMaterialsSales = lazy(() => import('../modules/scrap-materials/pages/Sales'))
const ScrapMaterialsPurchase = lazy(() => import('../modules/scrap-materials/pages/Purchase'))
const ScrapMaterialsCollections = lazy(() => import('../modules/scrap-materials/pages/Collections'))
const ScrapMaterialsWastage = lazy(() => import('../modules/scrap-materials/pages/Wastage'))
const ScrapMaterialsPettyCash = lazy(() => import('../modules/scrap-materials/pages/PettyCash'))
const ScrapMaterialsSettings = lazy(() => import('../modules/scrap-materials/pages/Settings'))

// ============================================================================
// LAZY LOADED - Shared Components (used by both businesses)
// ============================================================================
const Reports = lazy(() => import('../pages/Reports'))
const Banking = lazy(() => import('../pages/Banking'))
const UserManagement = lazy(() => import('../pages/UserManagement'))
const RoleManagement = lazy(() => import('../pages/RoleManagement'))
const Projects = lazy(() => import('../pages/Projects'))

/**
 * LazyRoute - Wrapper component for lazy-loaded routes
 * Provides consistent Suspense fallback across all routes
 */
const LazyRoute = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
)

const BusinessRouter = () => {
  const { selectedCompany } = useAuth()
  const isOilBusiness = selectedCompany?.businessType === 'oil'

  if (isOilBusiness) {
    // Oil Trading Business Routes - All isolated to oil-trading module
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard is eagerly loaded - no Suspense needed */}
        <Route path="/dashboard" element={<WorkflowDashboard />} />

        {/* All other routes are lazy loaded with Suspense */}
        <Route path="/customers" element={<LazyRoute><OilTradingCustomers /></LazyRoute>} />
        <Route path="/suppliers" element={<LazyRoute><OilTradingSuppliers /></LazyRoute>} />
        <Route path="/inventory" element={<LazyRoute><OilTradingInventory /></LazyRoute>} />
        <Route path="/stock-adjustment" element={<LazyRoute><OilTradingStockAdjustment /></LazyRoute>} />
        <Route path="/contracts" element={<LazyRoute><OilTradingContracts /></LazyRoute>} />
        <Route path="/sales" element={<LazyRoute><OilTradingSales /></LazyRoute>} />
        <Route path="/purchase" element={<LazyRoute><OilTradingPurchase /></LazyRoute>} />
        <Route path="/collections" element={<Navigate to="/purchase" replace />} />
        <Route path="/wastage" element={<LazyRoute><OilTradingWastage /></LazyRoute>} />
        <Route path="/petty-cash" element={<LazyRoute><OilTradingPettyCash /></LazyRoute>} />
        <Route path="/banking" element={<LazyRoute><Banking /></LazyRoute>} />
        <Route path="/reports" element={<LazyRoute><Reports /></LazyRoute>} />
        <Route path="/settings" element={<LazyRoute><OilTradingSettings /></LazyRoute>} />
        <Route path="/users" element={<LazyRoute><UserManagement /></LazyRoute>} />
        <Route path="/roles" element={<LazyRoute><RoleManagement /></LazyRoute>} />
        <Route path="/projects" element={<LazyRoute><Projects /></LazyRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  } else {
    // Scrap Materials Business Routes
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard is eagerly loaded - no Suspense needed */}
        <Route path="/dashboard" element={<ScrapMaterialsDashboard />} />

        {/* All other routes are lazy loaded with Suspense */}
        <Route path="/suppliers" element={<LazyRoute><ScrapMaterialsSuppliers /></LazyRoute>} />
        <Route path="/inventory" element={<LazyRoute><ScrapMaterialsInventory /></LazyRoute>} />
        <Route path="/sales" element={<LazyRoute><ScrapMaterialsSales /></LazyRoute>} />
        <Route path="/purchase" element={<LazyRoute><ScrapMaterialsPurchase /></LazyRoute>} />
        <Route path="/collections" element={<LazyRoute><ScrapMaterialsCollections /></LazyRoute>} />
        <Route path="/wastage" element={<LazyRoute><ScrapMaterialsWastage /></LazyRoute>} />
        <Route path="/petty-cash" element={<LazyRoute><ScrapMaterialsPettyCash /></LazyRoute>} />
        <Route path="/banking" element={<LazyRoute><Banking /></LazyRoute>} />
        <Route path="/reports" element={<LazyRoute><Reports /></LazyRoute>} />
        <Route path="/settings" element={<LazyRoute><ScrapMaterialsSettings /></LazyRoute>} />
        <Route path="/users" element={<LazyRoute><UserManagement /></LazyRoute>} />
        <Route path="/roles" element={<LazyRoute><RoleManagement /></LazyRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }
}

export default BusinessRouter
