import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Invoice } from '../types';
import { invoiceService } from '../services/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import useFetch from '../hooks/useFetch';
import { useToast } from '../contexts/ToastContext';
import { RefreshCw } from 'lucide-react';

// Lazy load components to improve performance
const InvoiceList = lazy(() => import('../components/Invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('../components/Invoices/InvoiceForm'));
const InvoiceDetail = lazy(() => import('../components/Invoices/InvoiceDetail'));

const InvoicesPage: React.FC = () => {
  const { id, action, filter } = useParams<{ id: string; action: string; filter: string }>();
  const { showToast } = useToast();

  // Function to fetch invoices with the current filter
  const fetchInvoices = useCallback(async () => {
    const filters = filter ? { status: filter } : undefined;
    return await invoiceService.getInvoices(filters);
  }, [filter]);

  // Use our custom hook for data fetching with caching
  const {
    data: invoices,
    loading,
    error,
    refetch
  } = useFetch<Invoice[]>(
    fetchInvoices,
    {
      initialData: [],
      cacheKey: `invoices-${filter || 'all'}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
      onError: (err) => {
        console.error('Error fetching invoices:', err);
        showToast('error', 'Failed to load invoices');
      },
      // Only fetch if we're in list view
      ...(id || action ? { skipInitialFetch: true } : {})
    }
  );

  const getFilteredInvoices = () => {
    if (!filter) return invoices;

    return invoices.filter(invoice => {
      switch (filter) {
        case 'draft':
          return invoice.status === 'draft';
        case 'unpaid':
          return invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue';
        case 'paid':
          return invoice.status === 'paid';
        default:
          return true;
      }
    });
  };

  const getTitle = () => {
    if (!filter) return 'All Invoices';

    switch (filter) {
      case 'draft':
        return 'Draft Invoices';
      case 'unpaid':
        return 'Unpaid Invoices';
      case 'paid':
        return 'Paid Invoices';
      default:
        return 'All Invoices';
    }
  };

  // Loading fallback for lazy-loaded components
  const ComponentLoadingFallback = () => (
    <LoadingSkeleton type={action === 'new' || (id && action === 'edit') ? 'form' : 'list'} count={5} />
  );

  const renderContent = () => {
    // Handle filter parameter from the route
    if (filter && ['draft', 'unpaid', 'paid'].includes(filter)) {
      // Use the filter parameter
      const filterValue = filter;

      // Filter invoices by the status
      const filteredInvoices = invoices.filter(invoice => {
        switch (filterValue) {
          case 'draft':
            return invoice.status === 'draft';
          case 'unpaid':
            return invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue';
          case 'paid':
            return invoice.status === 'paid';
          default:
            return true;
        }
      });

      // Get the title based on the filter
      const title = (() => {
        switch (filterValue) {
          case 'draft':
            return 'Draft Invoices';
          case 'unpaid':
            return 'Unpaid Invoices';
          case 'paid':
            return 'Paid Invoices';
          default:
            return 'All Invoices';
        }
      })();

      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <InvoiceList
            invoices={filteredInvoices}
            title={title}
            onRefresh={refetch}
            isLoading={loading}
          />
        </Suspense>
      );
    }

    // New invoice form
    if (action === 'new') {
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <InvoiceForm />
        </Suspense>
      );
    }

    // Edit invoice form
    if (id && action === 'edit') {
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <InvoiceForm isEditing invoiceId={id} />
        </Suspense>
      );
    }

    // View invoice details
    if (id && !action) {
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <InvoiceDetail invoiceId={id} />
        </Suspense>
      );
    }

    // Default: list view
    if (loading) {
      return <LoadingSkeleton type="list" count={5} />;
    }

    if (error) {
      return (
        <ErrorDisplay
          error={error.message}
          onRetry={refetch}
          className="py-12"
        />
      );
    }

    return (
      <Suspense fallback={<ComponentLoadingFallback />}>
        <InvoiceList
          invoices={getFilteredInvoices()}
          title={getTitle()}
          onRefresh={refetch}
          isLoading={loading}
        />
      </Suspense>
    );
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
};

export default InvoicesPage;