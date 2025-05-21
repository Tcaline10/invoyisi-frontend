import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { AuthProvider } from './contexts/AuthContext';
import ToastProvider from './contexts/ToastContext';
import OnboardingProvider from './contexts/OnboardingContext';
import ThemeProvider from './contexts/ThemeContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { supabase } from './services/api';
import SuspenseWrapper from './components/ui/SuspenseWrapper';

// Lazy load components to improve initial load time
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

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on initial load
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');

        // First check if we have a session in localStorage
        const cachedToken = localStorage.getItem('supabase.auth.token');
        if (cachedToken) {
          console.log('Found cached token, setting authenticated temporarily');
          setIsAuthenticated(true);
          // We'll verify the token with Supabase in the background
        }

        // Log for debugging
        console.log('Getting session from Supabase...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setIsAuthenticated(false);
          localStorage.removeItem('supabase.auth.token');
          setIsLoading(false);
          return;
        }

        // For debugging
        console.log('Session data:', data.session ? 'Session exists' : 'No session');

        // Set authentication state based on session
        setIsAuthenticated(!!data.session);

        // Store the session in localStorage to help with CORS issues
        if (data.session) {
          console.log('Storing session token in localStorage');
          localStorage.setItem('supabase.auth.token', data.session.access_token);

          // Create a user profile if it doesn't exist - but do this in the background
          // to avoid blocking the UI
          setTimeout(() => {
            createUserProfileIfNeeded(data.session.user.id, data.session.user.email,
              data.session.user.user_metadata?.full_name,
              data.session.user.user_metadata?.avatar_url);
          }, 100);
        } else {
          console.log('No session, removing token from localStorage');
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        console.log('Authentication check complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Helper function to create a user profile if it doesn't exist
    const createUserProfileIfNeeded = async (userId, email, fullName = '', avatarUrl = '') => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist, create one
          console.log('Creating user profile for:', userId);

          // Try to insert the user
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              email: email,
              full_name: fullName || '',
              avatar_url: avatarUrl || ''
            }]);

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // The user might already exist, try to update instead
            const { error: updateError } = await supabase
              .from('users')
              .update({
                email: email,
                full_name: fullName || '',
                avatar_url: avatarUrl || ''
              })
              .eq('id', userId);

            if (updateError) {
              console.error('Error updating user profile:', updateError);
            }
          }
        }
      } catch (profileError) {
        console.error('Error checking user profile:', profileError);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);

        // For debugging
        if (session) {
          console.log('User authenticated:', session.user.email);
        } else {
          console.log('User signed out or no session');
        }

        // Update authentication state
        setIsAuthenticated(!!session);

        // Store the session in localStorage to help with CORS issues
        if (session) {
          localStorage.setItem('supabase.auth.token', session.access_token);

          // If this is a new sign-in, create a user profile
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('New sign-in or token refresh, creating/updating user profile');
            // Do this in the background to avoid blocking the UI
            setTimeout(() => {
              createUserProfileIfNeeded(
                session.user.id,
                session.user.email,
                session.user.user_metadata?.full_name,
                session.user.user_metadata?.avatar_url
              );
            }, 100);
          }
        } else {
          console.log('Removing token from localStorage due to auth state change');
          localStorage.removeItem('supabase.auth.token');
        }

        // Always set loading to false after auth state change
        console.log('Auth state change complete, setting isLoading to false');
        setIsLoading(false);
      }
    );

    checkAuth();

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <OnboardingProvider>
              <Routes>
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

          {/* Protected Routes */}
          <Route path="/" element={
            isAuthenticated ? <MainLayout /> : <Navigate to="/signin" replace />
          }>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard as a secondary route */}
            <Route path="dashboard" element={
              <Suspense fallback={<div>Loading dashboard...</div>}>
                <Dashboard />
              </Suspense>
            } />

            {/* Invoice Routes */}
            <Route path="invoices" element={
              <Suspense fallback={<div>Loading invoices...</div>}>
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

            {/* Client Routes */}
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

            {/* Payment Routes */}
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
          </Route>

              {/* Redirect any unknown routes to dashboard or signin */}
              <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/signin"} replace />} />
              </Routes>
            </OnboardingProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;