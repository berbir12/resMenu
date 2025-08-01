import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate environment variables with fallbacks for development and production
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yucmqzoxjciqbarylvsm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y21xem94amNpcWJhcnlsdnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjgwOTEsImV4cCI6MjA2ODk0NDA5MX0.pPuBr4GW0wLVahM2COBIN00VJk9CPvLfx8Yx_Uwz0k4';

// Log environment status for debugging
console.log('Supabase URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('Supabase Key:', SUPABASE_PUBLISHABLE_KEY ? 'Set' : 'Missing');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});