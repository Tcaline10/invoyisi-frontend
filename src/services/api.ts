import axios from 'axios';
import { Client, Invoice, InvoiceItem, Payment, RecurringInvoice } from '../types';
import { supabase } from '../lib/supabase';

// Re-export the supabase client so other modules can import it from here
export { supabase };

// Add clientsCache to window object
declare global {
  interface Window {
    clientsCache?: {
      [key: string]: {
        data: any;
        timestamp: number;
      };
    };
    // Add global environment variables for TypeScript
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  }
}

// Hardcoded values as fallbacks - using proper URL format
const FALLBACK_URL = 'https://yaijujxifenvhgztyhkk.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaWp1anhpZmVudmhnenR5aGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NjIwNzksImV4cCI6MjA2MTAzODA3OX0.E62QYq-PzcKwv3TKYW5GvkV_E_8jQMaiUdtjZOgOb8o';

// Use the same URL and key as in lib/supabase.ts
const supabaseUrl = FALLBACK_URL;
const supabaseAnonKey = FALLBACK_KEY;

// Log the values for debugging
console.log('Supabase URL (api):', supabaseUrl);
console.log('Supabase Key Length (api):', supabaseAnonKey?.length || 0);

// Create an axios instance for API calls
const api = axios.create({
  baseURL: supabaseUrl + '/rest/v1',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    'Accept': '*/*', // Accept any content type
    'Prefer': 'return=representation'
  },
});

// Add a request interceptor to include the token in requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get the token from localStorage first (faster)
      let token = localStorage.getItem('supabase.auth.token');

      // Log for debugging
      console.log('Token from localStorage:', token ? 'Found (length: ' + token.length + ')' : 'Not found');

      // If not in localStorage, get it from Supabase
      if (!token) {
        console.log('Getting session from Supabase...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        const session = data.session;
        console.log('Session from Supabase:', session ? 'Found' : 'Not found');

        if (session) {
          token = session.access_token;
          // Store for future use
          localStorage.setItem('supabase.auth.token', token);
          console.log('Stored new token in localStorage');
        }
      }

      // Always ensure we have the required headers
      config.headers = {
        ...config.headers,
        'apikey': supabaseAnonKey,
        'Accept': '*/*',
        'Prefer': 'return=representation'
      };

      // Set Content-Type if not already set
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      // Add Authorization header if we have a token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header');
      } else {
        console.log('No token available for Authorization header');
      }

      return config;
    } catch (err) {
      console.error('Error in request interceptor:', err);
      // Return the config anyway to prevent the request from failing
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Login with email and password
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // Register a new user
  async register(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // Logout the current user
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  // Get current user
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
};

// Client service
export const clientService = {
  // Get all clients with caching
  async getClients() {
    // Use a simple in-memory cache to improve performance
    const cacheKey = 'clients_list';
    const cacheDuration = 5 * 60 * 1000; // 5 minutes

    // Check if we have cached data
    const cachedData = window.clientsCache?.[cacheKey];
    if (cachedData && (Date.now() - cachedData.timestamp < cacheDuration)) {
      console.log('Using cached clients data');
      return cachedData.data;
    }

    console.log('Fetching fresh clients data');
    let clientsData = [];

    try {
      // Get the current user
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        console.error('No authenticated user found');
        return []; // Return empty array instead of throwing to prevent app crashes
      }

      const userId = userData.user.id;

      // Fetch clients with a simple query
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        return []; // Return empty array instead of throwing to prevent app crashes
      }

      clientsData = data || [];

      // Convert the data to match our Client type
      const formattedData = clientsData.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        company: client.company_name, // Map company_name to company for compatibility
        company_name: client.company_name, // Keep the original field
        notes: client.notes,
        user_id: client.user_id,
        created_at: client.created_at,
        updated_at: client.created_at // Using created_at as updated_at since it's not in the schema
      })) as Client[];

      // Cache the result
      if (!window.clientsCache) window.clientsCache = {};
      window.clientsCache[cacheKey] = {
        data: formattedData,
        timestamp: Date.now()
      };

      return formattedData;
    } catch (err) {
      console.error('Error in getClients:', err);
      return []; // Return empty array instead of throwing to prevent app crashes
    }
  },

  // Get a client by ID
  async getClient(id: string) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }

    // Convert the data to match our Client type
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      company: data.company_name, // Map company_name to company for compatibility
      company_name: data.company_name, // Keep the original field
      notes: data.notes,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.created_at // Using created_at as updated_at since it's not in the schema
    } as Client;
  },

  // Create a new client
  async createClient(clientData: Partial<Client>) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Convert the data to match the database schema
    const dbClientData = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      company_name: clientData.company_name || clientData.company, // Use company_name if available, otherwise use company
      notes: clientData.notes,
      user_id: user.user.id
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([dbClientData])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    // Convert the data to match our Client type
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      company: data.company_name, // Map company_name to company for compatibility
      company_name: data.company_name, // Keep the original field
      notes: data.notes,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.created_at // Using created_at as updated_at since it's not in the schema
    } as Client;
  },

  // Update a client
  async updateClient(id: string, clientData: Partial<Client>) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Convert the data to match the database schema
    const dbClientData = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      company_name: clientData.company_name || clientData.company, // Use company_name if available, otherwise use company
      notes: clientData.notes
    };

    const { data, error } = await supabase
      .from('clients')
      .update(dbClientData)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }

    // Convert the data to match our Client type
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      company: data.company_name, // Map company_name to company for compatibility
      company_name: data.company_name, // Keep the original field
      notes: data.notes,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.created_at // Using created_at as updated_at since it's not in the schema
    } as Client;
  },

  // Delete a client
  async deleteClient(id: string) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }

    return true;
  }
};

