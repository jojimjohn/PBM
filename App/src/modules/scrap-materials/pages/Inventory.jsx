import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import { Eye, Edit, Package, Truck, DollarSign } from 'lucide-react'
import '../styles/Inventory.css'

const ScrapMaterialsInventory = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table') // 'grid' or 'table' - default to table view
  const [activeTab, setActiveTab] = useState('materials') // 'materials' or 'storage'

  const materialInventory = [
    {
      id: 1,
      name: 'Copper Wire',
      grade: 'Grade A',
      currentStock: 1250,
      unit: 'KG',
      purchaseRate: 3.00,
      marketRate: 3.25,
      totalValue: 4062.5,
      status: 'ready-to-sell',
      lastPurchase: '2024-01-15',
      storageLocation: 'Warehouse A - Section 1',
      purity: '99.5%'
    },
    {
      id: 2,
      name: 'Aluminum Cans',
      grade: 'Recycled',
      currentStock: 2800,
      unit: 'KG',
      purchaseRate: 1.35,
      marketRate: 1.50,
      totalValue: 4200,
      status: 'processing',
      lastPurchase: '2024-01-14',
      storageLocation: 'Warehouse B - Section 2',
      purity: '95%'
    },
    {
      id: 3,
      name: 'Steel Scrap',
      grade: 'Mixed Grade',
      currentStock: 4200,
      unit: 'KG',
      purchaseRate: 0.75,
      marketRate: 0.85,
      totalValue: 3570,
      status: 'sorting-required',
      lastPurchase: '2024-01-13',
      storageLocation: 'Warehouse A - Section 3',
      purity: '80%'
    },
    {
      id: 4,
      name: 'Brass Fittings',
      grade: 'Clean',
      currentStock: 890,
      unit: 'KG',
      purchaseRate: 2.60,
      marketRate: 2.80,
      totalValue: 2492,
      status: 'ready-to-sell',
      lastPurchase: '2024-01-12',
      storageLocation: 'Warehouse A - Section 1',
      purity: '98%'
    },
    {
      id: 5,
      name: 'Electronic Components',
      grade: 'Mixed',
      currentStock: 450,
      unit: 'KG',
      purchaseRate: 4.50,
      marketRate: 5.20,
      totalValue: 2340,
      status: 'processing',
      lastPurchase: '2024-01-10',
      storageLocation: 'Warehouse C - Electronics',
      purity: 'Variable'
    }
  ]

  const storageLocations = [
    {
      id: 1,
      name: 'Warehouse A',
      capacity: 15000,
      currentUsage: 12750,
      sections: [
        { name: 'Section 1', materials: ['Copper Wire', 'Brass Fittings'], usage: 3500 },
        { name: 'Section 2', materials: ['Steel Scrap (Sorted)'], usage: 2200 },
        { name: 'Section 3', materials: ['Steel Scrap (Unsorted)'], usage: 4200 },
        { name: 'Section 4', materials: ['Iron'], usage: 2850 }
      ]
    },
    {
      id: 2,
      name: 'Warehouse B',
      capacity: 8000,
      currentUsage: 5600,
      sections: [
        { name: 'Section 1', materials: ['Aluminum Cans'], usage: 2800 },
        { name: 'Section 2', materials: ['Aluminum Sheets'], usage: 1900 },
        { name: 'Section 3', materials: ['Aluminum Profiles'], usage: 900 }
      ]
    },
    {
      id: 3,
      name: 'Warehouse C',
      capacity: 3000,
      currentUsage: 1200,
      sections: [
        { name: 'Electronics', materials: ['Electronic Components', 'Cables'], usage: 750 },
        { name: 'Precious Metals', materials: ['Gold Parts', 'Silver'], usage: 450 }
      ]
    }
  ]

  const getUsagePercentage = (current, capacity) => {
    return Math.round((current / capacity) * 100)
  }

  const getPotentialProfit = (stock, purchaseRate, marketRate) => {
    return ((marketRate - purchaseRate) * stock).toFixed(2)
  }

  useEffect(() => {
    // Simulate loading inventory data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1300)
    
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message="Loading inventory..." size="large" />
      </div>
    )
  }

  return (
    <div className="scrap-inventory-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Material Inventory Management</h1>
          <p>Track scrap materials, storage, and processing status</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
          <button className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
              <path d="M2 11h20" />
              <path d="M2 16h20" />
              <path d="M6 19h12" />
            </svg>
           {t('processMaterialsBtn')}
          </button>
        </div>
      </div>

      <div className="inventory-content">
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
             {t('materialsInventoryTab')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
             {t('storageManagementTab')}
          </button>
        </div>

        {activeTab === 'materials' && (
          <>
            <div className="inventory-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
                    <path d="M2 11h20" />
                    <path d="M2 16h20" />
                    <path d="M6 19h12" />
                  </svg>
                </div>
                <div className="stat-info">
                  <p className="stat-value">9,590 KG</p>
                  <p className="stat-label">{t('totalMaterialWeight')}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="stat-info">
                  <p className="stat-value">OMR 16,665</p>
                  <p className="stat-label">{t('totalInventoryValue')}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon profit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                  </svg>
                </div>
                <div className="stat-info">
                  <p className="stat-value">OMR 1,895</p>
                  <p className="stat-label">{t('potentialProfit')}</p>
                </div>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="material-grid">
                {materialInventory.map(material => (
                  <div key={material.id} className={`material-card ${material.status}`}>
                    <div className="material-header">
                      <div className="material-info">
                        <h3>{material.name}</h3>
                        <p className="material-grade">{material.grade}</p>
                      </div>
                      <div className={`status-badge ${material.status}`}>
                        {material.status === 'ready-to-sell' && '✓ Ready to Sell'}
                        {material.status === 'processing' && '⚡ Processing'}
                        {material.status === 'sorting-required' && '⚠ Sorting Required'}
                      </div>
                    </div>
                    
                    <div className="material-weight">
                      <div className="weight-display">
                        <span className="current-weight">{material.currentStock.toLocaleString()}</span>
                        <span className="unit">{material.unit}</span>
                      </div>
                      <div className="purity">Purity: {material.purity}</div>
                    </div>
                    
                    <div className="material-details">
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="label">Purchase Rate:</span>
                          <span className="value">OMR {material.purchaseRate.toFixed(3)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Market Rate:</span>
                          <span className="value">OMR {material.marketRate.toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="label">Current Value:</span>
                          <span className="value highlight">OMR {material.totalValue.toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Potential Profit:</span>
                          <span className="value profit">OMR {getPotentialProfit(material.currentStock, material.purchaseRate, material.marketRate)}</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="label">Location:</span>
                          <span className="value">{material.storageLocation}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Last Purchase:</span>
                          <span className="value">{material.lastPurchase}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="material-actions">
                      <button className="btn btn-outline btn-sm">View Details</button>
                      {material.status === 'ready-to-sell' && (
                        <button className="btn btn-success btn-sm">Sell Now</button>
                      )}
                      {material.status === 'processing' && (
                        <button className="btn btn-primary btn-sm">Check Progress</button>
                      )}
                      {material.status === 'sorting-required' && (
                        <button className="btn btn-warning btn-sm">Start Sorting</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DataTable
                data={materialInventory}
                columns={[
                  {
                    key: 'name',
                    header: t('material'),
                    sortable: true,
                    filterable: true,
                    render: (value, row) => (
                      <div className="material-cell">
                        <strong>{value}</strong>
                        <small>{row.storageLocation}</small>
                      </div>
                    )
                  },
                  {
                    key: 'currentStock',
                    header: t('weight'),
                    type: 'number',
                    sortable: true,
                    render: (value, row) => `${value.toLocaleString()} ${row.unit}`
                  },
                  {
                    key: 'grade',
                    header: t('gradePurity'),
                    sortable: true,
                    filterable: true,
                    render: (value, row) => (
                      <div className="grade-cell">
                        <span>{value}</span>
                        <small>{row.purity}</small>
                      </div>
                    )
                  },
                  {
                    key: 'purchaseRate',
                    header: t('purchaseRate'),
                    type: 'currency',
                    align: 'right',
                    sortable: true,
                    render: (value) => `OMR ${value.toFixed(3)}`
                  },
                  {
                    key: 'marketRate',
                    header: t('marketRate'),
                    type: 'currency',
                    align: 'right',
                    sortable: true,
                    render: (value) => `OMR ${value.toFixed(3)}`
                  },
                  {
                    key: 'totalValue',
                    header: t('currentValue'),
                    type: 'currency',
                    align: 'right',
                    sortable: true,
                    render: (value) => `OMR ${value.toLocaleString()}`
                  },
                  {
                    key: 'potentialProfit',
                    header: t('potentialProfit'),
                    type: 'currency',
                    align: 'right',
                    sortable: true,
                    render: (value, row) => (
                      <span className="profit-cell">
                        OMR {getPotentialProfit(row.currentStock, row.purchaseRate, row.marketRate)}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    header: t('status'),
                    sortable: true,
                    filterable: true,
                    render: (value) => (
                      <span className={`status-badge ${value}`}>
                        {value === 'ready-to-sell' && t('readyToSell')}
                        {value === 'processing' && t('processing')}
                        {value === 'sorting-required' && t('sortingRequired')}
                      </span>
                    )
                  },
                  {
                    key: 'actions',
                    header: t('actions'),
                    sortable: false,
                    render: (value, row) => (
                      <div className="table-actions">
                        <button className="btn btn-outline btn-sm">
                          <Eye size={14} />
                          {t('details')}
                        </button>
                        {row.status === 'ready-to-sell' && (
                          <button className="btn btn-success btn-sm">
                            <DollarSign size={14} />
                            {t('sellNow')}
                          </button>
                        )}
                        {row.status === 'processing' && (
                          <button className="btn btn-primary btn-sm">
                            <Package size={14} />
                            {t('checkProgress')}
                          </button>
                        )}
                        {row.status === 'sorting-required' && (
                          <button className="btn btn-warning btn-sm">
                            <Truck size={14} />
                            {t('startSorting', 'Start Sorting')}
                          </button>
                        )}
                      </div>
                    )
                  }
                ]}
                title={t('materialInventory', 'Material Inventory')}
                subtitle={t('scrapMaterialsSubtitle', 'Manage scrap material inventory and processing')}
                loading={loading}
                searchable={true}
                filterable={true}
                sortable={true}
                paginated={true}
                exportable={true}
                selectable={false}
                emptyMessage={t('noMaterialsFound', 'No materials found')}
                className="scrap-inventory-table"
                initialPageSize={10}
                stickyHeader={true}
                enableColumnToggle={true}
              />
            )}
          </>
        )}

        {activeTab === 'storage' && (
          <div className="storage-management">
            <div className="storage-overview">
              <h2>Storage Locations Overview</h2>
              <div className="storage-grid">
                {storageLocations.map(location => (
                  <div key={location.id} className="storage-card">
                    <div className="storage-header">
                      <h3>{location.name}</h3>
                      <div className="usage-percentage">
                        {getUsagePercentage(location.currentUsage, location.capacity)}% Full
                      </div>
                    </div>
                    
                    <div className="storage-capacity">
                      <div className="capacity-bar">
                        <div 
                          className="capacity-fill"
                          style={{width: `${getUsagePercentage(location.currentUsage, location.capacity)}%`}}
                        ></div>
                      </div>
                      <div className="capacity-text">
                        {location.currentUsage.toLocaleString()} / {location.capacity.toLocaleString()} KG
                      </div>
                    </div>
                    
                    <div className="storage-sections">
                      <h4>Sections:</h4>
                      {location.sections.map((section, index) => (
                        <div key={index} className="section-item">
                          <div className="section-info">
                            <span className="section-name">{section.name}:</span>
                            <span className="section-materials">{section.materials.join(', ')}</span>
                          </div>
                          <span className="section-usage">{section.usage} KG</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="storage-actions">
                      <button className="btn btn-outline btn-sm">Manage Sections</button>
                      <button className="btn btn-primary btn-sm">Optimize Layout</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScrapMaterialsInventory