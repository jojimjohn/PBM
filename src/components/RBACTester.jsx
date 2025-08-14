import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { USER_ROLES, PERMISSIONS, getRoleDisplayName, getRoleColor } from '../config/roles'

const RBACTester = () => {
  const { user, selectedCompany } = useAuth()
  const { 
    userRole, 
    userPermissions, 
    hasPermission, 
    getAccessibleModules,
    canEdit,
    canDelete,
    canApprove 
  } = usePermissions()
  
  const [selectedPermission, setSelectedPermission] = useState(PERMISSIONS.VIEW_CUSTOMERS)
  const [isCollapsed, setIsCollapsed] = useState(true)
  
  if (!user) return null

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      width: isCollapsed ? '200px' : '320px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '12px',
      fontSize: '14px',
      zIndex: 9999,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isCollapsed ? '0' : '12px'
      }}>
        <h3 style={{ margin: '0', color: '#1f2937', fontSize: '14px' }}>
          🧪 RBAC {isCollapsed ? '' : 'Tester'}
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isCollapsed ? 'Expand RBAC Tester' : 'Collapse RBAC Tester'}
        >
          {isCollapsed ? '🔍' : '➖'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div>
          {/* User Info */}
          <div style={{ marginBottom: '12px' }}>
            <strong>User:</strong> {user.name}<br/>
            <strong>Role:</strong> 
            <span style={{ 
              color: getRoleColor(userRole), 
              fontWeight: 'bold',
              marginLeft: '4px'
            }}>
              {getRoleDisplayName(userRole)}
            </span><br/>
            <strong>Company:</strong> {selectedCompany?.name}<br/>
            <strong>Business:</strong> {selectedCompany?.businessType}
          </div>

          {/* Accessible Modules */}
          <div style={{ marginBottom: '12px' }}>
            <strong>Accessible Modules:</strong>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {getAccessibleModules().join(', ')}
            </div>
          </div>

          {/* Permission Tester */}
          <div style={{ marginBottom: '12px' }}>
            <strong>Test Permission:</strong>
            <select 
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '4px', 
                marginTop: '4px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              {Object.entries(PERMISSIONS).map(([key, value]) => (
                <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <div style={{ 
              marginTop: '4px', 
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: hasPermission(selectedPermission) ? '#dcfce7' : '#fee2e2',
              color: hasPermission(selectedPermission) ? '#166534' : '#dc2626'
            }}>
              {hasPermission(selectedPermission) ? '✅ ALLOWED' : '❌ DENIED'}
            </div>
          </div>

          {/* Action Permissions */}
          <div style={{ marginBottom: '12px' }}>
            <strong>Quick Actions:</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              <div>Edit Customers: {canEdit('customers') ? '✅' : '❌'}</div>
              <div>Delete Sales: {canDelete('sales') ? '✅' : '❌'}</div>
              <div>Approve Expenses: {canApprove('expenses') ? '✅' : '❌'}</div>
            </div>
          </div>

          {/* All User Permissions */}
          <details style={{ fontSize: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              All Permissions ({userPermissions.length})
            </summary>
            <div style={{ marginTop: '4px', maxHeight: '100px', overflow: 'auto' }}>
              {userPermissions.map(permission => (
                <div key={permission} style={{ color: '#6b7280' }}>
                  • {permission.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {isCollapsed && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
          <div><strong>{getRoleDisplayName(userRole)}</strong></div>
          <div>{getAccessibleModules().length} modules</div>
        </div>
      )}
    </div>
  )
}

export default RBACTester