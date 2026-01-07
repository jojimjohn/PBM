import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { useNavigate } from 'react-router-dom'
import workflowService from '../../../services/workflowService'
import {
  AlertTriangle, CheckCircle, Package, FileText,
  Banknote, TrendingUp, Clock, Calendar,
  ArrowRight, Activity, Bell, Zap, CreditCard,
  Trash2, Truck, Building2, BarChart3, Warehouse,
  AlertCircle, RefreshCw, Users, ChevronRight, ChevronDown
} from 'lucide-react'
import '../styles/WorkflowDashboard.css'

/**
 * Workflow Dashboard - Design Principles Applied
 *
 * Design Direction: Sophistication & Trust + Data & Analysis
 * - Cool slate/blue-gray foundation
 * - Borders-only depth strategy (like Linear, Stripe)
 * - Monospace numbers with tabular alignment
 * - Dense but readable information hierarchy
 * - 4px grid system throughout
 * - Color for meaning only (status, urgency)
 */

// Skeleton Loading Components
const SkeletonStatCard = ({ mini = false }) => (
  <div className={`stat-card skeleton ${mini ? 'mini' : ''}`}>
    <div className="stat-header">
      <div className="skeleton-icon"></div>
      <div className="skeleton-text short"></div>
    </div>
    <div className="stat-body">
      <div className="skeleton-number"></div>
      <div className="stat-detail">
        <div className="skeleton-text tiny"></div>
        <div className="skeleton-text short"></div>
      </div>
    </div>
  </div>
)

const SkeletonTaskItem = () => (
  <div className="task-item skeleton">
    <div className="task-icon-wrapper">
      <div className="skeleton-icon"></div>
    </div>
    <div className="task-content">
      <div className="skeleton-text medium"></div>
      <div className="skeleton-text long"></div>
    </div>
    <div className="task-actions">
      <div className="skeleton-badge"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
)

const SkeletonActivityItem = () => (
  <div className="activity-item skeleton">
    <div className="activity-icon-wrapper">
      <div className="skeleton-icon small"></div>
    </div>
    <div className="activity-content">
      <div className="skeleton-text medium"></div>
      <div className="skeleton-text long"></div>
      <div className="skeleton-text tiny"></div>
    </div>
  </div>
)

