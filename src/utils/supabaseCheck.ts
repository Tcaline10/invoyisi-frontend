import { supabase } from '../services/api';

/**
 * Utility to check Supabase connection and authentication
 */
export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  authenticated: boolean;
  error?: string;
  userId?: string;
}> => {
  try {
    // Check if we can connect to Supabase
    const { data: healthData, error: healthError } = await supabase.from('_health').select('*').limit(1);
    
    if (healthError) {
      console.error('Supabase connection error:', healthError);
      return {
        connected: false,
        authenticated: false,
        error: `Connection error: ${healthError.message}`
      };
    }
    
    // Check authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Supabase authentication error:', authError);
      return {
        connected: true,
        authenticated: false,
        error: `Authentication error: ${authError.message}`
      };
    }
    
    // Return connection status
    return {
      connected: true,
      authenticated: !!authData.session,
      userId: authData.session?.user?.id
    };
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return {
      connected: false,
      authenticated: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Check if tables exist and have the expected structure
 */
export const checkSupabaseTables = async (): Promise<{
  success: boolean;
  tables: Record<string, boolean>;
  error?: string;
}> => {
  try {
    // List of tables to check
    const tablesToCheck = [
      'clients',
      'invoices',
      'invoice_items',
      'payments',
      'recurring_invoices'
    ];
    
    const tableStatus: Record<string, boolean> = {};
    
    // Check each table
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        tableStatus[table] = !error;
      } catch {
        tableStatus[table] = false;
      }
    }
    
    // Check if all tables exist
    const allTablesExist = Object.values(tableStatus).every(status => status);
    
    return {
      success: allTablesExist,
      tables: tableStatus
    };
  } catch (error) {
    console.error('Error checking Supabase tables:', error);
    return {
      success: false,
      tables: {},
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
