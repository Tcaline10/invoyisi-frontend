import { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { invoiceService } from '../services/api';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      // Set empty array as fallback
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshInvoices = () => {
    fetchInvoices();
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
  };

  const removeInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    error,
    refreshInvoices,
    addInvoice,
    updateInvoice,
    removeInvoice
  };
};
