import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, User, Star, DollarSign, FileText } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { collectionOrderService } from '../../services/collectionService';
import contractService from '../../services/contractService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import './collections-managers.css';

const CollectionOrderManager = () => {
  const { t, isRTL } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Load collection orders on component mount
  useEffect(() => {
    loadOrders();
  }, [pagination.page, statusFilter, dateFilter, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await collectionOrderService.getCollectionOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        dateFilter: dateFilter === 'all' ? undefined : dateFilter,
        search: searchTerm || undefined
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
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setShowCreateModal(true);
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
      title: t('calloutNumber'),
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value}</div>
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
      render: (value, row) => (
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
            <DollarSign className="w-4 h-4" />
          </button>
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
      )
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
            <Search className="w-5 h-5 search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchOrders')}
              className="search-field"
            />
          </div>
        </div>

        <div className="filters">
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
      </div>

      {/* Quick Action Bar */}
      <div className="quick-actions">
        <div className="action-buttons">
          <button 
            className="action-btn scheduled"
            onClick={() => setStatusFilter('scheduled')}
          >
            <Calendar className="w-4 h-4" />
            {t('viewScheduled')}
          </button>
          <button 
            className="action-btn in-transit"
            onClick={() => setStatusFilter('in_transit')}
          >
            <Truck className="w-4 h-4" />
            {t('viewInTransit')}
          </button>
          <button 
            className="action-btn collecting"
            onClick={() => setStatusFilter('collecting')}
          >
            <Package className="w-4 h-4" />
            {t('viewCollecting')}
          </button>
        </div>
      </div>

      {/* Collection Orders Table */}
      <div className="orders-table">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <DataTable
            data={orders}
            columns={columns}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            emptyMessage={t('noOrdersFound')}
          />
        )}
      </div>

      {/* Create/Edit Order Modal */}
      {showCreateModal && (
        <OrderFormModal
          order={selectedOrder}
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedOrder(null);
          }}
          onSubmit={() => {
            loadOrders();
            setShowCreateModal(false);
            setSelectedOrder(null);
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
    </div>
  );
};

// Collection Order Form Modal
const OrderFormModal = ({ order, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
  const [formData, setFormData] = useState({
    contractId: order?.contractId || '',
    locationId: order?.locationId || '',
    scheduledDate: order?.scheduledDate || '',
    contactPerson: order?.contactPerson || '',
    contactPhone: order?.contactPhone || '',
    driverName: order?.driverName || '',
    vehiclePlate: order?.vehiclePlate || '',
    vehicleType: order?.vehicleType || '',
    specialInstructions: order?.specialInstructions || '',
    materials: order?.materials || [],
    expenses: order?.expenses || [],
    priority: order?.priority || 'normal'
  });
  
  const [contracts, setContracts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [contractMaterials, setContractMaterials] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form (1: Contract, 2: Details, 3: Materials & Expenses)

  useEffect(() => {
    if (isOpen) {
      loadContracts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.contractId) {
      loadContractLocations();
      loadContractDetails();
    }
  }, [formData.contractId]);

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
    // This would load locations for the selected contract
    // For now, we'll simulate some locations
    setLocations([
      { id: 1, locationName: 'Main Warehouse', address: '123 Main St' },
      { id: 2, locationName: 'Secondary Site', address: '456 Industrial Rd' }
    ]);
  };

  const loadContractDetails = async () => {
    try {
      if (formData.contractId) {
        const response = await contractService.getById(formData.contractId);
        if (response.success && response.data) {
          setSelectedContract(response.data);
          
          // Load contract materials with rates
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
            
            {/* Contract Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('selectContract')} *
                </label>
                <select
                  value={formData.contractId}
                  onChange={(e) => handleInputChange('contractId', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">{t('selectContract')}</option>
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contractNumber} - {contract.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pickupLocation')} *
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => handleInputChange('locationId', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!formData.contractId}
                >
                  <option value="">{t('selectLocation')}</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.locationName} - {location.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contactPerson')}
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contactPhone')}
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('scheduledDate')} *
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Vehicle & Driver Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('driverName')}
                </label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => handleInputChange('driverName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('vehiclePlate')}
                </label>
                <input
                  type="text"
                  value={formData.vehiclePlate}
                  onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('vehicleType')}
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('selectVehicleType')}</option>
                  <option value="truck">{t('truck')}</option>
                  <option value="van">{t('van')}</option>
                  <option value="trailer">{t('trailer')}</option>
                </select>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialInstructions')}
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('anySpecialInstructionsForCollection')}
              />
            </div>

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
  
  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
    onClose();
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

          {/* Status Update Buttons */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
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
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('collectionExpenses')}>
      <div className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-medium">{t('expenseTrackingComingSoon')}</h3>
            <p className="text-gray-600">{t('expenseFeatureDescription')}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p><strong>{t('orderNumber')}:</strong> {order.orderNumber}</p>
            <p><strong>{t('totalExpenses')}:</strong> {order.totalExpenses || 0} {order.currency}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CollectionOrderManager;