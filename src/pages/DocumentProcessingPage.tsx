import React, { useState } from 'react';
import { File, Check, Plus } from 'lucide-react';
import DocumentProcessing from '../components/DocumentProcessing/DocumentProcessing';
import Button from '../components/ui/Button';
import { invoiceService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const DocumentProcessingPage: React.FC = () => {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
  };

  const createInvoiceFromData = async () => {
    if (!extractedData) {
      showToast('error', 'No data available to create invoice');
      return;
    }

    try {
      setIsCreatingInvoice(true);
      showToast('info', 'Creating invoice from extracted data...');

      // Map extracted data to invoice format
      const invoiceData = mapDataToInvoice(extractedData);

      // Create the invoice
      const newInvoice = await invoiceService.createInvoice(invoiceData);

      showToast('success', 'Invoice created successfully');

      // Navigate to the new invoice
      navigate(`/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('error', 'Failed to create invoice from extracted data');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Helper function to map extracted data to invoice format
  const mapDataToInvoice = (data: any) => {
    // Default values
    const invoiceData: any = {
      status: 'draft',
      items: [],
      notes: 'Created from document processing',
    };

    // Map invoice number if available
    if (data.invoice_number) {
      invoiceData.number = data.invoice_number;
    }

    // Map dates if available
    if (data.date || data.invoice_date) {
      invoiceData.issued_date = data.date || data.invoice_date;
    }

    if (data.due_date) {
      invoiceData.due_date = data.due_date;
    }

    // Map client information if available
    if (data.client_name || data.customer_name) {
      invoiceData.client_name = data.client_name || data.customer_name;
    }

    // Map line items if available
    if (data.line_items || data.items) {
      const items = data.line_items || data.items || [];
      invoiceData.items = items.map((item: any) => ({
        description: item.description || item.name || 'Item',
        quantity: item.quantity || 1,
        price: item.unit_price || item.price || 0,
        amount: item.amount || item.total || 0,
      }));
    }

    // Map totals if available
    if (data.subtotal) {
      invoiceData.subtotal = data.subtotal;
    }

    if (data.tax_amount || data.tax) {
      invoiceData.tax = data.tax_amount || data.tax;
    }

    if (data.total_amount || data.total) {
      invoiceData.total = data.total_amount || data.total;
    }

    return invoiceData;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <File className="mr-2" size={24} />
          Document Processing
        </h1>
        {extractedData && (
          <Button
            variant="primary"
            onClick={createInvoiceFromData}
            isLoading={isCreatingInvoice}
            disabled={isCreatingInvoice}
            icon={<Plus size={16} />}
          >
            Create Invoice
          </Button>
        )}
      </div>

      <p className="text-gray-600 mb-8">
        Upload invoices, receipts, or other documents to automatically extract data and create invoices.
      </p>

      <DocumentProcessing onDataExtracted={handleDataExtracted} />
    </div>
  );
};

export default DocumentProcessingPage;