// Invoice service
export const invoiceService = {
  // Get all invoices
  async getInvoices(filters?: any) {
    // Import cache
    const cache = (await import('../utils/cacheUtils')).default;

    // Create a cache key based on the filters
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    const cacheKey = `invoices_${filterKey}`;

    // Check if we have cached data
    const cachedData = cache.get<Invoice[]>(cacheKey);
    if (cachedData) {
      console.log('Using cached invoice data');
      return cachedData;
    }

    console.log('Fetching fresh invoice data');
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email)
      `)
      .eq('user_id', user.user.id);

    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    // Convert the data to match our Invoice type
    const invoices = data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status as any,
      issued_date: invoice.issued_date,
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      tax: invoice.tax, // Use 'tax' field directly from the database
      discount: invoice.discount || 0, // Use discount field from the database
      total: invoice.total,
      notes: invoice.notes,
      client_id: invoice.client_id,
      user_id: invoice.user_id,
      client: invoice.client ? {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email
      } : undefined,
      created_at: invoice.created_at,
      updated_at: invoice.created_at // Using created_at as updated_at since it's not in the schema
    })) as Invoice[];

    // Cache the result for 2 minutes
    cache.set(cacheKey, invoices, 2 * 60 * 1000);

    return invoices;
  },

  // Get an invoice by ID
  async getInvoice(id: string) {
    // Validate id exists
    if (!id) {
      throw new Error('Invalid invoice ID');
    }

    // Check if id is a filter keyword rather than an actual ID
    if (['draft', 'unpaid', 'paid'].includes(id)) {
      throw new Error(`"${id}" is a filter keyword, not an invoice ID`);
    }

    // Use the ID as is (should be a UUID)
    const invoiceId = id;

    // Import cache
    const cache = (await import('../utils/cacheUtils')).default;

    // Create a cache key for this invoice
    const cacheKey = `invoice_${invoiceId}`;

    // Check if we have cached data
    const cachedData = cache.get<Invoice>(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for invoice ${invoiceId}`);
      return cachedData;
    }

    console.log(`Fetching fresh data for invoice ${invoiceId}`);
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, address, company_name)
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.user.id)
      .single();

    if (invoiceError) {
      console.error(`Error fetching invoice ${id}:`, invoiceError);
      throw invoiceError;
    }

    // Get the invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('id', { ascending: true });

    if (itemsError) {
      console.error(`Error fetching items for invoice ${id}:`, itemsError);
      throw itemsError;
    }

    // Convert the data to match our Invoice type
    const invoiceData = {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status as any,
      issued_date: invoice.issued_date,
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      tax: invoice.tax, // Use 'tax' field directly from the database
      discount: invoice.discount || 0, // Use discount field from the database
      total: invoice.total,
      notes: invoice.notes,
      client_id: invoice.client_id,
      user_id: invoice.user_id,
      client: invoice.client ? {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
        company: invoice.client.company_name
      } : undefined,
      items: items ? items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        invoice_id: item.invoice_id
      })) : [],
      created_at: invoice.created_at,
      updated_at: invoice.created_at // Using created_at as updated_at since it's not in the schema
    } as Invoice;

    // Cache the result for 5 minutes
    cache.set(cacheKey, invoiceData, 5 * 60 * 1000);

    return invoiceData;
  },

  // Create a new invoice
  async createInvoice(invoiceData: any) {
    try {
      // Import cache
      const cache = (await import('../utils/cacheUtils')).default;

      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!invoiceData.number) {
        throw new Error('Invoice number is required');
      }
      if (!invoiceData.client_id) {
        throw new Error('Client is required');
      }
      if (!invoiceData.issued_date) {
        throw new Error('Issue date is required');
      }
      if (!invoiceData.due_date) {
        throw new Error('Due date is required');
      }

      // Ensure numeric values are properly formatted
      const subtotal = parseFloat(invoiceData.subtotal) || 0;
      const taxAmount = parseFloat(invoiceData.tax) || 0;
      const total = parseFloat(invoiceData.total) || 0;

      // Convert the data to match the database schema
      const dbInvoiceData = {
        number: invoiceData.number,
        status: invoiceData.status || 'draft',
        issued_date: invoiceData.issued_date,
        due_date: invoiceData.due_date,
        subtotal: subtotal,
        tax: taxAmount, // Use 'tax' to match the actual database schema
        discount: invoiceData.discount || 0, // Include discount field
        total: total,
        notes: invoiceData.notes || '',
        client_id: invoiceData.client_id,
        user_id: user.user.id
      };

      console.log('Creating invoice with data:', dbInvoiceData);

      // Start a transaction
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([dbInvoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      // Create invoice items
      if (invoiceData.items && invoiceData.items.length > 0) {
        // Validate and format items
        const items = invoiceData.items.map((item: any) => ({
          description: item.description || 'Item',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          amount: parseFloat(item.amount) || 0,
          invoice_id: invoice.id
        }));

        console.log('Creating invoice items:', items);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);

          // If items fail, delete the invoice to avoid orphaned invoices
          await supabase.from('invoices').delete().eq('id', invoice.id);

          throw new Error(`Failed to create invoice items: ${itemsError.message}`);
        }
      }

      // Clear the invoices cache since we've added a new invoice
      // This ensures the invoice list will be refreshed on the next fetch
      cache.remove('invoices_all');

      // If there are any filtered caches, clear those too
      Object.keys(cache).forEach(key => {
        if (key.startsWith('invoices_')) {
          cache.remove(key);
        }
      });

      // Return the created invoice
      const createdInvoice = {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        issued_date: invoice.issued_date,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal,
        tax: invoice.tax, // Use 'tax' directly from the database
        discount: invoice.discount || 0,
        total: invoice.total,
        notes: invoice.notes,
        client_id: invoice.client_id,
        user_id: invoice.user_id,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at || invoice.created_at
      } as Invoice;

      // Cache the new invoice
      cache.set(`invoice_${invoice.id}`, createdInvoice, 5 * 60 * 1000);

      console.log('Successfully created invoice:', createdInvoice);
      return createdInvoice;
    } catch (error) {
      console.error('Error in createInvoice:', error);
      throw error;
    }
  },

  // Update an invoice
  async updateInvoice(id: string, invoiceData: any) {
    try {
      // Import cache
      const cache = (await import('../utils/cacheUtils')).default;

      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!invoiceData.number) {
        throw new Error('Invoice number is required');
      }
      if (!invoiceData.client_id) {
        throw new Error('Client is required');
      }
      if (!invoiceData.issued_date) {
        throw new Error('Issue date is required');
      }
      if (!invoiceData.due_date) {
        throw new Error('Due date is required');
      }

      // Ensure numeric values are properly formatted
      const subtotal = parseFloat(invoiceData.subtotal) || 0;
      const taxAmount = parseFloat(invoiceData.tax) || 0;
      const total = parseFloat(invoiceData.total) || 0;

      // Convert the data to match the database schema
      const dbInvoiceData = {
        number: invoiceData.number,
        status: invoiceData.status || 'draft',
        issued_date: invoiceData.issued_date,
        due_date: invoiceData.due_date,
        subtotal: subtotal,
        tax: taxAmount, // Use 'tax' to match the actual database schema
        discount: invoiceData.discount || 0, // Include discount field
        total: total,
        notes: invoiceData.notes || '',
        client_id: invoiceData.client_id
      };

      console.log('Updating invoice with data:', dbInvoiceData);

      // Update the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(dbInvoiceData)
        .eq('id', id)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (invoiceError) {
        console.error(`Error updating invoice ${id}:`, invoiceError);
        throw new Error(`Failed to update invoice: ${invoiceError.message}`);
      }

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) {
        console.error(`Error deleting items for invoice ${id}:`, deleteError);
        throw new Error(`Failed to update invoice items: ${deleteError.message}`);
      }

      // Create new items
      if (invoiceData.items && invoiceData.items.length > 0) {
        // Validate and format items
        const items = invoiceData.items.map((item: any) => ({
          description: item.description || 'Item',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          amount: parseFloat(item.amount) || 0,
          invoice_id: id
        }));

        console.log('Updating invoice items:', items);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);
          throw new Error(`Failed to update invoice items: ${itemsError.message}`);
        }
      }

      // Clear the specific invoice cache
      cache.remove(`invoice_${id}`);

      // Clear the invoices list cache since we've updated an invoice
      cache.remove('invoices_all');

      // If there are any filtered caches, clear those too
      Object.keys(cache).forEach(key => {
        if (key.startsWith('invoices_')) {
          cache.remove(key);
        }
      });

      // Return the updated invoice
      const updatedInvoice = {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        issued_date: invoice.issued_date,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal,
        tax: invoice.tax, // Use 'tax' directly from the database
        discount: invoice.discount || 0,
        total: invoice.total,
        notes: invoice.notes,
        client_id: invoice.client_id,
        user_id: invoice.user_id,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at || invoice.created_at
      } as Invoice;

      // Cache the updated invoice
      cache.set(`invoice_${id}`, updatedInvoice, 5 * 60 * 1000);

      console.log('Successfully updated invoice:', updatedInvoice);
      return updatedInvoice;
    } catch (error) {
      console.error(`Error in updateInvoice for invoice ${id}:`, error);
      throw error;
    }
  },

  // Delete an invoice
  async deleteInvoice(id: string) {
    // Import cache
    const cache = (await import('../utils/cacheUtils')).default;

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }

    // Clear the specific invoice cache
    cache.remove(`invoice_${id}`);

    // Clear the invoices list cache since we've deleted an invoice
    cache.remove('invoices_all');

    // If there are any filtered caches, clear those too
    Object.keys(cache).forEach(key => {
      if (key.startsWith('invoices_')) {
        cache.remove(key);
      }
    });

    return true;
  },

  // Get all recurring invoices
  async getRecurringInvoices() {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Get all recurring invoices for this user with client info
      const { data: recurringInvoices, error } = await supabase
        .from('recurring_invoices')
        .select(`
          *,
          client:clients(id, name, email, phone, address, company_name)
        `)
        .eq('user_id', user.user.id)
        .order('next_date', { ascending: true });

      if (error) {
        console.error('Error fetching recurring invoices:', error);
        throw error;
      }

      // Map the data to match our RecurringInvoice type
      return recurringInvoices.map(invoice => ({
        ...invoice,
        client: invoice.client ? {
          ...invoice.client,
          company: invoice.client.company_name // Map company_name to company for frontend
        } : undefined
      }));
    } catch (err) {
      console.error('Error in getRecurringInvoices:', err);
      // If the table doesn't exist yet, return an empty array
      if (err.code === '42P01') { // undefined_table
        console.log('Recurring invoices table may not exist yet:', err);
        return [];
      }
      throw err;
    }
  },

  // Get a recurring invoice by ID
  async getRecurringInvoice(id: string) {
    if (!id) {
      throw new Error('Invalid recurring invoice ID');
    }

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Get the recurring invoice
    const { data: invoice, error } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, address, company_name)
      `)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      console.error(`Error fetching recurring invoice ${id}:`, error);
      throw error;
    }

    // Map the data to match our RecurringInvoice type
    return {
      ...invoice,
      client: invoice.client ? {
        ...invoice.client,
        company: invoice.client.company_name // Map company_name to company for frontend
      } : undefined
    };
  },

  // Create a new recurring invoice
  async createRecurringInvoice(data: Partial<RecurringInvoice>) {
    try {
      console.log('Creating recurring invoice with data:', data);
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Ensure client_id is an integer if it's a string
      let clientId = data.client_id;
      if (typeof clientId === 'string') {
        // Try to convert to integer if it's a numeric string
        const parsedId = parseInt(clientId, 10);
        if (!isNaN(parsedId)) {
          clientId = parsedId;
        }
      }

      // Add user_id to the data and ensure client_id is properly formatted
      const recurringInvoiceData = {
        ...data,
        client_id: clientId,
        user_id: user.user.id
      };

      console.log('Formatted recurring invoice data:', recurringInvoiceData);

      // Insert the recurring invoice
      const { data: newRecurringInvoice, error } = await supabase
        .from('recurring_invoices')
        .insert(recurringInvoiceData)
        .select()
        .single();

      if (error) {
        console.error('Error creating recurring invoice:', error);
        throw error;
      }

      console.log('Successfully created recurring invoice:', newRecurringInvoice);
      return newRecurringInvoice;
    } catch (err) {
      console.error('Error in createRecurringInvoice:', err);
      throw err;
    }
  },

  // Update a recurring invoice
  async updateRecurringInvoice(id: string, data: Partial<RecurringInvoice>) {
    try {
      console.log(`Updating recurring invoice ${id} with data:`, data);
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Ensure client_id is an integer if it's a string
      let updateData = { ...data };
      if (data.client_id && typeof data.client_id === 'string') {
        // Try to convert to integer if it's a numeric string
        const parsedId = parseInt(data.client_id, 10);
        if (!isNaN(parsedId)) {
          updateData.client_id = parsedId;
        }
      }

      // Update the recurring invoice
      const { data: updatedRecurringInvoice, error } = await supabase
        .from('recurring_invoices')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating recurring invoice ${id}:`, error);
        throw error;
      }

      console.log('Successfully updated recurring invoice:', updatedRecurringInvoice);
      return updatedRecurringInvoice;
    } catch (err) {
      console.error(`Error in updateRecurringInvoice for invoice ${id}:`, err);
      throw err;
    }
  },

  // Delete a recurring invoice
  async deleteRecurringInvoice(id: string) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Delete the recurring invoice
    const { error } = await supabase
      .from('recurring_invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) {
      console.error(`Error deleting recurring invoice ${id}:`, error);
      throw error;
    }

    return true;
  },

  // Generate an invoice from a recurring invoice template
  async generateInvoiceFromRecurring(recurringInvoiceId: string) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Get the recurring invoice
    const recurringInvoice = await this.getRecurringInvoice(recurringInvoiceId);

    if (!recurringInvoice) {
      throw new Error('Recurring invoice not found');
    }

    // Get the next invoice number
    const { data: settings } = await supabase
      .from('invoice_settings')
      .select('invoice_prefix, next_invoice_number')
      .eq('user_id', user.user.id)
      .single();

    const prefix = settings?.invoice_prefix || 'INV-';
    const nextNumber = settings?.next_invoice_number || 1001;
    const invoiceNumber = `${prefix}${nextNumber}`;

    // Create the new invoice from the template
    const newInvoice = {
      number: invoiceNumber,
      status: 'draft',
      issued_date: new Date().toISOString().split('T')[0],
      due_date: this.calculateDueDate(new Date(), 30), // Default to 30 days
      subtotal: recurringInvoice.template.subtotal,
      tax: recurringInvoice.template.tax || 0,
      discount: recurringInvoice.template.discount || 0,
      total: recurringInvoice.template.total,
      notes: recurringInvoice.template.notes,
      client_id: recurringInvoice.client_id,
      user_id: user.user.id
    };

    // Insert the new invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(newInvoice)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice from recurring template:', invoiceError);
      throw invoiceError;
    }

    // Insert the invoice items
    const invoiceItems = recurringInvoice.template.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
      invoice_id: invoice.id
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Error creating invoice items from recurring template:', itemsError);
      throw itemsError;
    }

    // Update the recurring invoice with the new next_date and last_sent
    const nextDate = this.calculateNextDate(
      recurringInvoice.next_date,
      recurringInvoice.frequency
    );

    await this.updateRecurringInvoice(recurringInvoiceId, {
      next_date: nextDate,
      last_sent: new Date().toISOString().split('T')[0]
    });

    // Update the invoice settings with the new next_invoice_number
    if (settings) {
      await supabase
        .from('invoice_settings')
        .update({ next_invoice_number: nextNumber + 1 })
        .eq('user_id', user.user.id);
    }

    return invoice;
  },

  // Helper function to calculate the next date based on frequency
  calculateNextDate(currentDate: string, frequency: string) {
    const date = new Date(currentDate);

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date.toISOString().split('T')[0];
  },

  // Helper function to calculate due date
  calculateDueDate(issuedDate: Date, dueDays: number) {
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + dueDays);
    return dueDate.toISOString().split('T')[0];
  }
};

