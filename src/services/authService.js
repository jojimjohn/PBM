/**
 * Secure Authentication Service (Cookie-Based)
 *
 * SECURITY: Tokens are stored in HttpOnly cookies, not accessible to JavaScript.
 * This prevents XSS attacks from stealing authentication tokens.
 *
 * Key changes from header-based auth:
 * - No token storage in localStorage (XSS vulnerability)
 * - All requests use credentials: 'include' for cookie transmission
 * - Authentication state inferred from user data, not token existence
 */

import { API_BASE_URL } from '../config/api.js';

class AuthService {
  constructor() {
    this.user = null;
    this.isInitialized = false;

    // Initialize auth state
    this.initialize();
  }

  /**
   * Initialize authentication state
   * Handles migration from localStorage tokens to cookie-based auth
   */
  async initialize() {
    try {
      // Check for legacy localStorage auth data
      const legacyAuth = this.getLegacyAuth();

      if (legacyAuth?.token) {
        // Attempt to migrate to cookie-based auth
        await this.migrateTokensToCookies(legacyAuth.token);
      } else {
        // No legacy tokens, try to restore session from cookies
        await this.validateSession();
      }
    } catch (error) {
      console.warn('Auth initialization warning:', error.message);
      this.user = null;
    } finally {
      this.isInitialized = true;
    }
  }

  /**
   * Get legacy auth data from localStorage (for migration)
   */
  getLegacyAuth() {
    try {
      const stored = localStorage.getItem('petroleum_auth');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to read legacy auth:', error);
    }
    return null;
  }

  /**
   * Clear legacy localStorage auth data
   */
  clearLegacyAuth() {
    try {
      localStorage.removeItem('petroleum_auth');
    } catch (error) {
      console.warn('Failed to clear legacy auth:', error);
    }
  }

