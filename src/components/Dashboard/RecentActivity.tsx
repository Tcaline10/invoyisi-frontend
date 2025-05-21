import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, User, Calendar, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { invoiceService, paymentService, clientService } from '../../services/api';
import { formatDate, formatCurrency, formatTimeAgo } from '../../utils/formatters';

interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'client';
  title: string;
  description: string;
  date: Date;
  amount?: number;
  status?: string;
}

interface RecentActivityProps {
  limit?: number;
  title?: string;
  showHeader?: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  limit = 5,
  title = "Recent Activity",
  showHeader = true
}) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);

        // Fetch recent invoices, payments, and clients
        const [invoices, payments, clients] = await Promise.all([
          invoiceService.getInvoices(),
          paymentService.getAllPayments(),
          clientService.getClients()
        ]);

        // Process invoices into activity items
        const invoiceActivities = invoices.slice(0, limit).map(invoice => ({
          id: `invoice-${invoice.id}`,
          type: 'invoice' as const,
          title: `Invoice #${invoice.number}`,
          description: `${invoice.status === 'draft' ? 'Created' : 'Updated'} invoice for ${invoice.client?.name || 'Client'}`,
          date: new Date(invoice.created_at),
          amount: invoice.total,
          status: invoice.status
        }));

        // Process payments into activity items
        const paymentActivities = payments.slice(0, limit).map(payment => ({
          id: `payment-${payment.id}`,
          type: 'payment' as const,
          title: `Payment Received`,
          description: `Received payment for Invoice #${payment.invoice_number || payment.invoice_id}`,
          date: new Date(payment.date || payment.created_at),
          amount: payment.amount
        }));

        // Process clients into activity items
        const clientActivities = clients.slice(0, limit).map(client => ({
          id: `client-${client.id}`,
          type: 'client' as const,
          title: client.name,
          description: `Client ${client.created_at === client.updated_at ? 'added' : 'updated'}`,
          date: new Date(client.updated_at || client.created_at)
        }));

        // Combine all activities and sort by date (newest first)
        const allActivities = [...invoiceActivities, ...paymentActivities, ...clientActivities]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, limit);

        setActivities(allActivities);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [limit]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText size={16} className="text-blue-500" />;
      case 'payment':
        return <DollarSign size={16} className="text-green-500" />;
      case 'client':
        return <User size={16} className="text-purple-500" />;
      default:
        return <Calendar size={16} className="text-gray-500" />;
    }
  };

  // Using the imported formatTimeAgo function from utils/formatters

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="flex items-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-3 flex-grow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <Clock size={24} className="mx-auto mb-2" />
          <p>No recent activity found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                {activity.amount && (
                  <span className="ml-2 text-xs font-medium text-gray-500">
                    {formatCurrency(activity.amount)}
                  </span>
                )}
                {activity.status && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.status === 'paid' ? 'bg-green-100 text-green-800' :
                    activity.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400">{formatTimeAgo(activity.date)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!showHeader) {
    return renderContent();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
