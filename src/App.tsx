import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StaffDashboard from "./pages/StaffDashboard";
import AdminPanel from "./pages/AdminPanel";
import AuthPage from "./pages/AuthPage";
import TablePage from "./pages/TablePage";
import QRCodeAdminPage from "./pages/QRCodeAdminPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Debug component to check if environment variables are loaded
const DebugInfo = () => {
  useEffect(() => {
    console.log('App loaded');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    console.log('VITE_APP_URL:', import.meta.env.VITE_APP_URL);
  }, []);
  return null;
};

// Simple fallback component
const FallbackUI = () => (
  <div style={{ 
    padding: '20px', 
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h1>Table Scan System</h1>
    <p>Loading application...</p>
    <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
      <h3>Environment Check:</h3>
      <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
      <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      <p>App URL: {import.meta.env.VITE_APP_URL ? '✅ Set' : '❌ Missing'}</p>
    </div>
  </div>
);

const App = () => {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <DebugInfo />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/table/:tableId" element={<TablePage />} />
              <Route path="/admin/qrcodes" element={<QRCodeAdminPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
