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
  AlertCircle, RefreshCw, Users
} from 'lucide-react'
import '../styles/WorkflowDashboard.css'

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
  const [expandedSection, setExpandedSection] = useState(null) // null = all collapsed, 'high' or 'normal' to expand
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [selectedCompany])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all dashboard data in parallel
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
    // Navigate to the appropriate route based on action type
    navigate(action.actionRoute)
  }

  const getActionIcon = (type) => {
    const iconProps = { size: 20 }
    switch (type) {
      case 'wcn_finalization':
        return <CheckCircle {...iconProps} className="action-icon finalize" />
      case 'po_receipt':
        return <Package {...iconProps} className="action-icon receipt" />
      case 'generate_bill':
        return <FileText {...iconProps} className="action-icon bill" />
      case 'record_payment':
        return <Banknote {...iconProps} className="action-icon payment" />
      case 'contract_renewal':
        return <Calendar {...iconProps} className="action-icon renewal" />
      case 'low_stock':
        return <Warehouse {...iconProps} className="action-icon inventory" />
      case 'petty_cash_expiry':
      case 'petty_cash_low_balance':
        return <CreditCard {...iconProps} className="action-icon petty-cash" />
      case 'expense_approval':
        return <CreditCard {...iconProps} className="action-icon expense" />
      case 'wastage_approval':
        return <Trash2 {...iconProps} className="action-icon wastage" />
      case 'sales_delivery':
        return <Truck {...iconProps} className="action-icon sales" />
      case 'bank_reconciliation':
        return <Building2 {...iconProps} className="action-icon banking" />
      default:
        return <Bell {...iconProps} className="action-icon default" />
    }
  }

  const getActivityIcon = (type) => {
    const iconProps = { size: 16 }
    switch (type) {
      case 'wcn_finalization':
        return <CheckCircle {...iconProps} className="activity-icon finalize" />
      case 'po_receipt':
        return <Package {...iconProps} className="activity-icon receipt" />
      case 'bill_generation':
        return <FileText {...iconProps} className="activity-icon bill" />
      case 'payment':
        return <Banknote {...iconProps} className="activity-icon payment" />
      case 'wastage_approved':
        return <Trash2 {...iconProps} className="activity-icon wastage" />
      case 'expense_approved':
        return <CreditCard {...iconProps} className="activity-icon expense" />
      case 'sales_delivered':
        return <Truck {...iconProps} className="activity-icon sales" />
      case 'bank_deposit':
      case 'bank_withdrawal':
        return <Building2 {...iconProps} className="activity-icon banking" />
      default:
        return <Activity {...iconProps} className="activity-icon default" />
    }
  }

  const getNotificationIcon = (type, severity) => {
    const iconProps = { size: 18 }
    if (severity === 'error') return <AlertCircle {...iconProps} className="notification-icon error" />
    if (severity === 'warning') return <AlertTriangle {...iconProps} className="notification-icon warning" />
    return <Bell {...iconProps} className="notification-icon info" />
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

  const getUrgencyBadge = (urgency, daysPending) => {
    if (urgency === 'high') {
      return (
        <span className="urgency-badge high">
          <Zap size={12} />
          {daysPending}d pending
        </span>
      )
    }
    return (
      <span className="urgency-badge normal">
        <Clock size={12} />
        {daysPending}d pending
      </span>
    )
  }

  // Remove early return - let DataTable handle loading state with skeleton

  return (
    <div className="workflow-dashboard-page">
      {/* Welcome Header */}
      <div className="page-header" data-tour="page-header">
        <div className="header-content">
          <h1>{t('workflowDashboard')}</h1>
          <p className="welcome-message">
            Welcome back, {user?.name} • {selectedCompany?.name}
          </p>
        </div>
        <button className="btn-refresh" onClick={loadDashboardData}>
          <Activity size={16} />
          Refresh
        </button>
      </div>

      {/* Notifications Panel */}
      {notifications.total > 0 && (
        <div className="notifications-panel" data-tour="notifications-panel">
          <div className="notifications-header">
            <div className="notifications-title">
              <Bell size={18} className={notifications.hasUrgent ? 'urgent' : ''} />
              <span>Notifications ({notifications.total})</span>
            </div>
            <button
              className="notifications-toggle"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              {showNotifications ? 'Hide' : 'Show'}
            </button>
          </div>
          {showNotifications && (
            <div className="notifications-list">
              {notifications.notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`notification-item ${notif.severity}`}
                  onClick={() => navigate(notif.route)}
                >
                  {getNotificationIcon(notif.type, notif.severity)}
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                  </div>
                  <ArrowRight size={16} className="notification-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Row - Primary */}
      <div className="workflow-stats-grid" data-tour="primary-stats">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-header">
                <Package size={20} className="stat-icon collections" />
                <span className="stat-label">Collections</span>
              </div>
              <div className="stat-body">
                <div className="stat-number">{workflowStats.collections?.total || 0}</div>
                <div className="stat-detail">
                  <span className="stat-highlight warning">
                    {workflowStats.collections?.pendingWCN || 0}
                  </span>
                  <span className="stat-text">pending WCN</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <FileText size={20} className="stat-icon orders" />
                <span className="stat-label">Purchase Orders</span>
              </div>
              <div className="stat-body">
                <div className="stat-number">{workflowStats.purchaseOrders?.total || 0}</div>
                <div className="stat-detail">
                  <span className="stat-highlight info">
                    {workflowStats.purchaseOrders?.autoGenerated || 0}
                  </span>
                  <span className="stat-text">auto-generated</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Banknote size={20} className="stat-icon invoices" />
                <span className="stat-label">Invoices</span>
              </div>
              <div className="stat-body">
                <div className="stat-number">{workflowStats.invoices?.unpaid || 0}</div>
                <div className="stat-detail">
                  <span className="stat-highlight danger">
                    OMR {(workflowStats.invoices?.outstandingAmount || 0).toLocaleString()}
                  </span>
                  <span className="stat-text">outstanding</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <AlertTriangle size={20} className="stat-icon alerts" />
                <span className="stat-label">Pending Actions</span>
              </div>
              <div className="stat-body">
                <div className="stat-number">{pendingActions.stats.totalPending || 0}</div>
                <div className="stat-detail">
                  <span className="stat-highlight high">
                    {pendingActions.stats.highPriority || 0}
                  </span>
                  <span className="stat-text">high priority</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Stats Row - Secondary (All Modules) */}
      <div className="workflow-stats-grid secondary" data-tour="secondary-stats">
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
              <div className="stat-card mini" onClick={() => navigate('/contracts')}>
                <div className="stat-header">
                  <Calendar size={16} className="stat-icon contracts" />
                  <span className="stat-label">Contracts</span>
                </div>
                <div className="stat-body">
                  <div className="stat-number">{workflowStats.contracts?.active || 0}</div>
                  <div className="stat-detail">
                    <span className="stat-highlight warning">
                      {workflowStats.contracts?.expiringSoon || 0}
                    </span>
                    <span className="stat-text">expiring</span>
                  </div>
                </div>
              </div>
            )}

            {workflowStats.inventory && (
              <div className="stat-card mini" onClick={() => navigate('/inventory')}>
                <div className="stat-header">
                  <Warehouse size={16} className="stat-icon inventory" />
                  <span className="stat-label">Inventory</span>
                </div>
                <div className="stat-body">
                  <div className="stat-number">{workflowStats.inventory?.totalItems || 0}</div>
                  <div className="stat-detail">
                    <span className="stat-highlight warning">
                      {workflowStats.inventory?.lowStock || 0}
                    </span>
                    <span className="stat-text">low stock</span>
                  </div>
                </div>
              </div>
            )}

            {workflowStats.pettyCash && (
              <div className="stat-card mini" onClick={() => navigate('/petty-cash')}>
                <div className="stat-header">
                  <CreditCard size={16} className="stat-icon petty-cash" />
                  <span className="stat-label">Petty Cash</span>
                </div>
                <div className="stat-body">
                  <div className="stat-number">{workflowStats.pettyCash?.activeCards || 0}</div>
                  <div className="stat-detail">
                    <span className="stat-highlight info">
                      {workflowStats.pettyCash?.pendingApprovals || 0}
                    </span>
                    <span className="stat-text">pending</span>
                  </div>
                </div>
              </div>
            )}

            {workflowStats.wastage && (
              <div className="stat-card mini" onClick={() => navigate('/wastage')}>
                <div className="stat-header">
                  <Trash2 size={16} className="stat-icon wastage" />
                  <span className="stat-label">Wastage</span>
                </div>
                <div className="stat-body">
                  <div className="stat-number">{workflowStats.wastage?.total || 0}</div>
                  <div className="stat-detail">
                    <span className="stat-highlight warning">
                      {workflowStats.wastage?.pending || 0}
                    </span>
                    <span className="stat-text">pending</span>
                  </div>
                </div>
              </div>
            )}

            {workflowStats.sales && (
              <div className="stat-card mini" onClick={() => navigate('/sales')}>
                <div className="stat-header">
                  <Truck size={16} className="stat-icon sales" />
                  <span className="stat-label">Sales</span>
                </div>
                <div className="stat-body">
                  <div className="stat-number">{workflowStats.sales?.total || 0}</div>
                  <div className="stat-detail">
                    <span className="stat-highlight info">
                      {workflowStats.sales?.pendingDelivery || 0}
                    </span>
                    <span className="stat-text">pending</span>
                  </div>
                </div>
              </div>
            )}

            {workflowStats.banking && (
              <div className="stat-card mini" onClick={() => navigate('/banking')}>
                <div className="stat-header">
                  <Building2 size={16} className="stat-icon banking" />
                  <span className="stat-label">Banking</span>
                </div>
                <div className="stat-body">
                  <div className="stat-number">{workflowStats.banking?.totalAccounts || 0}</div>
                  <div className="stat-detail">
                    <span className="stat-highlight warning">
                      {workflowStats.banking?.unreconciled || 0}
                    </span>
                    <span className="stat-text">unreconciled</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Pending Actions Panel (Left - 60%) */}
        <div className="pending-actions-panel" data-tour="pending-tasks">
          <div className="panel-header">
            <h2>
              <Bell size={20} />
              Your Tasks
            </h2>
            <div className="task-count">
              {loading ? '...' : `${pendingActions.stats.totalPending} pending`}
            </div>
          </div>

          {/* Skeleton Loading for Tasks */}
          {loading && (
            <div className="task-section">
              <div className="section-header">
                <div className="section-title">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-text short"></div>
                </div>
              </div>
              <div className="task-list">
                <SkeletonTaskItem />
                <SkeletonTaskItem />
                <SkeletonTaskItem />
              </div>
            </div>
          )}

          {/* High Priority Tasks */}
          {!loading && pendingActions.high.length > 0 && (
            <div className="task-section high-priority">
              <div
                className="section-header"
                onClick={() => setExpandedSection(expandedSection === 'high' ? null : 'high')}
              >
                <div className="section-title">
                  <Zap size={16} className="priority-icon" />
                  <span>High Priority ({pendingActions.high.length})</span>
                </div>
                <span className="expand-icon">{expandedSection === 'high' ? '▼' : '▶'}</span>
              </div>

              {expandedSection === 'high' && (
                <div className="task-list">
                  {pendingActions.high.map((action, index) => (
                    <div key={index} className="task-item high">
                      <div className="task-icon-wrapper">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="task-content">
                        <div className="task-title">{action.title}</div>
                        <div className="task-description">{action.description}</div>
                        {action.metadata && (
                          <div className="task-metadata">
                            {action.metadata.supplierName && (
                              <span className="metadata-item">{action.metadata.supplierName}</span>
                            )}
                            {action.metadata.contractNumber && (
                              <span className="metadata-item">Contract: {action.metadata.contractNumber}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="task-actions">
                        {getUrgencyBadge(action.urgency, action.daysPending)}
                        <button
                          className="btn-action-primary"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.actionLabel}
                          <ArrowRight size={14} />
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
            <div className="task-section normal-priority">
              <div
                className="section-header"
                onClick={() => setExpandedSection(expandedSection === 'normal' ? null : 'normal')}
              >
                <div className="section-title">
                  <Clock size={16} className="priority-icon" />
                  <span>Normal Priority ({pendingActions.normal.length})</span>
                </div>
                <span className="expand-icon">{expandedSection === 'normal' ? '▼' : '▶'}</span>
              </div>

              {expandedSection === 'normal' && (
                <div className="task-list">
                  {pendingActions.normal.slice(0, 5).map((action, index) => (
                    <div key={index} className="task-item normal">
                      <div className="task-icon-wrapper">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="task-content">
                        <div className="task-title">{action.title}</div>
                        <div className="task-description">{action.description}</div>
                      </div>
                      <div className="task-actions">
                        {getUrgencyBadge(action.urgency, action.daysPending)}
                        <button
                          className="btn-action-secondary"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.actionLabel}
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingActions.normal.length > 5 && (
                    <div className="task-item-more">
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
              <CheckCircle size={48} className="empty-icon" />
              <h3>All caught up!</h3>
              <p>No pending actions at the moment. Great work! 🎉</p>
            </div>
          )}
        </div>

        {/* Activity Feed Panel (Right - 40%) */}
        <div className="activity-feed-panel" data-tour="activity-feed">
          <div className="panel-header">
            <h2>
              <Activity size={20} />
              Recent Activity
            </h2>
          </div>

          <div className="activity-list">
            {loading ? (
              <>
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
                <SkeletonActivityItem />
              </>
            ) : (
              activityFeed.map((activity, index) => (
                <div
                  key={index}
                  className="activity-item"
                  onClick={() => navigate(activity.route)}
                >
                  <div className="activity-icon-wrapper">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && activityFeed.length === 0 && (
            <div className="empty-state-small">
              <Activity size={32} className="empty-icon" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowDashboard
