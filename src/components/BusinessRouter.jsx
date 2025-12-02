import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Oil Trading Module Components
import OilTradingDashboard from '../modules/oil-trading/pages/Dashboard'
import WorkflowDashboard from '../modules/oil-trading/pages/WorkflowDashboard'
import OilTradingCustomers from '../modules/oil-trading/pages/Customers'
import OilTradingSuppliers from '../modules/oil-trading/pages/Suppliers'
import OilTradingInventory from '../modules/oil-trading/pages/Inventory'
import OilTradingContracts from '../modules/oil-trading/pages/Contracts'
import OilTradingPurchase from '../modules/oil-trading/pages/Purchase'
import OilTradingSales from '../modules/oil-trading/pages/Sales'
import OilTradingWastage from '../modules/oil-trading/pages/Wastage'
import OilTradingPettyCash from '../modules/oil-trading/pages/PettyCash'
import OilTradingSettings from '../modules/oil-trading/pages/Settings'

// Scrap Materials Module Components
import ScrapMaterialsDashboard from '../modules/scrap-materials/pages/Dashboard'
import ScrapMaterialsSuppliers from '../modules/scrap-materials/pages/Suppliers'
import ScrapMaterialsInventory from '../modules/scrap-materials/pages/Inventory'
import ScrapMaterialsSales from '../modules/scrap-materials/pages/Sales'
import ScrapMaterialsPurchase from '../modules/scrap-materials/pages/Purchase'
import ScrapMaterialsCollections from '../modules/scrap-materials/pages/Collections'
import ScrapMaterialsWastage from '../modules/scrap-materials/pages/Wastage'

// Shared components (used by both businesses)
import Settings from '../pages/Settings'
import PettyCash from '../pages/PettyCash'

const BusinessRouter = () => {
  const { selectedCompany } = useAuth()
  const isOilBusiness = selectedCompany?.businessType === 'oil'

  if (isOilBusiness) {
    // Oil Trading Business Routes - All isolated to oil-trading module
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<WorkflowDashboard />} />
        <Route path="/customers" element={<OilTradingCustomers />} />
        <Route path="/suppliers" element={<OilTradingSuppliers />} />
        <Route path="/inventory" element={<OilTradingInventory />} />
        <Route path="/contracts" element={<OilTradingContracts />} />
        <Route path="/sales" element={<OilTradingSales />} />
        <Route path="/purchase" element={<OilTradingPurchase />} />
        <Route path="/collections" element={<Navigate to="/purchase" replace />} />
        <Route path="/wastage" element={<OilTradingWastage />} />
        <Route path="/petty-cash" element={<OilTradingPettyCash />} />
        <Route path="/settings" element={<OilTradingSettings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  } else {
    // Scrap Materials Business Routes
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ScrapMaterialsDashboard />} />
        <Route path="/suppliers" element={<ScrapMaterialsSuppliers />} />
        <Route path="/inventory" element={<ScrapMaterialsInventory />} />
        <Route path="/sales" element={<ScrapMaterialsSales />} />
        <Route path="/purchase" element={<ScrapMaterialsPurchase />} />
        <Route path="/collections" element={<ScrapMaterialsCollections />} />
        <Route path="/wastage" element={<ScrapMaterialsWastage />} />
        <Route path="/petty-cash" element={<PettyCash />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }
}

export default BusinessRouter