import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Home, Loader2, RefreshCw, ChefHat, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

const StaffDashboard = () => {
  const [orders, setOrders] = useState<Database["public"]["Tables"]["orders"]["Row"][]>([]);
  const [completedOrders, setCompletedOrders] = useState<Database["public"]["Tables"]["orders"]["Row"][]>([]);
  const [tableMap, setTableMap] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showKDS, setShowKDS] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchTables = async () => {
      const { data: tableData, error: tableError } = await supabase
        .from("restaurant_tables")
        .select("id, table_number");
      
      if (!tableError && tableData) {
        const tableMapping: {[key: string]: number} = {};
        tableData.forEach(table => {
          tableMapping[table.id] = table.table_number;
        });
        setTableMap(tableMapping);
      }
    };
    
    const fetchOrders = async () => {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
             if (!error && data) {
         const activeOrders = data.filter(order => order.status !== "completed");
         const completedOrdersData = data.filter(order => order.status === "completed");
         
         setOrders(activeOrders);
         setCompletedOrders(completedOrdersData);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load orders."
        });
      }
      setOrdersLoading(false);
    };
    
    // Initial load
    const initialLoad = async () => {
      await fetchTables();
      await fetchOrders();
    };
    
    initialLoad();
    
    // Set up interval for background refresh
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrders();
      }, 5000); // Refresh every 5 seconds for real-time updates
    }
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log('Updating order status:', { orderId, newStatus });
    setOrderActionLoading(orderId);
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select();
      
      console.log('Update result:', { data, error });
      
      setOrderActionLoading(null);
      if (error) {
        console.error('Update error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to update order status: ${error.message}`
        });
      } else {
        console.log('Order status updated successfully:', data);
        toast({
          variant: "default",
          title: "Order Updated",
          description: `Order status updated to ${newStatus}.`
        });
        
        // Force refresh the orders list to see the change immediately
        const { data: refreshedOrders, error: refreshError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (!refreshError && refreshedOrders) {
          const activeOrders = refreshedOrders.filter(order => order.status !== "completed");
          const completedOrdersData = refreshedOrders.filter(order => order.status === "completed");
          setOrders(activeOrders);
          setCompletedOrders(completedOrdersData);
          console.log('Orders refreshed:', { activeOrders, completedOrdersData });
        }
      }
    } catch (err) {
      console.error('Exception in updateOrderStatus:', err);
      setOrderActionLoading(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status."
      });
    }
  };

  const clearWaiterCall = async (orderId: string) => {
    setOrderActionLoading(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ waiter_called: false })
      .eq("id", orderId);
    setOrderActionLoading(null);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear waiter call."
      });
    } else {
      toast({
        variant: "default",
        title: "Waiter Call Cleared",
        description: "Waiter call has been acknowledged."
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-green-100 text-green-800";
      case "served": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatOrderId = (orderId: string) => {
    return orderId.slice(0, 8).toUpperCase();
  };

  const getTimeElapsed = (timestamp: string) => {
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getOrderPriority = (order: any) => {
    const elapsed = Date.now() - new Date(order.created_at).getTime();
    const minutes = Math.floor(elapsed / 60000);
    
    if (minutes > 30) return "high";
    if (minutes > 15) return "medium";
    return "low";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderOrderItems = (order: any) => {
    let items: any[] = [];
    
    if (typeof order.items === 'string') {
      try {
        items = JSON.parse(order.items);
      } catch {
        items = [];
      }
    } else if (Array.isArray(order.items)) {
      items = order.items;
    } else if (order.items && typeof order.items === 'object') {
      items = [order.items];
    }
    
    if (!Array.isArray(items)) {
      items = [];
    }
    
    return (
      <ul className="list-disc list-inside text-sm space-y-1">
        {items.length === 0 ? (
          <li className="text-muted-foreground">No items</li>
        ) : (
          items.map((item, index) => (
            <li key={index} className="flex justify-between items-center">
              <div>
                {item && item.name ? (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.quantity && <span className="text-muted-foreground"> x{item.quantity}</span>}
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {typeof item === 'string' ? item : 'Unknown item'}
                  </span>
                )}
              </div>
              {item && item.price && item.quantity && (
                <span className="text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    );
  };



  // Kitchen Display System Component
  const KitchenDisplay = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">Kitchen Display</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowKDS(false)}
            size="sm"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="w-5 h-5" />
              Pending Orders ({orders.filter(o => o.status === 'pending').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders
              .filter(o => o.status === 'pending')
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((order) => {
                const priority = getOrderPriority(order);
                return (
                  <Card key={order.id} className={`border-2 ${getPriorityColor(priority)}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">Order #{formatOrderId(order.id)}</h3>
                          <p className="text-sm">Table {tableMap[order.table_id] || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTimeElapsed(order.created_at)} ago
                          </p>
                        </div>
                        <Badge className={getPriorityColor(priority)}>
                          {priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderOrderItems(order)}
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          disabled={orderActionLoading === order.id}
                          className="w-full"
                        >
                          {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                          Start Preparing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </CardContent>
        </Card>

        {/* Preparing Orders */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <ChefHat className="w-5 h-5" />
              Preparing ({orders.filter(o => o.status === 'preparing').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders
              .filter(o => o.status === 'preparing')
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((order) => (
                <Card key={order.id} className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">Order #{formatOrderId(order.id)}</h3>
                        <p className="text-sm">Table {tableMap[order.table_id] || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeElapsed(order.created_at)} ago
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        PREPARING
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderOrderItems(order)}
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        disabled={orderActionLoading === order.id}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                        Mark Ready
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (showKDS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="container mx-auto p-6">
          <KitchenDisplay />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
             <div className="container mx-auto p-6">

                 {/* Header */}
         <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-3xl font-bold text-orange-600">Staff Dashboard</h1>
             <p className="text-muted-foreground">Manage orders and restaurant operations</p>
           </div>
           <div className="flex gap-2">
             <Button 
               variant="outline" 
               onClick={() => window.location.reload()}
               disabled={ordersLoading}
               size="sm"
             >
               {ordersLoading ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <RefreshCw className="w-4 h-4 mr-2" />
               )}
               Refresh
             </Button>
             <Button 
               onClick={() => setShowKDS(true)}
               size="sm"
               className="bg-orange-600 hover:bg-orange-700"
             >
               <ChefHat className="w-4 h-4 mr-2" />
               Kitchen Display
             </Button>
             <Link to="/">
               <Button variant="outline">
                 <Home className="w-4 h-4 mr-2" />
                 Back to Main
               </Button>
             </Link>
           </div>
         </div>

        

        {/* Orders Management */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Orders ({completedOrders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {ordersLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No active orders</p>
                <p className="text-sm">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders
                  .sort((a, b) => {
                    // Sort by priority first, then by time
                    const priorityA = getOrderPriority(a);
                    const priorityB = getOrderPriority(b);
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    
                    if (priorityOrder[priorityA as keyof typeof priorityOrder] !== priorityOrder[priorityB as keyof typeof priorityOrder]) {
                      return priorityOrder[priorityB as keyof typeof priorityOrder] - priorityOrder[priorityA as keyof typeof priorityOrder];
                    }
                    
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  })
                  .map((order) => {
                    const priority = getOrderPriority(order);
                    return (
                      <Card key={order.id} className={`bg-card/50 backdrop-blur-sm border-2 ${getPriorityColor(priority)}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                Order #{formatOrderId(order.id)}
                                {priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Table: {tableMap[order.table_id] || 'Unknown'} • {new Date(order.created_at).toLocaleTimeString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getTimeElapsed(order.created_at)} ago
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.toUpperCase()}
                              </Badge>
                              <Badge className={getPriorityColor(priority)}>
                                {priority.toUpperCase()} PRIORITY
                              </Badge>
                              {order.waiter_called && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => clearWaiterCall(order.id)}
                                  disabled={orderActionLoading === order.id}
                                  className="ml-2"
                                >
                                  {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                  Acknowledge
                                </Button>
                              )}
                              <span className="text-lg font-bold">${parseFloat(order.total_amount?.toString() || '0').toFixed(2)}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground mb-2">Items:</p>
                            {renderOrderItems(order)}
                          </div>
                          <div className="flex justify-end">
                            {order.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "preparing")}
                                className="mr-2"
                                disabled={orderActionLoading === order.id}
                                variant="default"
                              >
                                {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                Start Preparing
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "ready")}
                                className="mr-2"
                                disabled={orderActionLoading === order.id}
                                variant="default"
                              >
                                {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                Mark Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "served")}
                                className="mr-2"
                                disabled={orderActionLoading === order.id}
                                variant="default"
                              >
                                {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                Mark Served
                              </Button>
                            )}
                            {order.status === 'served' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "completed")}
                                className="mr-2"
                                disabled={orderActionLoading === order.id}
                                variant="default"
                              >
                                {orderActionLoading === order.id ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            {completedOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No completed orders</p>
                <p className="text-sm">Completed orders will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {completedOrders.map((order) => (
                <Card key={order.id} className="bg-card/50 backdrop-blur-sm opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{formatOrderId(order.id)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Table: {tableMap[order.table_id] || 'Unknown'} • {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          COMPLETED
                        </Badge>
                        {order.waiter_called && (
                          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">Waiter Called</span>
                        )}
                        <span className="text-lg font-bold">${parseFloat(order.total_amount?.toString() || '0').toFixed(2)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Items:</p>
                      {renderOrderItems(order)}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffDashboard;