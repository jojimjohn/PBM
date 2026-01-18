import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Banknote, Wallet, AlertCircle, Fuel, Building2 } from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
// CSS moved to global index.css Tailwind

/**
 * PaymentMethodSelect Component
 *
 * A radio group component for selecting expense payment method.
 * Supports four payment methods:
 * - top_up_card: User's assigned petty cash card (deducts from card balance)
 * - petrol_card: Shared fuel card (fuel expenses only)
 * - company_card: Company debit card (no petty cash deduction)
 * - iou: Personal expense (requires reimbursement when approved)
 *
 * Usage:
 * <PaymentMethodSelect
 *   value={paymentMethod}
 *   onChange={setPaymentMethod}
 *   category={selectedCategory}
 *   error={errors.paymentMethod}
 * />
 */

// Payment method definitions with icons and metadata
const PAYMENT_METHODS = [
  {
    value: 'top_up_card',
    icon: CreditCard,
    labelKey: 'topUpCardPayment',
    defaultLabel: 'Top-up Card',
    descKey: 'topUpCardPaymentDesc',
    defaultDesc: 'Use your assigned petty cash card',
    requiresReimbursement: false,
    fuelOnly: false,
    color: '#3b82f6' // Blue
  },
  {
    value: 'petrol_card',
    icon: Fuel,
    labelKey: 'petrolCardPayment',
    defaultLabel: 'Petrol Card',
    descKey: 'petrolCardPaymentDesc',
    defaultDesc: 'Shared company fuel card',
    requiresReimbursement: false,
    fuelOnly: true,  // Only available for fuel category
    color: '#f59e0b' // Amber
  },
  {
    value: 'company_card',
    icon: Building2,
    labelKey: 'companyCardPayment',
    defaultLabel: 'Company Card',
    descKey: 'companyCardPaymentDesc',
    defaultDesc: 'Company debit/credit card',
    requiresReimbursement: false,
    fuelOnly: false,
    color: '#8b5cf6' // Purple
  },
  {
    value: 'iou',
    icon: Wallet,
    labelKey: 'iouPayment',
    defaultLabel: 'IOU (Personal)',
    descKey: 'iouPaymentDesc',
    defaultDesc: 'Personal expense - reimbursed when approved',
    requiresReimbursement: true,
    fuelOnly: false,
    color: '#ef4444' // Red
  }
]

