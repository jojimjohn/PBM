# RBAC Testing Guide

## 🧪 How to Test Role-Based Access Control

### 1. **Test Users Available**
All users use password: `password123`

| Username | Role | Company | Access Level |
|----------|------|---------|-------------|
| `admin` | Super Admin | Both | Full system access |
| `alramrami_admin` | Company Admin | Al Ramrami | Full company access |
| `pridemuscat_admin` | Company Admin | Pride Muscat | Full company access |
| `oil_manager` | Manager | Al Ramrami | Supervisory access |
| `scrap_manager` | Manager | Pride Muscat | Supervisory access |
| `sales_user` | Sales | Al Ramrami | Sales & customers only |
| `purchase_user` | Purchase | Pride Muscat | Purchase & inventory only |
| `accounts_user` | Accounts | Al Ramrami | Financial functions only |

### 2. **Testing Navigation Access**

#### **Super Admin (admin)**
- ✅ Should see ALL navigation items for both businesses
- ✅ Can switch between companies
- ✅ All modules accessible

#### **Sales User (sales_user)**
- ✅ Oil Trading business only
- ✅ Navigation: Dashboard, Customers, Sales only
- ❌ Should NOT see: Fuel Inventory, Purchase

#### **Purchase User (purchase_user)**
- ✅ Scrap Materials business only  
- ✅ Navigation: Dashboard, Suppliers, Materials, Purchase only
- ❌ Should NOT see: Sales

#### **Accounts User (accounts_user)**
- ✅ Limited navigation based on financial permissions
- ✅ Can view but not edit most modules

### 3. **Step-by-Step Testing Process**

#### **Test 1: Login as Sales User**
1. Go to login page
2. Username: `sales_user`
3. Password: `password123`
4. Company: Al Ramrami Trading Co. (Oil Trading)
5. **Expected**: Only see Dashboard, Customers, Sales in navigation

#### **Test 2: Login as Purchase User**
1. Logout current user
2. Username: `purchase_user`
3. Password: `password123`
4. Company: Pride Muscat Trading (Scrap Materials)
5. **Expected**: Only see Dashboard, Suppliers, Materials, Purchase

#### **Test 3: Login as Manager**
1. Username: `oil_manager`
2. Password: `password123`
3. Company: Al Ramrami Trading Co.
4. **Expected**: See most navigation items except admin functions

#### **Test 4: Login as Super Admin**
1. Username: `admin`
2. Password: `password123`
3. Company: Any (can switch)
4. **Expected**: See ALL navigation items, can switch companies

### 4. **Permission Testing Within Pages**

#### **Customer Management (Sales User)**
- ✅ Should see "Add Customer" button
- ✅ Can edit customer details
- ✅ Can view customer list

#### **Inventory Management (Purchase User)**
- ✅ Should see inventory management tools
- ✅ Can update stock levels
- ❌ Cannot access sales functions

#### **Financial Reports (Accounts User)**
- ✅ Can view financial data
- ✅ Can manage expenses
- ❌ Cannot edit customer or inventory data

### 5. **Testing Company Isolation**

#### **Single Company Users**
- Sales, Purchase, Accounts users should only see their assigned company
- Cannot switch companies
- Data filtered to their company only

#### **Multi-Company Users** 
- Super Admin can access both companies
- Company Admin can only access their company
- Data changes when switching companies

### 6. **Quick RBAC Validation Checklist**

- [ ] Sales user only sees customer/sales navigation
- [ ] Purchase user only sees supplier/purchase navigation  
- [ ] Accounts user has limited access
- [ ] Manager sees most functions except admin
- [ ] Company Admin sees all company functions
- [ ] Super Admin sees everything
- [ ] Users cannot access other companies' data
- [ ] Navigation adapts to user role
- [ ] Role badge shows correctly in header

### 7. **Browser Console Testing**

Open browser console and test permissions:
```javascript
// Check current user role
console.log(window.auth?.user?.role)

// Test permission checking
console.log(window.permissions?.hasPermission('MANAGE_CUSTOMERS'))

// View accessible modules
console.log(window.permissions?.getAccessibleModules())
```

### 8. **Expected Behaviors by Role**

#### **SALES Role**
- Navigation: Dashboard, Customers, Sales
- Can create/edit customers and sales
- Cannot access inventory or purchase functions

#### **PURCHASE Role**
- Navigation: Dashboard, Suppliers, Materials, Purchase
- Can manage suppliers and inventory
- Cannot access sales or customer functions

#### **ACCOUNTS Role**
- Navigation: Dashboard, limited other modules
- Focus on financial reporting and expense management
- Read-only access to most business data

#### **MANAGER Role**
- Navigation: Most modules except admin functions
- Can approve transactions and view reports
- Cannot manage users or system settings

#### **COMPANY_ADMIN Role**
- Navigation: All company modules
- Can manage users within company
- Cannot access other companies

#### **SUPER_ADMIN Role**
- Navigation: All modules for all companies
- Can switch between companies
- Full system access

### 9. **Troubleshooting**

If RBAC isn't working:
1. Check browser console for errors
2. Verify user data in `/public/data/users.json`
3. Ensure role constants match between files
4. Check localStorage for auth data
5. Verify company selection is correct

### 10. **Testing Company Switch**

For users with multiple company access (Super Admin):
1. Login as `admin`
2. Switch between Al Ramrami and Pride Muscat
3. Verify navigation changes based on business type
4. Confirm data isolation between companies