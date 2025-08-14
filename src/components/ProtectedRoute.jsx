import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import LoginForm from './LoginForm'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth()
  const { t } = useLocalization()

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="access-denied-container">
        <div className="access-denied-content">
          <h2>{t('accessDenied')}</h2>
          <p>{t('accessDeniedMessage')}</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute