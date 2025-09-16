import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to load company details
  const loadCompanyDetails = async (companyId) => {
    try {
      // Map backend company IDs to frontend company IDs
      const companyIdMap = {
        'al-ramrami': 'alramrami',
        'pride-muscat': 'pridemuscat'
      };
      
      const frontendCompanyId = companyIdMap[companyId] || companyId;
      
      // Load companies from configuration
      const companies = [
        {
          id: 'alramrami',
          name: 'Al Ramrami Trading Enterprises',
          arabicName: 'مؤسسة الرمرامي التجارية',
          businessType: 'oil',
          logo: '/images/alramrami-logo.png',
          modules: {
            enabled: ['dashboard', 'customers', 'suppliers', 'inventory', 'sales', 'purchase', 'contracts', 'collections', 'wastage', 'petty-cash', 'reports', 'settings']
          }
        },
        {
          id: 'pridemuscat',
          name: 'Pride Muscat International LLC',
          arabicName: 'شركة برايد مسقط العالمية ذ.م.م',
          businessType: 'scrap',
          logo: '/images/pridemuscat-logo.png',
          modules: {
            enabled: ['dashboard', 'suppliers', 'inventory', 'sales', 'purchase', 'collections', 'wastage', 'petty-cash', 'reports', 'settings']
          }
        }
      ];
      const company = companies.find(c => c.id === frontendCompanyId);
      
      if (company) {
        return company;
      } else {
        console.error('Company not found:', companyId, frontendCompanyId);
        return null;
      }
    } catch (error) {
      console.error('Error loading company details:', error);
      return null;
    }
  };

  // Load authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          
          // Load complete company details
          const companyDetails = await loadCompanyDetails(currentUser.companyId);
          setSelectedCompany(companyDetails);
          setIsAuthenticated(true);

          // Try to refresh token to ensure it's valid
          try {
            await authService.refreshAccessToken();
          } catch (error) {
            // If refresh fails, clear auth state
            console.warn('Token refresh failed during initialization:', error);
            await logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Secure login using JWT authentication
   */
  const login = async (email, password, companyId) => {
    setIsLoading(true);
    
    try {
      // Use the secure authentication service
      const result = await authService.login(email, password, companyId);
      
      if (result.success) {
        // Update state
        setUser(result.user);
        
        // Load complete company details
        const companyDetails = await loadCompanyDetails(result.user.companyId);
        setSelectedCompany(companyDetails);
        setIsAuthenticated(true);
        
        return {
          success: true,
          user: result.user,
          company: companyDetails,
          message: result.message || 'Login successful'
        };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Ensure auth state is cleared on failure
      setUser(null);
      setSelectedCompany(null);
      setIsAuthenticated(false);
      
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Secure logout
   */
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call secure logout
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setSelectedCompany(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  /**
   * Switch company (for super-admin users)
   */
  const switchCompany = async (newCompanyId) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Check if user has permission to switch companies
    if (user.role !== 'super-admin' && user.companyId !== newCompanyId) {
      throw new Error('Insufficient permissions to switch companies');
    }

    try {
      setIsLoading(true);

      // For super-admin, we can switch companies
      // For regular users, they can only access their assigned company
      if (user.role === 'super-admin' || user.companyId === newCompanyId) {
        setSelectedCompany(newCompanyId);
        
        // Update user object to reflect new company context
        const updatedUser = { ...user, currentCompanyContext: newCompanyId };
        setUser(updatedUser);
        
        return { success: true };
      } else {
        throw new Error('Access denied to this company');
      }
    } catch (error) {
      console.error('Company switch error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  /**
   * Check if user has access to company
   */
  const hasCompanyAccess = (companyId) => {
    return authService.hasCompanyAccess(companyId);
  };

  /**
   * Make authenticated API request
   */
  const makeAuthenticatedRequest = async (url, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await authService.makeAuthenticatedRequest(url, options);
  };

  /**
   * Get current authentication token
   */
  const getToken = () => {
    return authService.getToken();
  };

  /**
   * Legacy permission check for backward compatibility
   * TODO: Remove this once all components use the new permission system
   */
  const checkPermission = (permission) => {
    console.warn('checkPermission is deprecated, use hasPermission instead');
    return hasPermission(permission);
  };

  // Context value
  const value = {
    // Authentication state
    user,
    selectedCompany,
    isLoading,
    isAuthenticated,
    
    // Authentication methods
    login,
    logout,
    switchCompany,
    
    // Permission methods
    hasPermission,
    hasRole,
    hasCompanyAccess,
    checkPermission, // Legacy support
    
    // API methods
    makeAuthenticatedRequest,
    getToken,
    
    // Computed properties for backward compatibility
    permissions: user?.permissions || [],
    userRole: user?.role || null,
    companies: [
      { id: 'al-ramrami', name: 'Al Ramrami Trading' },
      { id: 'pride-muscat', name: 'Pride Muscat International' }
    ]
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};