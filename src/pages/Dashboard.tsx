import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, CreditCard, Calendar, AlertTriangle,
  TrendingUp, Users, FileText, RefreshCw
} from 'lucide-react';
import StatCard from '../components/Dashboard/StatCard';
import RecentInvoices from '../components/Dashboard/RecentInvoices';
import RevenueChart from '../components/Dashboard/RevenueChart';
import InvoiceStatusChart from '../components/Dashboard/InvoiceStatusChart';
import OutstandingPaymentsChart from '../components/Dashboard/OutstandingPaymentsChart';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { DashboardStats, MonthlyRevenue, Invoice } from '../types';
import AddInvoiceModal from '../components/Invoices/AddInvoiceModal';
import AddClientModal from '../components/Clients/AddClientModal';
import { invoiceService } from '../services/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import useFetch from '../hooks/useFetch';
import { useToast } from '../contexts/ToastContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const { showToast } = useToast();

  // Helper function to generate monthly revenue data
  const generateMonthlyRevenue = useCallback((paidInvoices: Invoice[]): MonthlyRevenue[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    // Initialize monthly revenue with 0 for each month
    const monthlyData: Record<string, number> = {};
    months.forEach(month => {
      monthlyData[month] = 0;
    });

    // Sum up revenue by month
    paidInvoices.forEach(invoice => {
      // Use created_at instead of createdAt (fix field name)
      const paymentDate = new Date(invoice.created_at);
      if (paymentDate.getFullYear() === currentYear) {
        const month = months[paymentDate.getMonth()];
        monthlyData[month] += invoice.total;
      }
    });

    // Convert to array format
    return months.map(month => ({
      month,
      amount: monthlyData[month]
    }));
  }, []);

  // Fetch dashboard data with caching
  const fetchDashboardData = useCallback(async () => {
    // Fetch invoices
    const invoices = await invoiceService.getInvoices();

    // Calculate dashboard stats
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const unpaidInvoices = invoices.filter(invoice =>
      invoice.status === 'unpaid' || invoice.status === 'sent' || invoice.status === 'viewed'
    );
    const overdueInvoices = invoices.filter(invoice => {
      // An invoice is overdue if it's unpaid and past the due date
      if (invoice.status !== 'paid' && invoice.status !== 'draft' && invoice.status !== 'cancelled') {
        const dueDate = new Date(invoice.due_date);
        const now = new Date();
        return dueDate < now;
      }
      return false;
    });
    const draftInvoices = invoices.filter(invoice => invoice.status === 'draft');
    const sentInvoices = invoices.filter(invoice => invoice.status === 'sent');
    const viewedInvoices = invoices.filter(invoice => invoice.status === 'viewed');
    const unpaidStatusInvoices = invoices.filter(invoice => invoice.status === 'unpaid');

    const totalPaid = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalDue = unpaidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const overdue = overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    // Calculate upcoming invoices (drafts and invoices due in the next 7 days)
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    // Include all draft invoices in upcoming
    const draftTotal = draftInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    // Also include unpaid invoices due in the next 7 days
    const upcomingDueInvoices = unpaidInvoices.filter(invoice => {
      const dueDate = new Date(invoice.due_date);
      return dueDate >= now && dueDate <= nextWeek;
    });

    const upcomingDueTotal = upcomingDueInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    // Total upcoming is draft + upcoming due
    const upcoming = draftTotal + upcomingDueTotal;

    // Get recent invoices (last 5)
    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Generate monthly revenue data for all statuses
    const paidRevenue = generateMonthlyRevenue(paidInvoices);
    const unpaidRevenue = generateMonthlyRevenue(unpaidInvoices);
    const overdueRevenue = generateMonthlyRevenue(overdueInvoices);
    const draftRevenue = generateMonthlyRevenue(draftInvoices);

    // Combine all revenue data
    const allMonths = new Set([
      ...paidRevenue.map(item => item.month),
      ...unpaidRevenue.map(item => item.month),
      ...overdueRevenue.map(item => item.month),
      ...draftRevenue.map(item => item.month)
    ]);

    // Create a combined monthly revenue array
    const monthlyRevenue = Array.from(allMonths).map(month => {
      const paid = paidRevenue.find(item => item.month === month)?.amount || 0;
      const unpaid = unpaidRevenue.find(item => item.month === month)?.amount || 0;
      const overdue = overdueRevenue.find(item => item.month === month)?.amount || 0;
      const draft = draftRevenue.find(item => item.month === month)?.amount || 0;

      return {
        month,
        amount: paid + unpaid + overdue + draft,
        paid,
        unpaid,
        overdue,
        draft
      };
    }).sort((a, b) => {
      // Sort by month (assuming format is "MMM YYYY")
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }

      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });

    // Generate status counts for pie chart
    const statusCounts = {
      draft: draftInvoices.length,
      sent: sentInvoices.length,
      viewed: viewedInvoices.length,
      unpaid: unpaidStatusInvoices.length,
      paid: paidInvoices.length,
      overdue: overdueInvoices.length
    };

    // Generate outstanding payments data
    const outstandingPayments = overdueInvoices.map(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        name: invoice.client?.name || `Client ${invoice.client_id}`,
        amount: invoice.total,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 1
      };
    });

    return {
      totalPaid,
      totalDue,
      overdue,
      upcoming,
      recentInvoices,
      monthlyRevenue,
      statusCounts,
      outstandingPayments
    } as DashboardStats;
  }, [generateMonthlyRevenue]);

  // Use our custom hook for data fetching with caching
  const {
    data: dashboardData,
    loading,
    error,
    refetch,
    clearCache
  } = useFetch<DashboardStats>(
    fetchDashboardData,
    {
      initialData: {
        totalPaid: 0,
        totalDue: 0,
        overdue: 0,
        upcoming: 0,
        recentInvoices: [],
        monthlyRevenue: [],
        statusCounts: {
          draft: 0,
          sent: 0,
          viewed: 0,
          unpaid: 0,
          paid: 0,
          overdue: 0
        },
        outstandingPayments: []
      },
      cacheKey: 'dashboard-data',
      cacheDuration: 2 * 60 * 1000, // 2 minutes (reduced from 5 minutes)
      onError: (err) => {
        console.error('Error fetching dashboard data:', err);
        showToast('error', 'Failed to load dashboard data');
      }
    }
  );

  const statCards = [
    {
      title: 'Total Paid',
      value: `FCFA${dashboardData.totalPaid.toLocaleString()}`,
      icon: <CreditCard size={20} />,
      change: { value: '12.5%', type: 'increase' as const },
      trend: [30, 35, 45, 40, 50, 65, 70]
    },
    {
      title: 'Total Due',
      value: `FCFA${dashboardData.totalDue.toLocaleString()}`,
      icon: <CreditCard size={20} />,
      change: { value: '5.2%', type: 'decrease' as const },
      trend: [60, 55, 40, 45, 35, 30, 25]
    },
    {
      title: 'Overdue',
      value: `FCFA${dashboardData.overdue.toLocaleString()}`,
      icon: <AlertTriangle size={20} />,
      change: { value: '2.1%', type: 'increase' as const },
      trend: [15, 20, 18, 25, 22, 30, 28]
    },
    {
      title: 'Upcoming',
      value: `FCFA${dashboardData.upcoming.toLocaleString()}`,
      icon: <Calendar size={20} />,
      change: { value: '8.3%', type: 'increase' as const },
      trend: [25, 20, 30, 35, 30, 40, 45]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <select className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Last 30 days</option>
            <option>This Month</option>
            <option>Last Quarter</option>
            <option>This Year</option>
          </select>
          <button
            onClick={() => {
              // Clear cache and refetch fresh data
              clearCache();
              refetch();
              showToast('info', 'Refreshing dashboard data...');
            }}
            className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            title="Refresh dashboard data"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <LoadingSkeleton type="stat" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <LoadingSkeleton type="chart" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <LoadingSkeleton type="list" count={5} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <LoadingSkeleton type="chart" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <LoadingSkeleton type="chart" />
            </div>
          </div>
        </div>
      ) : error ? (
        <ErrorDisplay
          error={error.message}
          onRetry={refetch}
          className="py-12"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                change={card.change}
                trend={card.trend}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={dashboardData.monthlyRevenue} />
            </div>
            <div>
              <RecentInvoices invoices={dashboardData.recentInvoices} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InvoiceStatusChart data={dashboardData.statusCounts} />
            <OutstandingPaymentsChart data={dashboardData.outstandingPayments} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
              onClick={() => setShowAddInvoiceModal(true)}
            >
              <div className="h-12 w-12 bg-blue-900 text-white rounded-full flex items-center justify-center mb-2">
                <FileText size={20} />
              </div>
              <span className="text-sm font-medium text-gray-900">New Invoice</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
              onClick={() => setShowAddClientModal(true)}
            >
              <div className="h-12 w-12 bg-blue-900 text-white rounded-full flex items-center justify-center mb-2">
                <Users size={20} />
              </div>
              <span className="text-sm font-medium text-gray-900">Add Client</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
              onClick={() => navigate('/reports')}
            >
              <div className="h-12 w-12 bg-blue-900 text-white rounded-full flex items-center justify-center mb-2">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-medium text-gray-900">View Reports</span>
            </button>
          </div>
        </div>

        <RecentActivity title="Activity" limit={4} />
      </div>

      {/* Modals */}
      <AddInvoiceModal
        isOpen={showAddInvoiceModal}
        onClose={() => setShowAddInvoiceModal(false)}
      />
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
      />
    </div>
  );
};

export default Dashboard;