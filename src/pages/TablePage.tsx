import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TablePage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (tableId) {
      // Validate UUID format first (same as manual input)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableId)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid table ID format.'
        });
        navigate('/', { replace: true });
        return;
      }

      // Use the exact same logic as manual input
      const determineModeAndHandleTable = async (tableUuid: string) => {
        try {
          console.log('Determining mode for table UUID:', tableUuid);
          
          // Get table info for display purposes
          const { data: tableInfo, error: tableError } = await supabase
            .from('restaurant_tables')
            .select('id, table_number')
            .eq('id', tableUuid)
            .single();
          
          if (tableError || !tableInfo) {
            console.log('Table not found:', tableError);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Table not found.'
            });
            navigate('/', { replace: true });
            return;
          }
          
          console.log('Found table:', tableInfo);
          console.log('Table UUID:', tableInfo.id, 'Table Number:', tableInfo.table_number);
          
          // Check for active orders for this table
          console.log('Looking for orders with table_id (UUID):', tableUuid);
          
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('table_id', tableUuid);
          
          if (orderError) {
            console.log('Order fetch error:', orderError);
            // Default to menu mode on error
            navigate(`/?tableId=${tableUuid}&mode=menu`, { replace: true });
            return;
          }
          
          console.log('Found orders:', orderData);
          
          // Filter active orders and sort by creation date
          const activeOrders = orderData
            ?.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
          
          console.log('Active orders (filtered):', activeOrders);
          
          // If there's an active order with status 'served', show bill
          let mode: 'menu' | 'bill' = 'menu';
          if (activeOrders.length > 0) {
            const latestOrder = activeOrders[0];
            console.log('Latest order status:', latestOrder.status);
            console.log('Latest order details:', {
              id: latestOrder.id,
              table_id: latestOrder.table_id,
              status: latestOrder.status,
              created_at: latestOrder.created_at
            });
            
            if (latestOrder.status === 'served') {
              console.log('Returning bill mode - order is served');
              mode = 'bill';
            }
          }
          
          console.log('Returning menu mode - no served orders found');
          
          // Redirect with mode parameter to match manual input exactly
          navigate(`/?tableId=${tableUuid}&mode=${mode}`, { replace: true });
          
          toast({
            title: "Table Detected",
            description: `Table ${tableInfo.table_number} - ${mode === 'menu' ? 'Menu Mode' : 'Bill Mode'}`,
          });
        } catch (error) {
          console.error('Error determining mode:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to access table.'
          });
          navigate('/', { replace: true });
        }
      };

      // Call the same function as manual input
      determineModeAndHandleTable(tableId);
    }
  }, [tableId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading table...</p>
      </div>
    </div>
  );
};

export default TablePage; 