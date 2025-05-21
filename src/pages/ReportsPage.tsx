import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import { invoiceService, paymentService } from '../services/api';
import { Invoice, Payment } from '../types';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('month');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState({
    paid: 0,
    pending: 0,
    overdue: 0,
    total: 0
  });
  const [paymentMethodData, setPaymentMethodData] = useState({
    credit_card: 0,
    bank_transfer: 0,
    cash: 0,
    check: 0,
    paypal: 0,
    other: 0,
    total: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch invoices and payments
      const invoicesData = await invoiceService.getInvoices();
      const paymentsData = await paymentService.getAllPayments();

      setInvoices(invoicesData);
      setPayments(paymentsData);

      // Process data for charts and statistics
      processRevenueData(invoicesData, paymentsData);
      processClientData(invoicesData);
      processInvoiceStatusData(invoicesData);
      processPaymentMethodData(paymentsData);
      processRecentActivity(invoicesData, paymentsData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (invoices: Invoice[], payments: Payment[]) => {
    // Group payments by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth: Record<string, { revenue: number, expenses: number }> = {};

    // Initialize all months with zero
    monthNames.forEach(month => {
      revenueByMonth[month] = { revenue: 0, expenses: 0 };
    });

    // Calculate revenue from payments
    payments.forEach(payment => {
      if (payment.date) {
        const date = new Date(payment.date);
        const month = monthNames[date.getMonth()];
        revenueByMonth[month].revenue += payment.amount || 0;
      }
    });

    // Convert to array format for chart
    const chartData = Object.keys(revenueByMonth).map(month => ({
      name: month,
      revenue: revenueByMonth[month].revenue,
      expenses: revenueByMonth[month].expenses
    }));

    setRevenueData(chartData);
  };

  const processClientData = (invoices: Invoice[]) => {
    // Group invoices by client
    const revenueByClient: Record<string, { name: string, revenue: number }> = {};

    invoices.forEach(invoice => {
      if (invoice.client && invoice.client.name) {
        const clientName = invoice.client.name;
        if (!revenueByClient[clientName]) {
          revenueByClient[clientName] = { name: clientName, revenue: 0 };
        }
        revenueByClient[clientName].revenue += invoice.total || 0;
      }
    });

    // Convert to array and sort by revenue
    const chartData = Object.values(revenueByClient)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 clients

    setClientData(chartData);
  };

  const processInvoiceStatusData = (invoices: Invoice[]) => {
    const statusCounts = {
      paid: 0,
      pending: 0,
      overdue: 0,
      total: invoices.length
    };

    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        statusCounts.paid++;
      } else if (invoice.status === 'overdue') {
        statusCounts.overdue++;
      } else {
        statusCounts.pending++; // includes draft, sent, viewed
      }
    });

    setInvoiceStatusData(statusCounts);
  };

  const processPaymentMethodData = (payments: Payment[]) => {
    const methodCounts = {
      credit_card: 0,
      bank_transfer: 0,
      cash: 0,
      check: 0,
      paypal: 0,
      other: 0,
      total: payments.length
    };

    payments.forEach(payment => {
      const method = payment.method as keyof typeof methodCounts;
      if (method && methodCounts[method] !== undefined) {
        methodCounts[method]++;
      } else {
        methodCounts.other++;
      }
    });

    setPaymentMethodData(methodCounts);
  };

  const processRecentActivity = (invoices: Invoice[], payments: Payment[]) => {
    // Combine recent invoices and payments
    const activities: any[] = [];

    // Add recent invoices
    invoices.slice(0, 10).forEach(invoice => {
      activities.push({
        type: 'invoice',
        id: invoice.id,
        number: invoice.number,
        date: new Date(invoice.created_at || Date.now()),
        message: `Invoice #${invoice.number} was created`,
        status: invoice.status
      });
    });

    // Add recent payments
    payments.slice(0, 10).forEach(payment => {
      activities.push({
        type: 'payment',
        id: payment.id,
        date: new Date(payment.date || payment.created_at || Date.now()),
        message: `Payment of $${payment.amount?.toFixed(2)} was recorded for Invoice #${payment.invoice_number || payment.invoice_id}`,
        method: payment.method
      });
    });

    // Sort by date (newest first) and take top 5
    const sortedActivities = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    setRecentActivity(sortedActivities);
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    return `${diffDay} days ago`;
  };

  if (loading) {
    return <LoadingSkeleton type="page" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <select
            className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paid</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${getPercentage(invoiceStatusData.paid, invoiceStatusData.total)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {getPercentage(invoiceStatusData.paid, invoiceStatusData.total)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${getPercentage(invoiceStatusData.pending, invoiceStatusData.total)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {getPercentage(invoiceStatusData.pending, invoiceStatusData.total)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${getPercentage(invoiceStatusData.overdue, invoiceStatusData.total)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {getPercentage(invoiceStatusData.overdue, invoiceStatusData.total)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credit Card</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${getPercentage(paymentMethodData.credit_card, paymentMethodData.total)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {getPercentage(paymentMethodData.credit_card, paymentMethodData.total)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bank Transfer</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${getPercentage(paymentMethodData.bank_transfer, paymentMethodData.total)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {getPercentage(paymentMethodData.bank_transfer, paymentMethodData.total)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Other</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-full bg-gray-500 rounded-full"
                      style={{ width: `${getPercentage(
                        paymentMethodData.cash + paymentMethodData.check + paymentMethodData.paypal + paymentMethodData.other,
                        paymentMethodData.total
                      )}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {getPercentage(
                      paymentMethodData.cash + paymentMethodData.check + paymentMethodData.paypal + paymentMethodData.other,
                      paymentMethodData.total
                    )}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                      activity.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;