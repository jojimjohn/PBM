/**
 * Customer Details Tab Components
 *
 * Individual tab panels for the customer details modal.
 * Each tab focuses on a specific aspect of customer data.
 * Uses consistent InfoItem component for label/value display.
 */

import React from 'react'
import {
  User, Phone, Mail, Calendar, Banknote, ShoppingCart, FileText, MapPin, CheckCircle, XCircle
} from 'lucide-react'

/**
 * Reusable Info Item component for consistent label/value display
 */
const InfoItem = ({ icon: Icon, label, value, variant, className = '' }) => {
  // Determine value styling based on variant
  const getValueClass = () => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600 font-semibold'
      case 'warning':
        return 'text-amber-600 font-semibold'
      case 'error':
        return 'text-red-600 font-semibold'
      case 'muted':
        return 'text-slate-400'
      case 'code':
        return 'font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm'
      default:
        return 'text-slate-800 font-medium'
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
        {Icon && <Icon size={12} className="text-slate-400" />}
        <span>{label}</span>
      </div>
      <div className={`text-sm ${getValueClass()}`}>
        {value || <span className="text-slate-400 italic">Not specified</span>}
      </div>
    </div>
  )
}

/**
 * Overview Tab - Quick summary with clean grid layout
 */
export const OverviewTab = ({ customer, t }) => (
  <div className="py-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <InfoItem
        icon={User}
        label="Contact Person"
        value={customer.contactPerson}
      />
      <InfoItem
        icon={Phone}
        label="Phone"
        value={customer.contact?.phone}
      />
      <InfoItem
        icon={Mail}
        label="Email"
        value={customer.contact?.email}
      />
      <InfoItem
        icon={Banknote}
        label="Credit Limit"
        value={`OMR ${parseFloat(customer.creditLimit || 0).toFixed(3)}`}
        variant="success"
      />
      <InfoItem
        icon={Calendar}
        label="Payment Terms"
        value={`${customer.paymentTerms || 0} days`}
      />
      <InfoItem
        icon={customer.is_taxable !== false ? CheckCircle : XCircle}
        label="Tax Status"
        value={customer.is_taxable !== false ? 'VAT Applied' : 'Non-Taxable'}
        variant={customer.is_taxable !== false ? 'success' : 'muted'}
      />
    </div>
  </div>
)

/**
 * Contact Tab - Detailed contact information
 */
export const ContactTab = ({ customer, t }) => {
  const formatAddress = () => {
    const addr = customer.contact?.address
    if (!addr) return null
    const parts = [addr.street, addr.city, addr.region].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InfoItem
          icon={User}
          label="Contact Person"
          value={customer.contactPerson}
        />
        <InfoItem
          icon={Phone}
          label="Phone Number"
          value={customer.contact?.phone}
        />
        <InfoItem
          icon={Mail}
          label="Email Address"
          value={customer.contact?.email}
        />
        <InfoItem
          icon={FileText}
          label={t?.('vatRegistrationNumber') || 'VAT Registration'}
          value={customer.contact?.vatRegistrationNumber || 'Not registered'}
          variant={customer.contact?.vatRegistrationNumber ? 'default' : 'muted'}
        />
        <InfoItem
          icon={MapPin}
          label="Address"
          value={formatAddress()}
          className="sm:col-span-2"
        />
      </div>
    </div>
  )
}

/**
 * Business Tab - Business terms and settings
 */
export const BusinessTab = ({ customer }) => (
  <div className="py-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <InfoItem
        icon={Banknote}
        label="Credit Limit"
        value={`OMR ${parseFloat(customer.creditLimit || 0).toFixed(3)}`}
        variant="success"
      />
      <InfoItem
        icon={Calendar}
        label="Payment Terms"
        value={`${customer.paymentTerms || 0} days`}
      />
      <InfoItem
        icon={FileText}
        label="VAT Status"
        value={customer.is_taxable !== false ? '✓ Taxable' : '✗ Non-Taxable'}
        variant={customer.is_taxable !== false ? 'success' : 'muted'}
      />
      <InfoItem
        icon={User}
        label="Customer Type"
        value={customer.type?.replace(/[-_]/g, ' ').toUpperCase()}
      />
    </div>
  </div>
)

/**
 * Sales Tab - Sales history and statistics
 */
export const SalesTab = ({ customer, onCreateOrder }) => {
  const hasOrders = customer.salesHistory?.totalOrders > 0

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <InfoItem
          icon={ShoppingCart}
          label="Total Orders"
          value={customer.salesHistory?.totalOrders || 0}
        />
        <InfoItem
          icon={Banknote}
          label="Total Revenue"
          value={`OMR ${customer.salesHistory?.totalValue?.toFixed(3) || '0.000'}`}
          variant="success"
        />
        <InfoItem
          icon={Calendar}
          label="Last Order Date"
          value={customer.salesHistory?.lastOrderDate
            ? new Date(customer.salesHistory.lastOrderDate).toLocaleDateString()
            : null}
        />
      </div>

      {!hasOrders && (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <ShoppingCart size={40} className="text-slate-300 mb-3" />
          <h4 className="text-base font-semibold text-slate-600 mb-1">No Orders Yet</h4>
          <p className="text-sm text-slate-500 mb-4">This customer hasn't placed any orders yet.</p>
          <button className="btn btn-primary btn-sm" onClick={onCreateOrder}>
            Create First Order
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Contract Tab - Contract summary (only for contract customers)
 */
export const ContractTab = ({ customer }) => {
  const contract = customer.contractDetails
  if (!contract) return null

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  )

  const isExpiringSoon = daysRemaining <= 30
  const isExpired = daysRemaining === 0

  return (
    <div className="py-4 space-y-6">
      {/* Contract Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <FileText size={16} className="text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contract Details</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <InfoItem
          label="Contract ID"
          value={contract.contractId}
          variant="code"
        />
        <InfoItem
          label="Status"
          value={
            <span className={`status-badge ${contract.status}`}>
              {contract.status.toUpperCase()}
            </span>
          }
        />
        <InfoItem
          label="Days Remaining"
          value={`${daysRemaining} days`}
          variant={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'default'}
        />
        <InfoItem
          icon={Calendar}
          label="Start Date"
          value={new Date(contract.startDate).toLocaleDateString()}
        />
        <InfoItem
          icon={Calendar}
          label="End Date"
          value={new Date(contract.endDate).toLocaleDateString()}
        />
      </div>

      {contract.specialTerms && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Special Terms & Conditions</span>
          </div>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{contract.specialTerms}</p>
        </div>
      )}
    </div>
  )
}

export default {
  OverviewTab,
  ContactTab,
  BusinessTab,
  SalesTab,
  ContractTab
}