  /**
   * Migrate header-based tokens to cookie-based auth
   */
  async migrateTokensToCookies(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/migrate-to-cookies`, {
        method: 'POST',
        credentials: 'include', // Essential for cookies
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Migration successful - store user data and clear legacy storage
        if (data.data?.user) {
          this.user = data.data.user;
        }
        this.clearLegacyAuth();
        console.log('Auth migrated to secure cookies');
        return true;
      } else {
        // Migration failed - clear legacy data and require re-login
        this.clearLegacyAuth();
        this.user = null;
        return false;
      }
    } catch (error) {
      console.error('Token migration failed:', error);
      this.clearLegacyAuth();
      this.user = null;
      return false;
    }
  }

  /**
   * Validate current session by making a test request
   * Uses cookies automatically via credentials: 'include'
   */
  async validateSession() {
    try {
      // Try to get current user info to validate session
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          this.user = data.data.user;
          return true;
        }
      }

      this.user = null;
      return false;
    } catch (error) {
      console.warn('Session validation failed:', error);
      this.user = null;
      return false;
    }
  }

  /**
   * Login with email and password
   * If MFA is enabled, returns requiresMfa: true and login must be completed with verifyMfa()
   * Tokens are set as HttpOnly cookies by the server (after MFA verification if enabled)
   */
  async login(email, password, companyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include', // Essential for receiving cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, companyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success) {
        // Check if MFA is required
        if (data.requiresMfa) {
          // MFA required - don't set user yet, return partial data for MFA step
          return {
            success: true,
            requiresMfa: true,
            mfaData: {
              userId: data.data.userId,
              companyId: data.data.companyId,
              email: data.data.email,
              firstName: data.data.firstName
            },
            message: data.message
          };
        }

        // No MFA - login complete, store user data
        this.user = data.data.user;

        // Clear any legacy localStorage data
        this.clearLegacyAuth();

        return {
          success: true,
          requiresMfa: false,
          user: this.user,
          message: data.message
        };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify MFA code to complete login (second step after password)
   * @param {number} userId - User ID from login response
   * @param {string} companyId - Company ID from login response
   * @param {string} code - TOTP code or backup code
   * @param {boolean} isBackupCode - Whether the code is a backup code
   */
  async verifyMfa(userId, companyId, code, isBackupCode = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, companyId, code, isBackupCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'MFA verification failed');
      }

      if (data.success) {
        // MFA verified - store user data
        this.user = data.data.user;
        this.clearLegacyAuth();

        return {
          success: true,
          user: this.user,
          message: data.message
        };
      } else {
        throw new Error(data.error || 'MFA verification failed');
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  }

  /**
   * Logout and clear session
   * Server clears HttpOnly cookies and blacklists tokens
   */
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send cookies to be cleared
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Logout endpoint error is not critical
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local state
      this.user = null;
      this.clearLegacyAuth();
    }
  }

  /**
   * Check if user is authenticated
   * Based on user data presence (tokens are in HttpOnly cookies)
   */
  isAuthenticated() {
    return !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get access token - DEPRECATED
   * Tokens are now in HttpOnly cookies, not accessible to JavaScript
   * This method is kept for backward compatibility during migration
   */
  getToken() {
    // Check legacy storage for migration scenarios
    const legacy = this.getLegacyAuth();
    return legacy?.token || null;
  }

  /**
   * Refresh access token
   * Server handles token rotation via cookies
   *
   * RACE CONDITION HANDLING:
   * If multiple tabs try to refresh simultaneously, the server returns
   * REFRESH_IN_PROGRESS (429) with Retry-After header. The caller should
   * retry after a short delay using exponential backoff.
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Refresh token is in HttpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Create error with code for proper handling
        const error = new Error(data.error || 'Token refresh failed');
        error.code = data.code;
        error.status = response.status;

        // Special handling for concurrent refresh attempts
        // IMPORTANT: Only check data.code, NOT response.status === 429
        // Other 429s (rate limiter) should NOT trigger retry logic
        if (data.code === 'REFRESH_IN_PROGRESS') {
          // Prefer Retry-After header, fallback to body value, default to 1 second
          // FIXED: Validate parsed value to avoid NaN propagating to backoff calculation
          const retryAfterHeader = response.headers.get('Retry-After');
          let retryAfter = data.retryAfter || 1; // Default from body or 1 second
          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed) && parsed > 0) {
              retryAfter = parsed;
            }
          }
          error.retryAfter = retryAfter;
          if (import.meta.env.DEV) {
            console.log('[Auth] Token refresh in progress on another tab, should retry');
          }
        }

        throw error;
      }

      if (data.success && data.data?.user) {
        // Update user data with fresh information
        this.user = data.data.user;
        return true;
      } else {
        const error = new Error(data.error || 'Token refresh failed');
        error.code = data.code;
        throw error;
      }
    } catch (error) {
      // Don't clear user for REFRESH_IN_PROGRESS - it's a retry scenario
      if (error.code !== 'REFRESH_IN_PROGRESS') {
        console.error('Token refresh error:', error);
        this.user = null;
      }
      throw error;
    }
  }

  /**
   * Make authenticated API request
   * Uses HttpOnly cookies automatically via credentials: 'include'
   * Automatically includes CSRF token for state-changing methods (POST, PUT, PATCH, DELETE)
   */
  async makeAuthenticatedRequest(url, options = {}) {
    // Check if user is authenticated
    if (!this.user) {
      throw new Error('Not authenticated');
    }

    // Determine if this is a state-changing request that needs CSRF protection
    const method = (options.method || 'GET').toUpperCase();
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Check if body is FormData (for file uploads)
    const isFormData = options.body instanceof FormData;

    // Build headers with CSRF token for state-changing requests
    // Don't set Content-Type for FormData - browser sets it automatically with boundary
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    // Add CSRF token for state-changing methods
    if (needsCsrf) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const defaultOptions = {
      credentials: 'include', // Essential for sending cookies
      headers,
    };

    // Remove Authorization header if present (no longer needed with cookies)
    if (defaultOptions.headers.Authorization) {
      delete defaultOptions.headers.Authorization;
    }

    try {
      const response = await fetch(url, {
        ...options,
        ...defaultOptions,
        headers: { ...options.headers, ...defaultOptions.headers }
      });

      // Handle CSRF validation failure
      if (response.status === 403) {
        const data = await response.json();
        if (data.code?.startsWith('CSRF_')) {
          // CSRF token mismatch - likely stale token, refresh page
          console.warn('CSRF validation failed:', data.code);
          throw new Error(data.message || 'Security validation failed. Please refresh the page and try again.');
        }
        // Other 403 errors (permission denied, etc.)
        throw new Error(data.error || 'Access denied');
      }

      // Handle token expiry
      if (response.status === 401) {
        try {
          // Try to refresh token
          await this.refreshAccessToken();

          // Get fresh CSRF token after refresh (cookie may have changed)
          const freshHeaders = { ...headers };
          if (needsCsrf) {
            const freshCsrfToken = this.getCsrfToken();
            if (freshCsrfToken) {
              freshHeaders['X-CSRF-Token'] = freshCsrfToken;
            }
          }

          // Retry request with fresh CSRF token
          const retryResponse = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: { ...options.headers, ...freshHeaders }
          });

          return await retryResponse.json();
        } catch (refreshError) {
          // Refresh failed, redirect to login
          this.user = null;
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Check user permission
   */
  hasPermission(permission) {
    if (!this.user || !this.user.permissions) {
      return false;
    }
    return this.user.permissions.includes(permission);
  }

  /**
   * Check user role
   */
  hasRole(role) {
    if (!this.user) {
      return false;
    }
    return this.user.role === role;
  }

  /**
   * Check company access
   */
  hasCompanyAccess(companyId) {
    if (!this.user) {
      return false;
    }
    // Super admin has access to all companies
    if (this.user.role === 'SUPER_ADMIN' || this.user.role === 'super-admin') {
      return true;
    }
    return this.user.companyId === companyId;
  }

  /**
   * Update stored user data (for profile updates, etc.)
   */
  updateUser(userData) {
    if (this.user) {
      this.user = { ...this.user, ...userData };
    }
  }

  /**
   * Get CSRF token from cookie (for state-changing requests)
   * Note: csrf-token cookie is NOT HttpOnly, so JS can read it
   */
  getCsrfToken() {
    try {
      const match = document.cookie.match(/csrf-token=([^;]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.warn('Failed to get CSRF token:', error);
      return null;
    }
  }

  /**
   * Make request with CSRF protection (for POST/PUT/DELETE)
   */
  async makeSecureRequest(url, options = {}) {
    const csrfToken = this.getCsrfToken();

    return this.makeAuthenticatedRequest(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
    });
  }

  // ============================================================================
  // MFA Management Methods
  // ============================================================================

  /**
   * Get MFA status for current user
   */
  async getMfaStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get MFA status');
      }

      return data.data;
    } catch (error) {
      console.error('MFA status error:', error);
      throw error;
    }
  }

  /**
   * Start MFA setup - returns QR code and secret
   */
  async setupMfa() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/setup`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate MFA setup');
      }

