import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { useProjects } from '../../../hooks/useProjects'
import useDashboardCache from '../../../hooks/useDashboardCache'
import { useNavigate } from 'react-router-dom'
import workflowService from '../../../services/workflowService'
import {
  AlertTriangle, CheckCircle, Package, FileText,
  Banknote, Clock, Calendar,
  ArrowRight, Activity, Bell, Zap, CreditCard,
  Trash2, Truck, Building2, Warehouse,
  RefreshCw, ChevronDown
} from 'lucide-react'

/**
 * Workflow Dashboard
 *
 * Design Direction: Sophistication & Trust + Data & Analysis
 * - Cool slate foundation
 * - Borders-only depth strategy (like Linear, Stripe)
 * - Monospace numbers with tabular alignment
 * - 4px grid system
 * - Color for meaning only (status, urgency)
 */

// Skeleton Loading Components - using global skeleton classes
const SkeletonStatCard = ({ mini = false }) => (
  <div className={mini ? 'stat-card-mini' : 'stat-card'}>
    {mini ? (
      <>
        <div className="skeleton-avatar w-7 h-7" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="skeleton-text w-10 h-5" />
          <div className="skeleton-text w-16 h-3" />
        </div>
      </>
    ) : (
      <>
        <div className="flex items-center gap-2 mb-3">
          <div className="skeleton-avatar w-8 h-8" />
          <div className="skeleton-text w-20" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="skeleton-title w-16" />
          <div className="flex items-center gap-2">
            <div className="skeleton-text w-12 h-5" />
            <div className="skeleton-text w-20" />
          </div>
        </div>
      </>
    )}
  </div>
)

const SkeletonTaskItem = () => (
  <div className="task-item">
    <div className="skeleton-avatar w-8 h-8" />
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      <div className="skeleton-text w-40" />
      <div className="skeleton-text w-56 h-3" />
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <div className="skeleton-text w-12 h-5" />
      <div className="skeleton w-20 h-8" />
    </div>
  </div>
)

const SkeletonActivityItem = () => (
  <div className="activity-item">
    <div className="skeleton-avatar w-7 h-7" />
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      <div className="skeleton-text w-40" />
      <div className="skeleton-text w-56 h-3" />
      <div className="skeleton-text w-10 h-3" />
    </div>
  </div>
)

