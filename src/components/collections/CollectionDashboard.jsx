import React from 'react';
import { AlertCircle, Truck, MapPin, Calendar, Clock, Package, TrendingUp, Users, Target } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { collectionUtils } from '../../services/collectionService';
import LoadingSpinner from '../LoadingSpinner';
import './CollectionDashboard.css';

const CollectionDashboard = ({ data, loading, error, onRefresh }) => {
  const { t, isRTL } = useLocalization();
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" />
        <p>{t('loadingDashboard')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3>{t('dashboardError')}</h3>
        <p>{error}</p>
        <button onClick={onRefresh} className="retry-btn">
          {t('retry')}
        </button>
      </div>
    );
  }

  const { 
    activeCallouts = [], 
    recentOrders = [], 
    statistics = {} 
  } = data || {};

  return (
    <div className={`collection-dashboard ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card pending">
          <div className="card-icon">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{statistics.pending || 0}</h3>
            <p>{t('pendingCallouts')}</p>
            <span className="card-trend">
              {statistics.pending > statistics.scheduled ? t('increasing') : t('stable')}
            </span>
          </div>
        </div>

        <div className="summary-card scheduled">
          <div className="card-icon">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{statistics.scheduled || 0}</h3>
            <p>{t('scheduledCollections')}</p>
            <span className="card-trend">
              {statistics.scheduled > 0 ? t('active') : t('none')}
            </span>
          </div>
        </div>

        <div className="summary-card in-progress">
          <div className="card-icon">
            <Truck className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{statistics.inProgress || 0}</h3>
            <p>{t('inProgressCollections')}</p>
            <span className="card-trend">
              {statistics.inProgress > 0 ? t('ongoing') : t('none')}
            </span>
          </div>
        </div>

        <div className="summary-card urgent">
          <div className="card-icon">
            <Target className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{statistics.urgent || 0}</h3>
            <p>{t('urgentCallouts')}</p>
            <span className="card-trend">
              {statistics.urgent > 0 ? t('attention') : t('good')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Active Callouts */}
        <div className="dashboard-section">
          <div className="section-header">
            <div className="section-title">
              <AlertCircle className="w-5 h-5" />
              <h2>{t('activeCallouts')}</h2>
            </div>
            <span className="section-count">{activeCallouts.length}</span>
          </div>
          
          <div className="section-content">
            {activeCallouts.length === 0 ? (
              <div className="empty-state">
                <Package className="w-12 h-12 text-gray-400" />
                <p>{t('noActiveCallouts')}</p>
              </div>
            ) : (
              <div className="callout-list">
                {activeCallouts.slice(0, 5).map((callout) => (
                  <div key={callout.id} className="callout-item">
                    <div className="callout-info">
                      <div className="callout-header">
                        <span className="callout-number">{callout.calloutNumber}</span>
                        <div className="callout-badges">
                          <span className={`status-badge ${callout.status}`}>
                            {collectionUtils.formatStatus(callout.status).text}
                          </span>
                          <span className={`priority-badge ${callout.priority}`}>
                            {collectionUtils.formatPriority(callout.priority).text}
                          </span>
                        </div>
                      </div>
                      
                      <div className="callout-details">
                        <div className="detail-item">
                          <Users className="w-4 h-4" />
                          <span>{callout.supplierName}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin className="w-4 h-4" />
                          <span>{callout.locationName}</span>
                        </div>
                        <div className="detail-item">
                          <Package className="w-4 h-4" />
                          <span>{callout.itemCount || 0} {t('items')}</span>
                        </div>
                        <div className="detail-item">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(callout.calloutDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="callout-actions">
                      <button className="action-btn primary">
                        {t('scheduleCollection')}
                      </button>
                    </div>
                  </div>
                ))}
                
                {activeCallouts.length > 5 && (
                  <div className="view-all">
                    <button className="view-all-btn">
                      {t('viewAll')} ({activeCallouts.length - 5} {t('more')})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Collection Orders */}
        <div className="dashboard-section">
          <div className="section-header">
            <div className="section-title">
              <Truck className="w-5 h-5" />
              <h2>{t('recentCollectionOrders')}</h2>
            </div>
            <span className="section-count">{recentOrders.length}</span>
          </div>
          
          <div className="section-content">
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <Truck className="w-12 h-12 text-gray-400" />
                <p>{t('noRecentOrders')}</p>
              </div>
            ) : (
              <div className="order-list">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div className="order-header">
                        <span className="order-number">{order.orderNumber}</span>
                        <span className={`status-badge ${order.status}`}>
                          {collectionUtils.formatStatus(order.status).text}
                        </span>
                      </div>
                      
                      <div className="order-details">
                        <div className="detail-item">
                          <Users className="w-4 h-4" />
                          <span>{order.supplierName}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin className="w-4 h-4" />
                          <span>{order.locationName}</span>
                        </div>
                        <div className="detail-item">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        {order.calculatedValue && (
                          <div className="detail-item">
                            <TrendingUp className="w-4 h-4" />
                            <span>{collectionUtils.formatCurrency(order.calculatedValue)}</span>
                          </div>
                        )}
                      </div>
                      
                      {order.driverName && (
                        <div className="driver-info">
                          <span className="driver-label">{t('driver')}:</span>
                          <span className="driver-name">{order.driverName}</span>
                          {order.vehiclePlate && (
                            <span className="vehicle-plate">({order.vehiclePlate})</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="order-progress">
                      <div className={`progress-indicator ${order.status}`}>
                        {collectionUtils.formatStatus(order.status).icon}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentOrders.length > 5 && (
                  <div className="view-all">
                    <button className="view-all-btn">
                      {t('viewAll')} ({recentOrders.length - 5} {t('more')})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div className="metrics-header">
          <h2>{t('performanceMetrics')}</h2>
          <span className="metrics-period">{t('thisMonth')}</span>
        </div>
        
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value">
              {statistics.totalCallouts || 0}
            </div>
            <div className="metric-label">{t('totalCallouts')}</div>
            <div className="metric-change positive">+12%</div>
          </div>
          
          <div className="metric-item">
            <div className="metric-value">
              {statistics.totalCollections || 0}
            </div>
            <div className="metric-label">{t('totalCollections')}</div>
            <div className="metric-change positive">+8%</div>
          </div>
          
          <div className="metric-item">
            <div className="metric-value">
              {statistics.fulfillmentRate || 0}%
            </div>
            <div className="metric-label">{t('fulfillmentRate')}</div>
            <div className="metric-change neutral">±0%</div>
          </div>
          
          <div className="metric-item">
            <div className="metric-value">
              {statistics.averageResponseTime || 0}h
            </div>
            <div className="metric-label">{t('avgResponseTime')}</div>
            <div className="metric-change negative">-15%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDashboard;