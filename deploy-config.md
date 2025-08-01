# Deployment Configuration Guide

## Environment Variables

Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=https://yucmqzoxjciqbarylvsm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y21xem94amNpcWJhcnlsdnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjgwOTEsImV4cCI6MjA2ODk0NDA5MX0.pPuBr4GW0wLVahM2COBIN00VJk9CPvLfx8Yx_Uwz0k4
VITE_APP_URL=https://your-app-domain.netlify.app
```

## Supabase Configuration

Your Supabase project is already configured with:
- URL: https://yucmqzoxjciqbarylvsm.supabase.co
- Database migrations applied
- RLS policies configured
- Tables created

## Deployment Steps

1. **Netlify Deployment** (Recommended)
2. **GitHub Pages** (Alternative)

See deployment guides below. 