const WorkflowDashboard = () => {
  const { user, selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate } = useSystemSettings()
  const { selectedProjectId, getProjectQueryParam, isProjectRequired, initialized: projectsInitialized } = useProjects()
  const navigate = useNavigate()

  const [taskTypeTab, setTaskTypeTab] = useState('all')
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const cacheEnabled = projectsInitialized && (!isProjectRequired || selectedProjectId)

  const projectParams = useMemo(() => {
    if (!cacheEnabled) return null
    return getProjectQueryParam()
  }, [cacheEnabled, selectedProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const cacheOptions = useMemo(() => ({
    ttlMinutes: 5,
    enabled: cacheEnabled,
    projectId: selectedProjectId || 'all',
    companyId: selectedCompany?.id || 'default'
  }), [cacheEnabled, selectedProjectId, selectedCompany?.id])

  const {
    data: pendingActions,
    loading: actionsLoading,
    refreshing: actionsRefreshing,
    refresh: refreshActions,
    lastUpdated: actionsLastUpdated
  } = useDashboardCache(
    'pending-actions',
    useCallback(() => workflowService.getPendingActions(projectParams), [projectParams]),
    { ...cacheOptions, defaultValue: { high: [], normal: [], stats: {} } }
  )

  const {
    data: workflowStats,
    loading: statsLoading,
    refreshing: statsRefreshing,
    refresh: refreshStats
  } = useDashboardCache(
    'workflow-stats',
    useCallback(() => workflowService.getWorkflowStats(projectParams), [projectParams]),
    { ...cacheOptions, defaultValue: {} }
  )

  const {
    data: activityData,
    loading: activityLoading,
    refreshing: activityRefreshing,
    refresh: refreshActivity
  } = useDashboardCache(
    'activity-feed',
    useCallback(() => workflowService.getActivityFeed(10, projectParams), [projectParams]),
    { ...cacheOptions, defaultValue: { activities: [] } }
  )

  const {
    data: notificationsData,
    loading: notificationsLoading,
    refreshing: notificationsRefreshing,
    refresh: refreshNotifications
  } = useDashboardCache(
    'notifications',
    useCallback(() => workflowService.getNotifications(10, projectParams), [projectParams]),
    { ...cacheOptions, defaultValue: { notifications: [], total: 0, hasUrgent: false } }
  )

  const activityFeed = activityData?.activities || []
  const notifications = notificationsData || { notifications: [], total: 0, hasUrgent: false }

  // Initial loading (no data yet)
  const initialLoading = (actionsLoading && !pendingActions?.stats) ||
                         (statsLoading && !workflowStats?.collections)

  // Refreshing state (manual refresh - for button animation)
  const isRefreshing = actionsRefreshing || statsRefreshing || activityRefreshing || notificationsRefreshing

  // Combined loading state - show skeletons on initial load OR during refresh
  const loading = initialLoading || isRefreshing

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshActions(), refreshStats()])
    await Promise.all([refreshActivity(), refreshNotifications()])
  }, [refreshActions, refreshStats, refreshActivity, refreshNotifications])

  const taskTypeGroups = {
    purchases: ['wcn_finalization', 'po_receipt', 'generate_bill'],
    sales: ['sales_delivery', 'customer_payment'],
    approvals: ['expense_approval', 'wastage_approval'],
    finance: ['record_payment', 'bank_reconciliation'],
    alerts: ['low_stock', 'out_of_stock', 'petty_cash_expiry', 'petty_cash_low_balance', 'contract_renewal']
  }

  const getFilteredTasks = () => {
    const allTasks = [...(pendingActions?.high || []), ...(pendingActions?.normal || [])]
    if (taskTypeTab === 'all') return allTasks
    const allowedTypes = taskTypeGroups[taskTypeTab] || []
    return allTasks.filter(task => allowedTypes.includes(task.type))
  }

  const getTaskCountByGroup = (group) => {
    if (group === 'all') return (pendingActions?.stats?.totalPending || 0)
    const allTasks = [...(pendingActions?.high || []), ...(pendingActions?.normal || [])]
    const allowedTypes = taskTypeGroups[group] || []
    return allTasks.filter(task => allowedTypes.includes(task.type)).length
  }

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleActionClick = (action) => {
    navigate(action.actionRoute)
  }

  const getActionIcon = (type) => {
    const iconProps = { size: 18, strokeWidth: 1.5 }
    const icons = {
      wcn_finalization: <CheckCircle {...iconProps} />,
      po_receipt: <Package {...iconProps} />,
      generate_bill: <FileText {...iconProps} />,
      record_payment: <Banknote {...iconProps} />,
      contract_renewal: <Calendar {...iconProps} />,
      low_stock: <Warehouse {...iconProps} />,
      out_of_stock: <AlertTriangle {...iconProps} />,
      petty_cash_expiry: <CreditCard {...iconProps} />,
      petty_cash_low_balance: <CreditCard {...iconProps} />,
      expense_approval: <CreditCard {...iconProps} />,
      wastage_approval: <Trash2 {...iconProps} />,
      sales_delivery: <Truck {...iconProps} />,
      bank_reconciliation: <Building2 {...iconProps} />
    }
    return icons[type] || <Bell {...iconProps} />
  }

  const getActivityIcon = (type) => {
    const iconProps = { size: 14, strokeWidth: 1.5 }
    const icons = {
      wcn_finalization: <CheckCircle {...iconProps} />,
      po_receipt: <Package {...iconProps} />,
      bill_generation: <FileText {...iconProps} />,
      payment: <Banknote {...iconProps} />,
      wastage_approved: <Trash2 {...iconProps} />,
      expense_approved: <CreditCard {...iconProps} />,
      sales_delivered: <Truck {...iconProps} />,
      bank_deposit: <Building2 {...iconProps} />,
      bank_withdrawal: <Building2 {...iconProps} />
    }
    return icons[type] || <Activity {...iconProps} />
  }

  // Color utilities - using global icon-bg-* classes from index.css
  const getTaskIconStyle = (type) => {
    const styles = {
      wcn_finalization: 'icon-bg-invoices',
      po_receipt: 'icon-bg-collections',
      generate_bill: 'icon-bg-orders',
      record_payment: 'icon-bg-alerts',
      contract_renewal: 'icon-bg-contracts',
      low_stock: 'icon-bg-inventory',
      out_of_stock: 'bg-red-100 text-red-600' // Critical - out of stock
    }
    return styles[type] || 'bg-slate-100 text-slate-500'
  }

  const getActivityIconStyle = (type) => {
    const styles = {
      wcn_finalization: 'icon-bg-invoices',
      po_receipt: 'icon-bg-collections',
      bill_generation: 'icon-bg-orders',
      payment: 'icon-bg-invoices'
    }
    return styles[type] || 'bg-slate-100 text-slate-500'
  }

  // Global icon background classes - change in tailwind.config.js to update everywhere
  const getStatIconStyle = (type) => {
    const styles = {
      collections: 'icon-bg-collections',
      orders: 'icon-bg-orders',
      invoices: 'icon-bg-invoices',
      alerts: 'icon-bg-alerts',
      contracts: 'icon-bg-contracts',
      inventory: 'icon-bg-inventory',
      'petty-cash': 'icon-bg-petty-cash',
      wastage: 'icon-bg-wastage',
      sales: 'icon-bg-sales',
      banking: 'icon-bg-banking'
    }
    return styles[type] || 'bg-slate-100 text-slate-500'
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
    <div className="page-container">
      {/* Header */}
      <header className="page-header w-full">
        <div className="flex justify-between items-start w-full gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800 mb-1">
              {formatGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="page-subtitle">{selectedCompany?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {actionsLastUpdated && (
              <span className="text-xs text-slate-400">
                {t('lastUpdated', 'Updated')}: {new Date(actionsLastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              className="refresh-data-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{t('refresh', 'Refresh')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Banner */}
      {notifications.total > 0 && (
        <section className="panel mb-6">
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <div className="flex items-center gap-2">
              <Bell size={16} className={notifications.hasUrgent ? 'text-amber-500' : 'text-slate-400'} />
              <span className="text-xs font-semibold font-mono text-white bg-amber-500 px-1.5 py-0.5 rounded min-w-[18px] text-center">
                {notifications.total}
              </span>
            </div>
            <span className="flex-1 text-sm font-medium text-slate-600">
              {notifications.hasUrgent ? 'Urgent notifications' : 'Notifications'}
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showNotifications ? 'rotate-180' : ''}`} />
          </div>

          {showNotifications && (
            <div className="border-t border-slate-100">
              {notifications.notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-l-2 ${
                    notif.severity === 'error' ? 'border-l-rose-500 bg-rose-50/50' :
                    notif.severity === 'warning' ? 'border-l-amber-500 bg-amber-50/50' :
                    'border-l-blue-500'
                  }`}
                  onClick={() => navigate(notif.route)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    notif.severity === 'error' ? 'bg-rose-500' :
                    notif.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">{notif.title}</span>
                    <span className="text-xs text-slate-500 truncate">{notif.message}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Primary Stats Grid - Reference Design: border-based grid */}
      <section className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-slate-200">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <article
                className="stat-card-primary stat-card-collections"
                onClick={() => navigate('/purchase')}
              >
                <div className="flex items-start justify-between">
                  <div className="stat-icon-lg bg-slate-900 text-white">
                    <Package size={20} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label-right">{t('collections', 'Collections')}</span>
                </div>
                <div className="mt-10">
                  <span className="stat-value-lg">
                    {workflowStats.collections?.total || 0}
                  </span>
                  <div className="mt-4 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-accent cursor-pointer hover:underline">
                    {workflowStats.collections?.pendingWCN || 0} {t('pendingWCN', 'PENDING WCN')}
                    <ArrowRight size={12} className="ml-1" />
                  </div>
                </div>
              </article>

              <article
                className="stat-card-primary stat-card-orders"
                onClick={() => navigate('/purchase')}
              >
                <div className="flex items-start justify-between">
                  <div className="stat-icon-lg bg-slate-100 text-slate-900">
                    <FileText size={20} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label-right">{t('orders', 'Orders')}</span>
                </div>
                <div className="mt-10">
                  <span className="stat-value-lg">
                    {workflowStats.purchaseOrders?.total || 0}
                  </span>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {workflowStats.purchaseOrders?.autoGenerated || 0} {t('autoGenerated', 'AUTO-GENERATED')}
                  </div>
                </div>
              </article>

              <article
                className="stat-card-primary stat-card-invoices"
                onClick={() => navigate('/purchase')}
              >
                <div className="flex items-start justify-between">
                  <div className="stat-icon-lg bg-slate-100 text-slate-900">
                    <Banknote size={20} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label-right">{t('invoices', 'Invoices')}</span>
                </div>
                <div className="mt-10">
                  <span className="stat-value-lg">
                    {workflowStats.invoices?.unpaid || 0}
                  </span>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    OMR {(workflowStats.invoices?.outstandingAmount || 0).toLocaleString()} {t('outstanding', 'OUTSTANDING')}
                  </div>
                </div>
              </article>

              <article className="stat-card-primary stat-card-alerts">
                <div className="flex items-start justify-between">
                  <div className="stat-icon-lg bg-red-100 text-red-600">
                    <AlertTriangle size={20} strokeWidth={1.5} />
                  </div>
                  <span className="stat-label-right">{t('actions', 'Actions')}</span>
                </div>
                <div className="mt-10">
                  <span className="stat-value-lg text-red-600">
                    {pendingActions.stats.totalPending || 0}
                  </span>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-red-600">
                    {t('urgentReviewRequired', 'URGENT REVIEW REQUIRED')}
                  </div>
                </div>
              </article>
            </>
          )}
        </div>
      </section>

      {/* Secondary Stats (Mini Cards) - Reference Design: border-based grid */}
      <section className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 border-t border-l border-slate-200">
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
              <article
                className="stat-card-secondary"
                onClick={() => navigate('/contracts')}
              >
                <p className="stat-label-secondary">{t('contracts', 'Contracts')}</p>
                <div className="flex items-end justify-between">
                  <span className="stat-value-secondary">
                    {String(workflowStats.contracts?.active || 0).padStart(2, '0')}
                  </span>
                  {workflowStats.contracts?.expiringSoon > 0 && (
                    <span className="badge badge-pending">{t('pending', 'PENDING')}</span>
                  )}
                </div>
              </article>

              <article
                className="stat-card-secondary"
                onClick={() => navigate('/inventory')}
              >
                <p className="stat-label-secondary">{t('inventory', 'Inventory')}</p>
                <div className="flex items-end justify-between">
                  <span className="stat-value-secondary">
                    {String(workflowStats.inventory?.totalItems || 0).padStart(2, '0')}
                  </span>
                  {workflowStats.inventory?.lowStock > 0 && (
                    <span className="badge badge-critical">{t('critical', 'CRITICAL')}</span>
                  )}
                </div>
              </article>

              <article
                className="stat-card-secondary"
                onClick={() => navigate('/petty-cash')}
              >
                <p className="stat-label-secondary">{t('pettyCash', 'Petty Cash')}</p>
                <div className="flex items-end justify-between">
                  <span className="stat-value-secondary">
                    {String(workflowStats.pettyCash?.activeCards || 0).padStart(2, '0')}
                  </span>
                </div>
              </article>

              <article
                className="stat-card-secondary"
                onClick={() => navigate('/wastage')}
              >
                <p className="stat-label-secondary">{t('wastage', 'Wastage')}</p>
                <div className="flex items-end justify-between">
                  <span className="stat-value-secondary">
                    {String(workflowStats.wastage?.total || 0).padStart(2, '0')}
                  </span>
                </div>
              </article>

              <article
                className="stat-card-secondary"
                onClick={() => navigate('/sales')}
              >
                <p className="stat-label-secondary">{t('salesDesk', 'Sales Desk')}</p>
                <div className="flex items-end justify-between">
                  <span className="stat-value-secondary">
                    {String(workflowStats.sales?.total || 0).padStart(2, '0')}
                  </span>
                  {workflowStats.sales?.pendingDelivery > 0 && (
                    <span className="badge badge-active">{t('active', 'ACTIVE')}</span>
                  )}
                </div>
              </article>

              <article
                className="stat-card-secondary"
                onClick={() => navigate('/banking')}
              >
                <p className="stat-label-secondary">{t('banking', 'Banking')}</p>
                <div className="flex items-end justify-between">
                  <span className="stat-value-secondary">
                    {String(workflowStats.banking?.totalAccounts || 0).padStart(2, '0')}
                  </span>
                </div>
              </article>
            </>
          )}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Tasks Panel - Reference Design: Title and tabs on same row */}
        <section className="panel">
          <div className="p-8 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-display font-bold uppercase tracking-tight">{t('yourTasks', 'Your Tasks')}</h2>
            <div className="workflow-tabs">
              {[
                { id: 'all', labelKey: 'all', fallback: 'ALL' },
                { id: 'purchases', labelKey: 'purchase', fallback: 'PURCHASES' },
                { id: 'sales', labelKey: 'sales', fallback: 'SALES' },
                { id: 'finance', labelKey: 'cashFlow', fallback: 'FINANCE' },
                { id: 'approvals', labelKey: 'pendingApprovalsCard', fallback: 'APPROVALS' },
                { id: 'alerts', labelKey: 'alerts', fallback: 'ALERTS' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`workflow-tab ${taskTypeTab === tab.id ? 'workflow-tab-active' : ''}`}
                  onClick={() => setTaskTypeTab(tab.id)}
                >
                  {t(tab.labelKey, tab.fallback).toUpperCase()}{tab.id === 'all' ? ` (${getTaskCountByGroup('all')})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loading && (
              <>
                <SkeletonTaskItem />
                <SkeletonTaskItem />
                <SkeletonTaskItem />
              </>
            )}

            {!loading && getFilteredTasks().map((action, index) => (
              <div
                key={`task-${action.entityId}-${index}`}
                className={action.urgency === 'high' ? 'task-item-urgent' : 'task-item'}
              >
                <div className={`task-icon ${getTaskIconStyle(action.type)}`}>
                  {getActionIcon(action.type)}
                </div>
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span className="task-title">{action.title}</span>
                  <span className="task-desc">{action.description}</span>
                  {action.metadata && (
                    <div className="task-meta">
                      {action.metadata.supplierName && <span>{action.metadata.supplierName}</span>}
                      {action.metadata.contractNumber && <span>Contract: {action.metadata.contractNumber}</span>}
                      {action.metadata.cardName && <span>Card: {action.metadata.cardName}</span>}
                      {action.metadata.materialName && <span>{action.metadata.materialName}</span>}
                      {action.metadata.customerName && <span>{action.metadata.customerName}</span>}
                      {action.metadata.totalCost && <span className="font-mono">OMR {parseFloat(action.metadata.totalCost).toFixed(3)}</span>}
                      {action.metadata.amount && <span className="font-mono">OMR {parseFloat(action.metadata.amount).toFixed(3)}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {action.daysPending !== undefined && (
                    <span className={`badge ${action.urgency === 'high' ? 'badge-error' : 'badge-neutral'}`}>
                      {action.urgency === 'high' ? <Zap size={10} /> : <Clock size={10} />}
                      {action.daysPending}d
                    </span>
                  )}
                  <button
                    className={action.urgency === 'high' ? 'btn-tw-primary btn-tw-sm' : 'btn-tw-secondary btn-tw-sm'}
                    onClick={() => handleActionClick(action)}
                  >
                    {action.actionLabel}
                    {action.urgency === 'high' && <ArrowRight size={12} />}
                  </button>
                </div>
              </div>
            ))}

            {!loading && getFilteredTasks().length === 0 && taskTypeTab !== 'all' && (
              <div className="empty-state py-8">
                <CheckCircle size={32} strokeWidth={1} className="empty-state-icon" />
                <p className="empty-state-text">No {taskTypeTab} tasks</p>
              </div>
            )}

            {!loading && pendingActions.high.length === 0 && pendingActions.normal.length === 0 && (
              <div className="empty-state">
                <CheckCircle size={40} strokeWidth={1} className="text-emerald-500 mb-4" />
                <h3 className="empty-state-title">All caught up!</h3>
                <p className="empty-state-text">No pending actions at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed Panel */}
        <section className="panel">
          <div className="p-8 border-b border-slate-200">
            <h2 className="text-xl font-display font-bold uppercase tracking-tight">{t('recentActivity', 'Recent Activity')}</h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
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
                  <div className={`activity-icon ${getActivityIconStyle(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="activity-title">{activity.title}</span>
                    <span className="activity-desc">{activity.description}</span>
                    <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state py-8">
                <Activity size={28} strokeWidth={1} className="empty-state-icon" />
                <p className="empty-state-text">No recent activity</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default WorkflowDashboard
