import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, Check, AlertTriangle, Info, CheckCircle,
  Clock, Trash2, Settings as SettingsIcon, MoreVertical
} from 'lucide-react'
// CSS moved to global index.css Tailwind

/**
 * NotificationPanel Component
 *
 * Dropdown notification center with real-time updates
 *
 * @param {Array} notifications - Array of notification objects
 * @param {Function} onMarkAsRead - Mark notification as read handler
 * @param {Function} onDelete - Delete notification handler
 * @param {Function} onClearAll - Clear all notifications handler
 * @param {Function} onSettingsClick - Open notification settings handler
 */
const NotificationPanel = ({
  notifications = [],
  onMarkAsRead,
  onDelete,
  onClearAll,
  onSettingsClick
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // all, unread, read
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="notification-icon success" size={20} />
      case 'warning':
        return <AlertTriangle className="notification-icon warning" size={20} />
      case 'error':
        return <X className="notification-icon error" size={20} />
      case 'info':
      default:
        return <Info className="notification-icon info" size={20} />
    }
  }

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000)

    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notification-panel-container">
      {/* Notification Button - Premium action button style */}
      <button
        ref={buttonRef}
        className="action-btn relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} className="text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            className="notification-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="notification-header">
              <div className="notification-title">
                <Bell size={18} />
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="unread-count">{unreadCount} new</span>
                )}
              </div>
              <div className="notification-header-actions">
                {notifications.length > 0 && (
                  <button
                    className="icon-btn"
                    onClick={onClearAll}
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  className="icon-btn"
                  onClick={onSettingsClick}
                  title="Notification settings"
                >
                  <SettingsIcon size={16} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="notification-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              <button
                className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id || index}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="notification-content">
                      {getIcon(notification.type)}
                      <div className="notification-body">
                        <h4 className="notification-item-title">
                          {notification.title}
                        </h4>
                        <p className="notification-message">
                          {notification.message}
                        </p>
                        <div className="notification-meta">
                          <Clock size={12} />
                          <span>{formatTimeAgo(notification.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <button
                          className="icon-btn small"
                          onClick={() => onMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className="icon-btn small"
                        onClick={() => onDelete(notification.id)}
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="notification-empty">
                  <Bell size={48} />
                  <p>No notifications</p>
                  <span>
                    {filter === 'all'
                      ? "You're all caught up!"
                      : filter === 'unread'
                      ? 'No unread notifications'
                      : 'No read notifications'}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="notification-footer">
                <button className="view-all-btn">View all notifications</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationPanel
