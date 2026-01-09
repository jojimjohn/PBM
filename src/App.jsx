import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SystemSettingsProvider } from './context/SystemSettingsContext'
import { LocalizationProvider } from './context/LocalizationContext'
import { TourProvider } from './context/TourContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import PageLoader from './components/ui/PageLoader'
import './App.css'
import './styles/rtl.css'
import './styles/responsive.css'

// Lazy load the PettyCashPortal - it's a separate public route
const PettyCashPortal = lazy(() => import('./pages/petty-cash-portal/PettyCashPortal'))

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route - Petty Cash Portal (QR + PIN auth, separate from system) */}
        <Route path="/pc-portal" element={
          <Suspense fallback={<PageLoader />}>
            <PettyCashPortal />
          </Suspense>
        } />

        {/* All other routes - require system authentication */}
        <Route path="/*" element={
          <AuthProvider>
            <LocalizationProvider>
              <SystemSettingsProvider>
                <TourProvider>
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                </TourProvider>
              </SystemSettingsProvider>
            </LocalizationProvider>
          </AuthProvider>
        } />
      </Routes>
    </Router>
  )
}

export default App