import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, Users, MoreHorizontal,
  Edit, Trash2, FileText, Mail, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Client } from '../../types';
import AddClientModal from './AddClientModal';
import AddInvoiceModal from '../Invoices/AddInvoiceModal';

interface ClientListProps {
  clients: Client[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  onRefresh,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);

  const toggleMenu = (clientId: string) => {
    setActiveClient(activeClient === clientId ? null : clientId);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowAddClientModal(true)}
          >
            New Client
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
                placeholder="Search clients..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                icon={<Filter size={16} />}
              >
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                onClick={onRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="bg-white border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar size="sm" name={client.name} />
                        <span className="ml-2 font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{client.email}</td>
                    <td className="px-4 py-3 text-gray-500">{client.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{client.company || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(client.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleMenu(client.id)}
                      >
                        <MoreHorizontal size={16} />
                      </Button>

                      {activeClient === client.id && (
                        <div className="absolute right-4 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                          <div className="py-1">
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => navigate(`/clients/${client.id}`)}
                            >
                              <Users size={16} className="mr-2" />
                              View
                            </button>
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => navigate(`/clients/${client.id}/edit`)}
                            >
                              <Edit size={16} className="mr-2" />
                              Edit
                            </button>
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                setActiveClient(null);
                                setShowAddInvoiceModal(true);
                              }}
                            >
                              <FileText size={16} className="mr-2" />
                              New Invoice
                            </button>
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Mail size={16} className="mr-2" />
                              Email
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
                ))}

                {filteredClients.length === 0 && (
                  <tr className="bg-white">
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Users size={24} className="mx-auto mb-2 text-gray-400" />
                      <p>No clients found</p>
                      <p className="text-sm">Try adjusting your search or create a new client</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
      />

      <AddInvoiceModal
        isOpen={showAddInvoiceModal}
        onClose={() => setShowAddInvoiceModal(false)}
      />
    </>
  );
};

export default ClientList;