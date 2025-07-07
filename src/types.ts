// Client type
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string; // maps to company_name in DB
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string; // Not in DB schema, but used in frontend
}

// Invoice status type
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';

// Invoice item type
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  invoice_id: string;
  created_at?: string; // Not in DB schema, but used in frontend
  updated_at?: string; // Not in DB schema, but used in frontend
}

// Invoice type
export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax?: number; // This is the 'tax' field in the DB
  discount?: number; // This is the 'discount' field in the DB
  total: number;
  notes?: string;
  client_id: string;
  user_id: string;
  client?: Partial<Client>; // For joined queries
  items?: InvoiceItem[];
  payments?: Payment[]; // For joined queries
  created_at: string;
  updated_at?: string; // This is in the DB schema
}

// Payment type
export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
  invoice_id: string;
  user_id: string;
  created_at: string;
  updated_at?: string; // Not in DB schema, but used in frontend
}

// User type
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string; // Not in DB schema, but used in frontend
}

// Dashboard stats type
export interface DashboardStats {
  totalPaid: number;
  totalDue: number;
  overdue: number;
  upcoming: number;
  recentInvoices: Invoice[];
  monthlyRevenue: MonthlyRevenue[];
}

// Monthly revenue type
export interface MonthlyRevenue {
  month: string;
  amount: number;
}

// Recurring invoice frequency type
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Recurring invoice type
export interface RecurringInvoice {
  id: string;
  name: string;
  frequency: RecurringFrequency;
  next_date: string;
  last_sent?: string;
  template: {
    items: {
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }[];
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    notes?: string;
  };
  active: boolean;
  client_id: string;
  client?: Partial<Client>; // For joined queries
  user_id: string;
  created_at: string;
  updated_at?: string;
}
