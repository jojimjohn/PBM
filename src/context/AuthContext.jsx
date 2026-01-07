import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [authInitialized, setAuthInitialized] = useState(false);

  // MFA pending state - survives LoginForm unmount/remount during loading
  const [pendingMfa, setPendingMfa] = useState(null);

  // Helper function to load company details
  const loadCompanyDetails = useCallback(async (companyId) => {
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
            enabled: ['dashboard', 'customers', 'suppliers', 'inventory', 'sales', 'purchase', 'contracts', 'collections', 'wastage', 'petty-cash', 'banking', 'reports', 'projects', 'users', 'settings']
          }
        },
        {
          id: 'pridemuscat',
          name: 'Pride Muscat International LLC',
          arabicName: 'شركة برايد مسقط العالمية ذ.م.م',
          businessType: 'scrap',
          logo: '/images/pridemuscat-logo.png',
          modules: {
            enabled: ['dashboard', 'suppliers', 'inventory', 'sales', 'purchase', 'collections', 'wastage', 'petty-cash', 'banking', 'reports', 'users', 'settings']
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
  }, []);

  // Sync state from authService
  const syncAuthState = useCallback(async () => {
    const currentUser = authService.getCurrentUser();

    if (currentUser) {
      setUser(currentUser);
      const companyDetails = await loadCompanyDetails(currentUser.companyId);
      setSelectedCompany(companyDetails);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setSelectedCompany(null);
      setIsAuthenticated(false);
    }
  }, [loadCompanyDetails]);

  // Load authentication state on mount
  // Waits for authService async initialization (migration, session validation)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Wait for authService to complete its async initialization
        // (handles legacy token migration and session validation via cookies)
        const maxWaitTime = 5000; // 5 seconds max
        const checkInterval = 100; // Check every 100ms
        let waited = 0;

        while (!authService.isInitialized && waited < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waited += checkInterval;
        }

        if (!authService.isInitialized) {
          console.warn('Auth service initialization timed out');
        }

        // Sync state from authService
        await syncAuthState();

      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setSelectedCompany(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, [syncAuthState]);

  /**
   * Secure login using JWT authentication
   * Tokens are stored in HttpOnly cookies by the server
   * Returns requiresMfa: true if MFA verification is needed
   */
  const login = async (email, password, companyId) => {
    setIsLoading(true);

    try {
      // Use the secure authentication service
      const result = await authService.login(email, password, companyId);

      if (result.success) {
        // Check if MFA is required
        if (result.requiresMfa) {
          // MFA required - store in context state (survives LoginForm remount)
          setPendingMfa({
            userId: result.mfaData.userId,
            companyId: result.mfaData.companyId,
            email: result.mfaData.email,
            firstName: result.mfaData.firstName
          });
          // Return MFA data for the verification step
          return {
            success: true,
            requiresMfa: true,
            mfaData: result.mfaData,
            message: result.message || 'MFA verification required'
          };
        }

        // No MFA - login complete
        setUser(result.user);

        // Load complete company details
        const companyDetails = await loadCompanyDetails(result.user.companyId);
        setSelectedCompany(companyDetails);
        setIsAuthenticated(true);

        return {
          success: true,
          requiresMfa: false,
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
   * Verify MFA code to complete login (second step after password)
   * @param {number} userId - User ID from login response
   * @param {string} companyId - Company ID from login response
   * @param {string} code - TOTP code or backup code
   * @param {boolean} isBackupCode - Whether the code is a backup code
   */
  /**
   * Clear pending MFA state (called when user cancels or goes back)
   */
  const clearPendingMfa = () => {
    setPendingMfa(null);
  };

  const verifyMfa = async (userId, companyId, code, isBackupCode = false) => {
    setIsLoading(true);

    try {
      const result = await authService.verifyMfa(userId, companyId, code, isBackupCode);

      if (result.success) {
        // MFA verified - clear pending state and complete login
        setPendingMfa(null);
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
        throw new Error('MFA verification failed');
      }
    } catch (error) {
      console.error('MFA verification error:', error);

      return {
        success: false,
        error: error.message || 'MFA verification failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Secure logout
   * Server clears HttpOnly cookies and blacklists tokens
   */
  const logout = async () => {
    setIsLoading(true);

    try {
      // Call secure logout (clears cookies, blacklists tokens)
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
   * Refresh session - validates current session and updates user data
   */
  const refreshSession = async () => {
    try {
      const success = await authService.refreshAccessToken();
      if (success) {
        await syncAuthState();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Clear auth state on refresh failure
      setUser(null);
      setSelectedCompany(null);
      setIsAuthenticated(false);
      return false;
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
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'super-admin' && user.companyId !== newCompanyId) {
      throw new Error('Insufficient permissions to switch companies');
    }

    try {
      setIsLoading(true);

      // For super-admin, we can switch companies
      // For regular users, they can only access their assigned company
      if (user.role === 'SUPER_ADMIN' || user.role === 'super-admin' || user.companyId === newCompanyId) {
        const companyDetails = await loadCompanyDetails(newCompanyId);
        setSelectedCompany(companyDetails);

        // Update user object to reflect new company context
        const updatedUser = { ...user, currentCompanyContext: newCompanyId };
        setUser(updatedUser);
        authService.updateUser(updatedUser);

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
   * Uses HttpOnly cookies automatically
   */
  const makeAuthenticatedRequest = async (url, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await authService.makeAuthenticatedRequest(url, options);
  };

  /**
   * Make secure request with CSRF protection
   * For POST/PUT/DELETE operations
   */
  const makeSecureRequest = async (url, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await authService.makeSecureRequest(url, options);
  };

  /**
   * Get current authentication token - DEPRECATED
   * Tokens are now in HttpOnly cookies, not accessible to JavaScript
   * Kept for backward compatibility during migration
   */
  const getToken = () => {
    console.warn('getToken() is deprecated - tokens are now in HttpOnly cookies');
    return authService.getToken();
  };

  /**
   * Get CSRF token for manual form submissions
   */
  const getCsrfToken = () => {
    return authService.getCsrfToken();
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
    authInitialized,

    // MFA state (survives component remounts)
    pendingMfa,
    clearPendingMfa,

    // Authentication methods
    login,
    verifyMfa,
    logout,
    refreshSession,
    switchCompany,

    // Permission methods
    hasPermission,
    hasRole,
    hasCompanyAccess,
    checkPermission, // Legacy support

    // API methods
    makeAuthenticatedRequest,
    makeSecureRequest,
    getToken, // Deprecated but kept for compatibility
    getCsrfToken,

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
