import { useEffect, useState } from 'react';

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
}

export function useEnvValidation(): EnvValidationResult {
  const [result, setResult] = useState<EnvValidationResult>({
    isValid: true,
    missingVars: [],
    errors: []
  });

  useEffect(() => {
    const missingVars: string[] = [];
    const errors: string[] = [];

    // Check required environment variables (with fallbacks in development)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
      (import.meta.env.DEV ? 'https://yucmqzoxjciqbarylvsm.supabase.co' : null);
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
      (import.meta.env.DEV ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y21xem94amNpcWJhcnlsdnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjgwOTEsImV4cCI6MjA2ODk0NDA5MX0.pPuBr4GW0wLVahM2COBIN00VJk9CPvLfx8Yx_Uwz0k4' : null);

    if (!supabaseUrl) {
      missingVars.push('VITE_SUPABASE_URL');
    }

    if (!supabaseKey) {
      missingVars.push('VITE_SUPABASE_ANON_KEY');
    }

    // Validate Supabase URL format
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        if (!url.hostname.includes('supabase.co')) {
          errors.push('VITE_SUPABASE_URL should be a valid Supabase URL');
        }
      } catch {
        errors.push('VITE_SUPABASE_URL is not a valid URL');
      }
    }

    // Validate Supabase key format
    if (supabaseKey) {
      if (!supabaseKey.startsWith('eyJ')) {
        errors.push('VITE_SUPABASE_ANON_KEY should be a valid JWT token');
      }
    }

    setResult({
      isValid: missingVars.length === 0 && errors.length === 0,
      missingVars,
      errors
    });
  }, []);

  return result;
} 