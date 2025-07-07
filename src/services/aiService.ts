import axios from 'axios';
import { Invoice, Client, Payment } from '../types';

// API base URL - use environment variable for backend URL or fallback to proxy
const BACKEND_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api/ai` : '/api/ai';

export interface InvoiceCategory {
  category: string;
  confidence: number;
  subcategory?: string;
  tags: string[];
}

export interface ExpenseData {
  amount: number;
  currency: string;
  date: string;
  vendor: string;
  category: string;
  description: string;
  taxAmount?: number;
  confidence: number;
}

export interface CashFlowPrediction {
  period: string;
  predictedIncome: number;
  predictedExpenses: number;
  netCashFlow: number;
  confidence: number;
  factors: string[];
}

export interface FraudDetectionResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  recommendations: string[];
}

export interface TaxCalculation {
  region: string;
  taxType: string;
  taxRate: number;
  taxAmount: number;
  netAmount: number;
  breakdown: {
    [key: string]: number;
  };
}

export interface SmartReminder {
  message: string;
  tone: 'friendly' | 'professional' | 'urgent';
  sendDate: string;
  channel: 'email' | 'sms' | 'both';
  personalization: {
    clientName: string;
    invoiceAmount: number;
    daysPastDue: number;
    relationshipLength: string;
  };
}

/**
 * Enhanced AI Service for advanced invoice management features
 */
class AIService {
  /**
   * Categorize an invoice using AI
   * @param invoice - Invoice data to categorize
   * @returns Promise<InvoiceCategory> - Categorization result
   */
  async categorizeInvoice(invoice: Invoice): Promise<InvoiceCategory> {
    try {
      const response = await axios.post(`${API_BASE_URL}/categorize-invoice`, {
        invoice: {
          items: invoice.items,
          client: invoice.client,
          total: invoice.total,
          notes: invoice.notes
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error categorizing invoice:', error);
      // Fallback categorization
      return {
        category: 'General',
        confidence: 0.5,
        tags: ['uncategorized']
      };
    }
  }

  /**
   * Process expense receipt using AI
   * @param fileUri - URI of the uploaded receipt
   * @param mimeType - MIME type of the file
   * @returns Promise<ExpenseData> - Extracted expense data
   */
  async processExpenseReceipt(fileUri: string, mimeType: string): Promise<ExpenseData> {
    try {
      const response = await axios.post(`${API_BASE_URL}/process-expense`, {
        fileUri,
        mimeType
      });

      return response.data;
    } catch (error) {
      console.error('Error processing expense receipt:', error);
      throw error;
    }
  }

  /**
   * Generate cash flow predictions using AI
   * @param invoices - Historical invoice data
   * @param payments - Historical payment data
   * @param period - Prediction period ('month', 'quarter', 'year')
   * @returns Promise<CashFlowPrediction[]> - Cash flow predictions
   */
  async predictCashFlow(
    invoices: Invoice[], 
    payments: Payment[], 
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CashFlowPrediction[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict-cashflow`, {
        invoices,
        payments,
        period
      });

      return response.data;
    } catch (error) {
      console.error('Error predicting cash flow:', error);
      // Return fallback prediction
      return [{
        period: 'next_month',
        predictedIncome: 0,
        predictedExpenses: 0,
        netCashFlow: 0,
        confidence: 0,
        factors: ['Insufficient data for prediction']
      }];
    }
  }

  /**
   * Detect potential fraud in invoice using AI
   * @param invoice - Invoice to analyze
   * @param clientHistory - Historical data for the client
   * @returns Promise<FraudDetectionResult> - Fraud detection result
   */
  async detectInvoiceFraud(invoice: Invoice, clientHistory?: Invoice[]): Promise<FraudDetectionResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/detect-fraud`, {
        invoice,
        clientHistory
      });

      return response.data;
    } catch (error) {
      console.error('Error detecting fraud:', error);
      // Return safe default
      return {
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        recommendations: []
      };
    }
  }

  /**
   * Calculate taxes automatically based on region and invoice data
   * @param invoice - Invoice data
   * @param region - Tax region/country code
   * @returns Promise<TaxCalculation> - Tax calculation result
   */
  async calculateTaxes(invoice: Invoice, region: string): Promise<TaxCalculation> {
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate-taxes`, {
        invoice,
        region
      });

      return response.data;
    } catch (error) {
      console.error('Error calculating taxes:', error);
      // Return basic calculation
      const taxRate = this.getDefaultTaxRate(region);
      const taxAmount = invoice.subtotal * taxRate;
      
      return {
        region,
        taxType: 'VAT',
        taxRate,
        taxAmount,
        netAmount: invoice.subtotal + taxAmount,
        breakdown: {
          'VAT': taxAmount
        }
      };
    }
  }

  /**
   * Generate personalized payment reminders using AI
   * @param invoice - Overdue invoice
   * @param client - Client information
   * @param reminderType - Type of reminder
   * @returns Promise<SmartReminder> - Generated reminder
   */
  async generateSmartReminder(
    invoice: Invoice, 
    client: Client, 
    reminderType: 'first' | 'second' | 'final'
  ): Promise<SmartReminder> {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-reminder`, {
        invoice,
        client,
        reminderType
      });

      return response.data;
    } catch (error) {
      console.error('Error generating smart reminder:', error);
      // Return fallback reminder
      return this.generateFallbackReminder(invoice, client, reminderType);
    }
  }

  /**
   * Batch process multiple documents
   * @param files - Array of file URIs and types
   * @returns Promise<any[]> - Processed results
   */
  async batchProcessDocuments(files: { uri: string; mimeType: string; type: 'invoice' | 'receipt' }[]): Promise<any[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/batch-process`, {
        files
      });

      return response.data;
    } catch (error) {
      console.error('Error batch processing documents:', error);
      throw error;
    }
  }

  // Helper methods
  private getDefaultTaxRate(region: string): number {
    const taxRates: { [key: string]: number } = {
      'CM': 0.1925, // Cameroon VAT
      'US': 0.08,   // Average US sales tax
      'GB': 0.20,   // UK VAT
      'FR': 0.20,   // France VAT
      'DE': 0.19,   // Germany VAT
      'CA': 0.13,   // Canada HST average
      'AU': 0.10,   // Australia GST
    };

    return taxRates[region] || 0.10; // Default 10%
  }

  private generateFallbackReminder(invoice: Invoice, client: Client, reminderType: string): SmartReminder {
    const daysPastDue = Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
    
    let message = '';
    let tone: 'friendly' | 'professional' | 'urgent' = 'professional';

    switch (reminderType) {
      case 'first':
        message = `Dear ${client.name}, we hope this message finds you well. We wanted to remind you that invoice ${invoice.number} for ${invoice.total} is now ${daysPastDue} days past due. We would appreciate your prompt attention to this matter.`;
        tone = 'friendly';
        break;
      case 'second':
        message = `Dear ${client.name}, this is a follow-up regarding invoice ${invoice.number} for ${invoice.total}, which is now ${daysPastDue} days overdue. Please arrange payment at your earliest convenience.`;
        tone = 'professional';
        break;
      case 'final':
        message = `Dear ${client.name}, this is our final notice regarding invoice ${invoice.number} for ${invoice.total}, which is now ${daysPastDue} days overdue. Immediate payment is required to avoid further action.`;
        tone = 'urgent';
        break;
    }

    return {
      message,
      tone,
      sendDate: new Date().toISOString(),
      channel: 'email',
      personalization: {
        clientName: client.name,
        invoiceAmount: invoice.total,
        daysPastDue,
        relationshipLength: 'unknown'
      }
    };
  }
}

export const aiService = new AIService();
