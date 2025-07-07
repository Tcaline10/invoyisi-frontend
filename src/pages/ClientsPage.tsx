import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientList from '../components/Clients/ClientList';
import ClientForm from '../components/Clients/ClientForm';
import ClientSummary from '../components/Clients/ClientSummary';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Save, Users, ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { clientService, invoiceService } from '../services/api';
import { Client, Invoice } from '../types';
import RecentActivity from '../components/Dashboard/RecentActivity';

const ClientDetail: React.FC<{ clientId: string }> = ({ clientId }) => {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [refreshingInvoices, setRefreshingInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClient(clientId);
      setClient(data);
    } catch (err) {
      console.error('Error fetching client:', err);
      setError('Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientInvoices = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshingInvoices(true);
      } else {
        setInvoicesLoading(true);
      }

      // Get all invoices and filter by client_id
      const allInvoices = await invoiceService.getInvoices();
      console.log('All invoices:', allInvoices);

      // Filter invoices for this client
      // Check both client_id and clientId fields to handle potential type inconsistencies
      const filteredInvoices = allInvoices.filter(invoice => {
        // Convert both to strings for comparison to handle potential type mismatches
        const invoiceClientId = String(invoice.client_id || invoice.clientId || '');
        const currentClientId = String(clientId || '');

        console.log(`Comparing invoice client ID: ${invoiceClientId} with current client ID: ${currentClientId}`);
        return invoiceClientId === currentClientId;
      });

      console.log('Filtered invoices for client:', filteredInvoices);

      // Sort by date (newest first)
      filteredInvoices.sort((a, b) => {
        const dateA = new Date(b.created_at || b.createdAt || Date.now()).getTime();
        const dateB = new Date(a.created_at || a.createdAt || Date.now()).getTime();
        return dateA - dateB;
      });

      setClientInvoices(filteredInvoices);
      setInvoicesError(null);
    } catch (err) {
      console.error('Error fetching client invoices:', err);
      setInvoicesError('Failed to load client invoices');
    } finally {
      setInvoicesLoading(false);
      setRefreshingInvoices(false);
    }
  };

  const refreshInvoices = () => {
    fetchClientInvoices(true);
  };

  useEffect(() => {
    fetchClient();
    fetchClientInvoices();
  }, [clientId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-900">Loading client details...</h2>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <Users size={48} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-medium text-gray-900">{error || 'Client not found'}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/clients')}
          icon={<ArrowLeft size={16} className="mr-2" />}
        >
          Back to Clients
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{client.name}</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="text-gray-900">{client.email}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Phone:</span>{' '}
                  <span className="text-gray-900">{client.phone || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Company:</span>{' '}
                  <span className="text-gray-900">{client.company_name || client.company || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Address:</span>{' '}
                  <span className="text-gray-900">{client.address}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <p className="text-sm text-gray-700">{client.notes || 'No notes available'}</p>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Client Since</h4>
                <p className="text-sm text-gray-700">{client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button
              variant="secondary"
              onClick={() => navigate(`/invoices/new?client=${client.id}`)}
              icon={<FileText size={16} className="mr-2" />}
            >
              Create Invoice
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/clients')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={() => navigate(`/clients/${client.id}/edit`)}
            >
              Edit Client
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Invoices</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInvoices}
              icon={<RefreshCw size={16} className={refreshingInvoices ? 'animate-spin' : ''} />}
              disabled={refreshingInvoices}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/invoices/new?client=${client.id}`)}
              icon={<FileText size={16} className="mr-2" />}
            >
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : invoicesError ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-red-500">{invoicesError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : clientInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No invoices found for this client.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/invoices/new?client=${client.id}`)}
              >
                Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Invoice #</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Due Date</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientInvoices.map((invoice) => (
                    <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{invoice.number}</td>
                      <td className="px-4 py-2">{new Date(invoice.issued_date || invoice.issuedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{new Date(invoice.due_date || invoice.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">${parseFloat(String(invoice.total)).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {String(invoice.status).charAt(0).toUpperCase() + String(invoice.status).slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}
        </CardContent>
      </Card>

      <ClientSummary clientId={client.id} clientName={client.name} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity showHeader={false} limit={3} />
        </CardContent>
      </Card>
    </div>
  );
};

const ClientsPage: React.FC = () => {
  const { id, action } = useParams<{ id: string; action: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch clients for the list view
    if (!id && !action) {
      fetchClients();
    }
  }, [id, action]);

  const renderContent = () => {
    // New client form
    if (action === 'new') {
      return <ClientForm />;
    }

    // Edit client form
    if (id && action === 'edit') {
      return <ClientForm isEditing />;
    }

    // View client details
    if (id) {
      return <ClientDetail clientId={id} />;
    }

    // Default: list view
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-900">Loading clients...</h2>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-medium text-gray-900">{error}</h2>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return <ClientList clients={clients} onRefresh={fetchClients} isLoading={loading} />;
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
};

export default ClientsPage;