// Module Configuration - Maps modules to their permission requirements and default labels
export const MODULE_PERMISSIONS = {
  'dashboard': {
    view: [], // Everyone can view dashboard
    requiredPermissions: []
  },
  'customers': {
    view: ['VIEW_CUSTOMERS'],
    manage: ['MANAGE_CUSTOMERS'],
    requiredPermissions: ['VIEW_CUSTOMERS', 'MANAGE_CUSTOMERS']
  },
  'suppliers': {
    view: ['VIEW_SUPPLIERS'],
    manage: ['MANAGE_SUPPLIERS'], 
    requiredPermissions: ['VIEW_SUPPLIERS', 'MANAGE_SUPPLIERS']
  },
  'inventory': {
    view: ['VIEW_INVENTORY'],
    manage: ['MANAGE_INVENTORY', 'UPDATE_STOCK'],
    requiredPermissions: ['VIEW_INVENTORY', 'MANAGE_INVENTORY']
  },
  'fuel-inventory': {
    view: ['VIEW_INVENTORY'],
    manage: ['MANAGE_INVENTORY', 'UPDATE_STOCK'],
    requiredPermissions: ['VIEW_INVENTORY', 'MANAGE_INVENTORY']
  },
  'material-inventory': {
    view: ['VIEW_INVENTORY'],
    manage: ['MANAGE_INVENTORY', 'UPDATE_STOCK'],
    requiredPermissions: ['VIEW_INVENTORY', 'MANAGE_INVENTORY']
  },
  'sales': {
    view: ['VIEW_SALES'],
    create: ['CREATE_SALES'],
    edit: ['EDIT_SALES'],
    delete: ['DELETE_SALES'],
    approve: ['APPROVE_SALES'],
    requiredPermissions: ['VIEW_SALES', 'CREATE_SALES']
  },
  'purchase': {
    view: ['VIEW_PURCHASE'],
    create: ['CREATE_PURCHASE'],
    edit: ['EDIT_PURCHASE'],
    delete: ['DELETE_PURCHASE'],
    approve: ['APPROVE_PURCHASE'],
    requiredPermissions: ['VIEW_PURCHASE', 'CREATE_PURCHASE']
  },
  'contracts': {
    view: ['VIEW_CONTRACTS'],
    manage: ['MANAGE_CONTRACTS'],
    approve: ['APPROVE_CONTRACTS'],
    requiredPermissions: ['VIEW_CONTRACTS']
  },
  'reports': {
    view: ['VIEW_REPORTS'],
    export: ['EXPORT_REPORTS'],
    create: ['CREATE_CUSTOM_REPORTS'],
    requiredPermissions: ['VIEW_REPORTS']
  },
  'expenses': {
    view: ['VIEW_FINANCIALS'],
    manage: ['MANAGE_EXPENSES'],
    approve: ['APPROVE_EXPENSES'],
    requiredPermissions: ['VIEW_FINANCIALS', 'MANAGE_EXPENSES']
  },
  'petty-cash': {
    view: ['VIEW_FINANCIALS'],
    manage: ['MANAGE_PETTY_CASH'],
    requiredPermissions: ['MANAGE_PETTY_CASH']
  },
  'invoices': {
    view: ['VIEW_INVOICES'],
    create: ['CREATE_INVOICES'],
    edit: ['EDIT_INVOICES'],
    requiredPermissions: ['VIEW_INVOICES', 'CREATE_INVOICES']
  },
  'settings': {
    view: ['MANAGE_SETTINGS'],
    manage: ['MANAGE_SETTINGS'],
    requiredPermissions: ['MANAGE_SETTINGS']
  },
  'wastage': {
    view: ['VIEW_WASTAGE'],
    create: ['CREATE_WASTAGE'],
    edit: ['EDIT_WASTAGE'],
    delete: ['DELETE_WASTAGE'],
    approve: ['APPROVE_WASTAGE'],
    requiredPermissions: ['VIEW_WASTAGE']
  }
}

// Default module labels (can be overridden by company configuration)
export const DEFAULT_MODULE_LABELS = {
  'dashboard': 'Dashboard',
  'customers': 'Customers',
  'suppliers': 'Suppliers',
  'inventory': 'Inventory',
  'fuel-inventory': 'Fuel Inventory',
  'material-inventory': 'Material Inventory', 
  'sales': 'Sales',
  'purchase': 'Purchase',
  'contracts': 'Contracts',
  'reports': 'Reports',
  'expenses': 'Expenses',
  'petty-cash': 'Petty Cash',
  'invoices': 'Invoices',
  'settings': 'Settings',
  'wastage': 'Wastage'
}

// Icon SVG paths for modules (to be used in JSX components)
export const MODULE_ICON_PATHS = {
  'dashboard': {
    viewBox: "0 0 24 24",
    paths: [
      "M3 3h7v9H3z",
      "M14 3h7v5h-7z", 
      "M14 12h7v9h-7z",
      "M3 16h7v5H3z"
    ]
  },
  'customers': {
    viewBox: "0 0 24 24", 
    paths: [
      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
      "M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
    ]
  },
  'suppliers': {
    viewBox: "0 0 24 24",
    paths: [
      "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
      "M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M20 8v6M23 11h-6"
    ]
  },
  'inventory': {
    viewBox: "0 0 24 24",
    paths: [
      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      "M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"
    ]
  },
  'fuel-inventory': {
    viewBox: "0 0 24 24",
    paths: [
      "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"
    ]
  },
  'material-inventory': {
    viewBox: "0 0 24 24", 
    paths: [
      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      "M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"
    ]
  },
  'sales': {
    viewBox: "0 0 24 24",
    paths: [
      "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
    ]
  },
  'purchase': {
    viewBox: "0 0 24 24",
    paths: [
      "M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
    ]
  },
  'contracts': {
    viewBox: "0 0 24 24",
    paths: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6M16 13H8M16 17H8M10 9H8"
    ]
  },
  'reports': {
    viewBox: "0 0 24 24",
    paths: [
      "M22 12h-4l-3 9L9 3l-3 9H2"
    ]
  },
  'expenses': {
    viewBox: "0 0 24 24", 
    paths: [
      "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
    ]
  },
  'petty-cash': {
    viewBox: "0 0 24 24",
    paths: [
      "M1 4h22v16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zM1 10h22"
    ]
  },
  'invoices': {
    viewBox: "0 0 24 24",
    paths: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6"
    ]
  },
  'settings': {
    viewBox: "0 0 24 24",
    paths: [
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
    ]
  },
  'wastage': {
    viewBox: "0 0 24 24",
    paths: [
      "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M10 11v6M14 11v6"
    ]
  }
}

export const getModuleLabel = (moduleId, company) => {
  return company?.modules?.labels?.[moduleId] || DEFAULT_MODULE_LABELS[moduleId] || moduleId
}

export const getModuleIconPaths = (moduleId) => {
  return MODULE_ICON_PATHS[moduleId] || MODULE_ICON_PATHS['dashboard']
}