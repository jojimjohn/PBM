/**
 * Compliance Service
 * - WCN manifest PDF download
 * - Company compliance settings management
 */
import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class ComplianceService {
  async getCompanyInfo() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/compliance/company-info`);
      return { success: true, data: data.data || {} };
    } catch (error) {
      return { success: false, error: error.message, data: {} };
    }
  }

  async saveCompanyInfo(settings) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/compliance/company-info`,
        { method: 'PUT', body: JSON.stringify(settings) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download the WCN manifest PDF (opens in new tab).
   * @param {number} collectionOrderId
   */
  downloadWcnPdf(collectionOrderId) {
    // PDF is streamed from backend with cookie auth — open in new tab
    const url = `${API_BASE_URL}/compliance/wcn/${collectionOrderId}/pdf`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Public verification (no auth).
   */
  async verifyWcn(wcnNumber) {
    try {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/api$/, '/api')}/compliance-public/wcn/verify/${encodeURIComponent(wcnNumber)}`,
        { credentials: 'omit' }
      );
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const complianceService = new ComplianceService();
export default complianceService;
