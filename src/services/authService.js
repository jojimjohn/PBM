/**
 * Secure Authentication Service
 * Replaces the hardcoded authentication system with JWT-based security
 */

import { API_BASE_URL } from '../config/api.js';

class AuthService {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    
    // Load stored auth data on initialization
    this.loadStoredAuth();
  }

  /**
   * Login with email and password
   */
  async login(email, password, companyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
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
        // Store authentication data
        this.token = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;
        this.user = data.data.user;

        // Store in localStorage (encrypted in production)
        this.storeAuth();

        return {
          success: true,
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
   * Logout and clear stored data
   */
  async logout() {
    try {
      // Call logout endpoint if token exists
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      // Logout endpoint error is not critical
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local data
      this.clearAuth();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get access token
   */
  getToken() {
    return this.token;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      if (data.success) {
        this.token = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;
        this.storeAuth();
        return this.token;
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      
      const response = await fetch(url, { ...options, headers: defaultOptions.headers });


      // Handle token expiry
      if (response.status === 401) {
        try {
          // Try to refresh token
          await this.refreshAccessToken();
          
          // Retry request with new token
          const newToken = this.getToken();
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...defaultOptions.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          });

          return retryResponse;
        } catch (refreshError) {
          // Refresh failed, redirect to login
          this.clearAuth();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }

      return response;
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
    if (this.user.role === 'super-admin') {
      return true;
    }
    return this.user.companyId === companyId;
  }

  /**
   * Store authentication data
   */
  storeAuth() {
    try {
      const authData = {
        token: this.token,
        refreshToken: this.refreshToken,
        user: this.user,
        timestamp: new Date().getTime()
      };

      // In production, encrypt this data
      localStorage.setItem('petroleum_auth', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  /**
   * Load stored authentication data
   */
  loadStoredAuth() {
    try {
      const storedAuth = localStorage.getItem('petroleum_auth');
      
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        
        // Check if auth data is not too old (7 days)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const age = new Date().getTime() - authData.timestamp;
        
        if (age < maxAge) {
          this.token = authData.token;
          this.refreshToken = authData.refreshToken;
          this.user = authData.user;
        } else {
          // Auth data is too old, clear it
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      this.clearAuth();
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    
    try {
      localStorage.removeItem('petroleum_auth');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Validate token format (basic check)
   */
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;