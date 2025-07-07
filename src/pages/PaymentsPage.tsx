import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CreditCard, AlertTriangle, Calendar, Filter, Search, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import RecordPaymentModal from '../components/Payments/RecordPaymentModal';
import { paymentService } from '../services/api';
import { Payment } from '../types';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import useFetch from '../hooks/useFetch';
import { useToast } from '../contexts/ToastContext';

const PaymentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const { showToast } = useToast();

  // Function to fetch payments and calculate stats
  const fetchPaymentsData = useCallback(async () => {
    // Fetch all payments
    const data = await paymentService.getAllPayments();

    // Calculate stats
    const totalReceived = data.reduce((sum, payment) =>
      payment.status === 'completed' ? sum + payment.amount : sum, 0);

    const pendingPayments = data.filter(payment => payment.status === 'pending');
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const failedPayments = data.filter(payment => payment.status === 'failed');
    const failedAmount = failedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      payments: data,
      stats: {
        totalReceived,
        pending: pendingAmount,
        pendingCount: pendingPayments.length,
        failed: failedAmount,
        failedCount: failedPayments.length
      }
    };
  }, []);

  // Use our custom hook for data fetching with caching
  const {
    data: paymentData,
    loading,
    error,
    refetch
  } = useFetch(
    fetchPaymentsData,
    {
      initialData: {
        payments: [],
        stats: {
          totalReceived: 0,
          pending: 0,
          pendingCount: 0,
          failed: 0,
          failedCount: 0
        }
      },
      cacheKey: 'payments-data',
      cacheDuration: 2 * 60 * 1000, // 2 minutes
      onError: (err) => {
        console.error('Error fetching payments:', err);
        showToast('error', 'Failed to load payments');
      }
    }
  );

  const payments = paymentData?.payments || [];
  const stats = paymentData?.stats || {
    totalReceived: 0,
    pending: 0,
    pendingCount: 0,
    failed: 0,
    failedCount: 0
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => {
              refetch();
              showToast('info', 'Refreshing payments data...');
            }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CreditCard size={16} />}
            onClick={() => setShowRecordPaymentModal(true)}
          >
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Received</p>
                <h3 className="text-2xl font-bold text-gray-900">FCFA{stats.totalReceived.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-sm text-green-600">Successfully processed</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <h3 className="text-2xl font-bold text-gray-900">FCFA{stats.pending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-sm text-orange-600">{stats.pendingCount} payments pending</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <h3 className="text-2xl font-bold text-gray-900">FCFA{stats.failed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-sm text-red-600">{stats.failedCount} failed payments</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                icon={<Filter size={16} />}
              >
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
                onClick={() => {
                  refetch();
                  showToast('info', 'Refreshing payments data...');
                }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <LoadingSkeleton type="list" count={3} />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <ErrorDisplay
                        error={error.message}
                        onRetry={refetch}
                        className="py-4"
                      />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments
                    .filter(payment =>
                      payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      payment.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((payment) => (
                      <tr key={payment.id} className="bg-white border-b">
                        <td className="px-4 py-3 font-medium">#{payment.invoice_number || 'N/A'}</td>
                        <td className="px-4 py-3">{payment.client_name || 'N/A'}</td>
                        <td className="px-4 py-3">${payment.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 capitalize">{payment.method.replace('_', ' ')}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              payment.status === 'completed' ? 'success' :
                              payment.status === 'pending' ? 'warning' : 'danger'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <RecordPaymentModal
        isOpen={showRecordPaymentModal}
        onClose={() => setShowRecordPaymentModal(false)}
      />
    </div>
  );
};

export default PaymentsPage;