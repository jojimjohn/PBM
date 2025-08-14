# Quick Login Commands for RBAC Testing

## 🚀 Fast Testing Commands

Copy and paste these into your browser console for quick user switching:

### Open Developer Console
1. Press `F12` or `Ctrl+Shift+I`
2. Go to Console tab
3. Copy and paste commands below

### Quick Login Functions

```javascript
// Quick login function
function quickLogin(username, companyId = 'alramrami') {
  // Clear existing auth
  localStorage.removeItem('auth_user')
  localStorage.removeItem('selected_company')
  
  // Reload page to trigger login
  window.location.href = `/?username=${username}&company=${companyId}&auto=true`
}

// Test different roles quickly
function testSales() { quickLogin('sales_user', 'alramrami') }
function testPurchase() { quickLogin('purchase_user', 'pridemuscat') }
function testManager() { quickLogin('oil_manager', 'alramrami') }
function testAccounts() { quickLogin('accounts_user', 'alramrami') }
function testAdmin() { quickLogin('admin', 'alramrami') }

// Print available commands
console.log(`
🧪 RBAC Testing Commands:
- testSales()     → Login as Sales User (Oil Trading)
- testPurchase()  → Login as Purchase User (Scrap Materials)  
- testManager()   → Login as Manager (Oil Trading)
- testAccounts()  → Login as Accounts User (Oil Trading)
- testAdmin()     → Login as Super Admin (All Access)

📊 View Current Permissions:
- window.auth?.user?.role
- window.permissions?.getAccessibleModules()
`)
```

### Direct Test Commands

```javascript
// Test Sales User (Oil Trading)
testSales()

// Test Purchase User (Scrap Materials)
testPurchase()

// Test Manager (Oil Trading)
testManager()

// Test Accounts (Oil Trading)
testAccounts()

// Test Super Admin (All Access)
testAdmin()
```

## Manual Testing Steps

### Step 1: Start Fresh
1. Open http://localhost:3001
2. Open browser developer tools (F12)
3. Look for the RBAC Tester widget on the right side

### Step 2: Test Sales User Navigation
1. Login with:
   - Username: `sales_user`
   - Password: `password123`
   - Company: Al Ramrami Trading Co.
2. **Expected Navigation**: Dashboard, Customers, Sales only
3. **RBAC Tester Should Show**: 
   - Role: Sales
   - Accessible Modules: dashboard, customers, sales
   - Can Edit Customers: ✅
   - Can Delete Sales: ❌

### Step 3: Test Purchase User Navigation  
1. Logout and login with:
   - Username: `purchase_user` 
   - Password: `password123`
   - Company: Pride Muscat Trading
2. **Expected Navigation**: Dashboard, Suppliers, Materials, Purchase only
3. **RBAC Tester Should Show**:
   - Role: Purchase
   - Accessible Modules: dashboard, suppliers, material-inventory, purchase
   - Can Edit Customers: ❌
   - Can Approve Expenses: ❌

### Step 4: Test Manager Access
1. Login with:
   - Username: `oil_manager`
   - Password: `password123`  
   - Company: Al Ramrami Trading Co.
2. **Expected Navigation**: Dashboard, Customers, Fuel Inventory, Sales, Purchase
3. **RBAC Tester Should Show**:
   - Role: Manager  
   - More permissions than Sales/Purchase users
   - Can Approve Expenses: ✅

### Step 5: Test Super Admin
1. Login with:
   - Username: `admin`
   - Password: `password123`
   - Company: Any (can switch)
2. **Expected Navigation**: ALL navigation items
3. **RBAC Tester Should Show**:
   - Role: Super Admin
   - All modules accessible
   - All actions allowed

## Troubleshooting Navigation Issues

If navigation items are stacked vertically instead of horizontally:

1. **Check Browser Width**: Try making browser window wider
2. **Clear Browser Cache**: Ctrl+F5 to force reload CSS
3. **Check Console**: Look for CSS loading errors
4. **Mobile View**: On narrow screens, navigation becomes icon-only

## What to Look For

### ✅ Correct RBAC Behavior
- Sales users only see customer/sales functions
- Purchase users only see supplier/purchase functions  
- Managers see most functions with approval rights
- Super Admin sees everything
- Navigation adapts based on role
- RBAC Tester shows correct permissions

### ❌ Issues to Report
- Wrong navigation items showing
- Users accessing forbidden modules
- RBAC Tester showing incorrect permissions
- Navigation items stacked vertically
- Login failures with test credentials

## Performance Testing

Test navigation performance with different roles:
```javascript
// Measure navigation render time
console.time('navigation-render')
// Switch between users
console.timeEnd('navigation-render')
```

The RBAC system should respond instantly to role changes without lag.