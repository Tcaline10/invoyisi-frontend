import { useState, useEffect } from 'react';
import { Client } from '../types';
import { clientService } from '../services/api';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      // Set empty array as fallback
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshClients = () => {
    fetchClients();
  };

  const addClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => 
      prev.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  };

  const removeClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    refreshClients,
    addClient,
    updateClient,
    removeClient
  };
};
