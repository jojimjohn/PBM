import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS } from '../config/roles'
import { getModuleIconPaths } from '../config/modules'
import PermissionGate from './PermissionGate'
import BusinessRouter from './BusinessRouter'
import { Menu, X } from 'lucide-react'
import './MainLayout.css'

const MainLayout = () => {
  const { user, selectedCompany, logout } = useAuth()
  const { theme, toggleTheme } = useSystemSettings()
  const { t, currentLanguage, changeLanguage, getSupportedLanguages } = useLocalization()
  const { getAccessibleModules, hasPermission } = usePermissions()
  const location = useLocation()
  const navigate = useNavigate()
  const isOilBusiness = selectedCompany?.businessType === 'oil'
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleNavigation = (path) => {
    navigate(path)
    // Close mobile menu when navigating
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Get navigation items based on company's enabled modules
  const getFilteredNavItems = () => {
    const accessibleModules = getAccessibleModules()
    
    return accessibleModules.map(moduleId => {
      // Map module IDs to navigation paths
      const pathMapping = {
        'dashboard': '/dashboard',
        'customers': '/customers',
        'suppliers': '/suppliers', 
        'inventory': '/inventory',
        'fuel-inventory': '/inventory',
        'material-inventory': '/inventory',
        'sales': '/sales',
        'purchase': '/purchase',
        'contracts': '/contracts',
        'collections': '/collections',
        'wastage': '/wastage',
        'reports': '/reports',
        'expenses': '/expenses',
        'petty-cash': '/petty-cash',
        'invoices': '/invoices',
        'settings': '/settings'
      }
      
      // Map module IDs to translation keys
      const labelMapping = {
        'dashboard': 'dashboard',
        'customers': 'customers',
        'suppliers': 'suppliers',
        'inventory': 'inventory',
        'fuel-inventory': 'fuelInventory',
        'material-inventory': 'materialInventory',
        'sales': 'sales',
        'purchase': 'purchase',
        'contracts': 'contracts',
        'collections': 'collections',
        'reports': 'reports',
        'expenses': 'expense',
        'petty-cash': 'cash',
        'invoices': 'invoice',
        'settings': 'settings'
      }
      
      const iconData = getModuleIconPaths(moduleId)
      
      return {
        path: pathMapping[moduleId] || `/${moduleId}`,
        label: t(labelMapping[moduleId] || moduleId),
        module: moduleId,
        icon: (
          <svg className="nav-icon" viewBox={iconData.viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {iconData.paths.map((path, index) => (
              <path key={index} d={path} />
            ))}
          </svg>
        )
      }
    })
  }

  return (
    <div className="main-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          {/* Left Side - Logo and Company Info */}
          <div className="header-left">
            <div className="logo-section">
              <div className="company-logo">
                {selectedCompany?.businessType === 'oil' ? (
                  <svg className="logo-icon oil-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2.04 4.6 4.14 5.93s3.83 2.34 4.36 4.05c0 3.22-2.23 5.99-5.5 5.99c-3.75 0-2.5-3-2.5-3s1.14-2 0-5.39z" />
                  </svg>
                ) : (
                  <svg className="logo-icon scrap-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 19H6.5a2.5 2.5 0 0 1 0-5H14" />
                    <path d="m14 4-3 3 3 3" />
                    <path d="M17 5H17.5a2.5 2.5 0 0 1 0 5H10" />
                    <path d="m10 20 3-3-3-3" />
                  </svg>
                )}
              </div>
              <div className="company-details">
                <h1 className="system-title">PBM System</h1>
                <div className="company-name-container">
                  <span className="company-name">{selectedCompany?.name || t('loading')}</span>
                  <span className={`business-type-badge ${selectedCompany?.id}`}>
                    {selectedCompany?.businessType === 'oil' ? t('oilTrading') : t('scrapMaterials')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Company Title Only */}
          <div className="header-center">
            <h2 className="header-title">
              {selectedCompany?.businessType === 'oil' ? t('oilTrading') : t('scrapMaterials')} {t('management', 'Management')}
            </h2>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn" 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Right Side - User Info and Actions */}
          <div className="header-right">
            <div className="header-actions">
              <button className="action-btn notification-btn">
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notification-badge">3</span>
              </button>
              <button onClick={toggleTheme} className="action-btn theme-toggle-btn">
                {theme === 'light' ? (
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              
              <div className="language-switcher">
                <button 
                  className="action-btn language-btn"
                  onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
                  title={currentLanguage === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
                >
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span className="language-code">{currentLanguage.toUpperCase()}</span>
                </button>
              </div>
              
            </div>

            <div className="user-profile">
              <div className="user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-role">{user?.role?.replace('_', ' ') || 'User'}</span>
              </div>
              <div className="user-menu">
                <button className="user-menu-btn">
                  <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>
                <div className="user-dropdown">
                  <a href="#" className="dropdown-item">
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {t('profile')}
                  </a>
                  <a href="#" className="dropdown-item" onClick={() => navigate('/settings')}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                    </svg>
                    {t('settings')}
                  </a>
                  <hr className="dropdown-divider" />
                  <button onClick={logout} className="dropdown-item logout-item">
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {t('logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="secondary-nav desktop-only">
        <div className="secondary-nav-container">
          {getFilteredNavItems().map((navItem) => (
            <button 
              key={navItem.path}
              className={`secondary-nav-item ${isActive(navItem.path) ? 'active' : ''}`}
              onClick={() => handleNavigation(navItem.path)}
            >
              {navItem.icon}
              <span>{navItem.label}</span>
            </button>
          ))}
        </div>
      </nav>
      
      {/* Mobile Navigation Overlay */}
      {isMobile && (
        <>
          <div 
            className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <nav className={`mobile-nav sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-header">
              <div className="mobile-company-info">
                <div className="mobile-logo">
                  {isOilBusiness ? (
                    <svg className="logo-icon oil-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2.04 4.6 4.14 5.93s3.83 2.34 4.36 4.05c0 3.22-2.23 5.99-5.5 5.99c-3.75 0-2.5-3-2.5-3s1.14-2 0-5.39z" />
                    </svg>
                  ) : (
                    <svg className="logo-icon scrap-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 19H6.5a2.5 2.5 0 0 1 0-5H14" />
                      <path d="m14 4-3 3 3 3" />
                      <path d="M17 5H17.5a2.5 2.5 0 0 1 0 5H10" />
                      <path d="m10 20 3-3-3-3" />
                    </svg>
                  )}
                </div>
                <div className="mobile-company-details">
                  <span className="mobile-company-name">{selectedCompany?.name}</span>
                  <span className="mobile-business-type">
                    {selectedCompany?.businessType === 'oil' ? t('oilTrading') : t('scrapMaterials')}
                  </span>
                </div>
              </div>
              <button 
                className="mobile-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mobile-nav-content">
              <div className="mobile-nav-items">
                {getFilteredNavItems().map((navItem) => (
                  <button 
                    key={navItem.path}
                    className={`mobile-nav-item ${isActive(navItem.path) ? 'active' : ''}`}
                    onClick={() => handleNavigation(navItem.path)}
                  >
                    <div className="mobile-nav-icon">{navItem.icon}</div>
                    <span className="mobile-nav-label">{navItem.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="mobile-nav-footer">
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{user?.name}</span>
                    <span className="mobile-user-role">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div className="mobile-actions">
                  <button 
                    className="mobile-action-btn"
                    onClick={toggleTheme}
                  >
                    {theme === 'light' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    )}
                    <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>
                  </button>
                  
                  <button 
                    className="mobile-action-btn"
                    onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <span>{currentLanguage === 'en' ? 'العربية' : 'English'}</span>
                  </button>
                  
                  <button 
                    className="mobile-action-btn logout-btn"
                    onClick={logout}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          <BusinessRouter />
        </div>
      </main>

    </div>
  )
}

export default MainLayout