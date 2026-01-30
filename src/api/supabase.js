import { createClient } from '@supabase/supabase-js';

// Supabase configuration - uses environment variables or falls back to demo mode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create Supabase client (or null if not configured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log configuration status for debugging
if (!isSupabaseConfigured) {
  console.log('BudgetBite: Running in demo mode (Supabase not configured)');
  console.log('To enable full features, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment');
}
