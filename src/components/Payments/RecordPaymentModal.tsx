import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, CreditCard, User, FileText, RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { invoiceService, paymentService } from '../../services/api';
import { Invoice } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInvoices?: () => void;
}

type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'other';

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, refreshInvoices }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    invoiceId: '',
    invoiceNumber: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'credit_card' as PaymentMethod,
    notes: '',
    client: '',
    reference: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch unpaid invoices when modal opens
      const fetchInvoices = async () => {
        try {
          setLoading(true);
          const data = await invoiceService.getInvoices({ status: 'unpaid' });
          // Filter to only include unpaid invoices
          const unpaidInvoices = data.filter(invoice =>
            invoice.status === 'sent' ||
            invoice.status === 'viewed' ||
            invoice.status === 'overdue'
          );
          setInvoices(unpaidInvoices);
        } catch (err) {
          console.error('Error fetching invoices:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchInvoices();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectInvoice = (invoice: Invoice) => {
    setFormData(prev => ({
      ...prev,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total.toString(),
      client: invoice.client?.name || `Client ${invoice.clientId}`,
    }));
    setShowInvoiceDropdown(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceId) {
      newErrors.invoiceNumber = 'Invoice is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setSubmitting(true);

        // Create payment data
        const paymentData = {
          invoice_id: formData.invoiceId,
          amount: parseFloat(formData.amount),
          date: formData.date,
          method: formData.method,
          reference: formData.reference,
          notes: formData.notes
        };

        // Get the selected invoice to check if payment is full or partial
        const selectedInvoice = invoices.find(invoice => invoice.id === formData.invoiceId);
        const isFullPayment = selectedInvoice && parseFloat(formData.amount) >= selectedInvoice.total;

        // Save payment
        await paymentService.createPayment(paymentData);

        // Reset form
        setFormData({
          invoiceId: '',
          invoiceNumber: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          method: 'credit_card',
          notes: '',
          client: '',
          reference: '',
        });

        // Close modal
        onClose();

        // Show success message with toast
        showToast(
          'success',
          `Payment recorded successfully! Invoice status is now ${isFullPayment ? 'paid' : 'partially paid'}.`
        );

        // Refresh invoices list if the callback is provided
        if (refreshInvoices) {
          refreshInvoices();
        }
      } catch (err) {
        console.error('Error recording payment:', err);
        showToast('error', 'Failed to record payment. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="Invoice"
            name="invoiceNumber"
            placeholder="Select an invoice"
            value={formData.invoiceNumber}
            onChange={handleChange}
            error={errors.invoiceNumber}
            prefix={<FileText size={16} className="text-gray-400" />}
            onFocus={() => setShowInvoiceDropdown(true)}
            onBlur={() => setTimeout(() => setShowInvoiceDropdown(false), 100)}
            fullWidth
          />
          {showInvoiceDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No unpaid invoices found</div>
              ) : (
                <ul className="py-1 max-h-60 overflow-auto">
                  {invoices.map((invoice) => (
                    <li
                      key={invoice.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => selectInvoice(invoice)}
                    >
                      <div className="flex justify-between">
                        <span>{invoice.number}</span>
                        <span className="font-medium">${invoice.total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.client?.name || `Client ${invoice.clientId}`}
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                          {invoice.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <Input
          label="Client"
          name="client"
          placeholder="Client will be selected from invoice"
          value={formData.client}
          onChange={handleChange}
          disabled
          prefix={<User size={16} className="text-gray-400" />}
          fullWidth
        />

        <Input
          label="Amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.amount}
          onChange={handleChange}
          error={errors.amount}
          prefix={<DollarSign size={16} className="text-gray-400" />}
          fullWidth
        />

        <Input
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          error={errors.date}
          prefix={<Calendar size={16} className="text-gray-400" />}
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard size={16} className="text-gray-400" />
            </div>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <Input
          label="Reference"
          name="reference"
          placeholder="Transaction ID, check number, etc."
          value={formData.reference}
          onChange={handleChange}
          fullWidth
        />

        <Input
          label="Notes"
          name="notes"
          placeholder="Add any additional notes about this payment"
          value={formData.notes}
          onChange={handleChange}
          as="textarea"
          className="h-24"
          fullWidth
        />
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
