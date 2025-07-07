import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Invoice, InvoiceItem, Client } from '../../types';
import { invoiceService, clientService } from '../../services/api';
import { Download, Edit, ArrowLeft, CreditCard, Printer, Send, DollarSign, CheckCircle, Brain } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import ErrorDisplay from '../ui/ErrorDisplay';
import InvoiceCategorization from '../AI/InvoiceCategorization';
import ExportInvoice from '../Export/ExportInvoice';

interface InvoiceDetailProps {
  invoiceId: string;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoiceId }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);

      // Validate invoiceId exists
      if (!invoiceId) {
        throw new Error('Invalid invoice ID');
      }

      const invoiceData = await invoiceService.getInvoice(invoiceId);
      setInvoice(invoiceData);

      if (invoiceData.client_id) {
        const clientData = await clientService.getClient(invoiceData.client_id);
        setClient(clientData);
      }

      // Show payment prompt for unpaid invoices
      if (invoiceData.status === 'unpaid' || invoiceData.status === 'sent' || invoiceData.status === 'viewed' || invoiceData.status === 'overdue') {
        setShowPaymentPrompt(true);
      } else {
        setShowPaymentPrompt(false);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('Failed to load invoice details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'default', label: 'Draft' },
      sent: { variant: 'info', label: 'Sent' },
      viewed: { variant: 'primary', label: 'Viewed' },
      paid: { variant: 'success', label: 'Paid' },
      partial: { variant: 'warning', label: 'Partial' },
      overdue: { variant: 'danger', label: 'Overdue' },
      cancelled: { variant: 'warning', label: 'Cancelled' },
    };

    const { variant, label } = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleProceedToPayment = () => {
    console.log('Proceeding to payment for invoice:', invoiceId);
    navigate(`/payments/new?invoice=${invoiceId}`);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSkeleton type="form" />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!invoice) {
    return <ErrorDisplay error="Invoice not found" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/invoices')}
        >
          Back to Invoices
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Printer size={16} />}
            onClick={handlePrintInvoice}
          >
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
            onClick={() => setShowExportModal(true)}
          >
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Brain size={16} />}
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            AI Categorize
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/invoices/${invoiceId}/edit`)}
          >
            Edit
          </Button>
          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Send size={16} />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await invoiceService.updateInvoice(invoiceId, { ...invoice, status: 'unpaid' });
                  showToast('success', 'Invoice marked as unpaid');
                  // Refresh the invoice data
                  fetchInvoice();
                } catch (error) {
                  console.error('Error updating invoice status:', error);
                  showToast('error', 'Failed to update invoice status');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Mark as Unpaid
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Send size={16} />}
              onClick={() => {
                showToast('info', 'Sending invoice to client...');
                // This would typically integrate with an email service
                setTimeout(() => {
                  showToast('success', 'Invoice sent to client');
                }, 1500);
              }}
            >
              Send
            </Button>
          )}
          {(invoice.status === 'unpaid' || invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue') && (
            <Button
              variant="success"
              size="sm"
              icon={<CheckCircle size={16} />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await invoiceService.updateInvoice(invoiceId, { ...invoice, status: 'paid' });
                  showToast('success', 'Invoice marked as paid');
                  // Refresh the invoice data
                  fetchInvoice();
                } catch (error) {
                  console.error('Error updating invoice status:', error);
                  showToast('error', 'Failed to update invoice status');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Mark as Paid
            </Button>
          )}
          {invoice.status !== 'paid' && (
            <Button
              variant="outline"
              size="sm"
              icon={<DollarSign size={16} />}
              onClick={() => navigate(`/payments/new?invoice=${invoiceId}`)}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6 print:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl">Invoice #{invoice.number}</CardTitle>
          {getStatusBadge(invoice.status)}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">From</h3>
              <div className="text-gray-900">
                <p className="font-medium">Your Company</p>
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>billing@yourcompany.com</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
              <div className="text-gray-900">
                <p className="font-medium">{client?.name || 'Client'}</p>
                <p>{client?.address || 'No address provided'}</p>
                <p>{client?.email || 'No email provided'}</p>
                <p>{client?.phone || 'No phone provided'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Invoice Date</h3>
              <p className="text-gray-900">{invoice.issued_date ? new Date(invoice.issued_date).toLocaleDateString() : 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
              <p className="text-gray-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Amount Due</h3>
              <p className="text-xl font-bold text-gray-900">${invoice.total.toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.map((item) => (
                  <tr key={item.id} className="bg-white border-b">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">Subtotal</td>
                  <td className="px-4 py-2 text-right font-medium">${invoice.subtotal.toFixed(2)}</td>
                </tr>
                {invoice.tax > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium">Tax</td>
                    <td className="px-4 py-2 text-right font-medium">${invoice.tax.toFixed(2)}</td>
                  </tr>
                )}
                {invoice.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium">Discount</td>
                    <td className="px-4 py-2 text-right font-medium">-${invoice.discount.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-bold">Total</td>
                  <td className="px-4 py-2 text-right font-bold">${invoice.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-900 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
        {showPaymentPrompt && (
          <CardFooter className="bg-blue-50 border-t border-blue-100">
            <div className="flex flex-col sm:flex-row justify-between items-center w-full">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-blue-800 font-medium">Payment Due</h3>
                <p className="text-blue-600 text-sm">This invoice is awaiting payment.</p>
              </div>
              <Button
                variant="primary"
                icon={<CreditCard size={16} />}
                onClick={handleProceedToPayment}
              >
                Pay Now
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* AI Categorization Panel */}
      {showAIPanel && invoice && (
        <div className="mt-6">
          <InvoiceCategorization
            invoice={invoice}
            onCategoryUpdate={(category) => {
              showToast('success', `Invoice categorized as: ${category.category}`);
            }}
            autoAnalyze={false}
          />
        </div>
      )}

      {/* Export Modal */}
      {invoice && (
        <ExportInvoice
          invoice={invoice}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default InvoiceDetail;