const PaymentMethodSelect = forwardRef(({
  value,
  onChange,
  error,
  disabled = false,
  showDescriptions = true,
  showReimbursementWarning = true,
  label,
  required = false,
  className = '',
  category = null,  // Expense category - used to enable/disable petrol card
  petrolCardBalance = null,  // Optional: show petrol card balance
  topUpCardBalance = null,   // Optional: show top-up card balance
  compact = false,  // Compact inline layout for forms
  ...props
}, ref) => {
  const { t, isRTL } = useLocalization()

  const handleSelect = (methodValue) => {
    if (!disabled && onChange) {
      onChange(methodValue)
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === value)
  const isFuelCategory = category === 'fuel'

  // Compact mode: inline horizontal layout with Tailwind
  if (compact) {
    return (
      <div ref={ref} className={`space-y-2 ${className} ${isRTL ? 'rtl' : ''}`} {...props}>
        {label && (
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon
            const isSelected = value === method.value
            const isPetrolDisabled = method.fuelOnly && !isFuelCategory
            const isMethodDisabled = disabled || isPetrolDisabled

            // Color classes based on method
            const getColorClasses = () => {
              if (isMethodDisabled) return 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              if (!isSelected) return 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              // Selected state with method-specific colors
              switch (method.value) {
                case 'top_up_card': return 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                case 'petrol_card': return 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500'
                case 'company_card': return 'border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-500'
                case 'iou': return 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                default: return 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
              }
            }

            return (
              <button
                key={method.value}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all duration-150 ${getColorClasses()}`}
                onClick={() => !isMethodDisabled && handleSelect(method.value)}
                disabled={isMethodDisabled}
                title={isPetrolDisabled
                  ? t('petrolCardFuelOnly', 'Petrol card can only be used for fuel expenses')
                  : t(method.descKey, method.defaultDesc)
                }
              >
                <Icon size={14} />
                <span>{t(method.labelKey, method.defaultLabel)}</span>
                {method.fuelOnly && !isFuelCategory && <span className="text-amber-500">⛽</span>}
              </button>
            )
          })}
        </div>

        {/* Compact info messages */}
        <AnimatePresence>
          {showReimbursementWarning && selectedMethod?.requiresReimbursement && (
            <motion.div
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{t('iouReimbursementNote', 'Personal expense - reimbursed when approved')}</span>
            </motion.div>
          )}
          {value === 'petrol_card' && (
            <motion.div
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Fuel size={14} className="shrink-0" />
              <span>{t('petrolCardSharedNote', 'Using shared company petrol card')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  // Full mode: card grid layout
  return (
    <div ref={ref} className={`payment-method-select ${className} ${isRTL ? 'rtl' : ''}`} {...props}>
      {/* Label */}
      {label && (
        <label className="payment-method-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      {/* Payment Method Options */}
      <div className="payment-method-options payment-method-grid-4">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon
          const isSelected = value === method.value
          const isPetrolDisabled = method.fuelOnly && !isFuelCategory
          const isMethodDisabled = disabled || isPetrolDisabled

          return (
            <motion.button
              key={method.value}
              type="button"
              className={`payment-method-option ${isSelected ? 'selected' : ''} ${isMethodDisabled ? 'disabled' : ''}`}
              onClick={() => !isMethodDisabled && handleSelect(method.value)}
              disabled={isMethodDisabled}
              whileHover={!isMethodDisabled ? { scale: 1.02 } : {}}
              whileTap={!isMethodDisabled ? { scale: 0.98 } : {}}
              style={{
                '--method-color': method.color,
                '--method-color-light': `${method.color}15`
              }}
              title={isPetrolDisabled ? t('petrolCardFuelOnly', 'Petrol card can only be used for fuel expenses') : ''}
            >
              {/* Selection Indicator */}
              <div className={`option-radio ${isSelected ? 'checked' : ''}`}>
                {isSelected && (
                  <motion.div
                    className="radio-dot"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>

              {/* Icon */}
              <div className="option-icon">
                <Icon size={22} />
              </div>

              {/* Content */}
              <div className="option-content">
                <span className="option-label">{t(method.labelKey, method.defaultLabel)}</span>
                {showDescriptions && (
                  <span className="option-description">{t(method.descKey, method.defaultDesc)}</span>
                )}
                {/* Show balance info if provided */}
                {method.value === 'petrol_card' && petrolCardBalance !== null && (
                  <span className="option-balance">
                    {t('balance', 'Balance')}: OMR {parseFloat(petrolCardBalance).toFixed(3)}
                  </span>
                )}
                {method.value === 'top_up_card' && topUpCardBalance !== null && (
                  <span className="option-balance">
                    {t('balance', 'Balance')}: OMR {parseFloat(topUpCardBalance).toFixed(3)}
                  </span>
                )}
              </div>

              {/* Fuel Only Badge for Petrol Card */}
              {method.fuelOnly && !isSelected && (
                <div className="fuel-only-badge">
                  ⛽ {t('fuelOnly', 'Fuel Only')}
                </div>
              )}

              {/* Reimbursement Badge */}
              {method.requiresReimbursement && isSelected && (
                <motion.div
                  className="reimbursement-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {t('requiresReimbursement', 'Reimbursable')}
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* IOU Reimbursement Warning */}
      <AnimatePresence>
        {showReimbursementWarning && selectedMethod?.requiresReimbursement && (
          <motion.div
            className="reimbursement-warning"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={16} className="warning-icon" />
            <span>{t('iouReimbursementNote', 'This personal expense will be reimbursed to you once approved by the manager.')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Petrol Card Info */}
      <AnimatePresence>
        {value === 'petrol_card' && (
          <motion.div
            className="petrol-card-info"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Fuel size={16} className="info-icon" />
            <span>{t('petrolCardSharedNote', 'Using the shared company petrol card. Amount will be deducted from petrol card balance.')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="payment-method-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

PaymentMethodSelect.displayName = 'PaymentMethodSelect'

// Export payment method constants for use in other components
export const paymentMethods = PAYMENT_METHODS

export default PaymentMethodSelect
