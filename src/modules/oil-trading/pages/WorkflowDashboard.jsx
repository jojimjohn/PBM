import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../../components/LoadingSpinner'
import workflowService from '../../../services/workflowService'
import {
  AlertTriangle, CheckCircle, Package, FileText,
  DollarSign, TrendingUp, Clock, Calendar,
  ArrowRight, Activity, Bell, Zap
} from 'lucide-react'
import '../styles/WorkflowDashboard.css'

const WorkflowDashboard = () => {
  const { user, selectedCompany } = useAuth()
  const { t } = useLocalization()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pendingActions, setPendingActions] = useState({ high: [], normal: [], stats: {} })
  const [activityFeed, setActivityFeed] = useState([])
  const [workflowStats, setWorkflowStats] = useState({})
  const [expandedSection, setExpandedSection] = useState('high') // 'high' or 'normal'

  useEffect(() => {
    loadDashboardData()
  }, [selectedCompany])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all dashboard data in parallel
      const [actionsResult, activityResult, statsResult] = await Promise.all([
        workflowService.getPendingActions(),
        workflowService.getActivityFeed(10),
        workflowService.getWorkflowStats()
      ])

      if (actionsResult.success) {
        setPendingActions(actionsResult.data)
      }

      if (activityResult.success) {
        setActivityFeed(activityResult.data.activities)
      }

      if (statsResult.success) {
        setWorkflowStats(statsResult.data)
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
        return <DollarSign {...iconProps} className="action-icon payment" />
      case 'contract_renewal':
        return <Calendar {...iconProps} className="action-icon renewal" />
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
        return <DollarSign {...iconProps} className="activity-icon payment" />
      default:
        return <Activity {...iconProps} className="activity-icon default" />
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
    return then.toLocaleDateString()
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
      <div className="page-header">
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

      {/* Quick Stats Row */}
      <div className="workflow-stats-grid">
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
            <DollarSign size={20} className="stat-icon invoices" />
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
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Pending Actions Panel (Left - 60%) */}
        <div className="pending-actions-panel">
          <div className="panel-header">
            <h2>
              <Bell size={20} />
              Your Tasks
            </h2>
            <div className="task-count">
              {pendingActions.stats.totalPending} pending
            </div>
          </div>

          {/* High Priority Tasks */}
          {pendingActions.high.length > 0 && (
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

              {(expandedSection === 'high' || expandedSection === null) && (
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
          {pendingActions.normal.length > 0 && (
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

              {(expandedSection === 'normal' || expandedSection === null) && (
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
          {pendingActions.high.length === 0 && pendingActions.normal.length === 0 && (
            <div className="empty-state">
              <CheckCircle size={48} className="empty-icon" />
              <h3>All caught up!</h3>
              <p>No pending actions at the moment. Great work! 🎉</p>
            </div>
          )}
        </div>

        {/* Activity Feed Panel (Right - 40%) */}
        <div className="activity-feed-panel">
          <div className="panel-header">
            <h2>
              <Activity size={20} />
              Recent Activity
            </h2>
          </div>

          <div className="activity-list">
            {activityFeed.map((activity, index) => (
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
            ))}
          </div>

          {activityFeed.length === 0 && (
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
