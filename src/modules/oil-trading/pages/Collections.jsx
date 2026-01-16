import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Truck, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import CollectionDashboard from '../../../components/collections/CollectionDashboard';
import CalloutManager from '../../../components/collections/CalloutManager';
// Custom hook for collections dashboard data
import { useCollections } from '../hooks';
import '../styles/Collections.css';

const Collections = () => {
  const { t, isRTL } = useLocalization();
  const [activeTab, setActiveTab] = useState('orders');

  // Use the custom hook for dashboard data management
  const {
    dashboardData,
    loading,
    error,
    loadDashboardData,
    refresh
  } = useCollections({ statsLimit: 50, recentLimit: 10 });

  // Local error state for UI management (can be cleared by user)
  const [displayError, setDisplayError] = useState('');

  // Sync hook error with display error
  useEffect(() => {
    if (error) {
      setDisplayError(t('errorLoadingDashboard') || error);
    }
  }, [error, t]);

  const tabs = [
    {
      id: 'dashboard',
      name: t('dashboard'),
      icon: <Package className="w-4 h-4" />,
      component: CollectionDashboard
    },
    {
      id: 'orders',
      name: t('collectionOrders'),
      icon: <Truck className="w-4 h-4" />,
      component: CalloutManager
    }
  ];

  // Load dashboard data when switching to dashboard tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, loadDashboardData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDisplayError(''); // Clear any errors when switching tabs
  };

  const renderActiveTab = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return null;

    const Component = currentTab.component;

    if (activeTab === 'dashboard') {
      return (
        <Component
          data={dashboardData}
          loading={loading}
          error={displayError}
          onRefresh={refresh}
        />
      );
    }

    return <Component />;
  };

  return (
    <div className={`collections-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Page Header */}
      <div className="collections-header">
        <div className="header-title">
          <Package className="header-icon" />
          <div>
            <h1>{t('collectionsModule')}</h1>
            <span className="header-subtitle">{t('materialCollectionWorkflow')}</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={refresh}
            disabled={loading}
          >
            <Clock className="w-4 h-4" />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="collections-content">
        {displayError && (
          <div className="error-banner">
            <AlertCircle className="w-5 h-5" />
            <span>{displayError}</span>
            <button
              onClick={() => setDisplayError('')}
              className="error-close"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading && activeTab === 'dashboard' ? (
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <p>{t('loadingDashboard')}</p>
          </div>
        ) : (
          renderActiveTab()
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="stat-item">
          <Calendar className="stat-icon pending" />
          <div className="stat-details">
            <span className="stat-value">{dashboardData.statistics.scheduled || 0}</span>
            <span className="stat-label">{t('scheduledCollections')}</span>
          </div>
        </div>

        <div className="stat-item">
          <Truck className="stat-icon in-progress" />
          <div className="stat-details">
            <span className="stat-value">{(dashboardData.statistics.inTransit || 0) + (dashboardData.statistics.collecting || 0)}</span>
            <span className="stat-label">{t('activeCollections')}</span>
          </div>
        </div>

        <div className="stat-item">
          <CheckCircle className="stat-icon completed" />
          <div className="stat-details">
            <span className="stat-value">{dashboardData.statistics.completed || 0}</span>
            <span className="stat-label">{t('completedCollections')}</span>
          </div>
        </div>

        <div className="stat-item">
          <Package className="stat-icon urgent" />
          <div className="stat-details">
            <span className="stat-value">{dashboardData.recentOrders.length}</span>
            <span className="stat-label">{t('recentOrders')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collections;
