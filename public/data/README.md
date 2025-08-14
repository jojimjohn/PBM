# JSON Data Structure Documentation

## Overview
This directory contains JSON files that serve as the data layer for the Petroleum Business Management System during the initial development phase. Each file represents a different entity in the system.

## File Structure

### `companies.json`
Contains configuration and details for both companies:
- **Al Ramrami Trading Enterprises** (Oil Business)
- **Pride Muscat International LLC** (Scrap Business)

Each company includes:
- Basic company information (name, logo, colors)
- Contact details
- Business-specific configuration (materials, units, customer types)

### `users.json`
User management and authentication data:
- User accounts with roles and permissions
- Role definitions (Super Admin, Company Admin, Manager, Sales, Purchase, Accounts)
- Company assignments for users
- Permission mappings

### `materials.json`
Material master data organized by company:
- **Al Ramrami**: Oil products (engine oil, transformer oil, empty drums, diesel, etc.)
- **Pride Muscat**: Scrap materials (metal, aluminum, copper, steel scrap)

Each material includes:
- Unique ID and code
- Category and unit of measurement
- Status options (used/sealed, clean/dirty, etc.)
- Standard pricing

### `customers.json`
Customer information organized by company:
- Customer types: Walk-in, Project-based, Contract
- Contact information
- Contract details with negotiated rates (for contract customers)
- Project-specific rates (for project customers)

### `inventory.json`
Real-time inventory tracking:
- Current stock levels by material and company
- Reorder levels and maximum stock limits
- Average cost and total valuation
- Stock movement history (in/out transactions)

### `transactions.json`
All business transactions organized by type:

#### Purchases
- Purchase orders with material details
- Cost tracking per unit and total
- Associated expenses (transportation, loading, etc.)
- Supplier/customer information

#### Sales
- Sales orders with pricing based on customer type
- Automatic profit calculation (gross and net)
- Sales expenses tracking
- Invoice generation data

#### Expenses
- Daily operational expenses
- Purchase and sales related expenses
- Approval workflow status
- Category-wise classification

#### Petty Cash
- Cash receipts and payments
- Voucher management
- Daily reconciliation data

## Key Design Principles

1. **Multi-Company Support**: All data is organized by company ID (alramrami/pridemuscat)
2. **Referential Integrity**: IDs are used to link related entities
3. **Audit Trail**: Creation and update timestamps for all records
4. **Flexible Pricing**: Support for standard, contract, and project-based pricing
5. **Comprehensive Cost Tracking**: All costs and expenses linked to transactions
6. **Status Management**: Proper status tracking for orders, approvals, etc.

## Sample Data

All files contain realistic sample data that demonstrates:
- Multi-company operations
- Different customer types and pricing models
- Complete transaction workflows
- Expense tracking and approval processes
- Inventory movements and valuations

This data structure will be migrated to a proper database system in later development phases.