/**
 * API Configuration
 * Centralized API base URL configuration
 */

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // Check for environment variable first (for production builds)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check for window environment variable (for runtime configuration)
  if (typeof window !== 'undefined' && window.API_URL) {
    return window.API_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
  // Add other API configuration here
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};