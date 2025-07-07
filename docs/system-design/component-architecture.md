# I-Invoyisi: Component Architecture

## Overview

This document outlines the component architecture for the I-Invoyisi frontend application. The application is built using React with TypeScript and follows a modular component-based architecture.

## Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── AuthenticatedLayout
│       │   ├── Sidebar
│       │   ├── Header
│       │   ├── Main Content Area
│       │   └── UserGuideButton
│       └── UnauthenticatedLayout
│           ├── Navbar
│           └── Main Content Area
├── ToastProvider
└── ThemeProvider
```

## Component Structure

The application follows a modular component structure organized by feature and type:

```
src/
├── components/         # Shared components used across features
│   ├── ui/             # Basic UI components (buttons, inputs, etc.)
│   ├── layout/         # Layout components
│   ├── forms/          # Form-related components
│   ├── data-display/   # Components for displaying data
│   ├── feedback/       # Feedback components (alerts, toasts, etc.)
│   ├── navigation/     # Navigation components
│   └── UserGuide/      # User guide components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── clients/        # Client management pages
│   ├── invoices/       # Invoice management pages
│   ├── payments/       # Payment management pages
│   ├── documents/      # Document processing pages
│   ├── reports/        # Reporting pages
│   └── settings/       # Settings pages
├── services/           # API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Core Components

#### App

The root component that sets up the application structure, including providers and routing.

```tsx
// App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
```

#### MainLayout

The main layout component for authenticated users, including sidebar, header, and content area.

```tsx
// layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Navigation/Sidebar';
import Header from '../components/Navigation/Header';
import UserGuideButton from '../components/UserGuide/UserGuideButton';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 z-20 transition-all duration-300 transform lg:transform-none lg:opacity-100 lg:relative lg:flex ${
        sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'
      }`}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
        
        <div className="fixed bottom-6 right-6 z-10">
          <UserGuideButton />
        </div>
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default MainLayout;
```

### Feature Components

#### Dashboard

The dashboard component displays key financial metrics and visualizations.

```tsx
// pages/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { MetricCard } from '../../components/data-display/MetricCard';
import { RevenueChart } from '../../components/data-display/RevenueChart';
import { InvoiceStatusChart } from '../../components/data-display/InvoiceStatusChart';
import { RecentInvoices } from '../../components/data-display/RecentInvoices';
import { dashboardService } from '../../services/dashboardService';
import { DashboardMetrics } from '../../types/dashboard';
import { Loader } from '../../components/ui/Loader';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Paid" 
          value={metrics.total_paid} 
          type="currency" 
          trend={metrics.paid_trend} 
          icon="dollar" 
          color="green" 
        />
        <MetricCard 
          title="Total Unpaid" 
          value={metrics.total_unpaid} 
          type="currency" 
          trend={metrics.unpaid_trend} 
          icon="clock" 
          color="amber" 
        />
        <MetricCard 
          title="Overdue" 
          value={metrics.total_overdue} 
          type="currency" 
          trend={metrics.overdue_trend} 
          icon="alert" 
          color="red" 
        />
        <MetricCard 
          title="Upcoming" 
          value={metrics.upcoming_due} 
          type="currency" 
          trend={metrics.upcoming_trend} 
          icon="calendar" 
          color="blue" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Revenue</h2>
            <RevenueChart data={metrics.revenue_chart} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Invoice Status</h2>
            <InvoiceStatusChart data={metrics.invoice_counts} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
          <RecentInvoices invoices={metrics.recent_invoices} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
```

#### InvoiceForm

The invoice form component for creating and editing invoices.

```tsx
// components/forms/InvoiceForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent } from '../ui/Card';
import { clientService } from '../../services/clientService';
import { invoiceService } from '../../services/invoiceService';
import { Client, Invoice, InvoiceItem } from '../../types';

// Form schema definition with Zod
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be at least 0'),
  amount: z.number().optional(),
});

