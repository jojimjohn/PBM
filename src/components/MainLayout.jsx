import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import { useSessionTimeout } from '../hooks/useSessionTimeout'
import { PERMISSIONS } from '../config/roles'
import { getModuleIconPaths } from '../config/modules'
import PermissionGate from './PermissionGate'
import BusinessRouter from './BusinessRouter'
import CommandPalette from './ui/CommandPalette'
import NotificationPanel from './ui/NotificationPanel'
import SessionTimeoutWarning from './SessionTimeoutWarning'
import ProfileModal from './ProfileModal'
import HelpMenu from './tour/HelpMenu'
import ProductTour from './tour/ProductTour'
import ProjectSelector from './ui/ProjectSelector'
import NoProjectsMessage from './ui/NoProjectsMessage'
import useProjects from '../hooks/useProjects'
import workflowService from '../services/workflowService'
import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react'
// CSS moved to global index.css Tailwind

// localStorage key for sidebar collapse state
const SIDEBAR_COLLAPSED_KEY = 'pbm_sidebar_collapsed'

const MainLayout = () => {
  const { user, selectedCompany, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useSystemSettings()
  const { t, currentLanguage, changeLanguage, getSupportedLanguages } = useLocalization()
  const { getAccessibleModules, hasPermission } = usePermissions()
  const { noProjectsAvailable, initialized: projectsInitialized, getProjectQueryParam } = useProjects()
  const location = useLocation()
  const navigate = useNavigate()
  const isOilBusiness = selectedCompany?.businessType === 'oil'

  // Session timeout monitoring - pass logout callback for proper 401 handling
  const {
    showWarning: showSessionWarning,
    remainingMinutes,
    extendSession,
    isExtending
  } = useSessionTimeout(isAuthenticated, logout)
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Sidebar collapse state - persisted in localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      return saved === 'true'
    } catch {
      return false
    }
  })

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Profile Modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Live notifications from workflow API
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Load live notifications from API
  const loadNotifications = useCallback(async () => {
    if (!user || !selectedCompany) return

    // Wait until project context is fully initialized (localStorage checked & projects loaded)
    // This prevents "Access denied" errors from stale/invalid project IDs
    if (!projectsInitialized) return

    setNotificationsLoading(true)
    try {
      // Use centralized helper that validates project access
      const params = getProjectQueryParam()

      const result = await workflowService.getNotifications(10, params)
      if (result.success && result.data?.notifications) {
        // Transform API notifications to UI format
        const transformedNotifications = result.data.notifications.map((notif, index) => ({
          id: `notif-${index}-${Date.now()}`,
          type: notif.severity === 'error' ? 'error' : notif.severity === 'warning' ? 'warning' : 'info',
          title: notif.title,
          message: notif.message,
          timestamp: new Date(),
          read: false,
          route: notif.route,
          count: notif.count
        }))
        setNotifications(transformedNotifications)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setNotificationsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCompany, projectsInitialized])

  // Load notifications on mount and when company changes
  useEffect(() => {
    loadNotifications()
    // Refresh notifications every 2 minutes
    const interval = setInterval(loadNotifications, 120000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // Toggle sidebar collapse state
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
      } catch {
        // Ignore localStorage errors
      }
      return newValue
    })
  }, [])

  // Notification handlers
  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ))
  }

  const handleDeleteNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId))
  }

  const handleClearAllNotifications = () => {
    if (window.confirm(t('clearAllNotifications', 'Clear all notifications?'))) {
      setNotifications([])
    }
  }

  const handleNotificationSettings = () => {
    navigate('/settings')
  }

  // Command palette handlers
  const getCommandPaletteCommands = () => {
    const navItems = getFilteredNavItems()
    return navItems.map(item => ({
      id: item.path,
      title: item.label,
      description: `Navigate to ${item.label}`,
      type: item.module,
      icon: item.module,
      action: () => navigate(item.path),
      keywords: [item.label.toLowerCase(), item.module]
    }))
  }

  const handleCommandExecute = (command) => {
    if (command.action) {
      command.action()
    }
  }

  // Get navigation items organized by section
  const getFilteredNavItems = () => {
    const accessibleModules = getAccessibleModules()

    // Filter out 'collections' (part of Purchase) and 'settings' (separate at bottom)
    const filteredModules = accessibleModules.filter(
      moduleId => moduleId !== 'collections' && moduleId !== 'settings'
    )

    // Define section groupings
    const coreNavModules = ['dashboard', 'customers', 'suppliers', 'inventory', 'fuel-inventory', 'material-inventory', 'sales', 'purchase', 'wastage']
    const legalFinanceModules = ['contracts', 'petty-cash', 'banking', 'invoices', 'expenses']
    const adminModules = ['users', 'roles', 'projects', 'reports']

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
      'wastage': '/wastage',
      'reports': '/reports',
      'expenses': '/expenses',
      'petty-cash': '/petty-cash',
      'banking': '/banking',
      'invoices': '/invoices',
      'users': '/users',
      'roles': '/roles',
      'projects': '/projects'
    }

    // Map module IDs to display labels
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
      'wastage': 'wastage',
      'reports': 'reports',
      'expenses': 'expense',
      'petty-cash': 'pettyCash',
      'banking': 'banking',
      'invoices': 'invoice',
      'users': 'userManagement',
      'roles': 'roleManagement',
      'projects': 'projects'
    }

    // Determine section for each module
    const getSection = (moduleId) => {
      if (coreNavModules.includes(moduleId)) return 'core'
      if (legalFinanceModules.includes(moduleId)) return 'legalFinance'
      if (adminModules.includes(moduleId)) return 'admin'
      return 'core'
    }

    return filteredModules.map(moduleId => {
      const iconData = getModuleIconPaths(moduleId)

      return {
        path: pathMapping[moduleId] || `/${moduleId}`,
        label: t(labelMapping[moduleId] || moduleId),
        module: moduleId,
        section: getSection(moduleId),
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

  // Group nav items by section
  const getNavItemsBySection = () => {
    const items = getFilteredNavItems()
    return {
      core: items.filter(item => item.section === 'core'),
      legalFinance: items.filter(item => item.section === 'legalFinance'),
      admin: items.filter(item => item.section === 'admin')
    }
  }

  return (
    <div className="main-layout flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar-desktop sidebar-gradient hidden lg:flex flex-col flex-shrink-0 border-r border-white/5 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-72'
        }`}
        data-tour="main-navigation"
      >
        {/* Sidebar Header - Logo and Collapse Toggle */}
        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'p-4' : 'p-6 pb-4'}`} data-tour="company-info">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? '' : 'gap-3'}`}>
              <div className="sidebar-logo-icon bg-accent flex items-center justify-center w-10 h-10 flex-shrink-0">
                <span className="material-symbols-outlined text-white">
                  {selectedCompany?.businessType === 'oil' ? 'oil_barrel' : 'recycling'}
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-display font-bold text-lg tracking-wider leading-none text-white whitespace-nowrap">
                    {selectedCompany?.businessType === 'oil' ? 'AL RAMRAMI' : 'PRIDE MUSCAT'}
                  </span>
                  <span className="text-xs font-bold text-accent tracking-[0.15em]">
                    {selectedCompany?.businessType === 'oil' ? 'ERP' : 'ERP'}
                  </span>
                </div>
              )}
            </div>
            {/* Collapse Toggle Icon - Only visible when expanded */}
            {!isSidebarCollapsed && (
              <button
                className="text-slate-400 hover:text-white transition-colors group relative cursor-pointer"
                onClick={toggleSidebarCollapse}
                title={t('collapseSidebar', 'Collapse Sidebar')}
              >
                <PanelLeftClose className="w-5 h-5" />
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                  {t('collapseSidebar', 'Collapse Sidebar')}
                </div>
              </button>
            )}
          </div>
          {/* Expand icon when collapsed - centered below logo */}
          {isSidebarCollapsed && (
            <button
              className="mt-3 w-full flex justify-center text-slate-400 hover:text-white transition-colors group relative cursor-pointer"
              onClick={toggleSidebarCollapse}
              title={t('expandSidebar', 'Expand Sidebar')}
            >
              <PanelLeft className="w-5 h-5" />
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                {t('expandSidebar', 'Expand Sidebar')}
              </div>
            </button>
          )}
        </div>

        {/* Navigation Items - Sectioned */}
        <nav className={`flex-1 overflow-y-auto pb-6 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {/* Core Navigation Section */}
          {getNavItemsBySection().core.length > 0 && (
            <>
              {!isSidebarCollapsed && (
                <div className="pt-2 pb-2 px-4 uppercase text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  {t('coreNavigation', 'Core Navigation')}
                </div>
              )}
              {isSidebarCollapsed && <div className="pt-2 border-t border-white/10 mt-2" />}
              <div className="space-y-1">
                {getNavItemsBySection().core.map((navItem) => (
                  <button
                    key={navItem.path}
                    className={`sidebar-nav-item w-full flex items-center transition-all group relative ${
                      isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
                    } ${
                      isActive(navItem.path)
                        ? 'active bg-accent text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => handleNavigation(navItem.path)}
                    title={isSidebarCollapsed ? navItem.label : undefined}
                  >
                    <span className={`nav-icon-wrapper flex-shrink-0 ${isActive(navItem.path) ? 'text-white' : 'group-hover:text-accent transition-colors'}`}>
                      {navItem.icon}
                    </span>
                    {!isSidebarCollapsed && <span className="text-sm whitespace-nowrap overflow-hidden">{navItem.label}</span>}
                    {/* Tooltip for collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                        {navItem.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Legal & Finance Section */}
          {getNavItemsBySection().legalFinance.length > 0 && (
            <>
              {!isSidebarCollapsed && (
                <div className="pt-8 pb-2 px-4 uppercase text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  {t('legalFinance', 'Legal & Finance')}
                </div>
              )}
              {isSidebarCollapsed && <div className="pt-4 border-t border-white/10 mt-4" />}
              <div className="space-y-1">
                {getNavItemsBySection().legalFinance.map((navItem) => (
                  <button
                    key={navItem.path}
                    className={`sidebar-nav-item w-full flex items-center transition-all group relative ${
                      isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
                    } ${
                      isActive(navItem.path)
                        ? 'active bg-accent text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => handleNavigation(navItem.path)}
                    title={isSidebarCollapsed ? navItem.label : undefined}
                  >
                    <span className={`nav-icon-wrapper flex-shrink-0 ${isActive(navItem.path) ? 'text-white' : 'group-hover:text-accent transition-colors'}`}>
                      {navItem.icon}
                    </span>
                    {!isSidebarCollapsed && <span className="text-sm whitespace-nowrap overflow-hidden">{navItem.label}</span>}
                    {/* Tooltip for collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                        {navItem.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Admin Section */}
          {getNavItemsBySection().admin.length > 0 && (
            <>
              {!isSidebarCollapsed && (
                <div className="pt-8 pb-2 px-4 uppercase text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  {t('administration', 'Administration')}
                </div>
              )}
              {isSidebarCollapsed && <div className="pt-4 border-t border-white/10 mt-4" />}
              <div className="space-y-1">
                {getNavItemsBySection().admin.map((navItem) => (
                  <button
                    key={navItem.path}
                    className={`sidebar-nav-item w-full flex items-center transition-all group relative ${
                      isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
                    } ${
                      isActive(navItem.path)
                        ? 'active bg-accent text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => handleNavigation(navItem.path)}
                    title={isSidebarCollapsed ? navItem.label : undefined}
                  >
                    <span className={`nav-icon-wrapper flex-shrink-0 ${isActive(navItem.path) ? 'text-white' : 'group-hover:text-accent transition-colors'}`}>
                      {navItem.icon}
                    </span>
                    {!isSidebarCollapsed && <span className="text-sm whitespace-nowrap overflow-hidden">{navItem.label}</span>}
                    {/* Tooltip for collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                        {navItem.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Sidebar Footer - Settings Only */}
        <div className={`sidebar-footer border-t border-white/10 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {/* Settings Button */}
          <button
            className={`sidebar-footer-btn w-full flex items-center transition-all group relative ${
              isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
            } text-slate-400 hover:text-white hover:bg-white/5 rounded-lg`}
            onClick={() => navigate('/settings')}
            title={isSidebarCollapsed ? t('settings', 'Settings') : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
            </svg>
            {!isSidebarCollapsed && <span className="text-sm">{t('settings', 'Settings')}</span>}
            {/* Tooltip for collapsed mode */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                {t('settings', 'Settings')}
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="dashboard-header h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          {/* Left - Search and Portfolio */}
          <div className="flex items-center gap-6 flex-1">
            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn lg:hidden p-2 text-slate-600 hover:bg-slate-100"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Project Selector */}
            <div data-tour="project-selector">
              <ProjectSelector />
            </div>
          </div>

          {/* Right - Actions and User */}
          <div className="flex items-center gap-4">
            {/* Notification Panel */}
            <div data-tour="notifications-bell">
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
                onClearAll={handleClearAllNotifications}
                onSettingsClick={handleNotificationSettings}
              />
            </div>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="action-btn" data-tour="theme-toggle">
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <button
              className="action-btn flex items-center gap-1"
              onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
              data-tour="language-switcher"
            >
              <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{currentLanguage.toUpperCase()}</span>
            </button>

            {/* Help Menu */}
            <HelpMenu />

            {/* User Profile */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200" data-tour="user-menu">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold tracking-tight text-slate-900">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || user?.email || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  {user?.role?.replace('_', ' ') || 'User'}
                </p>
              </div>
              <div className="user-menu relative">
                <button className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={() => setIsProfileOpen(true)}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {t('profile')}
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                    </svg>
                    {t('settings')}
                  </button>
                  <hr className="dropdown-divider" />
                  <button onClick={logout} className="dropdown-item logout-item">
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        </header>

        {/* Main Content */}
        <main className="main-content-area">
          {noProjectsAvailable ? (
            <NoProjectsMessage />
          ) : (
            <BusinessRouter />
          )}
        </main>
      </div>

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

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={getCommandPaletteCommands()}
        onExecute={handleCommandExecute}
        recentCommands={[]}
      />

      {/* Session Timeout Warning */}
      <SessionTimeoutWarning
        show={showSessionWarning}
        remainingMinutes={remainingMinutes}
        onExtend={extendSession}
        onLogout={logout}
        isExtending={isExtending}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Product Tour - Driver.js overlay */}
      <ProductTour />
    </div>
  )
}

export default MainLayout