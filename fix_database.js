// Script to fix database tables using Supabase client
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Read SQL file
const sqlFile = fs.readFileSync('fix_database.sql', 'utf8');

// Split SQL file into individual statements
const statements = sqlFile
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute SQL statements
async function executeStatements() {
  try {
    console.log(`Found ${statements.length} SQL statements to execute`);

    // Sign in as a user first (if needed)
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Authentication error:', authError);
      process.exit(1);
    }

    if (!authData.session) {
      console.log('No active session, please sign in first');
      process.exit(1);
    }

    console.log('Authenticated as:', authData.session.user.email);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the execute_sql RPC function if available
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement
        });

        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Exception executing statement ${i + 1}:`, err);
        console.error('Statement:', statement);
      }
    }

    console.log('All statements executed');
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the script
executeStatements();
