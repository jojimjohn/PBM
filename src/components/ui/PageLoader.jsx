/**
 * PageLoader Component
 *
 * Displays a skeleton loading UI while lazy-loaded pages are being fetched.
 * Used as the fallback for React.Suspense when code splitting routes.
 */

import React from 'react'
import './PageLoader.css'

const PageLoader = () => {
  return (
    <div className="page-loader">
      <div className="page-loader-content">
        {/* Header skeleton */}
        <div className="loader-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </div>

        {/* Stats cards skeleton */}
        <div className="loader-stats">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="loader-stat-card">
              <div className="skeleton skeleton-stat-icon" />
              <div className="skeleton skeleton-stat-value" />
              <div className="skeleton skeleton-stat-label" />
            </div>
          ))}
        </div>

        {/* Content area skeleton */}
        <div className="loader-content-area">
          <div className="loader-toolbar">
            <div className="skeleton skeleton-search" />
            <div className="skeleton skeleton-button" />
          </div>
          <div className="loader-table">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageLoader
