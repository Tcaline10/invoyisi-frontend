import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { RecurringInvoice } from '../types';
import { invoiceService } from '../services/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import useFetch from '../hooks/useFetch';
import { useToast } from '../contexts/ToastContext';

// Lazy load components to improve performance
const RecurringInvoicesList = lazy(() => import('../components/RecurringInvoices/RecurringInvoicesList'));
const RecurringInvoiceForm = lazy(() => import('../components/RecurringInvoices/RecurringInvoiceForm'));
const RecurringInvoiceDetail = lazy(() => import('../components/RecurringInvoices/RecurringInvoiceDetail'));

const RecurringInvoicesPage: React.FC = () => {
  const { id, action } = useParams<{ id: string; action: string }>();
  const { showToast } = useToast();

  // Function to fetch recurring invoices
  const fetchRecurringInvoices = useCallback(async () => {
    return await invoiceService.getRecurringInvoices();
  }, []);

  // Use our custom hook for data fetching with caching
  const {
    data: recurringInvoices,
    loading,
    error,
    refetch
  } = useFetch<RecurringInvoice[]>(
    fetchRecurringInvoices,
    {
      initialData: [],
      cacheKey: 'recurring-invoices',
      cacheDuration: 2 * 60 * 1000, // 2 minutes
      onError: (err) => {
        console.error('Error fetching recurring invoices:', err);
        showToast('error', 'Failed to load recurring invoices');
      },
      // Only fetch if we're in list view
      ...(id || action ? { skipInitialFetch: true } : {})
    }
  );

  // Loading fallback for lazy-loaded components
  const ComponentLoadingFallback = () => (
    <LoadingSkeleton type={action === 'new' || (id && action === 'edit') ? 'form' : 'list'} count={5} />
  );

  const renderContent = () => {
    // New recurring invoice form
    if (action === 'new') {
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <RecurringInvoiceForm />
        </Suspense>
      );
    }

    // Edit recurring invoice form
    if (id && action === 'edit') {
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <RecurringInvoiceForm isEditing recurringInvoiceId={id} />
        </Suspense>
      );
    }

    // View recurring invoice details
    if (id && !action) {
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <RecurringInvoiceDetail recurringInvoiceId={id} />
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
        <RecurringInvoicesList
          recurringInvoices={recurringInvoices}
          title="Recurring Invoices"
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

export default RecurringInvoicesPage;