const WorkflowDashboard = () => {
  const { user, selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate } = useSystemSettings()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pendingActions, setPendingActions] = useState({ high: [], normal: [], stats: {} })
  const [activityFeed, setActivityFeed] = useState([])
  const [workflowStats, setWorkflowStats] = useState({})
  const [notifications, setNotifications] = useState({ notifications: [], total: 0, hasUrgent: false })
  const [expandedSection, setExpandedSection] = useState('high')
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadDashboardData()
  }, [selectedCompany])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [actionsResult, activityResult, statsResult, notificationsResult] = await Promise.all([
        workflowService.getPendingActions(),
        workflowService.getActivityFeed(10),
        workflowService.getWorkflowStats(),
        workflowService.getNotifications(10)
      ])

      if (actionsResult.success) {
        setPendingActions(actionsResult.data)
      }

      if (activityResult.success) {
        setActivityFeed(activityResult.data.activities || [])
      }

      if (statsResult.success) {
        setWorkflowStats(statsResult.data)
      }

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action) => {
    navigate(action.actionRoute)
  }

  const getActionIcon = (type) => {
    const iconProps = { size: 18, strokeWidth: 1.5 }
    switch (type) {
      case 'wcn_finalization':
        return <CheckCircle {...iconProps} />
      case 'po_receipt':
        return <Package {...iconProps} />
      case 'generate_bill':
        return <FileText {...iconProps} />
      case 'record_payment':
        return <Banknote {...iconProps} />
      case 'contract_renewal':
        return <Calendar {...iconProps} />
      case 'low_stock':
        return <Warehouse {...iconProps} />
      case 'petty_cash_expiry':
      case 'petty_cash_low_balance':
      case 'expense_approval':
        return <CreditCard {...iconProps} />
      case 'wastage_approval':
        return <Trash2 {...iconProps} />
      case 'sales_delivery':
        return <Truck {...iconProps} />
      case 'bank_reconciliation':
        return <Building2 {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getActivityIcon = (type) => {
    const iconProps = { size: 14, strokeWidth: 1.5 }
    switch (type) {
      case 'wcn_finalization':
        return <CheckCircle {...iconProps} />
      case 'po_receipt':
        return <Package {...iconProps} />
      case 'bill_generation':
        return <FileText {...iconProps} />
      case 'payment':
        return <Banknote {...iconProps} />
      case 'wastage_approved':
        return <Trash2 {...iconProps} />
      case 'expense_approved':
        return <CreditCard {...iconProps} />
      case 'sales_delivered':
        return <Truck {...iconProps} />
      case 'bank_deposit':
      case 'bank_withdrawal':
        return <Building2 {...iconProps} />
      default:
        return <Activity {...iconProps} />
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now - then) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return formatDate ? formatDate(timestamp) : then.toLocaleDateString()
  }

  const formatGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="workflow-dashboard">
      {/* Header Section */}
      <header className="dashboard-header-section">
        <div className="header-main">
          <div className="header-greeting">
            <h1>{formatGreeting()}, {user?.name?.split(' ')[0]}</h1>
            <p className="header-subtitle">{selectedCompany?.name}</p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Banner */}
      {notifications.total > 0 && (
        <section className="notifications-banner">
          <div className="notification-toggle" onClick={() => setShowNotifications(!showNotifications)}>
            <div className="notification-indicator">
              <Bell size={16} className={notifications.hasUrgent ? 'urgent' : ''} />
              <span className="notification-count">{notifications.total}</span>
            </div>
            <span className="notification-label">
              {notifications.hasUrgent ? 'Urgent notifications' : 'Notifications'}
            </span>
            <ChevronDown size={16} className={`chevron ${showNotifications ? 'open' : ''}`} />
          </div>

          {showNotifications && (
            <div className="notifications-dropdown">
              {notifications.notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`notification-item ${notif.severity}`}
                  onClick={() => navigate(notif.route)}
                >
                  <div className={`notification-dot ${notif.severity}`} />
                  <div className="notification-body">
                    <span className="notification-title">{notif.title}</span>
                    <span className="notification-message">{notif.message}</span>
                  </div>
                  <ArrowRight size={14} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Primary Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid primary">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <article className="stat-card" onClick={() => navigate('/purchase')}>
                <div className="stat-header">
                  <div className="stat-icon collections">
                    <Package size={18} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label">Collections</span>
                </div>
                <div className="stat-body">
                  <span className="stat-number">{workflowStats.collections?.total || 0}</span>
                  <div className="stat-detail">
                    <span className="stat-highlight warning">
                      {workflowStats.collections?.pendingWCN || 0}
                    </span>
                    <span className="stat-text">pending WCN</span>
                  </div>
                </div>
              </article>

              <article className="stat-card" onClick={() => navigate('/purchase')}>
                <div className="stat-header">
                  <div className="stat-icon orders">
                    <FileText size={18} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label">Purchase Orders</span>
                </div>
                <div className="stat-body">
                  <span className="stat-number">{workflowStats.purchaseOrders?.total || 0}</span>
                  <div className="stat-detail">
                    <span className="stat-highlight info">
                      {workflowStats.purchaseOrders?.autoGenerated || 0}
                    </span>
                    <span className="stat-text">auto-generated</span>
                  </div>
                </div>
              </article>

              <article className="stat-card" onClick={() => navigate('/purchase')}>
                <div className="stat-header">
                  <div className="stat-icon invoices">
                    <Banknote size={18} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label">Invoices</span>
                </div>
                <div className="stat-body">
                  <span className="stat-number">{workflowStats.invoices?.unpaid || 0}</span>
                  <div className="stat-detail">
                    <span className="stat-highlight danger">
                      OMR {(workflowStats.invoices?.outstandingAmount || 0).toLocaleString()}
                    </span>
                    <span className="stat-text">outstanding</span>
                  </div>
                </div>
              </article>

              <article className="stat-card highlight">
                <div className="stat-header">
                  <div className="stat-icon alerts">
                    <AlertTriangle size={18} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label">Pending Actions</span>
                </div>
                <div className="stat-body">
                  <span className="stat-number">{pendingActions.stats.totalPending || 0}</span>
                  <div className="stat-detail">
                    <span className="stat-highlight high">
                      {pendingActions.stats.highPriority || 0}
                    </span>
                    <span className="stat-text">high priority</span>
                  </div>
                </div>
              </article>
            </>
          )}
        </div>
      </section>

      {/* Secondary Stats (Mini Cards) */}
      <section className="stats-section secondary">
        <div className="stats-grid mini">
          {loading ? (
            <>
              <SkeletonStatCard mini />
              <SkeletonStatCard mini />
              <SkeletonStatCard mini />
              <SkeletonStatCard mini />
              <SkeletonStatCard mini />
              <SkeletonStatCard mini />
            </>
          ) : (
            <>
              {workflowStats.contracts && (
                <article className="stat-card mini" onClick={() => navigate('/contracts')}>
                  <div className="stat-icon-mini contracts">
                    <Calendar size={14} strokeWidth={1.5} />
                  </div>
                  <div className="stat-info-mini">
                    <span className="stat-number-mini">{workflowStats.contracts?.active || 0}</span>
                    <span className="stat-label-mini">Contracts</span>
                  </div>
                  {workflowStats.contracts?.expiringSoon > 0 && (
                    <span className="stat-badge-mini warning">{workflowStats.contracts.expiringSoon}</span>
                  )}
                </article>
              )}

              {workflowStats.inventory && (
                <article className="stat-card mini" onClick={() => navigate('/inventory')}>
                  <div className="stat-icon-mini inventory">
                    <Warehouse size={14} strokeWidth={1.5} />
                  </div>
                  <div className="stat-info-mini">
                    <span className="stat-number-mini">{workflowStats.inventory?.totalItems || 0}</span>
                    <span className="stat-label-mini">Inventory</span>
                  </div>
                  {workflowStats.inventory?.lowStock > 0 && (
                    <span className="stat-badge-mini warning">{workflowStats.inventory.lowStock}</span>
                  )}
                </article>
              )}

              {workflowStats.pettyCash && (
                <article className="stat-card mini" onClick={() => navigate('/petty-cash')}>
                  <div className="stat-icon-mini petty-cash">
                    <CreditCard size={14} strokeWidth={1.5} />
                  </div>
                  <div className="stat-info-mini">
                    <span className="stat-number-mini">{workflowStats.pettyCash?.activeCards || 0}</span>
                    <span className="stat-label-mini">Petty Cash</span>
                  </div>
                  {workflowStats.pettyCash?.pendingApprovals > 0 && (
                    <span className="stat-badge-mini info">{workflowStats.pettyCash.pendingApprovals}</span>
                  )}
                </article>
              )}

              {workflowStats.wastage && (
                <article className="stat-card mini" onClick={() => navigate('/wastage')}>
                  <div className="stat-icon-mini wastage">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </div>
                  <div className="stat-info-mini">
                    <span className="stat-number-mini">{workflowStats.wastage?.total || 0}</span>
                    <span className="stat-label-mini">Wastage</span>
                  </div>
                  {workflowStats.wastage?.pending > 0 && (
                    <span className="stat-badge-mini warning">{workflowStats.wastage.pending}</span>
                  )}
                </article>
              )}

              {workflowStats.sales && (
                <article className="stat-card mini" onClick={() => navigate('/sales')}>
                  <div className="stat-icon-mini sales">
                    <Truck size={14} strokeWidth={1.5} />
                  </div>
                  <div className="stat-info-mini">
                    <span className="stat-number-mini">{workflowStats.sales?.total || 0}</span>
                    <span className="stat-label-mini">Sales</span>
                  </div>
                  {workflowStats.sales?.pendingDelivery > 0 && (
                    <span className="stat-badge-mini info">{workflowStats.sales.pendingDelivery}</span>
                  )}
                </article>
              )}

              {workflowStats.banking && (
                <article className="stat-card mini" onClick={() => navigate('/banking')}>
                  <div className="stat-icon-mini banking">
                    <Building2 size={14} strokeWidth={1.5} />
                  </div>
                  <div className="stat-info-mini">
                    <span className="stat-number-mini">{workflowStats.banking?.totalAccounts || 0}</span>
                    <span className="stat-label-mini">Banking</span>
                  </div>
                  {workflowStats.banking?.unreconciled > 0 && (
                    <span className="stat-badge-mini warning">{workflowStats.banking.unreconciled}</span>
                  )}
                </article>
              )}
            </>
          )}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Tasks Panel */}
        <section className="panel tasks-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Bell size={18} strokeWidth={1.5} />
              <h2>Your Tasks</h2>
            </div>
            <span className="panel-count">
              {loading ? '...' : pendingActions.stats.totalPending || 0}
            </span>
          </div>

          <div className="panel-body">
            {/* Loading State */}
            {loading && (
              <div className="task-list">
                <SkeletonTaskItem />
                <SkeletonTaskItem />
                <SkeletonTaskItem />
              </div>
            )}

            {/* High Priority Tasks */}
            {!loading && pendingActions.high.length > 0 && (
              <div className="task-section">
                <button
                  className="section-toggle high"
                  onClick={() => setExpandedSection(expandedSection === 'high' ? null : 'high')}
                >
                  <div className="toggle-left">
                    <Zap size={14} />
                    <span>High Priority</span>
                    <span className="section-count">{pendingActions.high.length}</span>
                  </div>
                  <ChevronRight size={14} className={`chevron ${expandedSection === 'high' ? 'open' : ''}`} />
                </button>

                {expandedSection === 'high' && (
                  <div className="task-list">
                    {pendingActions.high.map((action, index) => (
                      <div key={index} className="task-item high">
                        <div className="task-icon-wrapper" data-type={action.type}>
                          {getActionIcon(action.type)}
                        </div>
                        <div className="task-content">
                          <span className="task-title">{action.title}</span>
                          <span className="task-description">{action.description}</span>
                          {action.metadata && (
                            <div className="task-meta">
                              {action.metadata.supplierName && (
                                <span>{action.metadata.supplierName}</span>
                              )}
                              {action.metadata.contractNumber && (
                                <span>Contract: {action.metadata.contractNumber}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="task-actions">
                          <span className="urgency-badge high">
                            <Zap size={10} />
                            {action.daysPending}d
                          </span>
                          <button
                            className="btn-task-action primary"
                            onClick={() => handleActionClick(action)}
                          >
                            {action.actionLabel}
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Normal Priority Tasks */}
            {!loading && pendingActions.normal.length > 0 && (
              <div className="task-section">
                <button
                  className="section-toggle"
                  onClick={() => setExpandedSection(expandedSection === 'normal' ? null : 'normal')}
                >
                  <div className="toggle-left">
                    <Clock size={14} />
                    <span>Normal Priority</span>
                    <span className="section-count">{pendingActions.normal.length}</span>
                  </div>
                  <ChevronRight size={14} className={`chevron ${expandedSection === 'normal' ? 'open' : ''}`} />
                </button>

                {expandedSection === 'normal' && (
                  <div className="task-list">
                    {pendingActions.normal.slice(0, 5).map((action, index) => (
                      <div key={index} className="task-item">
                        <div className="task-icon-wrapper" data-type={action.type}>
                          {getActionIcon(action.type)}
                        </div>
                        <div className="task-content">
                          <span className="task-title">{action.title}</span>
                          <span className="task-description">{action.description}</span>
                        </div>
                        <div className="task-actions">
                          <span className="urgency-badge">
                            <Clock size={10} />
                            {action.daysPending}d
                          </span>
                          <button
                            className="btn-task-action"
                            onClick={() => handleActionClick(action)}
                          >
                            {action.actionLabel}
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingActions.normal.length > 5 && (
                      <div className="task-more">
                        +{pendingActions.normal.length - 5} more tasks
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && pendingActions.high.length === 0 && pendingActions.normal.length === 0 && (
              <div className="empty-state">
                <CheckCircle size={40} strokeWidth={1} />
                <h3>All caught up!</h3>
                <p>No pending actions at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed Panel */}
        <section className="panel activity-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Activity size={18} strokeWidth={1.5} />
              <h2>Recent Activity</h2>
            </div>
          </div>

          <div className="panel-body scrollable">
            {loading ? (
              <>
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
              </>
            ) : activityFeed.length > 0 ? (
              activityFeed.map((activity, index) => (
                <div
                  key={index}
                  className="activity-item"
                  onClick={() => navigate(activity.route)}
                >
                  <div className="activity-icon-wrapper" data-type={activity.type}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <span className="activity-title">{activity.title}</span>
                    <span className="activity-description">{activity.description}</span>
                    <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state small">
                <Activity size={28} strokeWidth={1} />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default WorkflowDashboard
