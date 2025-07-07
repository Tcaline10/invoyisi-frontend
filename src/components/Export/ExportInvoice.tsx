import React, { useState } from 'react';
import { Download, FileText, Table, Printer, Settings, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Select } from '../ui/Select';
import { exportService, ExportOptions, InvoiceTemplate } from '../../services/exportService';
import { Invoice } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface ExportInvoiceProps {
  invoice?: Invoice;
  invoices?: Invoice[];
  isOpen: boolean;
  onClose: () => void;
}

const ExportInvoice: React.FC<ExportInvoiceProps> = ({
  invoice,
  invoices,
  isOpen,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [includePayments, setIncludePayments] = useState(true);
  const [includeItems, setIncludeItems] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { showToast } = useToast();

  const templates = exportService.getInvoiceTemplates();
  const isSingleInvoice = !!invoice;
  const isMultipleInvoices = !!invoices && invoices.length > 0;

  const handleExport = async () => {
    if (!isSingleInvoice && !isMultipleInvoices) {
      showToast('error', 'No invoice data to export');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format: exportFormat,
        template: selectedTemplate,
        includePayments,
        includeItems
      };

      let blob: Blob;
      let filename: string;

      if (isSingleInvoice && invoice) {
        // Export single invoice
        if (exportFormat === 'pdf') {
          await exportService.exportAndDownloadPDF(invoice, options);
        } else if (exportFormat === 'excel') {
          await exportService.exportAndDownloadExcel([invoice], options);
        } else {
          // CSV export
          const csvData = exportService.exportAsCSV(
            [{
              'Invoice Number': invoice.number,
              'Client Name': invoice.client?.name || 'N/A',
              'Issue Date': new Date(invoice.issued_date).toLocaleDateString(),
              'Due Date': new Date(invoice.due_date).toLocaleDateString(),
              'Status': invoice.status,
              'Total': invoice.total,
              'Notes': invoice.notes || ''
            }],
            ['Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 'Status', 'Total', 'Notes']
          );
          const blob = new Blob([csvData], { type: 'text/csv' });
          exportService.downloadBlob(blob, `invoice-${invoice.number}.csv`);
        }
      } else if (isMultipleInvoices && invoices) {
        // Export multiple invoices
        if (exportFormat === 'pdf') {
          showToast('warning', 'PDF export for multiple invoices will create separate files');
          // For now, export the first invoice as PDF
          await exportService.exportAndDownloadPDF(invoices[0], options);
        } else if (exportFormat === 'excel') {
          await exportService.exportAndDownloadExcel(invoices, options);
        } else {
          // CSV export
          const csvData = exportService.exportAsCSV(
            invoices.map(invoice => ({
              'Invoice Number': invoice.number,
              'Client Name': invoice.client?.name || 'N/A',
              'Issue Date': new Date(invoice.issued_date).toLocaleDateString(),
              'Due Date': new Date(invoice.due_date).toLocaleDateString(),
              'Status': invoice.status,
              'Total': invoice.total,
              'Notes': invoice.notes || ''
            })),
            ['Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 'Status', 'Total', 'Notes']
          );
          const blob = new Blob([csvData], { type: 'text/csv' });
          exportService.downloadBlob(blob, `invoices-export.csv`);
        }
      } else {
        throw new Error('Invalid export configuration');
      }

      showToast('success', `${exportFormat.toUpperCase()} exported successfully`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      showToast('error', `Failed to export ${exportFormat.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    if (!invoice) {
      showToast('warning', 'Preview is only available for single invoices');
      return;
    }
    setPreviewMode(true);
  };

  const getExportIcon = () => {
    switch (exportFormat) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <Table className="h-4 w-4" />;
      case 'csv':
        return <Table className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getExportDescription = () => {
    if (isSingleInvoice) {
      switch (exportFormat) {
        case 'pdf':
          return 'Generate a professional PDF invoice ready for printing or emailing';
        case 'excel':
          return 'Export invoice data to Excel format for further analysis';
        case 'csv':
          return 'Export invoice data to CSV format for importing into other systems';
      }
    } else {
      switch (exportFormat) {
        case 'pdf':
          return 'Generate PDF files for each invoice (batch processing)';
        case 'excel':
          return 'Export all invoices to a single Excel spreadsheet';
        case 'csv':
          return 'Export all invoices to CSV format for data analysis';
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Invoice">
      <div className="space-y-6">
        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                exportFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileText className="h-6 w-6 mx-auto mb-1" />
              <div className="text-sm font-medium">PDF</div>
              <div className="text-xs text-black">Professional</div>
            </button>
            <button
              onClick={() => setExportFormat('excel')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                exportFormat === 'excel'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Table className="h-6 w-6 mx-auto mb-1" />
              <div className="text-sm font-medium">Excel</div>
              <div className="text-xs text-black">Spreadsheet</div>
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Table className="h-6 w-6 mx-auto mb-1" />
              <div className="text-sm font-medium">CSV</div>
              <div className="text-xs text-black">Data</div>
            </button>
          </div>
        </div>

        {/* Template Selection (PDF only) */}
        {exportFormat === 'pdf' && (
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Template
            </label>
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-black mb-3">
            Include in Export
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeItems}
                onChange={(e) => setIncludeItems(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-black">Invoice items and details</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includePayments}
                onChange={(e) => setIncludePayments(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-black">Payment history</span>
            </label>
          </div>
        </div>

        {/* Export Description */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start">
            {getExportIcon()}
            <div className="ml-3">
              <h4 className="text-sm font-medium text-black">
                {exportFormat.toUpperCase()} Export
              </h4>
              <p className="text-sm text-black mt-1">
                {getExportDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            {isSingleInvoice && exportFormat === 'pdf' && (
              <Button
                variant="outline"
                onClick={handlePreview}
                icon={<Eye className="h-4 w-4" />}
              >
                Preview
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              isLoading={isExporting}
              icon={getExportIcon()}
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExportInvoice;