const invoiceSchema = z.object({
  client_id: z.number().min(1, 'Client is required'),
  issued_date: z.date(),
  due_date: z.date(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'unpaid', 'paid', 'overdue']),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax: z.number().min(0, 'Tax must be at least 0'),
  discount: z.number().min(0, 'Discount must be at least 0'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Invoice;
  onSubmit: (data: InvoiceFormValues) => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      client_id: 0,
      issued_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: '',
      status: 'draft',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
      tax: 0,
      discount: 0,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  // Watch form values for calculations
  const items = watch('items');
  const tax = watch('tax');
  const discount = watch('discount');
  
  // Calculate subtotal and total
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);
  
  const total = subtotal + (tax || 0) - (discount || 0);
  
  // Update item amounts when quantity or unit_price changes
  useEffect(() => {
    items.forEach((item, index) => {
      const amount = (item.quantity || 0) * (item.unit_price || 0);
      setValue(`items.${index}.amount`, amount);
    });
  }, [items, setValue]);
  
  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientService.getClients();
        setClients(data);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, []);
  
  const handleFormSubmit = (data: InvoiceFormValues) => {
    onSubmit(data);
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Client and dates section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <Select
                {...register('client_id', { valueAsNumber: true })}
                disabled={loading}
                error={errors.client_id?.message}
              >
                <option value={0}>Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <DatePicker
                name="issued_date"
                control={control}
                error={errors.issued_date?.message}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <DatePicker
                name="due_date"
                control={control}
                error={errors.due_date?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Items section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Items</h3>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Description"
                    error={errors.items?.[index]?.description?.message}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Qty"
                    error={errors.items?.[index]?.quantity?.message}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    error={errors.items?.[index]?.unit_price?.message}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={items[index]?.amount?.toFixed(2) || '0.00'}
                    readOnly
                    disabled
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    X
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
            >
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Totals section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Textarea
                {...register('notes')}
                rows={4}
                placeholder="Invoice notes, payment terms, etc."
              />
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select {...register('status')}>
                  <option value="draft">Draft</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Tax:</span>
                <div className="w-32">
                  <Input
                    {...register('tax', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    error={errors.tax?.message}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Discount:</span>
                <div className="w-32">
                  <Input
                    {...register('discount', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    error={errors.discount?.message}
                  />
                </div>
              </div>
              
              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;
```

## Component Design Patterns

### 1. Container/Presentational Pattern

Components are separated into container components (which handle data fetching and state) and presentational components (which focus on rendering UI).

Example:
- `InvoiceListContainer`: Fetches invoice data and manages state
- `InvoiceList`: Renders the list of invoices based on props

### 2. Compound Components

Related components are grouped together to provide a cohesive API.

Example:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Invoice Details</CardTitle>
    <CardDescription>View and manage invoice information</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content goes here */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### 3. Render Props

Components that use render props to allow for flexible rendering.

Example:
```tsx
<DataTable
  data={invoices}
  renderItem={(invoice) => (
    <InvoiceRow
      key={invoice.id}
      invoice={invoice}
      onView={() => handleViewInvoice(invoice.id)}
      onEdit={() => handleEditInvoice(invoice.id)}
      onDelete={() => handleDeleteInvoice(invoice.id)}
    />
  )}
/>
```

### 4. Higher-Order Components (HOCs)

HOCs are used to add functionality to components.

Example:
```tsx
const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) return <Loader />;
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    return <Component {...props} />;
  };
};

const ProtectedPage = withAuth(DashboardPage);
```

### 5. Custom Hooks

Custom hooks encapsulate and reuse stateful logic.

Example:
```tsx
// hooks/useInvoices.ts
export const useInvoices = (filters = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const data = await invoiceService.getInvoices(filters);
        setInvoices(data);
        setError(null);
      } catch (err) {
        setError('Failed to load invoices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, [filters]);
  
  return { invoices, loading, error };
};
```

## State Management

### 1. React Context

React Context is used for global state management, including:

- **AuthContext**: Manages user authentication state
- **ToastContext**: Manages toast notifications
- **ThemeContext**: Manages theme preferences

### 2. React Query

React Query is used for server state management, providing:

- Data fetching and caching
- Background updates
- Optimistic updates
- Error handling

### 3. Form State

Form state is managed using React Hook Form, which provides:

- Form validation
- Field arrays
- Form submission handling
- Error handling

## Styling Approach

The application uses Tailwind CSS for styling, with:

1. **Utility-First Approach**: Using Tailwind's utility classes for most styling
2. **Component Abstractions**: Creating reusable UI components that encapsulate Tailwind classes
3. **Responsive Design**: Using Tailwind's responsive modifiers for different screen sizes
4. **Theme Customization**: Extending Tailwind's theme with custom colors and other design tokens

## Performance Optimizations

1. **Code Splitting**: Using React.lazy and Suspense for code splitting
2. **Memoization**: Using React.memo, useMemo, and useCallback to prevent unnecessary re-renders
3. **Virtualization**: Using virtualized lists for large data sets
4. **Image Optimization**: Optimizing images for different screen sizes and resolutions
5. **Bundle Size Optimization**: Minimizing bundle size through tree shaking and proper imports
