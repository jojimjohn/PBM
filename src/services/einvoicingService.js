/**
 * E-Invoicing Service
 * Generates, downloads, and retrieves UBL 2.1 XML / PDF / QR for sales invoices.
 */
import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class EInvoicingService {
  /**
   * Generate e-invoice metadata (UUID, hash, TLV, invoice number).
   * Idempotent — if already generated, returns existing data.
   */
  async generate(salesOrderId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/einvoicing/${salesOrderId}/generate`,
        { method: 'POST' }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  downloadXml(salesOrderId) {
    window.open(`${API_BASE_URL}/einvoicing/${salesOrderId}/xml`, '_blank', 'noopener,noreferrer');
  }

  downloadPdf(salesOrderId) {
    window.open(`${API_BASE_URL}/einvoicing/${salesOrderId}/pdf`, '_blank', 'noopener,noreferrer');
  }

  getQrUrl(salesOrderId) {
    return `${API_BASE_URL}/einvoicing/${salesOrderId}/qr`;
  }
}

const einvoicingService = new EInvoicingService();
export default einvoicingService;
