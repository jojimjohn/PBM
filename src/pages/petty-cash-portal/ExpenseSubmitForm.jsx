/**
 * Expense Submit Form
 *
 * Simple form for petty cash users to submit expenses.
 * Mobile-optimized with large touch targets and camera support.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Receipt,
  Camera,
  Banknote,
  FileText,
  Store,
  Calendar,
  Send,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image,
  CreditCard,
  Wallet,
  Fuel,
  FolderOpen,
} from 'lucide-react';
import pettyCashPortalService from '../../services/pettyCashPortalService';
// CSS moved to global index.css - using Tailwind classes

// Get local date string in YYYY-MM-DD format (avoids UTC timezone shift)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Category icons mapping
const categoryIcons = {
  fuel: '⛽',
  transport: '🚕',
  meals: '🍽️',
  office_supplies: '📦',
  maintenance: '🔧',
  communication: '📱',
  travel: '✈️',
  miscellaneous: '📋',
  emergency: '🚨',
};

// Payment method options for mobile portal
// top_up_card: User's assigned petty cash card - deducts from their card balance
// petrol_card: User's assigned petrol card - deducts from their petrol card balance (fuel only)
// iou: Personal expense - reimbursed when approved
const PAYMENT_METHODS = [
  {
    value: 'top_up_card',
    label: 'My Card',
    labelAr: 'بطاقتي',
    desc: 'Use your assigned card',
    icon: CreditCard,
    color: '#3b82f6',
    requiresReimbursement: false,
    fuelOnly: false
  },
  {
    value: 'petrol_card',
    label: 'Petrol Card',
    labelAr: 'بطاقة البترول',
    desc: 'Your assigned petrol card',
    icon: Fuel,
    color: '#f59e0b',
    requiresReimbursement: false,
    fuelOnly: true,  // Only available for fuel category
    requiresPetrolCard: true  // User must have a petrol card assigned
  },
  {
    value: 'iou',
    label: 'IOU (Personal)',
    labelAr: 'سلفة شخصية',
    desc: 'Reimbursed when approved',
    icon: Wallet,
    color: '#ef4444',
    requiresReimbursement: true,
    fuelOnly: false
  },
];

const ExpenseSubmitForm = ({
  user,
  categories = [],
  projects = [],
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: getLocalDateString(), // Use local date, not UTC
    vendor: '',
    receiptNumber: '',
    paymentMethod: 'top_up_card', // Default to user's assigned card
    projectId: '', // Optional project assignment
  });
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Get balances and petrol card status
  const currentBalance = user?.currentBalance || 0;
  const petrolCardBalance = user?.petrolCardBalance || 0;
  const hasPetrolCard = user?.hasPetrolCard || false;

  // Fuel category payment logic (normalize to lowercase for case-insensitive comparison)
  const isFuelCategory = formData.category?.toLowerCase() === 'fuel';
  const expenseAmount = parseFloat(formData.amount) || 0;
  // User can use petrol card only if they have one assigned AND it has sufficient balance
  const petrolCardHasSufficientBalance = hasPetrolCard && petrolCardBalance > 0 && petrolCardBalance >= expenseAmount;

  // Validate form
  const isValid = formData.category && formData.description && formData.amount && formData.expenseDate;
  const amountExceedsBalance = expenseAmount > currentBalance;

  // Auto-select project from main system's localStorage if user has access
  // This creates a seamless UX where the project filter carries over to mobile expense submission
  useEffect(() => {
    if (projects.length > 0 && !formData.projectId) {
      try {
        const savedProject = localStorage.getItem('pbm_selected_project');
        if (savedProject) {
          const parsed = JSON.parse(savedProject);
          const projectId = parsed.projectId;
          // Check if user has access to this project (it's in their projects list)
          if (projectId && projectId !== 'all' && projects.some(p => p.id === projectId)) {
            setFormData(prev => ({ ...prev, projectId: projectId.toString() }));
          }
        }
      } catch {
        // Ignore localStorage parsing errors - just don't auto-select
      }
    }
  }, [projects]); // Only run when projects load

  // Auto-switch payment method for fuel based on petrol card availability and balance
  useEffect(() => {
    if (isFuelCategory && formData.paymentMethod === 'petrol_card' && !petrolCardHasSufficientBalance && expenseAmount > 0) {
      // Switch to top_up_card if petrol card is not available or balance is insufficient
      setFormData((prev) => ({ ...prev, paymentMethod: 'top_up_card' }));
    } else if (isFuelCategory && formData.paymentMethod === 'top_up_card' && petrolCardHasSufficientBalance) {
      // Switch back to petrol_card if user has one and balance becomes sufficient
      setFormData((prev) => ({ ...prev, paymentMethod: 'petrol_card' }));
    }
  }, [isFuelCategory, expenseAmount, petrolCardHasSufficientBalance, formData.paymentMethod, hasPetrolCard]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload an image or PDF.');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setReceipt(file);
      setError(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  // Remove receipt
  const handleRemoveReceipt = () => {
    setReceipt(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting || amountExceedsBalance) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit expense
      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        vendor: formData.vendor || null,
        receiptNumber: formData.receiptNumber || null,
        paymentMethod: formData.paymentMethod || 'top_up_card',
        projectId: formData.projectId ? parseInt(formData.projectId, 10) : null,
      };

      const result = await pettyCashPortalService.submitExpense(expenseData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit expense');
      }

      // Upload receipt if present
      if (receipt && result.data?.id) {
        const uploadResult = await pettyCashPortalService.uploadReceipt(result.data.id, receipt);
        if (!uploadResult.success) {
          console.warn('Receipt upload failed:', uploadResult.error);
          // Don't fail the whole operation, expense was created
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(result.data);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-100 to-slate-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Expense Submitted!</h2>
          <p className="text-slate-600">Your expense has been submitted for approval.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="px-4 py-6 space-y-5" onSubmit={handleSubmit}>
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">NEW EXPENSE</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Submit for Approval</p>
        </div>
        <div className="text-right p-3 bg-emerald-50 border border-emerald-200">
          <span className="block text-[10px] text-emerald-600 uppercase tracking-wider font-medium">Available</span>
          <span className="text-lg font-bold text-emerald-700">{currentBalance.toFixed(3)} OMR</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Project Selection - shown first for context */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FolderOpen size={16} className="text-slate-400" />
            Project
          </label>
          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a project (optional)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Link this expense to one of your assigned projects
          </p>
        </div>
      )}

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Receipt size={16} className="text-slate-400" />
          Category *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`flex flex-col items-center justify-center gap-1 p-3 border transition-all text-center
                ${formData.category === cat.id
                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              onClick={() => {
                // Normalize to lowercase for case-insensitive fuel detection
                const isFuel = cat.id?.toLowerCase() === 'fuel';
                if (isFuel && hasPetrolCard) {
                  // Auto-select petrol card for fuel if user has one assigned
                  setFormData((prev) => ({ ...prev, category: cat.id, paymentMethod: 'petrol_card' }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    category: cat.id,
                    paymentMethod: prev.paymentMethod === 'petrol_card' ? 'top_up_card' : prev.paymentMethod
                  }));
                }
              }}
            >
              <span className="text-xl">{categoryIcons[cat.id?.toLowerCase()] || '📋'}</span>
              <span className="text-xs font-medium truncate w-full">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Banknote size={16} className="text-slate-400" />
          Amount (OMR) *
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className={`w-full px-4 py-3 text-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${amountExceedsBalance ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
          placeholder="0.000"
          step="0.001"
          min="0.001"
          max={currentBalance}
          required
        />
        {amountExceedsBalance && (
          <span className="text-xs text-red-600">Amount exceeds available balance</span>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText size={16} className="text-slate-400" />
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="What was this expense for?"
          rows={3}
          required
        />
      </div>

      {/* Vendor */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Store size={16} className="text-slate-400" />
          Vendor / Shop
        </label>
        <input
          type="text"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Where did you make this purchase?"
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Calendar size={16} className="text-slate-400" />
          Date *
        </label>
        <input
          type="date"
          name="expenseDate"
          value={formData.expenseDate}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          max={getLocalDateString()}
          required
        />
      </div>

      {/* Receipt Number */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Receipt size={16} className="text-slate-400" />
          Receipt Number
        </label>
        <input
          type="text"
          name="receiptNumber"
          value={formData.receiptNumber}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Optional receipt number"
        />
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <CreditCard size={16} className="text-slate-400" />
          Payment Method *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = formData.paymentMethod === method.value;

            // Determine if method is disabled based on category, petrol card assignment, and balance
            let isDisabled = false;
            let disabledReason = '';

            if (method.requiresPetrolCard && !hasPetrolCard) {
              // Petrol card disabled if user doesn't have one assigned
              isDisabled = true;
              disabledReason = 'No petrol card assigned';
            } else if (method.fuelOnly && !isFuelCategory) {
              // Petrol card disabled for non-fuel categories
              isDisabled = true;
              disabledReason = 'Fuel expenses only';
            } else if (isFuelCategory && method.value === 'top_up_card' && petrolCardHasSufficientBalance) {
              // For fuel: My Card disabled if petrol card has sufficient balance
              isDisabled = true;
              disabledReason = 'Use Petrol Card';
            }

            const getColorClasses = () => {
              if (isDisabled) return 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';
              if (!isSelected) return 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';
              switch (method.value) {
                case 'top_up_card': return 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500';
                case 'petrol_card': return 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500';
                case 'iou': return 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500';
                default: return 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500';
              }
            };

            return (
              <button
                key={method.value}
                type="button"
                className={`flex flex-col items-center gap-1 p-3 border transition-all ${getColorClasses()}`}
                onClick={() => !isDisabled && setFormData((prev) => ({ ...prev, paymentMethod: method.value }))}
                disabled={isDisabled}
                title={isDisabled ? disabledReason : method.desc}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{method.label}</span>
                {method.fuelOnly && !isFuelCategory && (
                  <span className="text-[10px] text-amber-500">⛽ Fuel Only</span>
                )}
                {isDisabled && disabledReason && !method.fuelOnly && (
                  <span className="text-[10px] text-slate-400">{disabledReason}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Petrol Card Balance Info for Fuel */}
        {isFuelCategory && (
          <div className={`flex items-center gap-2 p-2.5 border text-xs ${
            hasPetrolCard ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Fuel size={14} className="shrink-0" />
            <span>
              {hasPetrolCard ? (
                <>
                  Petrol Card Balance: <strong>{petrolCardBalance.toFixed(3)} OMR</strong>
                  {!petrolCardHasSufficientBalance && expenseAmount > 0 && (
                    <span className="text-red-600 ml-1">(Insufficient - use My Card)</span>
                  )}
                </>
              ) : (
                <span className="text-slate-500">No petrol card assigned - use My Card or IOU</span>
              )}
            </span>
          </div>
        )}

        {/* IOU Reimbursement Warning */}
        {formData.paymentMethod === 'iou' && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>This personal expense will be reimbursed when approved by manager</span>
          </div>
        )}
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Camera size={16} className="text-slate-400" />
          Receipt Photo
        </label>
        {receiptPreview ? (
          <div className="relative bg-slate-100 border border-slate-200 p-2">
            <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-48 object-contain" />
            <button
              type="button"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
              onClick={handleRemoveReceipt}
            >
              <X size={18} />
            </button>
          </div>
        ) : receipt ? (
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200">
            <FileText size={24} className="text-red-500 shrink-0" />
            <span className="flex-1 text-sm text-slate-700 truncate">{receipt.name}</span>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
              onClick={handleRemoveReceipt}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              capture="environment"
            />
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={24} />
              <span className="font-medium">Take Photo or Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Actions - Sticky bottom on mobile */}
      <div className="sticky bottom-0 left-0 right-0 flex gap-3 pt-4 pb-2 bg-gradient-to-t from-slate-100 via-slate-100 to-transparent -mx-4 px-4">
        <button
          type="button"
          className="flex-1 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isValid || isSubmitting || amountExceedsBalance}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Expense
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ExpenseSubmitForm;
