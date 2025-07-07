import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Eye, MoreHorizontal, Search,
  Filter, Plus, FileText, Trash2, Edit, Send, RefreshCw,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Invoice, InvoiceStatus } from '../../types';
import AddInvoiceModal from './AddInvoiceModal';
import ExportInvoice from '../Export/ExportInvoice';

interface InvoiceListProps {
  invoices: Invoice[];
  title: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const statusVariants: Record<InvoiceStatus, { variant: any; icon: any }> = {
  draft: { variant: 'default', icon: FileText },
  sent: { variant: 'info', icon: Send },
  viewed: { variant: 'primary', icon: Eye },
  unpaid: { variant: 'warning', icon: FileText },
  paid: { variant: 'success', icon: Download },
  overdue: { variant: 'danger', icon: FileText },
  cancelled: { variant: 'warning', icon: FileText },
};

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, title, onRefresh, isLoading = false }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<string | null>(null);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const itemsPerPage = 10;

  const toggleMenu = (invoiceId: string) => {
    setActiveInvoice(activeInvoice === invoiceId ? null : invoiceId);
  };

  // Filter invoices based on search term and status
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.client?.name && invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Apply status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Get current page items
  const currentInvoices = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Handle page changes
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowAddInvoiceModal(true)}
          >
            New Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when search changes
                }}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(true)}
                icon={<Download size={16} />}
              >
                Export
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  icon={<Filter size={16} />}
                >
                  Filter {statusFilter !== 'all' && '(1)'}
                </Button>

                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                    <div className="py-1">
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setStatusFilter('all');
                          setShowFilterMenu(false);
                        }}
                      >
                        {statusFilter === 'all' && <Check size={16} className="mr-2" />}
                        <span className={statusFilter === 'all' ? 'ml-5' : 'ml-7'}>All</span>
                      </button>
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setStatusFilter('draft');
                          setShowFilterMenu(false);
                        }}
                      >
                        {statusFilter === 'draft' && <Check size={16} className="mr-2" />}
                        <span className={statusFilter === 'draft' ? 'ml-5' : 'ml-7'}>Draft</span>
                      </button>
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setStatusFilter('unpaid');
                          setShowFilterMenu(false);
                        }}
                      >
                        {statusFilter === 'unpaid' && <Check size={16} className="mr-2" />}
                        <span className={statusFilter === 'unpaid' ? 'ml-5' : 'ml-7'}>Unpaid</span>
                      </button>
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setStatusFilter('paid');
                          setShowFilterMenu(false);
                        }}
                      >
                        {statusFilter === 'paid' && <Check size={16} className="mr-2" />}
                        <span className={statusFilter === 'paid' ? 'ml-5' : 'ml-7'}>Paid</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice) => {
                  const StatusIcon = statusVariants[invoice.status]?.icon;

                  return (
                    <tr
                      key={invoice.id}
                      className="bg-white border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        #{invoice.number}
                      </td>
                      <td className="px-4 py-3">{invoice.client?.name || `Client ${invoice.clientId}`}</td>
                      <td className="px-4 py-3">{new Date(invoice.issuedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">${invoice.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariants[invoice.status]?.variant}>
                          <StatusIcon size={12} className="mr-1" />
                          <span className="capitalize">{invoice.status}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleMenu(invoice.id)}
                        >
                          <MoreHorizontal size={16} />
                        </Button>

                        {activeInvoice === invoice.id && (
                          <div className="absolute right-4 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <div className="py-1">
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                              >
                                <Eye size={16} className="mr-2" />
                                View
                              </button>
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                              >
                                <Edit size={16} className="mr-2" />
                                Edit
                              </button>
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Download size={16} className="mr-2" />
                                Download
                              </button>
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <tr className="bg-white">
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                      <p>No invoices found</p>
                      <p className="text-sm">Try adjusting your search or create a new invoice</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {filteredInvoices.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredInvoices.length)}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</span> of{' '}
              <span className="font-medium">{filteredInvoices.length}</span> invoices
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  // If near start, show first 5 pages
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // If near end, show last 5 pages
                  pageNum = totalPages - 4 + i;
                } else {
                  // Otherwise show current page and 2 pages on each side
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <AddInvoiceModal
        isOpen={showAddInvoiceModal}
        onClose={() => setShowAddInvoiceModal(false)}
      />

      <ExportInvoice
        invoices={filteredInvoices}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
};

export default InvoiceList;