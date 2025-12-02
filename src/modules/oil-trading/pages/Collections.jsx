import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, Filter, Calendar, MapPin, Truck, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';
import { calloutService, collectionOrderService, collectionUtils } from '../../../services/collectionService';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import CollectionDashboard from '../../../components/collections/CollectionDashboard';
import CalloutManager from '../../../components/collections/CalloutManager';
import '../styles/Collections.css';

const Collections = () => {
  const { t, isRTL } = useLocalization();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    activeCallouts: [],
    recentOrders: [],
    statistics: {
      pending: 0,
      scheduled: 0,
      inTransit: 0,
      collecting: 0,
      completed: 0
    }
  });

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

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load collection orders for dashboard
      console.log('Loading collection orders...'); // Debug log

      const [allOrdersResponse, recentOrdersResponse] = await Promise.all([
        collectionOrderService.getCollectionOrders({
          page: 1,
          limit: 50 // Get more data for statistics
        }).catch(err => {
          console.error('Error loading all orders:', err);
          return { success: false, error: err.message };
        }),
        collectionOrderService.getCollectionOrders({
          page: 1,
          limit: 10
        }).catch(err => {
          console.error('Error loading recent orders:', err);
          return { success: false, error: err.message };
        })
      ]);

      console.log('All orders response:', allOrdersResponse); // Debug log
      console.log('Recent orders response:', recentOrdersResponse); // Debug log

      // Handle both successful and failed API responses gracefully
      const allOrders = (allOrdersResponse?.success ? allOrdersResponse.data : []) || [];
      const recentOrders = (recentOrdersResponse?.success ? recentOrdersResponse.data : []) || [];

      setDashboardData({
        activeCallouts: [], // No more callouts - removed functionality
        recentOrders: recentOrders,
        statistics: {
          pending: 0, // No more pending callouts
          scheduled: allOrders.filter(o => o.status === 'scheduled').length || 0,
          inTransit: allOrders.filter(o => o.status === 'in_transit').length || 0,
          collecting: allOrders.filter(o => o.status === 'collecting').length || 0,
          completed: allOrders.filter(o => o.status === 'completed').length || 0
        }
      });

      // Log API errors but don't fail the dashboard load
      if (!allOrdersResponse?.success) {
        console.warn('Failed to load all orders:', allOrdersResponse?.error);
      }
      if (!recentOrdersResponse?.success) {
        console.warn('Failed to load recent orders:', recentOrdersResponse?.error);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(t('errorLoadingDashboard') || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setError(''); // Clear any errors when switching tabs
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
          error={error}
          onRefresh={loadDashboardData}
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
            onClick={loadDashboardData}
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
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="collections-content">
        {error && (
          <div className="error-banner">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
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
