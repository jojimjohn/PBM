/**
 * Customer Details Modal
 *
 * Tabbed modal for viewing customer details.
 * Uses composition of tab panel components.
 */

import React, { useState } from 'react'
import { User, Phone, Banknote, ShoppingCart, FileText, Edit } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import {
  OverviewTab,
  ContactTab,
  BusinessTab,
  SalesTab,
  ContractTab
} from './DetailsTabs'

/**
 * @typedef {import('../../types/customer.types').Customer} Customer
 */

/**
 * Tab configuration based on customer type
 * @param {Customer} customer
 * @returns {Array} Tab configuration
 */
const getTabs = (customer) => {
  const baseTabs = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
    { id: 'business', label: 'Business', icon: <Banknote size={16} /> },
    { id: 'sales', label: 'Sales', icon: <ShoppingCart size={16} /> }
  ]

  // Add contract tab only for contract customers with contract details
  if (customer.type === 'contract' && customer.contractDetails) {
    baseTabs.push({ id: 'contract', label: 'Contract', icon: <FileText size={16} /> })
  }

  return baseTabs
}

/**
 * Customer details view modal
 *
 * @param {Object} props
 * @param {Customer} props.customer - Customer to display
 * @param {Function} props.onClose - Called when modal is closed
 * @param {Function} props.onEdit - Called when edit is requested
 * @param {Function} props.onCreateOrder - Called when create order is requested
 * @param {Function} props.t - Translation function
 */
const CustomerDetailsModal = ({ customer, onClose, onEdit, onCreateOrder, t }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const tabs = getTabs(customer)

  /**
   * Render the active tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab customer={customer} t={t} />
      case 'contact':
        return <ContactTab customer={customer} t={t} />
      case 'business':
        return <BusinessTab customer={customer} />
      case 'sales':
        return <SalesTab customer={customer} onCreateOrder={onCreateOrder} />
      case 'contract':
        return <ContractTab customer={customer} />
      default:
        return null
    }
  }

  const modalFooter = (
    <button className="btn btn-outline" onClick={onClose}>
      Close
    </button>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t?.('customerDetails', 'Customer Details') || 'Customer Details'}
      footer={modalFooter}
      size="lg"
      closeOnOverlayClick={false}
      showCloseButton
    >
      {/* Header with customer info and actions */}
      <CustomerHeader
        customer={customer}
        onEdit={onEdit}
        onCreateOrder={onCreateOrder}
      />

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </Modal>
  )
}

/**
 * Customer header component with avatar and key info
 */
const CustomerHeader = ({ customer, onEdit, onCreateOrder }) => {
  const initials = customer.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200">
      <div className="flex items-center gap-4">
        {/* Avatar using Tailwind */}
        <div className="w-14 h-14 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-800">{customer.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <code className="cell-code accent">{customer.code}</code>
            <span className="status-badge">
              {customer.type ? customer.type.replace(/[-_]/g, ' ').toUpperCase() : 'N/A'}
            </span>
            <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
              {customer.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-outline btn-sm"
          onClick={onEdit}
          title="Edit Customer"
        >
          <Edit size={16} />
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={onCreateOrder}
          title="Create Order"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  )
}

export default CustomerDetailsModal
