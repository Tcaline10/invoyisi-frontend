import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RecurringInvoice } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PlusCircle, RefreshCw, Calendar, Clock, ArrowRight, Play, Pause, Edit, Trash2 } from 'lucide-react';
import { invoiceService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';

interface RecurringInvoicesListProps {
  recurringInvoices: RecurringInvoice[];
  title: string;
  onRefresh: () => void;
  isLoading: boolean;
}

const RecurringInvoicesList: React.FC<RecurringInvoicesListProps> = ({
  recurringInvoices,
  title,
  onRefresh,
  isLoading
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);
  const [toggleStatusId, setToggleStatusId] = useState<string | null>(null);

  const handleCreateClick = () => {
    console.log('Navigating to create new recurring invoice form');
    navigate('/recurring-invoices/new');
  };

  const handleEditClick = (id: string) => {
    navigate(`/recurring-invoices/${id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoiceId) return;

    try {
      await invoiceService.deleteRecurringInvoice(selectedInvoiceId);
      showToast('success', 'Recurring invoice deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting recurring invoice:', error);
      showToast('error', 'Failed to delete recurring invoice');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedInvoiceId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setToggleStatusId(id);
      await invoiceService.updateRecurringInvoice(id, { active: !currentStatus });
      showToast('success', `Recurring invoice ${currentStatus ? 'paused' : 'activated'} successfully`);
      onRefresh();
    } catch (error) {
      console.error('Error toggling recurring invoice status:', error);
      showToast('error', 'Failed to update recurring invoice status');
    } finally {
      setToggleStatusId(null);
    }
  };

  const handleGenerateInvoice = async (id: string) => {
    try {
      setGeneratingInvoiceId(id);
      const invoice = await invoiceService.generateInvoiceFromRecurring(id);
      showToast('success', 'Invoice generated successfully');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast('error', 'Failed to generate invoice');
    } finally {
      setGeneratingInvoiceId(null);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleCreateClick}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Recurring Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recurringInvoices.length === 0 ? (
          <EmptyState
            title="No recurring invoices yet"
            description="Create your first recurring invoice to automatically generate invoices on a schedule."
            action={
              <Button onClick={handleCreateClick}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Recurring Invoice
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Client</th>
                  <th className="text-left py-3 px-4">Frequency</th>
                  <th className="text-left py-3 px-4">Next Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        to={`/recurring-invoices/${invoice.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {invoice.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {invoice.client?.name || 'Unknown Client'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {getFrequencyLabel(invoice.frequency)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        {formatDate(invoice.next_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {formatCurrency(invoice.template.total)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={invoice.active ? 'success' : 'secondary'}>
                        {invoice.active ? 'Active' : 'Paused'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInvoice(invoice.id)}
                          disabled={generatingInvoiceId === invoice.id}
                          title="Generate invoice now"
                        >
                          {generatingInvoiceId === invoice.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(invoice.id, invoice.active)}
                          disabled={toggleStatusId === invoice.id}
                          title={invoice.active ? 'Pause' : 'Activate'}
                        >
                          {toggleStatusId === invoice.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : invoice.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(invoice.id)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(invoice.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recurring Invoice"
        description="Are you sure you want to delete this recurring invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Card>
  );
};

export default RecurringInvoicesList;