      return data.data;
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  }

  /**
   * Complete MFA setup by verifying code
   * @param {string} code - 6-digit TOTP code
   * @returns {Object} - Contains backup codes on success
   */
  async verifyMfaSetup(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/verify-setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'MFA verification failed');
      }

      // Update user's MFA status
      if (this.user) {
        this.user.mfaEnabled = true;
      }

      return {
        success: true,
        backupCodes: data.data.backupCodes,
        warning: data.data.warning
      };
    } catch (error) {
      console.error('MFA verify setup error:', error);
      throw error;
    }
  }

  /**
   * Disable MFA for current user
   * @param {string} password - Current password OR
   * @param {string} code - MFA code
   */
  async disableMfa(password, code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable MFA');
      }

      // Update user's MFA status
      if (this.user) {
        this.user.mfaEnabled = false;
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('MFA disable error:', error);
      throw error;
    }
  }

  /**
   * Regenerate backup codes
   * @param {string} code - Current MFA code to authorize regeneration
   * @returns {Object} - Contains new backup codes
   */
  async regenerateBackupCodes(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/regenerate-backup-codes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }

      return {
        success: true,
        backupCodes: data.data.backupCodes,
        warning: data.data.warning
      };
    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      throw error;
    }
  }

  /**
   * Change password (self-service)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Result with success/error
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to change password'
        };
      }

      return {
        success: true,
        message: data.message || 'Password changed successfully'
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password'
      };
    }
  }

  /**
   * Update user profile (first name, last name)
   * Self-service profile update for authenticated users
   */
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update profile'
        };
      }

      // Update local user data
      if (data.user) {
        this.user = { ...this.user, ...data.user };
      }

      return {
        success: true,
        message: data.message || 'Profile updated successfully',
        user: data.user
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
