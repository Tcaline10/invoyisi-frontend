import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecurringInvoice } from '../../types';
import { invoiceService } from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Edit, Trash2, Play, Pause, ArrowRight, RefreshCw } from 'lucide-react';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface RecurringInvoiceDetailProps {
  recurringInvoiceId: string;
}

const RecurringInvoiceDetail: React.FC<RecurringInvoiceDetailProps> = ({ recurringInvoiceId }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [recurringInvoice, setRecurringInvoice] = useState<RecurringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    const fetchRecurringInvoiceData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!recurringInvoiceId) {
          throw new Error('Invalid recurring invoice ID');
        }

        const data = await invoiceService.getRecurringInvoice(recurringInvoiceId);
        setRecurringInvoice(data);
      } catch (err) {
        console.error('Error fetching recurring invoice details:', err);
        setError('Failed to load recurring invoice details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecurringInvoiceData();
  }, [recurringInvoiceId]);

  const handleBackClick = () => {
    navigate('/recurring-invoices');
  };

  const handleEditClick = () => {
    navigate(`/recurring-invoices/${recurringInvoiceId}/edit`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await invoiceService.deleteRecurringInvoice(recurringInvoiceId);
      showToast('success', 'Recurring invoice deleted successfully');
      navigate('/recurring-invoices');
    } catch (error) {
      console.error('Error deleting recurring invoice:', error);
      showToast('error', 'Failed to delete recurring invoice');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!recurringInvoice) return;

    try {
      setTogglingStatus(true);
      const updatedInvoice = await invoiceService.updateRecurringInvoice(
        recurringInvoiceId,
        { active: !recurringInvoice.active }
      );
      setRecurringInvoice(updatedInvoice);
      showToast('success', `Recurring invoice ${recurringInvoice.active ? 'paused' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error toggling recurring invoice status:', error);
      showToast('error', 'Failed to update recurring invoice status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      const invoice = await invoiceService.generateInvoiceFromRecurring(recurringInvoiceId);
      showToast('success', 'Invoice generated successfully');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast('error', 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  if (loading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  if (!recurringInvoice) {
    return <ErrorDisplay error="Recurring invoice not found" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recurring Invoices
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
          >
            {togglingStatus ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : recurringInvoice.active ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {recurringInvoice.active ? 'Pause' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
          >
            {generatingInvoice ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Generate Invoice Now
          </Button>
          <Button variant="outline" onClick={handleEditClick}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{recurringInvoice.name}</CardTitle>
            <Badge variant={recurringInvoice.active ? 'success' : 'secondary'}>
              {recurringInvoice.active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Frequency</p>
                  <p className="font-medium">{getFrequencyLabel(recurringInvoice.frequency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Invoice Date</p>
                  <p className="font-medium">{formatDate(recurringInvoice.next_date)}</p>
                </div>
                {recurringInvoice.last_sent && (
                  <div>
                    <p className="text-sm text-gray-500">Last Generated</p>
                    <p className="font-medium">{formatDate(recurringInvoice.last_sent)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(recurringInvoice.template.total)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Client</h3>
              {recurringInvoice.client ? (
                <div>
                  <p className="font-medium">{recurringInvoice.client.name}</p>
                  <p className="text-sm text-gray-500">{recurringInvoice.client.email}</p>
                  {recurringInvoice.client.phone && (
                    <p className="text-sm text-gray-500">{recurringInvoice.client.phone}</p>
                  )}
                  {recurringInvoice.client.company && (
                    <p className="text-sm text-gray-500">{recurringInvoice.client.company}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Client information not available</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invoice Template</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Description</th>
                    <th className="text-right py-2 px-4">Quantity</th>
                    <th className="text-right py-2 px-4">Unit Price</th>
                    <th className="text-right py-2 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringInvoice.template.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4">{item.description}</td>
                      <td className="py-2 px-4 text-right">{item.quantity}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b">
                    <td colSpan={3} className="py-2 px-4 text-right font-medium">Subtotal</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(recurringInvoice.template.subtotal)}</td>
                  </tr>
                  {recurringInvoice.template.tax > 0 && (
                    <tr className="border-b">
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">Tax</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(recurringInvoice.template.tax)}</td>
                    </tr>
                  )}
                  {recurringInvoice.template.discount > 0 && (
                    <tr className="border-b">
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">Discount</td>
                      <td className="py-2 px-4 text-right">-{formatCurrency(recurringInvoice.template.discount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="py-2 px-4 text-right font-medium">Total</td>
                    <td className="py-2 px-4 text-right font-bold">{formatCurrency(recurringInvoice.template.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {recurringInvoice.template.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                <p className="mt-1">{recurringInvoice.template.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recurring Invoice"
        description="Are you sure you want to delete this recurring invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default RecurringInvoiceDetail;
