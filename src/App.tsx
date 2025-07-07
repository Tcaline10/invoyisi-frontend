import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ToastProvider from './contexts/ToastContext';
import ThemeProvider from './contexts/ThemeContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SuspenseWrapper from './components/ui/SuspenseWrapper';

// Lazy load components to improve initial load time
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const RecordPaymentPage = lazy(() => import('./pages/RecordPaymentPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
// RecurringPage is deprecated, using RecurringInvoicesPage instead
const RecurringInvoicesPage = lazy(() => import('./pages/RecurringInvoicesPage'));
const DocumentProcessingPage = lazy(() => import('./pages/DocumentProcessingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const DiagnosticsPage = lazy(() => import('./pages/DiagnosticsPage'));
const SignInPage = lazy(() => import('./pages/AuthPages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/AuthPages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages/ForgotPasswordPage'));
const TestingPage = lazy(() => import('./pages/TestingPage'));
const AICategorization = lazy(() => import('./pages/AICategorization'));
const ExportReports = lazy(() => import('./pages/ExportReports'));
const MultiCurrency = lazy(() => import('./pages/MultiCurrency'));

// App content component that uses the auth context
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();



  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-gray-600">Loading your account...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Home page - show to everyone, redirect authenticated users to dashboard */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/app/dashboard" replace /> : (
          <Suspense fallback={<div>Loading...</div>}>
            <HomePage />
          </Suspense>
        )
      } />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/signin" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SignInPage />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SignUpPage />
          </Suspense>
        } />
        <Route path="/forgot-password" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordPage />
          </Suspense>
        } />
      </Route>

      {/* Public Routes */}
      <Route path="/about" element={
        <Suspense fallback={<div>Loading...</div>}>
          <AboutPage />
        </Suspense>
      } />
      <Route path="/diagnostics" element={
        <Suspense fallback={<div>Loading...</div>}>
          <DiagnosticsPage />
        </Suspense>
      } />
      <Route path="/testing" element={
        <Suspense fallback={<div>Loading...</div>}>
          <TestingPage />
        </Suspense>
      } />

      {/* Protected Routes */}
      <Route path="/app" element={
        isAuthenticated ? <MainLayout /> : <Navigate to="/signin" replace />
      }>
        {/* Dashboard route */}
        <Route path="dashboard" element={
          <Suspense fallback={<div>Loading dashboard...</div>}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="invoices" element={
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicesPage />
          </Suspense>
        } />
        <Route path="invoices/new" element={
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicesPage />
          </Suspense>
        } />
        <Route path="invoices/filter/:filter" element={
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicesPage />
          </Suspense>
        } />
        <Route path="invoices/:id/:action" element={
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicesPage />
          </Suspense>
        } />
        <Route path="invoices/:id" element={
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicesPage />
          </Suspense>
        } />
        <Route path="clients" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ClientsPage />
          </Suspense>
        } />
        <Route path="clients/new" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ClientsPage />
          </Suspense>
        } />
        <Route path="clients/:id" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ClientsPage />
          </Suspense>
        } />
        <Route path="clients/:id/:action" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ClientsPage />
          </Suspense>
        } />
        <Route path="payments" element={
          <Suspense fallback={<div>Loading...</div>}>
            <PaymentsPage />
          </Suspense>
        } />
        <Route path="payments/new" element={
          <Suspense fallback={<div>Loading...</div>}>
            <RecordPaymentPage />
          </Suspense>
        } />
        <Route path="reports" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ReportsPage />
          </Suspense>
        } />
        {/* Redirect /recurring to /recurring-invoices for backward compatibility */}
        <Route path="recurring" element={<Navigate to="/recurring-invoices" replace />} />

        {/* Recurring Invoices Routes */}
        <Route path="recurring-invoices" element={
          <Suspense fallback={<div>Loading...</div>}>
            <RecurringInvoicesPage />
          </Suspense>
        } />
        <Route path="recurring-invoices/new" element={
          <Suspense fallback={<div>Loading...</div>}>
            <RecurringInvoicesPage />
          </Suspense>
        } />
        <Route path="recurring-invoices/:id" element={
          <Suspense fallback={<div>Loading...</div>}>
            <RecurringInvoicesPage />
          </Suspense>
        } />
        <Route path="recurring-invoices/:id/:action" element={
          <Suspense fallback={<div>Loading...</div>}>
            <RecurringInvoicesPage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<div>Loading...</div>}>
            <SettingsPage />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ProfilePage />
          </Suspense>
        } />
        <Route path="documents" element={
          <Suspense fallback={<div>Loading...</div>}>
            <DocumentProcessingPage />
          </Suspense>
        } />
        <Route path="ai-categorization" element={
          <Suspense fallback={<div>Loading...</div>}>
            <AICategorization />
          </Suspense>
        } />
        <Route path="export" element={
          <Suspense fallback={<div>Loading...</div>}>
            <ExportReports />
          </Suspense>
        } />
        <Route path="currency" element={
          <Suspense fallback={<div>Loading...</div>}>
            <MultiCurrency />
          </Suspense>
        } />
      </Route>

      {/* Redirect any unknown routes to dashboard or home */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/app/dashboard" : "/"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;