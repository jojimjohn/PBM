import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Oil Trading Module Components
import OilTradingDashboard from '../modules/oil-trading/pages/Dashboard'
import OilTradingCustomers from '../modules/oil-trading/pages/Customers'
import OilTradingInventory from '../modules/oil-trading/pages/Inventory'
import OilTradingContracts from '../modules/oil-trading/pages/Contracts'
import OilTradingPurchase from '../modules/oil-trading/pages/Purchase'

// Scrap Materials Module Components
import ScrapMaterialsDashboard from '../modules/scrap-materials/pages/Dashboard'
import ScrapMaterialsSuppliers from '../modules/scrap-materials/pages/Suppliers'
import ScrapMaterialsInventory from '../modules/scrap-materials/pages/Inventory'

// Generic components for common features
import Sales from '../pages/Sales'
import Purchase from '../pages/Purchase'
import Settings from '../pages/Settings'
import Wastage from '../pages/Wastage'
import PettyCash from '../pages/PettyCash'

const BusinessRouter = () => {
  const { selectedCompany } = useAuth()
  const isOilBusiness = selectedCompany?.businessType === 'oil'

  if (isOilBusiness) {
    // Oil Trading Business Routes
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<OilTradingDashboard />} />
        <Route path="/customers" element={<OilTradingCustomers />} />
        <Route path="/inventory" element={<OilTradingInventory />} />
        <Route path="/contracts" element={<OilTradingContracts />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/purchase" element={<OilTradingPurchase />} />
        <Route path="/wastage" element={<Wastage />} />
        <Route path="/petty-cash" element={<PettyCash />} />
        <Route path="/settings" element={<Settings />} />
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
        <Route path="/sales" element={<Sales />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/wastage" element={<Wastage />} />
        <Route path="/petty-cash" element={<PettyCash />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }
}

export default BusinessRouter