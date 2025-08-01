import React, { useState, useEffect } from "react";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

interface RestaurantTable {
  id: string;
  table_number: number;
  qr_code_data: any;
}

const QRCodeAdminPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');
      
      if (error) {
        console.error('Error fetching tables:', error);
        return;
      }
      
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTables();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 className="text-2xl font-bold mb-4">QR Code Generator for Tables</h1>
      {tablesLoading ? (
        <div className="text-center py-8">Loading tables...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tables found. Please add tables in the Admin Panel first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {tables.map((table) => (
            <QRCodeGenerator 
              key={table.id} 
              tableUuid={table.id} 
              tableNumber={table.table_number} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QRCodeAdminPage; 