import React, { Suspense, lazy } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'

/**
 * DashboardRouter
 *
 * Routes the user to the appropriate dashboard based on their role.
 * Each role gets a purpose-built view — owners see financial KPIs,
 * managers see operations, accountants see financials, etc.
 */

// Lazy load each dashboard to keep initial bundle small
const ExecutiveDashboard = lazy(() => import('../pages/dashboards/ExecutiveDashboard'))
const OperationsDashboard = lazy(() => import('../pages/dashboards/OperationsDashboard'))
const AccountantDashboard = lazy(() => import('../pages/dashboards/AccountantDashboard'))
const SalesDashboard = lazy(() => import('../pages/dashboards/SalesDashboard'))
const WorkflowDashboard = lazy(() => import('../modules/oil-trading/pages/WorkflowDashboard'))
const ScrapMaterialsDashboard = lazy(() => import('../modules/scrap-materials/pages/Dashboard'))

// Normalize role string to compare reliably
const normalizeRole = (role) => (role || '').toLowerCase().replace(/[-_\s]/g, '')

const DashboardRouter = () => {
  const { user, selectedCompany } = useAuth()
  const isOilBusiness = selectedCompany?.businessType === 'oil'
  const role = normalizeRole(user?.role)

  // Pick the right dashboard
  let DashboardComponent

  if (role === 'superadmin' || role === 'companyadmin') {
    DashboardComponent = ExecutiveDashboard
  } else if (role === 'manager') {
    DashboardComponent = OperationsDashboard
  } else if (role === 'accountsstaff') {
    DashboardComponent = AccountantDashboard
  } else if (role === 'salesstaff') {
    DashboardComponent = SalesDashboard
  } else if (role === 'purchasestaff') {
    // Purchase staff uses the existing workflow-centric dashboard
    DashboardComponent = isOilBusiness ? WorkflowDashboard : ScrapMaterialsDashboard
  } else {
    // Fallback for unknown/custom roles
    DashboardComponent = isOilBusiness ? WorkflowDashboard : ScrapMaterialsDashboard
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardComponent />
    </Suspense>
  )
}

export default DashboardRouter
