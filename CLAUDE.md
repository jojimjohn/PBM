# App Service CLAUDE.md

## Purpose
React frontend application for the Petroleum Business Management System providing user interfaces for oil trading and scrap materials businesses.

## Narrative Summary
The App service implements a comprehensive React 19 frontend with Vite build system, serving both Al Ramrami Trading Enterprises (oil business) and Pride Muscat International LLC (scrap business). It provides a multi-tenant UI with company-specific branding, role-based access control, and Arabic localization support. The service communicates with the backend through a robust service layer pattern with authenticated API requests.

## Key Files
- `src/services/pettyCashService.js:1-575` - Petty cash management with card and expense operations
- `src/services/wastageService.js:1-424` - Wastage tracking and approval workflow integration  
- `src/services/authService.js` - JWT authentication with refresh token handling
- `src/context/AuthContext.jsx` - Authentication state management
- `src/config/api.js` - API configuration and base URL setup
- `src/hooks/usePermissions.js` - Role-based permission checking
- `package.json` - React 19, Vite, and production dependencies

## API Integration Points
### Service Layer Architecture
- **Authentication Flow**: JWT tokens with refresh mechanism via authService.makeAuthenticatedRequest()
- **Error Handling**: Standardized response format with success/error states
- **Request Pattern**: All services extend base authenticated request pattern

### Petty Cash Service Interface
#### Card Management Operations
- `getAllCards()` - Retrieve all petty cash cards with pagination
- `getCardById(cardId)` - Get specific card with recent expenses
- `createCard(cardData)` - Create new petty cash card with validation
- `updateCard(cardId, cardData)` - Update existing card details
- `deleteCard(cardId)` - Soft delete by closing card
- `reloadCard(cardId, reloadData)` - Add funds to card balance

#### Expense Management Operations  
- `getAllExpenses()` - Retrieve expenses with filtering support
- `getExpensesByCard(cardId)` - Get expenses for specific card
- `createExpense(expenseData)` - Submit expense for approval
- `updateExpense(expenseId, expenseData)` - Modify pending expenses
- `deleteExpense(expenseId)` - Remove pending expense
- `approveExpense(expenseId, approvalData)` - Approve expense transaction
- `rejectExpense(expenseId, rejectionData)` - Reject expense with reason
- `uploadReceipt(expenseId, receiptFile)` - Upload receipt attachment

#### Analytics & Reporting
- `getExpenseAnalytics(period)` - Get expense analytics for period
- `getExpenseCategories()` - Retrieve available expense categories
- `searchExpenses(query, filters)` - Search expenses with filtering
- `getPendingApprovalExpenses()` - Get expenses awaiting approval

### Wastage Service Interface
#### Core Wastage Operations
- `getAll()` - Retrieve all wastage records with filtering
- `getById(wastageId)` - Get specific wastage with details
- `create(wastageData)` - Create new wastage record
- `update(wastageId, wastageData)` - Update pending wastage record
- `delete(wastageId)` - Delete pending wastage record

#### Approval Workflow
- `getPendingApproval()` - Get wastages awaiting approval
- `approve(wastageId, approvalData)` - Approve wastage with ACID compliance
- `reject(wastageId, rejectionData)` - Reject wastage with reason

#### Analytics & Insights
- `getAnalytics(period)` - Get wastage analytics for period
- `getByMaterial(materialId, period)` - Material-specific wastage data
- `getTypes()` - Available wastage type definitions
- `getCostImpact(wastageId)` - Calculate cost impact
- `getMonthlyTrends(months)` - Historical trend analysis

### Collection Service Interface
#### WCN Operations
- `collectionOrderService.finalizeWCN(collectionOrderId, wcnData)` - Finalize WCN with wastage support
- `collectionOrderService.rectifyWCN(collectionOrderId, rectificationData)` - Post-finalization adjustments
- `collectionOrderService.getLinkedWastages(collectionOrderId)` - Get wastages created during WCN finalization

#### WCN Finalization Data Structure
```javascript
wcnData: {
  wcnNumber: string,
  wcnDate: date,
  notes: string,
  items: [{
    materialId: number,
    verifiedQuantity: number,
    qualityGrade: 'A'|'B'|'C'|'Reject',
    contractRate: number,
    wastages: [{  // NEW: Wastage entries per material
      wasteType: 'spillage'|'contamination'|'damage'|...,
      quantity: number,
      unitCost: number,
      totalCost: number,
      notes: string
    }]
  }]
}
```

