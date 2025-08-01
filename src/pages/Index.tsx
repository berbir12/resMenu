import { RestaurantProvider, useRestaurant } from "@/components/RestaurantContext";
import { useEffect, useState } from "react";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import MenuDisplay from "@/components/MenuDisplay";
import BillDisplay from "@/components/BillDisplay";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";
import pastryHero from "@/assets/pastry-hero.jpg";
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from "react-router-dom";

function RestaurantApp() {
  const { tableId, mode, setTableId, setMode, updateOrder, getBillItems, resetSession, orderItems } = useRestaurant();
  const [tableData, setTableData] = useState<{id: string, table_number: number} | null>(null);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('RestaurantApp component loaded');
    console.log('Environment check:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      appUrl: import.meta.env.VITE_APP_URL
    });
    setIsLoading(false);
  }, []);

  // Handle URL parameter for direct table access
  useEffect(() => {
    const urlTableId = searchParams.get('tableId');
    const urlMode = searchParams.get('mode') as 'menu' | 'bill' | null;
    
    if (urlTableId && !tableId) {
      if (urlMode) {
        // If mode is provided in URL (from QR code), use it directly
        console.log('Using mode from URL:', urlMode);
        setTableId(urlTableId);
        setMode(urlMode);
        
        // Fetch table data for display
        const fetchTableData = async () => {
          try {
            const { data: tableInfo, error } = await supabase
              .from('restaurant_tables')
              .select('id, table_number')
              .eq('id', urlTableId)
              .single();
            
            if (!error && tableInfo) {
              setTableData(tableInfo);
              toast({
                title: "Table Accessed",
                description: `Table ${tableInfo.table_number} - ${urlMode === 'menu' ? 'Menu Mode' : 'Bill Mode'}`,
              });
            }
          } catch (err) {
            console.error('Error fetching table data:', err);
          }
        };
        
        fetchTableData();
      } else {
        // If no mode provided (manual input), determine mode
        determineModeAndHandleTable(urlTableId);
      }
    }
  }, [searchParams, tableId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Initializing restaurant app</p>
        </div>
      </div>
    );
  }

  // Function to determine mode and handle table access (similar to QR scanner logic)
  const determineModeAndHandleTable = async (tableUuid: string) => {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableUuid)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid table ID format.'
        });
        return;
      }
      
      // Get table info for display purposes
      const { data: tableInfo, error: tableError } = await supabase
        .from('restaurant_tables')
        .select('id, table_number')
        .eq('id', tableUuid)
        .single();
      
      if (tableError || !tableInfo) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Table not found.'
        });
        return;
      }
      
      setTableData(tableInfo);
      
      // Check for active orders for this table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('table_id', tableUuid);
      
      if (orderError) {
        console.error('Order fetch error:', orderError);
        // Default to menu mode on error
        setTableId(tableUuid);
        setMode('menu');
        return;
      }
      
      // Filter active orders and sort by creation date
      const activeOrders = orderData
        ?.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
      
      // If there's an active order with status 'served', show bill
      let mode: 'menu' | 'bill' = 'menu';
      if (activeOrders.length > 0) {
        const latestOrder = activeOrders[0];
        if (latestOrder.status === 'served') {
          mode = 'bill';
        }
      }
      
      setTableId(tableUuid);
      setMode(mode);
      
      toast({
        title: "Table Accessed",
        description: `Table ${tableInfo.table_number} - ${mode === 'menu' ? 'Menu Mode' : 'Bill Mode'}`,
      });
    } catch (error) {
      console.error('Error determining mode:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to access table.'
      });
    }
  };



  const handleTableScanned = async (scannedTableUuid: string, scannedMode: 'menu' | 'bill') => {
    setTableId(scannedTableUuid);
    setMode(scannedMode);
    
    // Fetch table data for display
    try {
      const { data: tableInfo, error } = await supabase
        .from('restaurant_tables')
        .select('id, table_number')
        .eq('id', scannedTableUuid)
        .single();
      
      if (!error && tableInfo) {
        setTableData(tableInfo);
      }
    } catch (err) {
      console.error('Error fetching table data:', err);
    }
    
    toast({
      title: "QR Code Scanned Successfully",
      description: `Table ${tableData?.table_number || scannedTableUuid.slice(0, 8)} - ${scannedMode === 'menu' ? 'Menu Mode' : 'Bill Mode'}`,
    });
  };

  const handleOrderUpdate = (items: import('@/components/RestaurantContext').OrderItem[]) => {
    updateOrder(items);
  };

  const handlePayment = () => {
    // In a real app, this would integrate with Stripe or another payment processor
    toast({
      title: "Payment Processed",
      description: "Thank you for your payment! Your receipt has been sent.",
    });
    
    // Simulate payment success and reset
    setTimeout(() => {
      resetSession();
      toast({
        title: "Session Complete",
        description: "Thank you for dining with us! Please scan again for your next visit.",
      });
    }, 2000);
  };

  const handleFinishOrder = async () => {
    if (!tableId || orderItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No items in cart or no table selected.'
      });
      return;
    }
    
    try {
      // Validate that tableId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableId)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid table ID. Please scan the QR code again.'
        });
        return;
      }
      
      // Verify the table exists
      const { data: tableData, error: tableError } = await supabase
        .from('restaurant_tables')
        .select('id, table_number')
        .eq('id', tableId)
        .single();
      
      if (tableError || !tableData) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Table not found. Please scan the QR code again.'
        });
        return;
      }
      
      const totalAmount = orderItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      const orderData = {
        table_id: tableId, // Use the UUID directly
        items: JSON.stringify(orderItems),
        total_amount: totalAmount,
        status: 'pending',
        waiter_called: false
      };
      
      const { error } = await supabase.from('orders').insert([orderData]);
      
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Orders table not found. Please contact support.'
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to place order. Please try again.'
          });
        }
      } else {
        toast({
          title: 'Order Placed',
          description: 'Your order has been sent to the kitchen!'
        });
        // Stay in menu mode - bill will only show when order status is changed to "served"
        resetSession();
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to place order. Please try again.'
      });
    }
  };

  const goBack = () => {
    if (mode) {
      setMode(null);
      setTableId(null);
      setTableData(null);
    }
  };

  // Main QR Scanner View
  if (!tableId || !mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        {/* Hero Section */}
        <div className="relative h-72 overflow-hidden"> {/* Increased height for better aspect ratio */}
          <img 
            src={pastryHero} 
            alt="Pastry Hero" 
            className="w-full h-full object-cover object-center scale-95 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white text-center">
              
            </div>
        </div>

        {/* QR Scanner */}
        <div className="py-8">
          <QRCodeScanner onTableScanned={handleTableScanned} />
        </div>
      </div>
    );
  }

  // Menu View
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        {/* Navigation */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border z-10">
          <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
            <Button variant="outline" onClick={goBack} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scanner
            </Button>
            <h2 className="font-semibold text-orange-600">Table {tableData?.table_number || tableId.slice(0, 8)} - Menu</h2>
            <Button 
              variant="fresh" 
              size="sm"
              onClick={handleFinishOrder}
              disabled={orderItems.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Send Order to Staff
            </Button>
          </div>
        </div>

        {/* Menu Content */}
        <div className="py-8">
          <MenuDisplay 
            tableId={tableId} 
            onOrderUpdate={handleOrderUpdate} 
            onSendOrder={handleFinishOrder}
          />
        </div>
      </div>
    );
  }

  // Bill View
  if (mode === 'bill') {
    const billItems = getBillItems();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        {/* Navigation */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border z-10">
          <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
            <Button variant="outline" onClick={goBack} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scanner
            </Button>
            <h2 className="font-semibold text-orange-600">Table {tableData?.table_number || tableId.slice(0, 8)} - Bill</h2>
            <div /> {/* Spacer for center alignment */}
          </div>
        </div>

        {/* Bill Content */}
        <div className="py-8">
          <BillDisplay 
            tableId={tableId} 
            items={billItems}
            onPayment={handlePayment}
            onGoBack={goBack}
            onUpdateOrder={() => setMode('menu')}
          />
        </div>
      </div>
    );
  }

  return null;
}

const Index = () => {
  return (
    <RestaurantProvider>
      <RestaurantApp />
    </RestaurantProvider>
  );
};

export default Index;