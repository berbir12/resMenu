import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate environment variables with fallbacks for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 
  (import.meta.env.DEV ? 'https://yucmqzoxjciqbarylvsm.supabase.co' : null);
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (import.meta.env.DEV ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y21xem94amNpcWJhcnlsdnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjgwOTEsImV4cCI6MjA2ODk0NDA5MX0.pPuBr4GW0wLVahM2COBIN00VJk9CPvLfx8Yx_Uwz0k4' : null);

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});