### Contract Service Interface
#### Core Contract Operations
- `getAll()` - Retrieve all contracts with filtering
- `getById(contractId)` - Get specific contract with details and location-material rates
- `create(contractData)` - Create new contract with locations and material rates
- `update(contractId, contractData)` - Update existing contract
- `delete(contractId)` - Delete contract record

#### Contract Management
- `search(query, filters)` - Search contracts with filtering
- `getByCustomer(customerId)` - Get contracts for specific customer
- `getActive()` - Get active contracts only
- `getExpiring(days)` - Get contracts expiring within days
- `updateStatus(contractId, status)` - Update contract status
- `renew(contractId, renewalData)` - Renew existing contract

#### Pricing & Terms
- `getPricing(contractId, materialId)` - Get material pricing
- `updatePricing(contractId, materialId, pricingData)` - Update pricing
- `getTerms(contractId)` - Get contract terms
- `getPerformanceMetrics(contractId)` - Get performance metrics

### Contract View Modal Components
#### ContractViewModal Props Structure (Contracts.jsx:762-1191)
- `isOpen` - Boolean modal visibility state
- `onClose` - Function to close modal
- `contractData` - Enhanced contract object with locations array and formatted dates
- `onEdit` - Optional function to trigger edit mode transition
- `formatCurrency` - Currency formatting function
- `getContractStatusInfo` - Status information helper function
- `t` - Localization function

#### Enhanced ContractData Object Structure
```javascript
contractData: {
  ...baseContract,
  locations: [
    {
      id: locationId,
      name: locationName,
      locationCode: locationCode,
      materials: [
        {
          materialId: number,
          materialName: string,
          rateType: 'fixed_rate'|'discount_percentage'|'minimum_price_guarantee'|'free'|'we_pay',
          contractRate: number,
          discountPercentage: number,
          minimumPrice: number,
          paymentDirection: 'we_receive'|'we_pay',
          unit: string,
          minimumQuantity: number,
          maximumQuantity: number,
          description: string,
          locationCode: string
        }
      ]
    }
  ],
  formattedStartDate: string,
  formattedEndDate: string
}
```

#### ContractFormModal Props Structure (Contracts.jsx:1194-1745)
- `isOpen` - Boolean modal visibility state
- `onClose` - Function to close modal
- `onSave` - Function to handle form submission
- `title` - Modal title string
- `formData` - Form data object with locations array and material configurations
- `setFormData` - State setter for form data
- `suppliers` - Array of available suppliers
- `materials` - Array of available materials
- `supplierLocations` - Array of supplier locations loaded dynamically
- `loadSupplierLocations` - Function to load locations by supplier ID
- `contractTypes` - Available contract types object
- `isEdit` - Boolean indicating edit mode vs create mode
- `loading` - Boolean loading state
- `t` - Localization function

#### Contract Modal Features
- **Location-Material Rate Management**: Dynamic table for location-specific material rates
- **Rate Type Support**: Fixed rate, discount percentage, minimum price guarantee, free, we pay
- **Real-time Validation**: Form validation with supplier and material selection
- **Expiry Alerts**: Visual warnings for expiring contracts in view modal
- **Professional Styling**: Enterprise-grade modal design with responsive layout
- **Arabic RTL Support**: Full localization with professional business terminology

## Integration Points
### Consumes
- Backend API: `http://localhost:5000` - All business operations
- MySQL Database: Via backend API for data persistence
- File Upload: Receipt attachments via FormData

### Provides
- Web UI: `http://localhost:3000` - Multi-tenant business management interface
- Authentication: JWT-based session management
- Real-time Updates: Service layer handles data synchronization

## Configuration
Required environment variables:
- `VITE_API_BASE_URL` - Backend API base URL (defaults to http://localhost:5000)
- `NODE_ENV` - Environment mode (development/production)

## Key Patterns
### Service Layer Pattern (src/services/)
- Consistent error handling across all API operations
- Authenticated request wrapper via authService.makeAuthenticatedRequest()
- Standardized response format: { success, data, error, message }

### Authentication Integration
- JWT tokens with automatic refresh on 401 responses
- Permission-based UI rendering via usePermissions hook
- Company-specific routing and data isolation

### Frontend-Backend Integration Fixes
- Enhanced error handling in pettyCashService.js for robust API communication
- Standardized request/response patterns across all service modules
- ACID compliance integration for approval workflows

## Related Documentation
- backend/CLAUDE.md - Backend service API documentation
- D:\projects\PBM\CLAUDE.md - Overall project architecture
- src/config/roles.js - RBAC permission definitions