// Payment service
export const paymentService = {
  // Get all payments
  async getAllPayments() {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Check if the payments table exists
      const { error: tableCheckError } = await supabase
        .from('payments')
        .select('id')
        .limit(1);

      // If the payments table doesn't exist yet, return an empty array
      if (tableCheckError) {
        console.warn('Payments table may not exist yet:', tableCheckError);
        return [];
      }

      // Use a simpler query first to avoid potential join issues
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      // Process the data with default values for missing fields
      return data.map(payment => ({
        ...payment,
        invoice_number: payment.invoice_number || `INV-${payment.invoice_id}`,
        client_name: payment.client_name || 'Client',
        status: payment.status || 'completed' // Default to completed if status is not set
      })) as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Get all payments for an invoice
  async getPayments(invoiceId: string) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Check if the payments table exists
    const { error: tableCheckError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);

    // If the payments table doesn't exist yet, return an empty array
    if (tableCheckError) {
      console.warn('Payments table may not exist yet:', tableCheckError);
      return [];
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching payments for invoice ${invoiceId}:`, error);
      throw error;
    }

    return data as Payment[];
  },

  // Create a new payment
  async createPayment(paymentData: Partial<Payment>) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // First, check if the invoice exists and belongs to the user
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, status, total')
      .eq('id', paymentData.invoice_id)
      .eq('user_id', user.user.id)
      .single();

    if (invoiceError) {
      console.error(`Error fetching invoice ${paymentData.invoice_id}:`, invoiceError);
      throw new Error('Invoice not found or access denied');
    }

    // Create the payment
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          amount: paymentData.amount,
          date: paymentData.date,
          method: paymentData.method,
          reference: paymentData.reference,
          notes: paymentData.notes,
          invoice_id: paymentData.invoice_id,
          user_id: user.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

    // Get total payments for this invoice
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', paymentData.invoice_id);

    if (paymentsError) {
      console.error(`Error fetching payments for invoice ${paymentData.invoice_id}:`, paymentsError);
    } else {
      // Calculate total paid amount
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

      // Update invoice status based on payment amount
      let newStatus = invoice.status;
      if (totalPaid >= invoice.total) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      // Update the invoice status if needed
      if (newStatus !== invoice.status) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: newStatus })
          .eq('id', paymentData.invoice_id);

        if (updateError) {
          console.error(`Error updating invoice status:`, updateError);
        }
      }
    }

    return data as Payment;
  },

  // Delete a payment
  async deletePayment(id: string) {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // First, get the payment to find the invoice_id
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('invoice_id, amount')
      .eq('id', id)
      .single();

    if (paymentError) {
      console.error(`Error fetching payment ${id}:`, paymentError);
      throw paymentError;
    }

    // Delete the payment
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting payment ${id}:`, error);
      throw error;
    }

    // Update the invoice status if needed
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, status, total')
      .eq('id', payment.invoice_id)
      .single();

    if (invoiceError) {
      console.error(`Error fetching invoice ${payment.invoice_id}:`, invoiceError);
    } else {
      // Get remaining payments for this invoice
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id);

      if (paymentsError) {
        console.error(`Error fetching payments for invoice ${payment.invoice_id}:`, paymentsError);
      } else {
        // Calculate total paid amount
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        // Update invoice status based on payment amount
        let newStatus = invoice.status;
        if (totalPaid === 0) {
          if (invoice.status === 'paid' || invoice.status === 'partial') {
            newStatus = 'sent';
          }
        } else if (totalPaid < invoice.total) {
          newStatus = 'partial';
        }

        // Update the invoice status if needed
        if (newStatus !== invoice.status) {
          const { error: updateError } = await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', payment.invoice_id);

          if (updateError) {
            console.error(`Error updating invoice status:`, updateError);
          }
        }
      }
    }

    return true;
  }
};

