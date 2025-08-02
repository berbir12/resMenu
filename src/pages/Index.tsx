import { RestaurantProvider, useRestaurant } from "@/components/RestaurantContext";
import { useEffect, useState } from "react";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import MenuDisplay from "@/components/MenuDisplay";
import BillDisplay from "@/components/BillDisplay";
import OrderTracker from "@/components/OrderTracker";
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
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showOrderTracker, setShowOrderTracker] = useState(false);

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
    const urlMode = searchParams.get('mode') as 'menu' | 'tracker' | 'bill' | null;
    const urlOrderId = searchParams.get('orderId');
    
    if (urlTableId && !tableId) {
      if (urlMode) {
        // If mode is provided in URL (from QR code), use it directly
        console.log('Using mode from URL:', urlMode, 'Order ID:', urlOrderId);
        setTableId(urlTableId);
        setMode(urlMode);
        
        // If tracker mode with orderId, show order tracker
        if (urlMode === 'tracker' && urlOrderId) {
          setCurrentOrderId(urlOrderId);
          setShowOrderTracker(true);
        }
        
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
              const modeLabels = {
                menu: 'Menu Mode',
                tracker: 'Order Tracker',
                bill: 'Bill Mode'
              };
              toast({
                title: "Table Accessed",
                description: `Table ${tableInfo.table_number} - ${modeLabels[urlMode]}`,
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
      
      // Determine mode based on order status
      let mode: 'menu' | 'tracker' | 'bill' = 'menu';
      let orderId: string | null = null;
      
      if (activeOrders.length > 0) {
        const latestOrder = activeOrders[0];
        if (latestOrder.status === 'served') {
          mode = 'bill';
        } else {
          mode = 'tracker';
          orderId = latestOrder.id;
        }
      }
      
      setTableId(tableUuid);
      setMode(mode);
      
      // If tracker mode, show order tracker
      if (mode === 'tracker' && orderId) {
        setCurrentOrderId(orderId);
        setShowOrderTracker(true);
      }
      
      const modeLabels = {
        menu: 'Menu Mode',
        tracker: 'Order Tracker',
        bill: 'Bill Mode'
      };
      
      toast({
        title: "Table Accessed",
        description: `Table ${tableInfo.table_number} - ${modeLabels[mode]}`,
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



  const handleTableScanned = async (scannedTableUuid: string, scannedMode: 'menu' | 'tracker' | 'bill', orderId?: string) => {
    setTableId(scannedTableUuid);
    setMode(scannedMode);
    
    // If tracker mode with orderId, show order tracker
    if (scannedMode === 'tracker' && orderId) {
      setCurrentOrderId(orderId);
      setShowOrderTracker(true);
    }
    
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
    
    const modeLabels = {
      menu: 'Menu Mode',
      tracker: 'Order Tracker',
      bill: 'Bill Mode'
    };
    
    toast({
      title: "QR Code Scanned Successfully",
      description: `Table ${tableData?.table_number || scannedTableUuid.slice(0, 8)} - ${modeLabels[scannedMode]}`,
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
      
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
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
          title: 'Order Placed Successfully!',
          description: 'Your order has been sent to the kitchen. You can now track its progress.',
        });
        
        // Set the current order ID and show order tracker
        setCurrentOrderId(newOrder.id);
        setShowOrderTracker(true);
        
        // Reset the session but keep the table context
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
    if (showOrderTracker) {
      setShowOrderTracker(false);
      setCurrentOrderId(null);
    } else if (mode) {
      setMode(null);
      setTableId(null);
      setTableData(null);
    }
  };

  const handleOrderComplete = () => {
    setShowOrderTracker(false);
    setCurrentOrderId(null);
    
    // Check if we should switch to bill mode
    if (tableId) {
      const checkOrderStatus = async () => {
        try {
          const { data: orderData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('table_id', tableId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (!error && orderData) {
            if (orderData.status === 'served') {
              setMode('bill');
              toast({
                title: 'Order Served!',
                description: 'Your order has been served. You can now view your bill.',
              });
            } else if (orderData.status === 'completed') {
              toast({
                title: 'Order Complete!',
                description: 'Thank you for dining with us. You can place a new order anytime.',
              });
            }
          }
        } catch (err) {
          console.error('Error checking order status:', err);
        }
      };
      
      checkOrderStatus();
    }
  };

    // Order Tracker View
  if (showOrderTracker && currentOrderId) {
    return (
      <OrderTracker
        tableId={tableId!}
        orderId={currentOrderId}
        onGoBack={goBack}
        onOrderComplete={handleOrderComplete}
        onEditOrder={(orderId) => {
          // This could be used for additional edit order functionality
          console.log('Edit order requested for:', orderId);
        }}
      />
    );
  }

  // Main QR Scanner View
  if (!tableId || !mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        {/* Hero Section */}
        <div className="relative h-60 sm:h-72 overflow-hidden"> {/* Responsive height */}
          <img 
            src={pastryHero} 
            alt="Pastry Hero" 
            className="w-full h-full object-cover object-center scale-95 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to CHANOLY NOODLE</h1>
            <p className="text-sm sm:text-base opacity-90">Scan your table QR code to get started</p>
          </div>
        </div>

        {/* QR Scanner */}
        <div className="py-6 sm:py-8 px-4">
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
          <div className="max-w-4xl mx-auto p-3 sm:p-4 flex items-center justify-between">
            <Button variant="outline" onClick={goBack} size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Scanner</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h2 className="font-semibold text-orange-600 text-sm sm:text-base text-center flex-1 mx-2">
              Table {tableData?.table_number || tableId.slice(0, 8)} - Menu
            </h2>
            <Button 
              variant="fresh" 
              size="sm"
              onClick={handleFinishOrder}
              disabled={orderItems.length === 0}
              className="text-xs sm:text-sm"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Send Order to Staff</span>
              <span className="sm:hidden">Send Order</span>
            </Button>
          </div>
        </div>

        {/* Menu Content */}
        <div className="py-4 sm:py-8">
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
          <div className="max-w-2xl mx-auto p-3 sm:p-4 flex items-center justify-between">
            <Button variant="outline" onClick={goBack} size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Scanner</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h2 className="font-semibold text-orange-600 text-sm sm:text-base text-center flex-1 mx-2">
              Table {tableData?.table_number || tableId.slice(0, 8)} - Bill
            </h2>
            <div className="w-16 sm:w-20" /> {/* Spacer for center alignment */}
          </div>
        </div>

        {/* Bill Content */}
        <div className="py-4 sm:py-8">
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