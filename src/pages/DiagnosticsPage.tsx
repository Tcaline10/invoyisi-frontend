import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { checkSupabaseConnection, checkSupabaseTables } from '../utils/supabaseCheck';
import { supabase } from '../services/api';

const DiagnosticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    authenticated: boolean;
    error?: string;
    userId?: string;
  } | null>(null);
  
  const [tablesStatus, setTablesStatus] = useState<{
    success: boolean;
    tables: Record<string, boolean>;
    error?: string;
  } | null>(null);
  
  const [envVariables, setEnvVariables] = useState<{
    supabaseUrl: string;
    supabaseKeyLength: number;
  }>({
    supabaseUrl: '',
    supabaseKeyLength: 0
  });
  
  const runDiagnostics = async () => {
    setLoading(true);
    
    try {
      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      setEnvVariables({
        supabaseUrl,
        supabaseKeyLength: supabaseKey.length
      });
      
      // Check connection
      const connectionResult = await checkSupabaseConnection();
      setConnectionStatus(connectionResult);
      
      // Check tables
      if (connectionResult.connected) {
        const tablesResult = await checkSupabaseTables();
        setTablesStatus(tablesResult);
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (error) {
        console.error('Sign in error:', error);
        alert(`Sign in failed: ${error.message}`);
      } else {
        alert('Sign in successful!');
        runDiagnostics();
      }
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      alert(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supabase Diagnostics</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={runDiagnostics}
          disabled={loading}
          icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
        >
          {loading ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Supabase URL</h3>
              <div className="flex items-center mt-1">
                {envVariables.supabaseUrl ? (
                  <>
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    <span className="text-sm text-gray-900">{envVariables.supabaseUrl}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-red-500 mr-2" />
                    <span className="text-sm text-red-600">Missing VITE_SUPABASE_URL</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Supabase Anon Key</h3>
              <div className="flex items-center mt-1">
                {envVariables.supabaseKeyLength > 0 ? (
                  <>
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    <span className="text-sm text-gray-900">
                      Present (length: {envVariables.supabaseKeyLength})
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-red-500 mr-2" />
                    <span className="text-sm text-red-600">Missing VITE_SUPABASE_ANON_KEY</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !connectionStatus ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw size={24} className="animate-spin text-blue-500 mr-2" />
              <span>Checking connection...</span>
            </div>
          ) : connectionStatus ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Connection</h3>
                <div className="flex items-center mt-1">
                  {connectionStatus.connected ? (
                    <>
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">Connected to Supabase</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-red-500 mr-2" />
                      <span className="text-sm text-red-600">
                        Failed to connect: {connectionStatus.error || 'Unknown error'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Authentication</h3>
                <div className="flex items-center mt-1">
                  {connectionStatus.authenticated ? (
                    <>
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        Authenticated (User ID: {connectionStatus.userId})
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-red-500 mr-2" />
                      <span className="text-sm text-red-600">Not authenticated</span>
                    </>
                  )}
                </div>
                
                {!connectionStatus.authenticated && connectionStatus.connected && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleSignIn}
                  >
                    Sign In (Test User)
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-red-600">
              <AlertCircle size={24} className="mx-auto mb-2" />
              <p>Failed to check connection status</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {tablesStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tablesStatus.tables).map(([table, exists]) => (
                <div key={table} className="flex items-center">
                  {exists ? (
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                  ) : (
                    <AlertCircle size={16} className="text-red-500 mr-2" />
                  )}
                  <span className="text-sm">
                    {table}: {exists ? 'Accessible' : 'Not accessible'}
                  </span>
                </div>
              ))}
              
              {tablesStatus.error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {tablesStatus.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosticsPage;
