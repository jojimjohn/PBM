import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SystemSettingsProvider } from './context/SystemSettingsContext'
import { LocalizationProvider } from './context/LocalizationContext'
import { TourProvider } from './context/TourContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import './App.css'
import './styles/rtl.css'
import './styles/responsive.css'

function App() {
  return (
    <Router>
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
    </Router>
  )
}

export default App