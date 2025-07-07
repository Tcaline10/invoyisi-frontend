import React, { useState } from 'react';
import { Download, FileText, Table, BarChart3, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import ExportInvoice from '../components/Export/ExportInvoice';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { exportService } from '../services/exportService';
import { useToast } from '../contexts/ToastContext';
import { Invoice } from '../types';

const ExportReports: React.FC = () => {
  const { invoices, loading } = useInvoices();
  const { clients } = useClients();
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const { showToast } = useToast();

  // Filter invoices based on selected criteria
  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus !== 'all' && invoice.status !== filterStatus) return false;
    if (filterClient !== 'all' && invoice.client_id !== filterClient) return false;
    
    if (dateRange !== 'all') {
      const invoiceDate = new Date(invoice.issued_date);
      const now = new Date();
      
      switch (dateRange) {
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return invoiceDate >= lastMonth && invoiceDate < thisMonth;
        case 'last_3_months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          return invoiceDate >= threeMonthsAgo;
        case 'this_year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          return invoiceDate >= yearStart;
        default:
          return true;
      }
    }
    
    return true;
  });

  const handleQuickExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (filteredInvoices.length === 0) {
      showToast('warning', 'No invoices to export');
      return;
    }

    try {
      if (format === 'excel') {
        await exportService.exportAndDownloadExcel(filteredInvoices);
      } else if (format === 'csv') {
        const csvData = exportService.exportAsCSV(
          filteredInvoices.map(invoice => ({
            'Invoice Number': invoice.number,
            'Client Name': invoice.client?.name || 'N/A',
            'Issue Date': new Date(invoice.issued_date).toLocaleDateString(),
            'Due Date': new Date(invoice.due_date).toLocaleDateString(),
            'Status': invoice.status,
            'Subtotal': invoice.subtotal,
            'Tax': invoice.tax || 0,
            'Total': invoice.total,
            'Notes': invoice.notes || ''
          })),
          ['Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total', 'Notes']
        );
        const blob = new Blob([csvData], { type: 'text/csv' });
        exportService.downloadBlob(blob, `invoices-export-${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        showToast('info', 'PDF export for multiple invoices - use the detailed export modal');
        setShowExportModal(true);
        setSelectedInvoices(filteredInvoices);
        return;
      }
      
      showToast('success', `${format.toUpperCase()} export completed successfully`);
    } catch (error) {
      showToast('error', `Failed to export ${format.toUpperCase()}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'viewed': 'bg-purple-100 text-purple-800',
      'paid': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const exportStats = {
    total: filteredInvoices.length,
    totalValue: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
    pending: filteredInvoices.filter(inv => ['sent', 'viewed'].includes(inv.status)).length,
    overdue: filteredInvoices.filter(inv => inv.status === 'overdue').length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center">
            <Download className="mr-3 h-7 w-7 text-blue-900" />
            Export & Reports
          </h1>
          <p className="text-black mt-1">
            Export your invoice data and generate comprehensive reports
          </p>
        </div>
      </div>

      {/* Export Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-black">{exportStats.total}</p>
              <p className="text-sm text-black">Total Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-black">${exportStats.totalValue.toLocaleString()}</p>
              <p className="text-sm text-black">Total Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{exportStats.paid}</p>
              <p className="text-sm text-black">Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{exportStats.pending}</p>
              <p className="text-sm text-black">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{exportStats.overdue}</p>
              <p className="text-sm text-black">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Status</label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Client</label>
              <Select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Date Range</label>
              <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="all">All Time</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="this_year">This Year</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickExport('excel')}
              icon={<Table className="h-4 w-4" />}
              fullWidth
            >
              Export to Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickExport('csv')}
              icon={<Table className="h-4 w-4" />}
              fullWidth
            >
              Export to CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedInvoices(filteredInvoices);
                setShowExportModal(true);
              }}
              icon={<FileText className="h-4 w-4" />}
              fullWidth
            >
              Advanced Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Filtered Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
              <p className="text-black mt-2">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-black">No invoices match the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.slice(0, 50).map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{invoice.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{invoice.client?.name || 'No client'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {new Date(invoice.issued_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">${invoice.total.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInvoices.length > 50 && (
                <div className="text-center py-4">
                  <p className="text-sm text-black">
                    Showing first 50 of {filteredInvoices.length} invoices
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Modal */}
      <ExportInvoice
        invoices={selectedInvoices}
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setSelectedInvoices([]);
        }}
      />
    </div>
  );
};

export default ExportReports;
