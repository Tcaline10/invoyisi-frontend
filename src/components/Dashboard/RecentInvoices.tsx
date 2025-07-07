import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { ArrowRight } from 'lucide-react';
import { Invoice } from '../../types';

interface RecentInvoicesProps {
  invoices: Invoice[];
}

const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: any; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    sent: { variant: 'info', label: 'Sent' },
    viewed: { variant: 'primary', label: 'Viewed' },
    paid: { variant: 'success', label: 'Paid' },
    overdue: { variant: 'danger', label: 'Overdue' },
    cancelled: { variant: 'warning', label: 'Cancelled' },
  };

  const { variant, label } = statusMap[status] || { variant: 'default', label: status };

  return <Badge variant={variant}>{label}</Badge>;
};

const RecentInvoices: React.FC<RecentInvoicesProps> = ({ invoices }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Invoices</CardTitle>
        <button
          className="text-sm text-blue-900 font-medium flex items-center hover:underline"
          onClick={() => navigate('/invoices')}
        >
          View All <ArrowRight size={14} className="ml-1" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <div className="flex items-center">
                <Avatar size="sm" name={`Client ${invoice.clientId}`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Invoice #{invoice.number}</p>
                  <p className="text-xs text-gray-500">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${invoice.total.toFixed(2)}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentInvoices;