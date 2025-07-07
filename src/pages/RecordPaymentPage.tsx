import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { Invoice } from '../types';
import { invoiceService, paymentService } from '../services/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const RecordPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const invoiceId = queryParams.get('invoice');

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Payment form state
  const [formData, setFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'credit_card',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError('No invoice specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Validate invoiceId exists
        if (!invoiceId) {
          throw new Error('Invalid invoice ID');
        }

        const invoiceData = await invoiceService.getInvoice(invoiceId);
        setInvoice(invoiceData);

        // Set default payment amount to the total amount due
        setFormData(prev => ({
          ...prev,
          amount: invoiceData.total
        }));
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validate payment amount
      if (formData.amount <= 0) {
        setError('Payment amount must be greater than zero');
        setSubmitting(false);
        return;
      }

      // Create payment
      const paymentData = {
        invoice_id: invoice.id,
        amount: formData.amount,
        date: formData.date,
        method: formData.method,
        reference: formData.reference,
        notes: formData.notes
      };

      const result = await paymentService.createPayment(paymentData);

      // Update invoice status to paid if payment covers the full amount
      if (formData.amount >= invoice.total) {
        await invoiceService.updateInvoice(invoice.id, {
          ...invoice,
          status: 'paid'
        });
      } else if (formData.amount > 0) {
        // Set to partial if payment is partial
        await invoiceService.updateInvoice(invoice.id, {
          ...invoice,
          status: 'partial'
        });
      }

      // Show success modal
      setShowSuccessModal(true);

    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInvoice = () => {
    if (invoice) {
      navigate(`/invoices/${invoice.id}`);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="form" />;
  }

  if (error && !invoice) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-4">Record Payment</h1>
        </div>

        {invoice && (
          <Card>
            <CardHeader>
              <CardTitle>Payment for Invoice #{invoice.number}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-medium">#{invoice.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium">{invoice.client?.name || 'Client'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium">{new Date(invoice.issued_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium capitalize">{invoice.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">${invoice.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Payment Amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={invoice.total}
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    required
                  />

                  <Input
                    label="Payment Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={formData.method}
                      onChange={(e) => handleChange('method', e.target.value)}
                      required
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="paypal">PayPal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Reference Number"
                    placeholder="Transaction ID, check number, etc."
                    value={formData.reference}
                    onChange={(e) => handleChange('reference', e.target.value)}
                  />

                  <Input
                    label="Notes"
                    placeholder="Additional payment details"
                    as="textarea"
                    className="h-24"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                  />
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    icon={<CreditCard size={16} />}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleViewInvoice}
        title="Payment Recorded Successfully"
        size="sm"
        footer={
          <div className="flex justify-end w-full">
            <Button
              variant="primary"
              onClick={handleViewInvoice}
            >
              View Invoice
            </Button>
          </div>
        }
      >
        <div className="text-center py-6">
          <div className="mx-auto mb-4 text-green-500">
            <CheckCircle size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Recorded Successfully</h3>
          <p className="text-gray-600 mb-4">
            Your payment has been recorded and the invoice status has been updated.
          </p>
        </div>
      </Modal>
    </>
  );
};

export default RecordPaymentPage;
