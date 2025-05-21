import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Hardcoded values as fallbacks - using proper URL format
const FALLBACK_URL = 'https://yaijujxifenvhgztyhkk.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaWp1anhpZmVudmhnenR5aGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NjIwNzksImV4cCI6MjA2MTAzODA3OX0.E62QYq-PzcKwv3TKYW5GvkV_E_8jQMaiUdtjZOgOb8o';

// Get URL from environment or use fallback
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Fix URL if it contains escaped characters
if (supabaseUrl.includes('\\x3a')) {
  supabaseUrl = supabaseUrl.replace('\\x3a', ':');
}

// Make sure URL starts with https://
if (!supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://' + supabaseUrl.replace(/^[\/\\]+/, '');
}

// Log the values for debugging
console.log('Supabase URL (lib) after fixing:', supabaseUrl);
console.log('Supabase Key Length (lib):', supabaseAnonKey?.length || 0);

// Create the Supabase client with the Database type
let supabase;

try {
  // Create the client with proper error handling
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Fallback to a hardcoded URL if there's an error
  console.log('Using hardcoded fallback URL');
  supabase = createClient<Database>(FALLBACK_URL, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Export the client
export { supabase };