// User service
export const userService = {
  // Get user profile
  async getProfile() {
    try {
      // Get the current user from auth
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User not authenticated');
      }

      // Get user profile data from the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle(); // Use maybeSingle to avoid errors if no record exists

      // If no user record exists yet, create one
      if (!userData) {
        console.log('No user profile found, creating one...');

        // Create a new user profile
        const newUserData = {
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: authData.user.user_metadata?.full_name || '',
          avatar_url: authData.user.user_metadata?.avatar_url || '',
        };

        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert([newUserData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          throw insertError;
        }

        return {
          ...newUserData,
          phone: '',
          location: '',
          bio: '',
          company_name: '',
        };
      }

      // Combine auth user data with profile data
      return {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: userData?.full_name || authData.user.user_metadata?.full_name || '',
        phone: userData?.phone || '',
        location: userData?.location || '',
        bio: userData?.bio || '',
        company_name: userData?.company_name || '',
        avatar_url: userData?.avatar_url || authData.user.user_metadata?.avatar_url || '',
      };
    } catch (err) {
      console.error('Error loading profile:', err);
      throw err;
    }
  },

  // Update user profile
  async updateProfile(profileData: any) {
    try {
      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        console.error('Auth error or no user found:', authError);
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;

      // Create a clean profile object with only the fields we need
      const profileObject = {
        id: userId,
        email: authData.user.email,
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        bio: profileData.bio || '',
        company_name: profileData.company_name || '',
        avatar_url: profileData.avatar_url || ''
      };

      // Use upsert operation (insert with on_conflict do update)
      const { data, error } = await supabase
        .from('users')
        .upsert(profileObject, {
          onConflict: 'id',
          returning: 'representation'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user profile:', error);
        throw error;
      }

      // Update auth metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url
          }
        });
      } catch (authUpdateErr) {
        console.error('Error updating auth metadata:', authUpdateErr);
        // Don't throw here, just log the error
      }

      return data;
    } catch (err) {
      console.error('Error in updateProfile:', err);
      throw err;
    }
  },

  // Upload avatar
  async uploadAvatar(file: File) {
    try {
      // Get the current user
      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) {
        throw new Error('User not authenticated');
      }

      // Validate file size
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size exceeds 2MB limit');
      }

      // Create a unique file name with proper extension
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;

      console.log('Uploading file to avatars bucket:', fileName);

      // Try to upload directly without checking bucket existence
      // If the bucket doesn't exist, we'll handle the error
      try {
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });

        if (uploadError) {
          // If the error is because the bucket doesn't exist, we'll try to create it
          if (uploadError.message?.includes('bucket') || uploadError.statusCode === 404) {
            console.log('Bucket might not exist, trying to create it...');

            // Try to create the bucket
            const { error: createError } = await supabase
              .storage
              .createBucket('avatars', {
                public: true,
                fileSizeLimit: 2 * 1024 * 1024 // 2MB
              });

            if (createError) {
              console.error('Error creating avatars bucket:', createError);
              throw createError;
            }

            // Try uploading again after creating the bucket
            const { data: retryData, error: retryError } = await supabase
              .storage
              .from('avatars')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
              });

            if (retryError) {
              console.error('Error uploading avatar after bucket creation:', retryError);
              throw retryError;
            }
          } else {
            console.error('Error uploading avatar:', uploadError);
            throw uploadError;
          }
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('Upload successful, public URL:', publicUrl);

        return publicUrl;
      } catch (uploadErr) {
        console.error('Final upload error:', uploadErr);
        throw uploadErr;
      }
    } catch (err) {
      console.error('Error in uploadAvatar:', err);
      throw err;
    }
  },

  // Get company data
  async getCompany() {
    try {
      console.log('Fetching company data');

      // Get the current user from auth
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        console.error('Auth error or no user found:', authError);
        return this.getDefaultCompany();
      }

      const userId = authData.user.id;
      console.log('Fetching company data for user:', userId);

      // Get company data if it exists
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (companyError) {
        console.error('Error fetching company data:', companyError);
        return this.getDefaultCompany();
      }

      console.log('Company data fetch result:', companyData);

      // If no company data found, create a default company
      if (!companyData) {
        console.log('No company data found, creating default company');
        return await this.createDefaultCompany(userId);
      }

      return companyData;
    } catch (err) {
      console.error('Error loading company data:', err);
      return this.getDefaultCompany();
    }
  },

  // Helper method to get default company data
  getDefaultCompany() {
    return {
      name: 'Your Company Name',
      email: 'your@company.com',
      phone: '',
      address: '',
      website: '',
      tax_number: ''
    };
  },

  // Helper method to create a default company
  async createDefaultCompany(userId: string) {
    try {
      console.log('Creating default company for user:', userId);

      const defaultCompany = {
        ...this.getDefaultCompany(),
        user_id: userId
      };

      console.log('Default company data to insert:', defaultCompany);

      const { data, error } = await supabase
        .from('companies')
        .insert([defaultCompany])
        .select()
        .single();

      if (error) {
        console.error('Error creating default company:', error);

        // Try a direct approach as fallback
        console.log('Trying direct approach as fallback');

        // Check if the error is a duplicate key violation
        if (error.code === '23505') { // Unique violation
          console.log('Duplicate key violation, fetching existing company');

          // Try to fetch the existing company
          const { data: existingData, error: fetchError } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (fetchError) {
            console.error('Error fetching existing company:', fetchError);
            return defaultCompany;
          }

          console.log('Found existing company:', existingData);
          return existingData;
        }

        return defaultCompany;
      }

      console.log('Default company created successfully:', data);
      return data;
    } catch (err) {
      console.error('Error creating default company:', err);
      return this.getDefaultCompany();
    }
  },

  // Update company data
  async updateCompany(companyData: any) {
    try {
      console.log('updateCompany called with data:', companyData);

      // Create a clean company object with only the fields we need
      const name = companyData.name || 'Your Company Name';
      const logo_url = companyData.logo_url || null;
      const address = companyData.address || '';
      const phone = companyData.phone || '';
      const email = companyData.email || 'your@company.com';
      const website = companyData.website || '';
      const tax_number = companyData.tax_number || '';

      console.log('Clean company data:', {
        name, logo_url, address, phone, email, website, tax_number
      });

      // APPROACH 1: Use the update_company function
      try {
        console.log('Using update_company function');

        const { data: result, error } = await supabase.rpc('update_company', {
          p_name: name,
          p_logo_url: logo_url,
          p_address: address,
          p_phone: phone,
          p_email: email,
          p_website: website,
          p_tax_number: tax_number
        });

        if (error) {
          console.error('Error calling update_company function:', error);
          throw error;
        }

        console.log('Company updated successfully via function:', result);
        return result;
      } catch (funcErr) {
        console.error('Error in update_company function approach:', funcErr);

        // APPROACH 2: Get the current user and use standard Supabase API
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          console.error('Auth error or no user found:', authError);
          throw new Error('User not authenticated');
        }

        const userId = authData.user.id;
        console.log('User ID for company update:', userId);

        // Check if the user already has a company
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        const companyObject = {
          name,
          logo_url,
          address,
          phone,
          email,
          website,
          tax_number,
          user_id: userId
        };

        if (existingCompany?.id) {
          // Update existing company
          console.log('Updating existing company with ID:', existingCompany.id);

          const updateData = { ...companyObject, id: existingCompany.id };
          const { data, error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', existingCompany.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating company:', error);
            throw error;
          }

          console.log('Company updated successfully:', data);
          return data;
        } else {
          // Create new company
          console.log('Creating new company for user:', userId);

          const { data, error } = await supabase
            .from('companies')
            .insert([companyObject])
            .select()
            .single();

          if (error) {
            console.error('Error creating company:', error);
            throw error;
          }

          console.log('Company created successfully:', data);
          return data;
        }
      }
    } catch (err) {
      console.error('Error in updateCompany:', err);
      throw err; // Actually throw the error instead of swallowing it
    }
  },

  // Get invoice settings
  async getInvoiceSettings() {
    try {
      console.log('Fetching invoice settings');

      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        console.error('Auth error or no user found:', authError);
        return this.getDefaultInvoiceSettings();
      }

      const userId = authData.user.id;
      console.log('Fetching invoice settings for user:', userId);

      // Get invoice settings
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching invoice settings:', error);
        return this.getDefaultInvoiceSettings();
      }

      console.log('Invoice settings fetch result:', data);

      // If no settings exist, return default settings
      if (!data) {
        console.log('No invoice settings found, creating default settings');
        return await this.createDefaultInvoiceSettings(userId);
      }

      return data;
    } catch (err) {
      console.error('Exception in getInvoiceSettings:', err);
      return this.getDefaultInvoiceSettings();
    }
  },

  // Helper method to get default invoice settings
  getDefaultInvoiceSettings() {
    return {
      invoice_prefix: 'INV-',
      next_invoice_number: 1001,
      default_due_days: 30,
      default_tax_rate: 0,
      default_currency: 'XAF',
      invoice_footer: 'Thank you for your business!'
    };
  },

  // Helper method to create default invoice settings
  async createDefaultInvoiceSettings(userId: string) {
    try {
      console.log('Creating default invoice settings for user:', userId);

      const defaultSettings = {
        ...this.getDefaultInvoiceSettings(),
        user_id: userId
      };

      console.log('Default invoice settings to insert:', defaultSettings);

      const { data, error } = await supabase
        .from('invoice_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) {
        console.error('Error creating default invoice settings:', error);

        // Check if the error is a duplicate key violation
        if (error.code === '23505') { // Unique violation
          console.log('Duplicate key violation, fetching existing settings');

          // Try to fetch the existing settings
          const { data: existingData, error: fetchError } = await supabase
            .from('invoice_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (fetchError) {
            console.error('Error fetching existing invoice settings:', fetchError);
            return defaultSettings;
          }

          console.log('Found existing invoice settings:', existingData);
          return existingData;
        }

        return defaultSettings;
      }

      console.log('Default invoice settings created successfully:', data);
      return data;
    } catch (err) {
      console.error('Error creating default invoice settings:', err);
      return this.getDefaultInvoiceSettings();
    }
  },

  // Update invoice settings
  async updateInvoiceSettings(settingsData: any) {
    try {
      console.log('updateInvoiceSettings called with data:', settingsData);

      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        console.error('Auth error or no user found:', authError);
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;
      console.log('User ID for invoice settings update:', userId);

      // Create a clean settings object with only the fields we need
      const settingsObject = {
        invoice_prefix: settingsData.invoice_prefix || 'INV-',
        next_invoice_number: settingsData.next_invoice_number || 1001,
        default_due_days: settingsData.default_due_days || 30,
        default_tax_rate: settingsData.default_tax_rate || 0,
        default_currency: settingsData.default_currency || 'XAF',
        invoice_footer: settingsData.invoice_footer || 'Thank you for your business!',
        user_id: userId
      };

      console.log('Clean settings object:', settingsObject);

      // Check if the user already has invoice settings
      const { data: existingSettings, error: checkError } = await supabase
        .from('invoice_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing settings:', checkError);
        throw checkError;
      }

      console.log('Existing settings check result:', existingSettings);

      if (existingSettings?.id) {
        // Update existing settings
        console.log('Updating existing settings with ID:', existingSettings.id);

        const updateData = { ...settingsObject, id: existingSettings.id };
        const { data, error } = await supabase
          .from('invoice_settings')
          .update(updateData)
          .eq('id', existingSettings.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating invoice settings:', error);
          throw error;
        }

        console.log('Invoice settings updated successfully:', data);
        return data;
      } else {
        // Create new settings
        console.log('Creating new invoice settings for user:', userId);

        const { data, error } = await supabase
          .from('invoice_settings')
          .insert([settingsObject])
          .select()
          .single();

        if (error) {
          console.error('Error creating invoice settings:', error);
          throw error;
        }

        console.log('Invoice settings created successfully:', data);
        return data;
      }
    } catch (err) {
      console.error('Error in updateInvoiceSettings:', err);
      throw err;
    }
  },

  // These functions have been moved to the invoiceService object
  // to fix the "invoiceService.getRecurringInvoices is not a function" error
};

export default api;
