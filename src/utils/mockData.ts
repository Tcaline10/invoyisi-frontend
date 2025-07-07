import {
  Client, Invoice, InvoiceStatus,
  DashboardStats, MonthlyRevenue
} from '../types';

// Helper function to generate a random date within a range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate a random number within a range
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Generate mock clients
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, New York, NY 10001',
    company: 'Acme Corporation',
    notes: 'Major client with multiple ongoing projects',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-06-20'),
  },
  {
    id: 'client-2',
    name: 'TechCorp Solutions',
    email: 'info@techcorp.com',
    phone: '+1 (555) 987-6543',
    address: '456 Tech Blvd, San Francisco, CA 94105',
    company: 'TechCorp Solutions',
    notes: 'Prefers email communication',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-07-05'),
  },
  {
    id: 'client-3',
    name: 'Global Innovations Ltd',
    email: 'contact@globalinnovations.com',
    phone: '+1 (555) 456-7890',
    address: '789 Innovation Way, Boston, MA 02110',
    company: 'Global Innovations Ltd',
    notes: undefined,
    createdAt: new Date('2023-03-22'),
    updatedAt: new Date('2023-05-18'),
  },
  {
    id: 'client-4',
    name: 'Modern Designs Inc',
    email: 'hello@moderndesigns.com',
    phone: '+1 (555) 234-5678',
    address: '321 Design St, Austin, TX 78701',
    company: 'Modern Designs Inc',
    notes: 'Quarterly billing cycle',
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2023-08-12'),
  },
  {
    id: 'client-5',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 345-6789',
    address: '567 Maple Ave, Chicago, IL 60601',
    company: undefined,
    notes: 'Freelance client',
    createdAt: new Date('2023-05-17'),
    updatedAt: new Date('2023-07-30'),
  },
  {
    id: 'client-6',
    name: 'Robert Smith Consulting',
    email: 'robert@smithconsulting.com',
    phone: '+1 (555) 876-5432',
    address: '890 Consulting Rd, Seattle, WA 98101',
    company: 'Robert Smith Consulting',
    notes: undefined,
    createdAt: new Date('2023-06-08'),
    updatedAt: new Date('2023-08-25'),
  },
  {
    id: 'client-7',
    name: 'EcoFriendly Solutions',
    email: 'info@ecofriendly.com',
    phone: '+1 (555) 567-8901',
    address: '432 Green St, Portland, OR 97201',
    company: 'EcoFriendly Solutions',
    notes: 'Environmentally conscious company',
    createdAt: new Date('2023-07-14'),
    updatedAt: new Date('2023-09-02'),
  },
  {
    id: 'client-8',
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    phone: '+1 (555) 678-9012',
    address: '765 Oak St, Denver, CO 80202',
    company: undefined,
    notes: undefined,
    createdAt: new Date('2023-08-03'),
    updatedAt: new Date('2023-09-10'),
  },
  {
    id: 'client-9',
    name: 'Creative Studios LLC',
    email: 'hello@creativestudios.com',
    phone: '+1 (555) 789-0123',
    address: '987 Creative Ln, Los Angeles, CA 90001',
    company: 'Creative Studios LLC',
    notes: 'Monthly retainer agreement',
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-09-15'),
  },
  {
    id: 'client-10',
    name: 'Financial Advisors Group',
    email: 'contact@financialadvisors.com',
    phone: '+1 (555) 890-1234',
    address: '654 Finance Ave, Miami, FL 33101',
    company: 'Financial Advisors Group',
    notes: 'Annual contract review in December',
    createdAt: new Date('2023-10-05'),
    updatedAt: new Date('2023-10-20'),
  }
];

// Define possible invoice statuses
const statuses: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

// Generate mock invoices
export const mockInvoices: Invoice[] = Array.from({ length: 20 }).map((_, index) => {
  const issuedDate = randomDate(new Date(2023, 0, 1), new Date());
  const dueDate = new Date(issuedDate);
  dueDate.setDate(dueDate.getDate() + randomNumber(7, 30));

  const items = Array.from({ length: randomNumber(1, 5) }).map((_, itemIndex) => {
    const quantity = randomNumber(1, 10);
    const unitPrice = randomNumber(50, 500);

    return {
      id: `item-${index}-${itemIndex}`,
      description: `Service ${itemIndex + 1}`,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 10; // 10%
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    id: `invoice-${index + 1}`,
    number: `INV-${String(index + 1).padStart(3, '0')}`,
    clientId: `client-${randomNumber(1, 10)}`,
    issuedDate,
    dueDate,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes: index % 3 === 0 ? `Notes for invoice ${index + 1}` : undefined,
    status: statuses[randomNumber(0, statuses.length - 1)],
    paymentMethod: index % 4 === 0 ? 'Credit Card' : index % 4 === 1 ? 'Bank Transfer' : undefined,
    createdAt: issuedDate,
    updatedAt: issuedDate,
  };
});

// Generate monthly revenue data
const revenueMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const mockMonthlyRevenue: MonthlyRevenue[] = revenueMonths.map((month) => ({
  month,
  amount: randomNumber(5000, 20000),
}));

// Generate dashboard stats
export const mockDashboardData: DashboardStats = {
  totalPaid: 56789.50,
  totalDue: 12456.75,
  overdue: 3250.00,
  upcoming: 9206.75,
  recentInvoices: mockInvoices.slice(0, 5),
  monthlyRevenue: mockMonthlyRevenue,
};