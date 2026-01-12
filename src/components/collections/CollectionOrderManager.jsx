import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Search, Filter, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, User, Star, Banknote, FileText, ArrowRight, Droplet, Upload } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { useProjects } from '../../context/ProjectContext';
import { collectionOrderService, calloutService } from '../../services/collectionService';
import contractService from '../../services/contractService';
import supplierService from '../../services/supplierService';
import inventoryService from '../../services/inventoryService';
import uploadService from '../../services/uploadService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import DateInput from '../ui/DateInput';
import Autocomplete from '../ui/Autocomplete';
import Input, { Textarea } from '../ui/Input';
import FileUpload from '../ui/FileUpload';
import FileViewer from '../ui/FileViewer';
import WastageForm from '../../modules/oil-trading/components/WastageForm';
import './collections-managers.css';

const CollectionOrderManager = () => {
  const { t, isRTL } = useLocalization();
  const { selectedProjectId, getProjectQueryParam } = useProjects();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCallout, setSelectedCallout] = useState(null);
  // Wastage form state
  const [showWastageForm, setShowWastageForm] = useState(false);
  const [wastageOrderContext, setWastageOrderContext] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Memoized load function to avoid stale closure issues
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Get project filter params
      const projectParams = getProjectQueryParam();

      const response = await collectionOrderService.getCollectionOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        dateFilter: dateFilter === 'all' ? undefined : dateFilter,
        search: searchTerm || undefined,
        ...projectParams  // Include project_id filter
      });

      if (response.success) {
        setOrders(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error loading collection orders:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, dateFilter, searchTerm, selectedProjectId, getProjectQueryParam]);

  // Load collection orders on component mount or when filters/project change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setSelectedCallout(null);
    setShowCreateModal(true);
  };

  const handleCreateFromCallout = () => {
    setSelectedOrder(null);
    setShowCalloutModal(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowCreateModal(true);
  };

  const handleViewExpenses = (order) => {
    setSelectedOrder(order);
    setShowExpensesModal(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(t('confirmDeleteOrder'))) {
      try {
        const response = await collectionOrderService.deleteCollectionOrder(orderId);
        if (response.success) {
          loadOrders(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting collection order:', error);
      }
    }
  };

  // Open wastage form with collection context
  const handleRecordWastage = (order) => {
    setWastageOrderContext(order);
    setShowWastageForm(true);
  };

  // Handle wastage form success
  const handleWastageCreated = () => {
    setShowWastageForm(false);
    setWastageOrderContext(null);
    // Optionally refresh the orders list to update any wastage indicators
    loadOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await collectionOrderService.updateCollectionOrderStatus(orderId, newStatus);
      if (response.success) {
        loadOrders(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'in_transit': return <Truck className="w-4 h-4 text-orange-500" />;
      case 'collecting': return <Package className="w-4 h-4 text-purple-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'in_transit': return 'text-orange-600 bg-orange-100';
      case 'collecting': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      title: t('orderNumber'),
      render: (value, row) => (
        <div className="font-medium text-blue-600">
          {value}
        </div>
      )
    },
    {
      key: 'calloutNumber',
      title: t('supplierNotification'),
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value || '-'}</div>
          <div className="text-gray-500">{row.contractName}</div>
        </div>
      )
    },
    {
      key: 'locationName',
      title: t('location'),
      render: (value, row) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'scheduledDate',
      title: t('scheduledDate'),
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      title: t('status'),
      render: (value, row) => (
        <div className="flex items-center">
          {getStatusIcon(value)}
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {t(value)}
          </span>
        </div>
      )
    },
    {
      key: 'driverName',
      title: t('driver'),
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value || '-'}</div>
          <div className="text-gray-500">{row.vehicleNumber || '-'}</div>
        </div>
      )
    },
    {
      key: 'actualQuantity',
      title: t('quantity'),
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value || row.estimatedQuantity || 0}</div>
          <div className="text-gray-500">{value ? t('actual') : t('estimated')}</div>
        </div>
      )
    },
    {
      key: 'totalValue',
      title: t('totalValue'),
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value || 0} {row.currency || 'OMR'}</div>
          {row.totalExpenses > 0 && (
            <div className="text-red-500">-{row.totalExpenses} {t('expenses')}</div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: t('actions'),
      render: (value, row) => {
        const isFinalized = row.is_finalized === 1 || row.isFinalized;
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => handleViewOrder(row)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title={t('viewDetails')}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewExpenses(row)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title={t('viewExpenses')}
            >
              <Banknote className="w-4 h-4" />
            </button>
            {/* Wastage button - only for finalized orders */}
            {isFinalized && (
              <button
                onClick={() => handleRecordWastage(row)}
                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                title={t('recordWastage') || 'Record Wastage'}
              >
                <Droplet className="w-4 h-4" />
              </button>
            )}
            {(row.status === 'scheduled' || row.status === 'in_transit') && (
              <>
                <button
                  onClick={() => handleEditOrder(row)}
                  className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                  title={t('edit')}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteOrder(row.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title={t('delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className={`collection-order-manager ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="manager-header">
        <div className="header-title">
          <Truck className="w-6 h-6" />
          <h2>{t('collectionOrderManagement')}</h2>
        </div>
        <div className="header-actions">
          <button 
            className="filter-btn"
            onClick={() => {/* TODO: Implement filter modal */}}
          >
            <Filter className="w-4 h-4" />
            {t('filter')}
          </button>
          <button 
            className="filter-btn"
            onClick={handleCreateFromCallout}
          >
            <ArrowRight className="w-4 h-4" />
            {t('createFromSupplierNotification')}
          </button>
          <button 
            className="add-btn"
            onClick={handleCreateOrder}
          >
            <Plus className="w-4 h-4" />
            {t('newCollectionOrder')}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-and-filters">
        <div className="search-bar">
          <div className="search-input">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchOrders')}
              className="search-field"
            />
          </div>
          
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">{t('status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('allStatuses')}</option>
                <option value="scheduled">{t('scheduled')}</option>
                <option value="in_transit">{t('inTransit')}</option>
                <option value="collecting">{t('collecting')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t('date')}</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('allDates')}</option>
                <option value="today">{t('today')}</option>
                <option value="tomorrow">{t('tomorrow')}</option>
                <option value="this_week">{t('thisWeek')}</option>
                <option value="next_week">{t('nextWeek')}</option>
                <option value="this_month">{t('thisMonth')}</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button 
                className="filter-btn advanced-filters-btn"
                onClick={() => {/* TODO: Implement advanced filters modal */}}
                title={t('advancedFilters')}
              >
                <Filter className="w-4 h-4" />
                {t('advancedFilters')}
              </button>
              
              <button 
                className="filter-btn columns-btn"
                onClick={() => {/* TODO: Implement column toggle */}}
                title={t('columns')}
              >
                <Eye className="w-4 h-4" />
                {t('columns')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Statistics Cards */}
      <div className="collection-stats">
        <div className="stats-grid">
          <div 
            className={`stat-card clickable ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('scheduled')}
          >
            <div className="stat-icon scheduled">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{orders.filter(o => o.status === 'scheduled').length}</div>
              <div className="stat-label">{t('scheduled')}</div>
            </div>
          </div>
          
          <div 
            className={`stat-card clickable ${statusFilter === 'in_transit' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_transit')}
          >
            <div className="stat-icon in-transit">
              <Truck className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{orders.filter(o => o.status === 'in_transit').length}</div>
              <div className="stat-label">{t('inTransit')}</div>
            </div>
          </div>
          
          <div 
            className={`stat-card clickable ${statusFilter === 'collecting' ? 'active' : ''}`}
            onClick={() => setStatusFilter('collecting')}
          >
            <div className="stat-icon collecting">
              <Package className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{orders.filter(o => o.status === 'collecting').length}</div>
              <div className="stat-label">{t('collecting')}</div>
            </div>
          </div>
          
          <div 
            className={`stat-card clickable ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            <div className="stat-icon completed">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{orders.filter(o => o.status === 'completed').length}</div>
              <div className="stat-label">{t('completed')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Orders Table */}
      <div className="orders-table">
        <DataTable
          data={orders}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          emptyMessage={t('noOrdersFound')}
        />
      </div>

      {/* Create/Edit Order Modal */}
      {showCreateModal && (
        <OrderFormModal
          order={selectedOrder}
          callout={selectedCallout}
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedOrder(null);
            setSelectedCallout(null);
          }}
          onSubmit={() => {
            loadOrders();
            setShowCreateModal(false);
            setSelectedOrder(null);
            setSelectedCallout(null);
          }}
        />
      )}

      {/* Callout Selection Modal */}
      {showCalloutModal && (
        <SupplierNotificationModal
          isOpen={showCalloutModal}
          onClose={() => {
            setShowCalloutModal(false);
          }}
          onSelectNotification={(callout) => {
            setSelectedCallout(callout);
            setShowCalloutModal(false);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Order Expenses Modal */}
      {showExpensesModal && selectedOrder && (
        <OrderExpensesModal
          order={selectedOrder}
          isOpen={showExpensesModal}
          onClose={() => {
            setShowExpensesModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Wastage Form Modal */}
      {showWastageForm && wastageOrderContext && (
        <WastageForm
          isOpen={showWastageForm}
          onClose={() => {
            setShowWastageForm(false);
            setWastageOrderContext(null);
          }}
          onSuccess={handleWastageCreated}
          preSelectedCollectionId={wastageOrderContext.id}
          collectionOrderNumber={wastageOrderContext.orderNumber || wastageOrderContext.wcn_number || wastageOrderContext.wcnNumber}
          collectionMaterials={wastageOrderContext.items?.map(item => ({
            materialId: item.materialId,
            materialName: item.materialName || `Material ${item.materialId}`,
            unit: item.unit || item.materialUnit || 'KG',
            quantity: parseFloat(item.collectedQuantity || item.verifiedQuantity || 0)
          })) || []}
        />
      )}
    </div>
  );
};

// Collection Order Form Modal
const OrderFormModal = ({ order, callout, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
  const [formData, setFormData] = useState({
    supplierId: order?.supplierId || callout?.supplierId || '',
    contractId: order?.contractId || callout?.contractId || '',
    locationId: order?.locationId || callout?.locationId || '',
    calloutId: callout?.id || '',
    calloutNumber: callout?.calloutNumber || '',
    scheduledDate: order?.scheduledDate || '',
    contactPerson: order?.contactPerson || callout?.contactPerson || '',
    contactPhone: order?.contactPhone || callout?.contactPhone || '',
    driverName: order?.driverName || '',
    vehiclePlate: order?.vehiclePlate || '',
    vehicleType: order?.vehicleType || '',
    specialInstructions: order?.specialInstructions || callout?.instructions || '',
    materials: order?.materials || [],
    expenses: order?.expenses || [],
    priority: order?.priority || callout?.priority || 'normal'
  });

  const [suppliers, setSuppliers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [contractMaterials, setContractMaterials] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form (1: Contract, 2: Details, 3: Materials & Expenses)

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      loadContracts();
      // If creating from callout, load callout materials
      if (callout) {
        loadCalloutMaterials();
      }
    }
  }, [isOpen, callout]);

  // Filter contracts when supplier changes
  useEffect(() => {
    if (formData.supplierId && contracts.length > 0) {
      const supplierContracts = contracts.filter(c =>
        c.supplierId === parseInt(formData.supplierId) &&
        c.status === 'active'
      );
      setFilteredContracts(supplierContracts);
      // Clear contract and location if supplier changed
      if (!callout) {
        setFormData(prev => ({ ...prev, contractId: '', locationId: '' }));
        setLocations([]);
      }
    } else {
      setFilteredContracts([]);
    }
  }, [formData.supplierId, contracts]);

  useEffect(() => {
    if (formData.contractId) {
      loadContractLocations();
      loadContractDetails();
    }
  }, [formData.contractId]);

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      if (response.success) {
        // Filter to only active suppliers
        const activeSuppliers = (response.data || []).filter(s => s.isActive);
        setSuppliers(activeSuppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await contractService.getAll();
      if (response.success) {
        setContracts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const loadContractLocations = async () => {
    try {
      if (!formData.contractId) return;

      const response = await contractService.getById(formData.contractId);
      if (response.success && response.data) {
        const contract = response.data;

        // Extract unique locations from contract rates
        if (contract.rates && contract.rates.length > 0) {
          const locationMap = new Map();

          contract.rates.forEach(rate => {
            const locationId = rate.locationId;
            const isActive = rate.locationIsActive === 1 || rate.locationIsActive === true;

            if (!locationMap.has(locationId)) {
              locationMap.set(locationId, {
                id: locationId,
                locationName: rate.locationName,
                locationCode: rate.locationCode,
                address: rate.locationName, // Using locationName as address fallback
                isActive: isActive
              });
            }
          });

          let locations = Array.from(locationMap.values());

          // For NEW orders, filter out inactive locations
          // For EDITING existing orders, keep all locations (including inactive ones)
          if (!order && !callout) {
            locations = locations.filter(loc => loc.isActive);
          }

          setLocations(locations);
        } else {
          setLocations([]);
        }
      }
    } catch (error) {
      console.error('Error loading contract locations:', error);
      setLocations([]);
    }
  };

  const loadCalloutMaterials = async () => {
    try {
      if (callout) {
        // Get callout details with materials (backend returns 'items' not 'materials')
        const response = await calloutService.getCallout(callout.id);
        if (response.success && response.data) {
          const calloutData = response.data;

          // Load callout items with pre-filled quantities and contract rates
          // Backend returns 'items' array with contractRate from contract_location_rates
          const items = calloutData.items || calloutData.materials || [];
          setContractMaterials(items.map(item => ({
            materialId: item.materialId,
            materialName: item.materialName,
            materialCode: item.materialCode,
            selectedQuantity: item.availableQuantity || item.quantity || 0,
            unit: item.materialUnit || item.unit || 'kg',
            contractRate: item.contractRate || item.rate || 0,
            rateType: item.rateType || 'fixed_rate',
            paymentDirection: item.paymentDirection || 'we_pay',
            minimumQuantity: item.minimumQuantity || 0,
            maximumQuantity: item.maximumQuantity || null,
            estimatedValue: (item.availableQuantity || item.quantity || 0) * (item.contractRate || item.rate || 0)
          })));
        }
      }
    } catch (error) {
      console.error('Error loading callout materials:', error);
    }
  };

  const loadContractDetails = async () => {
    try {
      if (formData.contractId) {
        const response = await contractService.getById(formData.contractId);
        if (response.success && response.data) {
          setSelectedContract(response.data);
          
          // Load contract materials with rates (only if not from callout)
          if (!callout) {
            const materials = response.data.materials || [];
            setContractMaterials(materials.map(material => ({
              ...material,
              selectedQuantity: 0,
              unit: material.unit || 'kg',
              contractRate: material.rate || 0,
              estimatedValue: 0
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error loading contract details:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialQuantityChange = (materialIndex, quantity) => {
    setContractMaterials(prev => {
      const updated = [...prev];
      updated[materialIndex].selectedQuantity = parseFloat(quantity) || 0;
      updated[materialIndex].estimatedValue = updated[materialIndex].selectedQuantity * updated[materialIndex].contractRate;
      return updated;
    });
  };

  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, {
        id: Date.now(),
        category: '',
        description: '',
        amount: 0,
        notes: ''
      }]
    }));
  };

  const removeExpense = (expenseId) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== expenseId)
    }));
  };

  const updateExpense = (expenseId, field, value) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map(exp => 
        exp.id === expenseId ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const getTotalEstimatedValue = () => {
    return contractMaterials.reduce((total, material) => total + material.estimatedValue, 0);
  };

  const getTotalExpenses = () => {
    return formData.expenses.reduce((total, expense) => total + (parseFloat(expense.amount) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get selected materials with quantities
      const selectedMaterials = contractMaterials
        .filter(material => material.selectedQuantity > 0)
        .map(material => ({
          materialId: material.id || material.materialId,
          materialName: material.name || material.materialName,
          expectedQuantity: material.selectedQuantity,
          unit: material.unit,
          contractRate: material.contractRate,
          estimatedValue: material.estimatedValue,
          notes: material.notes || ''
        }));

      // Transform form data for API
      const orderData = {
        ...formData,
        materials: selectedMaterials,
        expenses: formData.expenses.filter(exp => exp.category && exp.amount > 0),
        totalEstimatedValue: getTotalEstimatedValue(),
        totalExpenses: getTotalExpenses(),
        netValue: getTotalEstimatedValue() - getTotalExpenses()
      };

      const response = order 
        ? await collectionOrderService.updateCollectionOrder(order.id, orderData)
        : await collectionOrderService.createCollectionOrder(orderData);

      if (response.success) {
        onSubmit();
        onClose();
      }
    } catch (error) {
      console.error('Error saving collection order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={order ? t('editCollectionOrder') : t('createCollectionOrder')}
      size="large"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Step 1: Contract & Location Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('contractAndLocation')}</h3>
            
            {/* Supplier Notification Information (when creating from notification) */}
            {callout && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">{t('creatingFromSupplierNotification')}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t('calloutNumber')}:</span>
                    <span className="ml-1 text-gray-900">{callout.calloutNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('status')}:</span>
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                      callout.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      callout.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t(callout.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('contract')}:</span>
                    <span className="ml-1 text-gray-900">{callout.contractName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('location')}:</span>
                    <span className="ml-1 text-gray-900">{callout.locationName}</span>
                  </div>
                </div>
                {callout.instructions && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-700">{t('instructions')}:</span>
                    <p className="ml-1 text-gray-900">{callout.instructions}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Supplier & Contract Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Autocomplete
                label={`${t('supplier')} *`}
                options={suppliers}
                value={formData.supplierId}
                onChange={(supplierId) => handleInputChange('supplierId', supplierId)}
                getOptionLabel={(supplier) => supplier ? supplier.name : ''}
                getOptionValue={(supplier) => supplier?.id || ''}
                placeholder={t('selectSupplier')}
                searchable
                required
                disabled={!!callout}
              />

              <Autocomplete
                label={`${t('contract')} *`}
                options={filteredContracts}
                value={formData.contractId}
                onChange={(contractId) => handleInputChange('contractId', contractId)}
                getOptionLabel={(contract) => contract ? `${contract.contractNumber} - ${contract.title}` : ''}
                getOptionValue={(contract) => contract?.id || ''}
                placeholder={formData.supplierId ? t('selectContract') : t('selectSupplierFirst', 'Select supplier first')}
                searchable
                required
                disabled={!formData.supplierId || !!callout}
              />

              <Autocomplete
                label={`${t('pickupLocation')} *`}
                options={locations}
                value={formData.locationId}
                onChange={(locationId) => handleInputChange('locationId', locationId)}
                getOptionLabel={(location) => location ? `${location.locationName} ${location.locationCode ? `(${location.locationCode})` : ''}` : ''}
                getOptionValue={(location) => location?.id || ''}
                placeholder={formData.contractId ? t('selectLocation') : t('selectContractFirst', 'Select contract first')}
                searchable
                required
                disabled={!formData.contractId || !!callout}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('contactPerson')}
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              />
              <Input
                label={t('contactPhone')}
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              />
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                {t('cancel')}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(2)}
                disabled={!formData.contractId || !formData.locationId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')} →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Collection Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('collectionDetails')}</h3>
            
            {/* Collection Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label={`${t('scheduledDate')} *`}
                value={formData.scheduledDate || ''}
                onChange={(value) => handleInputChange('scheduledDate', value || '')}
                minDate={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Vehicle & Driver Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('driverName')}
                type="text"
                value={formData.driverName}
                onChange={(e) => handleInputChange('driverName', e.target.value)}
              />

              <Input
                label={t('vehiclePlate')}
                type="text"
                value={formData.vehiclePlate}
                onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
              />

              <Autocomplete
                label={t('vehicleType')}
                options={[
                  { value: 'truck', label: t('truck') },
                  { value: 'van', label: t('van') },
                  { value: 'trailer', label: t('trailer') }
                ]}
                value={formData.vehicleType}
                onChange={(value) => handleInputChange('vehicleType', value)}
                placeholder={t('selectVehicleType')}
                searchable={false}
              />
            </div>

            {/* Special Instructions */}
            <Textarea
              label={t('specialInstructions')}
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              rows={3}
              placeholder={t('anySpecialInstructionsForCollection')}
            />

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ← {t('back')}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(3)}
                disabled={!formData.scheduledDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')} →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Materials & Expenses */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('materialsAndExpenses')}</h3>
            
            {/* Contract Materials Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">{t('selectMaterials')}</h4>
              {contractMaterials.length > 0 ? (
                <div className="space-y-3">
                  {contractMaterials.map((material, index) => (
                    <div key={material.id || index} className="bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('material')}</label>
                          <p className="text-sm text-gray-900">{material.name || material.materialName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('contractRate')}</label>
                          <p className="text-sm text-gray-900">{material.contractRate} OMR/{material.unit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('quantity')}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={material.selectedQuantity}
                            onChange={(e) => handleMaterialQuantityChange(index, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('estimatedValue')}</label>
                          <p className="text-sm font-semibold text-green-600">
                            {material.estimatedValue.toFixed(2)} OMR
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('noMaterialsInContract')}</p>
              )}
            </div>

            {/* Collection Expenses */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">{t('collectionExpenses')}</h4>
                <button
                  type="button"
                  onClick={addExpense}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  {t('addExpense')}
                </button>
              </div>
              
              {formData.expenses.length > 0 ? (
                <div className="space-y-3">
                  {formData.expenses.map((expense, index) => (
                    <div key={expense.id} className="bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('category')}</label>
                          <select
                            value={expense.category}
                            onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">{t('selectCategory')}</option>
                            <option value="fuel">{t('fuel')}</option>
                            <option value="transport">{t('transport')}</option>
                            <option value="labor">{t('labor')}</option>
                            <option value="equipment">{t('equipment')}</option>
                            <option value="permits">{t('permits')}</option>
                            <option value="meals">{t('meals')}</option>
                            <option value="other">{t('other')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('description')}</label>
                          <input
                            type="text"
                            value={expense.description}
                            onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('expenseDescription')}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('amount')} (OMR)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeExpense(expense.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('noExpensesAdded')}</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">{t('financialSummary')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">{t('totalEstimatedValue')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {getTotalEstimatedValue().toFixed(2)} OMR
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">{t('totalExpenses')}</p>
                  <p className="text-lg font-semibold text-red-600">
                    {getTotalExpenses().toFixed(2)} OMR
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">{t('netValue')}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {(getTotalEstimatedValue() - getTotalExpenses()).toFixed(2)} OMR
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ← {t('back')}
              </button>
              <button 
                type="submit"
                disabled={loading || contractMaterials.filter(m => m.selectedQuantity > 0).length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <LoadingSpinner size="small" /> : null}
                {order ? t('updateCollectionOrder') : t('createCollectionOrder')}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

const OrderDetailsModal = ({ order, isOpen, onClose, onUpdateStatus }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [actualQuantities, setActualQuantities] = useState({});
  const [showInventoryUpdate, setShowInventoryUpdate] = useState(false);
  
  useEffect(() => {
    if (isOpen && order) {
      // Initialize actual quantities with estimated quantities
      const initialQuantities = {};
      if (order.materials) {
        order.materials.forEach(material => {
          initialQuantities[material.materialId] = material.expectedQuantity || 0;
        });
      }
      setActualQuantities(initialQuantities);
    }
  }, [isOpen, order]);

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'completed') {
      setShowInventoryUpdate(true);
    } else {
      onUpdateStatus(order.id, newStatus);
      onClose();
    }
  };

  const handleCompleteWithInventoryUpdate = async () => {
    try {
      setLoading(true);
      
      // First update the collection order status to completed
      const statusResponse = await collectionOrderService.updateCollectionOrderStatus(order.id, 'completed');
      if (!statusResponse.success) {
        throw new Error('Failed to update order status');
      }

      // Then update inventory for each material
      const inventoryUpdates = [];
      for (const material of order.materials || []) {
        const actualQty = actualQuantities[material.materialId] || 0;
        if (actualQty > 0) {
          const inventoryUpdate = {
            materialId: material.materialId,
            quantity: actualQty,
            type: 'collection_receipt',
            referenceType: 'collection_order',
            referenceId: order.id,
            notes: `Collection from ${order.locationName} - Order ${order.orderNumber}`,
            unitCost: material.contractRate || 0,
            totalValue: actualQty * (material.contractRate || 0)
          };
          inventoryUpdates.push(inventoryUpdate);
        }
      }

      // Process inventory updates
      for (const update of inventoryUpdates) {
        try {
          await inventoryService.addStock(update);
        } catch (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Continue with other updates even if one fails
        }
      }

      // Update the collection order with actual quantities
      const orderUpdateData = {
        actualQuantities: actualQuantities,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };
      
      await collectionOrderService.updateCollectionOrder(order.id, orderUpdateData);

      onUpdateStatus(order.id, 'completed');
      onClose();
    } catch (error) {
      console.error('Error completing collection order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (materialId, quantity) => {
    setActualQuantities(prev => ({
      ...prev,
      [materialId]: parseFloat(quantity) || 0
    }));
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('collectionOrderDetails')}>
      <div className="p-4">
        <div className="space-y-4">
          {/* Order Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('orderNumber')}</label>
              <p className="text-gray-600">{order.orderNumber}</p>
            </div>
            <div>
              <label className="font-medium">{t('status')}</label>
              <p className="text-gray-600">{t(order.status)}</p>
            </div>
            <div>
              <label className="font-medium">{t('scheduledDate')}</label>
              <p className="text-gray-600">{new Date(order.scheduledDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium">{t('completedDate')}</label>
              <p className="text-gray-600">{order.completedDate ? new Date(order.completedDate).toLocaleDateString() : '-'}</p>
            </div>
          </div>

          {/* Driver and Vehicle Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('driver')}</label>
              <p className="text-gray-600">{order.driverName || '-'}</p>
            </div>
            <div>
              <label className="font-medium">{t('vehicle')}</label>
              <p className="text-gray-600">{order.vehicleNumber || '-'}</p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('estimatedQuantity')}</label>
              <p className="text-gray-600">{order.estimatedQuantity || 0}</p>
            </div>
            <div>
              <label className="font-medium">{t('actualQuantity')}</label>
              <p className="text-gray-600">{order.actualQuantity || '-'}</p>
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-medium">{t('totalValue')}</label>
              <p className="text-gray-600">{order.totalValue || 0} {order.currency}</p>
            </div>
            <div>
              <label className="font-medium">{t('totalExpenses')}</label>
              <p className="text-gray-600">{order.totalExpenses || 0} {order.currency}</p>
            </div>
            <div>
              <label className="font-medium">{t('netValue')}</label>
              <p className="text-gray-600">{order.netValue || 0} {order.currency}</p>
            </div>
          </div>

          {order.notes && (
            <div>
              <label className="font-medium">{t('notes')}</label>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Inventory Update Section (when completing) */}
          {showInventoryUpdate && (
            <div className="pt-4 border-t bg-green-50 -m-4 p-4 rounded-b-lg">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('updateInventoryQuantities')}
              </h4>
              <p className="text-sm text-green-800 mb-4">
                {t('enterActualQuantitiesCollected')}
              </p>
              
              {order.materials && order.materials.length > 0 ? (
                <div className="space-y-3">
                  {order.materials.map((material) => (
                    <div key={material.materialId} className="bg-white p-3 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('material')}</label>
                          <p className="text-sm text-gray-900">{material.materialName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('expected')}</label>
                          <p className="text-sm text-gray-600">{material.expectedQuantity} {material.unit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('actualQuantity')} *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={actualQuantities[material.materialId] || ''}
                            onChange={(e) => handleQuantityChange(material.materialId, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">{t('value')}</label>
                          <p className="text-sm font-semibold text-green-600">
                            {((actualQuantities[material.materialId] || 0) * (material.contractRate || 0)).toFixed(2)} OMR
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('noMaterialsToUpdate')}</p>
              )}

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('totalCollectionValue')}:</span>
                  <span className="ml-1 text-lg font-semibold text-green-600">
                    {Object.entries(actualQuantities).reduce((total, [materialId, qty]) => {
                      const material = order.materials?.find(m => m.materialId.toString() === materialId);
                      return total + (qty * (material?.contractRate || 0));
                    }, 0).toFixed(2)} OMR
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInventoryUpdate(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleCompleteWithInventoryUpdate}
                    disabled={loading || Object.values(actualQuantities).every(qty => qty === 0)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? <LoadingSpinner size="small" /> : <CheckCircle className="w-4 h-4" />}
                    {t('completeAndUpdateInventory')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Update Buttons */}
          {!showInventoryUpdate && order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="pt-4 border-t">
              <label className="font-medium">{t('updateStatus')}</label>
              <div className="flex space-x-2 mt-2">
                {order.status === 'scheduled' && (
                  <button
                    onClick={() => handleStatusUpdate('in_transit')}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm"
                  >
                    {t('markInTransit')}
                  </button>
                )}
                {order.status === 'in_transit' && (
                  <button
                    onClick={() => handleStatusUpdate('collecting')}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                  >
                    {t('markCollecting')}
                  </button>
                )}
                {order.status === 'collecting' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                  >
                    {t('markCompleted')}
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const OrderExpensesModal = ({ order, isOpen, onClose }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    notes: '',
    receiptFile: null
  });
  // S3 Attachments state for new expense
  const [newExpenseFiles, setNewExpenseFiles] = useState([]);
  // State to track which expense's attachments are being viewed
  const [viewingExpenseId, setViewingExpenseId] = useState(null);
  const [expenseAttachments, setExpenseAttachments] = useState({});

  useEffect(() => {
    if (isOpen && order) {
      loadExpenses();
    }
  }, [isOpen, order]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      // Load expenses for this collection order
      const response = await collectionOrderService.getCollectionOrderExpenses(order.id);
      if (response.success) {
        setExpenses(response.data || []);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      setLoading(true);
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount) || 0,
        orderId: order.id,
        status: 'pending_approval'
      };

      const response = await collectionOrderService.addCollectionExpense(order.id, expenseData);
      if (response.success) {
        // If we have files to upload, upload them now that we have the expense ID
        if (newExpenseFiles.length > 0 && response.data?.id) {
          try {
            await uploadService.uploadMultipleToS3(newExpenseFiles, 'collection-expenses', response.data.id);
          } catch (uploadError) {
            console.error('Error uploading receipt files:', uploadError);
          }
        }
        loadExpenses(); // Refresh expenses list
        setShowAddExpense(false);
        setNewExpenseFiles([]); // Clear staged files
        setNewExpense({
          category: '',
          description: '',
          amount: '',
          notes: '',
          receiptFile: null
        });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load S3 attachments for a specific expense
  const loadExpenseAttachments = async (expenseId) => {
    try {
      const result = await uploadService.getS3Files('collection-expenses', expenseId);
      if (result.success) {
        setExpenseAttachments(prev => ({
          ...prev,
          [expenseId]: result.data.map(file => ({
            id: file.id,
            originalFilename: file.original_filename,
            contentType: file.content_type,
            fileSize: file.file_size,
            downloadUrl: file.download_url
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading expense attachments:', error);
    }
  };

  // Toggle viewing attachments for an expense
  const toggleExpenseAttachments = async (expenseId) => {
    if (viewingExpenseId === expenseId) {
      setViewingExpenseId(null);
    } else {
      setViewingExpenseId(expenseId);
      if (!expenseAttachments[expenseId]) {
        await loadExpenseAttachments(expenseId);
      }
    }
  };

  // Handle deleting an attachment from an expense
  const handleDeleteExpenseAttachment = async (expenseId, fileId) => {
    try {
      const result = await uploadService.deleteS3File(fileId);
      if (result.success) {
        setExpenseAttachments(prev => ({
          ...prev,
          [expenseId]: prev[expenseId].filter(f => f.id !== fileId)
        }));
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const getExpenseCategoryIcon = (category) => {
    switch (category) {
      case 'fuel': return '⛽';
      case 'transportation': return '🚛';
      case 'loading_unloading': return '📦';
      case 'permits_fees': return '📄';
      case 'equipment_rental': return '🔧';
      case 'meals_accommodation': return '🍽️';
      case 'maintenance': return '🔨';
      default: return '💰';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('collectionExpenses')} size="large">
      <div className="p-6 space-y-4">
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">{t('orderNumber')}:</span>
              <span className="ml-1 text-gray-900">{order.orderNumber}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t('status')}:</span>
              <span className="ml-1 text-gray-900">{t(order.status)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t('totalValue')}:</span>
              <span className="ml-1 text-gray-900">{order.totalValue || 0} OMR</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t('totalExpenses')}:</span>
              <span className="ml-1 font-semibold text-red-600">{totalExpenses.toFixed(2)} OMR</span>
            </div>
          </div>
        </div>

        {/* Add Expense Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('expenses')}</h3>
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('addExpense')}
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">{t('newExpense')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('selectCategory')}</option>
                  <option value="fuel">{t('fuel')}</option>
                  <option value="transportation">{t('transportation')}</option>
                  <option value="loading_unloading">{t('loadingUnloading')}</option>
                  <option value="permits_fees">{t('permitsAndFees')}</option>
                  <option value="equipment_rental">{t('equipmentRental')}</option>
                  <option value="meals_accommodation">{t('mealsAndAccommodation')}</option>
                  <option value="maintenance">{t('maintenance')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} (OMR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('expenseDescription')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
                <textarea
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('additionalNotes')}
                />
              </div>
              {/* Receipt Attachments Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="inline w-4 h-4 mr-1" />
                  {t('receiptAttachments') || 'Receipt Attachments'}
                </label>
                <FileUpload
                  onUpload={(files) => setNewExpenseFiles(prev => [...prev, ...files])}
                  accept="image/*,.pdf"
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024}
                />
                {newExpenseFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newExpenseFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="truncate flex-1">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setNewExpenseFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddExpense(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddExpense}
                disabled={!newExpense.category || !newExpense.amount || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <LoadingSpinner size="small" /> : <Plus className="w-4 h-4" />}
                {t('addExpense')}
              </button>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          ) : expenses.length > 0 ? (
            expenses.map((expense) => (
              <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getExpenseCategoryIcon(expense.category)}</span>
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                        {t(expense.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{t('category')}:</span> {t(expense.category)}
                      </div>
                      <div>
                        <span className="font-medium">{t('date')}:</span> {new Date(expense.createdAt).toLocaleDateString()}
                      </div>
                      {expense.notes && (
                        <div className="col-span-2">
                          <span className="font-medium">{t('notes')}:</span> {expense.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {expense.amount.toFixed(2)} OMR
                    </div>
                    <button
                      onClick={() => toggleExpenseAttachments(expense.id)}
                      className="text-blue-600 text-sm hover:underline mt-1 flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      {viewingExpenseId === expense.id ? t('hideReceipts') || 'Hide Receipts' : t('viewReceipts') || 'View Receipts'}
                    </button>
                  </div>
                </div>
                {/* S3 Attachments Viewer */}
                {viewingExpenseId === expense.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        <FileText className="inline w-4 h-4 mr-1" />
                        {t('receiptAttachments') || 'Receipt Attachments'}
                      </h5>
                      <FileUpload
                        onUpload={async (files) => {
                          try {
                            await uploadService.uploadMultipleToS3(files, 'collection-expenses', expense.id);
                            loadExpenseAttachments(expense.id);
                          } catch (err) {
                            console.error('Error uploading files:', err);
                          }
                        }}
                        accept="image/*,.pdf"
                        maxFiles={5}
                        maxSize={10 * 1024 * 1024}
                      />
                    </div>
                    {expenseAttachments[expense.id]?.length > 0 ? (
                      <FileViewer
                        files={expenseAttachments[expense.id]}
                        onDelete={(fileId) => handleDeleteExpenseAttachment(expense.id, fileId)}
                        showDownload={true}
                        showDelete={true}
                      />
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        {t('noReceiptsAttached') || 'No receipts attached'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">{t('noExpensesRecorded')}</h3>
              <p>{t('addExpenseToTrackCosts')}</p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {expenses.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">{t('collectionValue')}</div>
                <div className="text-lg font-semibold text-green-600">{(order.totalValue || 0).toFixed(2)} OMR</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('totalExpenses')}</div>
                <div className="text-lg font-semibold text-red-600">{totalExpenses.toFixed(2)} OMR</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('netValue')}</div>
                <div className={`text-lg font-semibold ${(order.totalValue || 0) - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {((order.totalValue || 0) - totalExpenses).toFixed(2)} OMR
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Supplier Notification Modal for creating collection orders from supplier notifications
const SupplierNotificationModal = ({ isOpen, onClose, onSelectNotification }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [callouts, setCallouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    if (isOpen) {
      loadCallouts();
    }
  }, [isOpen, statusFilter]);

  const loadCallouts = async () => {
    try {
      setLoading(true);
      const response = await calloutService.getCallouts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      });

      if (response.success) {
        setCallouts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading callouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCallouts = callouts.filter(callout =>
    callout.calloutNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    callout.contractName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    callout.locationName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('selectSupplierNotificationForCollection')} size="large">
      <div className="p-6 space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchSupplierNotifications')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">{t('pendingNotifications')}</option>
              <option value="scheduled">{t('scheduledForCollection')}</option>
              <option value="all">{t('allNotifications')}</option>
            </select>
          </div>
        </div>

        {/* Callouts List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredCallouts.length > 0 ? (
            <div className="space-y-3">
              {filteredCallouts.map((callout) => (
                <div
                  key={callout.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectNotification(callout)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{callout.calloutNumber}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(callout.status)}`}>
                          {t(callout.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{t('contract')}:</span> {callout.contractName}
                        </div>
                        <div>
                          <span className="font-medium">{t('location')}:</span> {callout.locationName}
                        </div>
                        <div>
                          <span className="font-medium">{t('materials')}:</span> {callout.materialCount || 0} {t('items')}
                        </div>
                        <div>
                          <span className="font-medium">{t('estimatedValue')}:</span> {callout.totalEstimatedValue || 0} OMR
                        </div>
                      </div>

                      {callout.instructions && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">{t('instructions')}:</span> {callout.instructions}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-blue-600">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">{t('noSupplierNotificationsFound')}</h3>
              <p>{t('noNotificationsMatchFilter')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CollectionOrderManager;