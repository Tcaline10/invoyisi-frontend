import { Invoice, Client, Payment } from '../types';
import { formatCurrency } from '../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  template?: string;
  includePayments?: boolean;
  includeItems?: boolean;
  customFields?: { [key: string]: any };
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'modern' | 'classic' | 'minimal' | 'professional';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: string;
  customCSS?: string;
}

/**
 * Export Service for generating PDFs, Excel files, and other formats
 */
class ExportService {
  private templates: InvoiceTemplate[] = [
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean, modern design with blue accents',
      layout: 'modern',
      colors: {
        primary: '#1e3a8a', // blue-900
        secondary: '#10b981', // emerald-500
        accent: '#f3f4f6'
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
      }
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional business invoice design',
      layout: 'classic',
      colors: {
        primary: '#374151',
        secondary: '#6b7280',
        accent: '#f9fafb'
      },
      fonts: {
        heading: 'Georgia, serif',
        body: 'Arial, sans-serif'
      }
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple design',
      layout: 'minimal',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#ffffff'
      },
      fonts: {
        heading: 'Helvetica, sans-serif',
        body: 'Helvetica, sans-serif'
      }
    }
  ];

  /**
   * Export invoice as PDF
   * @param invoice - Invoice to export
   * @param options - Export options
   * @returns Promise<Blob> - PDF blob
   */
  async exportInvoicePDF(invoice: Invoice, options: ExportOptions = { format: 'pdf' }): Promise<Blob> {
    try {
      // Generate HTML content for the invoice
      const htmlContent = this.generateInvoiceHTML(invoice, options);
      
      // Use browser's print functionality or a PDF library
      if (typeof window !== 'undefined' && window.print) {
        return this.generatePDFFromHTML(htmlContent);
      }
      
      throw new Error('PDF generation not supported in this environment');
    } catch (error) {
      console.error('Error exporting invoice as PDF:', error);
      throw error;
    }
  }

  /**
   * Export invoices as Excel
   * @param invoices - Invoices to export
   * @param options - Export options
   * @returns Promise<Blob> - Excel blob
   */
  async exportInvoicesExcel(invoices: Invoice[], options: ExportOptions = { format: 'excel' }): Promise<Blob> {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Prepare invoice data
      const invoiceData = invoices.map(invoice => ({
        'Invoice Number': invoice.number,
        'Client Name': invoice.client?.name || 'N/A',
        'Client Email': invoice.client?.email || '',
        'Issue Date': new Date(invoice.issued_date).toLocaleDateString(),
        'Due Date': new Date(invoice.due_date).toLocaleDateString(),
        'Status': invoice.status.toUpperCase(),
        'Subtotal': invoice.subtotal,
        'Tax': invoice.tax || 0,
        'Discount': invoice.discount || 0,
        'Total': invoice.total,
        'Notes': invoice.notes || ''
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(invoiceData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 20 }, // Client Name
        { wch: 25 }, // Client Email
        { wch: 12 }, // Issue Date
        { wch: 12 }, // Due Date
        { wch: 10 }, // Status
        { wch: 12 }, // Subtotal
        { wch: 10 }, // Tax
        { wch: 10 }, // Discount
        { wch: 12 }, // Total
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

      // If including items, create separate sheet
      if (options.includeItems) {
        const itemsData: any[] = [];
        invoices.forEach(invoice => {
          if (invoice.items) {
            invoice.items.forEach(item => {
              itemsData.push({
                'Invoice Number': invoice.number,
                'Client Name': invoice.client?.name || 'N/A',
                'Item Description': item.description,
                'Quantity': item.quantity,
                'Unit Price': item.unit_price,
                'Amount': item.amount
              });
            });
          }
        });

        if (itemsData.length > 0) {
          const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
          itemsWorksheet['!cols'] = [
            { wch: 15 }, // Invoice Number
            { wch: 20 }, // Client Name
            { wch: 30 }, // Item Description
            { wch: 10 }, // Quantity
            { wch: 12 }, // Unit Price
            { wch: 12 }  // Amount
          ];
          XLSX.utils.book_append_sheet(workbook, itemsWorksheet, 'Invoice Items');
        }
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      return blob;
    } catch (error) {
      console.error('Error exporting invoices as Excel:', error);
      throw error;
    }
  }

  /**
   * Export data as CSV
   * @param data - Data to export
   * @param headers - CSV headers
   * @returns string - CSV content
   */
  exportAsCSV(data: any[], headers: string[]): string {
    try {
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      );
      
      return [csvHeaders, ...csvRows].join('\n');
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  }

  /**
   * Get available invoice templates
   * @returns InvoiceTemplate[] - Available templates
   */
  getInvoiceTemplates(): InvoiceTemplate[] {
    return this.templates;
  }

  /**
   * Get template by ID
   * @param templateId - Template ID
   * @returns InvoiceTemplate | undefined
   */
  getTemplate(templateId: string): InvoiceTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  /**
   * Add custom template
   * @param template - Custom template
   */
  addCustomTemplate(template: InvoiceTemplate): void {
    this.templates.push(template);
  }

  /**
   * Generate invoice HTML for PDF export
   * @param invoice - Invoice data
   * @param options - Export options
   * @returns string - HTML content
   */
  private generateInvoiceHTML(invoice: Invoice, options: ExportOptions): string {
    const template = this.getTemplate(options.template || 'modern') || this.templates[0];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.number}</title>
        <style>
          ${this.generateInvoiceCSS(template)}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${this.generateInvoiceHeader(invoice, template)}
          ${this.generateInvoiceDetails(invoice)}
          ${this.generateInvoiceItems(invoice)}
          ${this.generateInvoiceTotals(invoice)}
          ${options.includePayments ? this.generatePaymentHistory(invoice) : ''}
          ${this.generateInvoiceFooter(invoice)}
        </div>
      </body>
      </html>
    `;
  }

  private generateInvoiceCSS(template: InvoiceTemplate): string {
    return `
      body {
        font-family: ${template.fonts.body};
        margin: 0;
        padding: 20px;
        color: #333;
      }
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
        border-bottom: 2px solid ${template.colors.primary};
        padding-bottom: 20px;
      }
      .company-info h1 {
        font-family: ${template.fonts.heading};
        color: ${template.colors.primary};
        margin: 0 0 10px 0;
        font-size: 28px;
      }
      .invoice-info {
        text-align: right;
      }
      .invoice-number {
        font-size: 24px;
        font-weight: bold;
        color: ${template.colors.primary};
      }
      .invoice-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-bottom: 40px;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      .items-table th {
        background: ${template.colors.primary};
        color: white;
        padding: 12px;
        text-align: left;
      }
      .items-table td {
        padding: 12px;
        border-bottom: 1px solid #eee;
      }
      .totals {
        margin-left: auto;
        width: 300px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
      }
      .total-row.final {
        border-top: 2px solid ${template.colors.primary};
        font-weight: bold;
        font-size: 18px;
        color: ${template.colors.primary};
      }
      @media print {
        body { margin: 0; padding: 0; }
        .invoice-container { box-shadow: none; }
      }
    `;
  }

  private generateInvoiceHeader(invoice: Invoice, template: InvoiceTemplate): string {
    return `
      <div class="invoice-header">
        <div class="company-info">
          <h1>I-Invoyisi</h1>
          <p>Smart Invoice Management</p>
        </div>
        <div class="invoice-info">
          <div class="invoice-number">Invoice ${invoice.number}</div>
          <p>Date: ${new Date(invoice.issued_date).toLocaleDateString()}</p>
          <p>Due: ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p>Status: <span style="color: ${this.getStatusColor(invoice.status)}">${invoice.status.toUpperCase()}</span></p>
        </div>
      </div>
    `;
  }

  private generateInvoiceDetails(invoice: Invoice): string {
    return `
      <div class="invoice-details">
        <div class="bill-to">
          <h3>Bill To:</h3>
          <p><strong>${invoice.client?.name || 'N/A'}</strong></p>
          <p>${invoice.client?.email || ''}</p>
          <p>${invoice.client?.phone || ''}</p>
          <p>${invoice.client?.address || ''}</p>
        </div>
        <div class="invoice-meta">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice #:</strong> ${invoice.number}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issued_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
        </div>
      </div>
    `;
  }

  private generateInvoiceItems(invoice: Invoice): string {
    if (!invoice.items || invoice.items.length === 0) {
      return '<p>No items found.</p>';
    }

    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center">${item.quantity}</td>
        <td style="text-align: right">${formatCurrency(item.unit_price)}</td>
        <td style="text-align: right">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    return `
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center">Qty</th>
            <th style="text-align: right">Unit Price</th>
            <th style="text-align: right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    `;
  }

  private generateInvoiceTotals(invoice: Invoice): string {
    return `
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${invoice.tax ? `
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(invoice.tax)}</span>
          </div>
        ` : ''}
        ${invoice.discount ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-${formatCurrency(invoice.discount)}</span>
          </div>
        ` : ''}
        <div class="total-row final">
          <span>Total:</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>
    `;
  }

  private generatePaymentHistory(invoice: Invoice): string {
    if (!invoice.payments || invoice.payments.length === 0) {
      return '';
    }

    const paymentsHTML = invoice.payments.map(payment => `
      <tr>
        <td>${new Date(payment.date).toLocaleDateString()}</td>
        <td>${payment.method}</td>
        <td>${payment.reference || 'N/A'}</td>
        <td style="text-align: right">${formatCurrency(payment.amount)}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-top: 40px;">
        <h3>Payment History</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Reference</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsHTML}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateInvoiceFooter(invoice: Invoice): string {
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
        <p style="text-align: center; color: #666; font-size: 12px;">
          Generated by I-Invoyisi - Smart Invoice Management System
        </p>
      </div>
    `;
  }

  private generateInvoicesCSV(invoices: Invoice[], options: ExportOptions): string {
    const headers = [
      'Invoice Number',
      'Client Name',
      'Issue Date',
      'Due Date',
      'Status',
      'Subtotal',
      'Tax',
      'Discount',
      'Total',
      'Notes'
    ];

    const data = invoices.map(invoice => ({
      'Invoice Number': invoice.number,
      'Client Name': invoice.client?.name || 'N/A',
      'Issue Date': new Date(invoice.issued_date).toLocaleDateString(),
      'Due Date': new Date(invoice.due_date).toLocaleDateString(),
      'Status': invoice.status,
      'Subtotal': invoice.subtotal,
      'Tax': invoice.tax || 0,
      'Discount': invoice.discount || 0,
      'Total': invoice.total,
      'Notes': invoice.notes || ''
    }));

    return this.exportAsCSV(data, headers);
  }

  private async generatePDFFromHTML(htmlContent: string): Promise<Blob> {
    try {
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Convert to blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple HTML blob
      return new Blob([htmlContent], { type: 'text/html' });
    }
  }

  private getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'draft': '#6b7280',
      'sent': '#3b82f6',
      'viewed': '#8b5cf6',
      'paid': '#10b981',
      'partial': '#f59e0b',
      'overdue': '#ef4444',
      'cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Download blob as file
   * @param blob - Blob to download
   * @param filename - Name of the file
   */
  downloadBlob(blob: Blob, filename: string): void {
    try {
      saveAs(blob, filename);
    } catch (error) {
      // Fallback download method
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Export and download invoice as PDF
   * @param invoice - Invoice to export
   * @param options - Export options
   */
  async exportAndDownloadPDF(invoice: Invoice, options: ExportOptions = { format: 'pdf' }): Promise<void> {
    const blob = await this.exportInvoicePDF(invoice, options);
    const filename = `invoice-${invoice.number}.pdf`;
    this.downloadBlob(blob, filename);
  }

  /**
   * Export and download invoices as Excel
   * @param invoices - Invoices to export
   * @param options - Export options
   */
  async exportAndDownloadExcel(invoices: Invoice[], options: ExportOptions = { format: 'excel' }): Promise<void> {
    const blob = await this.exportInvoicesExcel(invoices, options);
    const filename = invoices.length === 1
      ? `invoice-${invoices[0].number}.xlsx`
      : `invoices-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    this.downloadBlob(blob, filename);
  }
}

export const exportService = new ExportService();
