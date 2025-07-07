// Type definitions for the application

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone?: string;
  email: string;
  website?: string;
  taxNumber?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  company?: string;
  company_name?: string; // Added for compatibility with database
  notes?: string;
  user_id?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  createdAt?: Date; // For compatibility with old code
  updatedAt?: Date; // For compatibility with old code
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  issuedDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: InvoiceStatus;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'unpaid' | 'paid' | 'overdue' | 'cancelled';

export interface DashboardStats {
  totalPaid: number;
  totalDue: number;
  overdue: number;
  upcoming: number;
  recentInvoices: Invoice[];
  monthlyRevenue: MonthlyRevenue[];
  statusCounts: {
    draft: number;
    sent: number;
    viewed: number;
    unpaid: number;
    paid: number;
    overdue: number;
  };
  outstandingPayments: {
    name: string;
    amount: number;
    daysOverdue: number;
  }[];
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
  paid?: number;
  unpaid?: number;
  overdue?: number;
  draft?: number;
}

export interface RecurringInvoice {
  id: string;
  name: string;
  client_id: string;
  client?: Client;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_date: string;
  last_sent?: string;
  template: {
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    notes?: string;
    items: {
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }[];
  };
  user_id: string;
  created_at: string;
  updated_at: string;
}