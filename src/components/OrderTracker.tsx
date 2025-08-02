import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, ChefHat, Utensils, Receipt, ArrowLeft, Edit, Plus, Minus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OrderTrackerProps {
  tableId: string;
  orderId: string;
  onGoBack: () => void;
  onOrderComplete: () => void;
  onEditOrder?: (orderId: string) => void;
}

interface Order {
  id: string;
  table_id: string;
  items: any; // JSON data from database
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
  created_at: string;
  updated_at: string;
  customer_name?: string;
  notes?: string;
  waiter_called?: boolean;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const OrderTracker = ({ tableId, orderId, onGoBack, onOrderComplete, onEditOrder }: OrderTrackerProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { toast } = useToast();
  const [editOrderDialogOpen, setEditOrderDialogOpen] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Order status configuration
  const orderSteps = [
    { status: 'pending', label: 'Order Received', icon: Receipt, color: 'bg-blue-500' },
    { status: 'preparing', label: 'Preparing', icon: ChefHat, color: 'bg-orange-500' },
    { status: 'ready', label: 'Ready to Serve', icon: Utensils, color: 'bg-green-500' },
    { status: 'served', label: 'Served', icon: CheckCircle, color: 'bg-purple-500' },
    { status: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-gray-500' }
  ];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return orderSteps.findIndex(step => step.status === order.status);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return Math.max(0, Math.min(100, (currentIndex / (orderSteps.length - 1)) * 100));
  };

  const getEstimatedTime = () => {
    if (!order) return 'Calculating...';
    
    const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000 / 60);
    
    switch (order.status) {
      case 'pending':
        return `${elapsed} min elapsed • ~15-20 min total`;
      case 'preparing':
        return `${elapsed} min elapsed • ~10-15 min remaining`;
      case 'ready':
        return `${elapsed} min elapsed • Ready for pickup`;
      case 'served':
        return `${elapsed} min elapsed • Enjoy your meal!`;
      default:
        return `${elapsed} min total`;
    }
  };

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load order status.'
        });
        return;
      }

      setOrder(data as any);
      
      // Parse order items for editing
      try {
        const parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        setEditedItems(parsedItems);
      } catch (err) {
        console.error('Error parsing order items:', err);
        setEditedItems([]);
      }
      
             // If order is completed, trigger completion callback
       if (data.status === 'completed') {
         setTimeout(() => {
           onOrderComplete();
         }, 3000);
       }
       
       // If order is served, redirect to bill mode after a delay
       if (data.status === 'served') {
         setTimeout(() => {
           onOrderComplete();
         }, 2000);
       }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for order updates
  useEffect(() => {
    fetchOrder();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, 
        (payload) => {
          console.log('Order updated:', payload.new);
          setOrder(payload.new as any);
          
          // Show notification for status changes
          const newStatus = payload.new.status;
          const statusLabels = {
            'preparing': 'Your order is being prepared!',
            'ready': 'Your order is ready!',
            'served': 'Your order has been served!',
            'completed': 'Thank you for dining with us!'
          };
          
          if (statusLabels[newStatus as keyof typeof statusLabels]) {
            toast({
              title: 'Order Update',
              description: statusLabels[newStatus as keyof typeof statusLabels]
            });
          }
          
          // If order status changes to ready or beyond, close edit dialog if open
          if ((newStatus === 'ready' || newStatus === 'served' || newStatus === 'completed') && editOrderDialogOpen) {
            setEditOrderDialogOpen(false);
            toast({
              title: 'Order No Longer Editable',
              description: 'Your order is now being prepared and cannot be modified.',
              variant: 'default'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Update elapsed time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (order) {
        const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000 / 60);
        setTimeElapsed(elapsed);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [order]);

  const updateOrderItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item from order
      const updatedItems = editedItems.filter(item => item.id !== itemId);
      setEditedItems(updatedItems);
    } else {
      // Update item quantity
      const updatedItems = editedItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setEditedItems(updatedItems);
    }
  };

  const getTotalAmount = () => {
    return editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleUpdateOrder = async () => {
    if (editedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Order must contain at least one item.'
      });
      return;
    }

    if (!order) return;

    setIsUpdatingOrder(true);
    
    try {
      const totalAmount = getTotalAmount();
      
      const { error } = await supabase
        .from('orders')
        .update({
          items: JSON.stringify(editedItems),
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        items: JSON.stringify(editedItems),
        total_amount: totalAmount
      } : null);

      setEditOrderDialogOpen(false);
      
      toast({
        title: 'Order Updated',
        description: 'Your order has been updated successfully.'
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order. Please try again.'
      });
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const canEditOrder = () => {
    if (!order) return false;
    // Allow editing only if order is still pending or preparing
    return order.status === 'pending' || order.status === 'preparing';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={onGoBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
          <Button variant="outline" onClick={onGoBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Menu</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h2 className="font-semibold text-orange-600 text-sm sm:text-base">Order #{orderId.slice(0, 8)}</h2>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{getEstimatedTime()}</span>
            <span className="text-xs sm:text-sm text-muted-foreground sm:hidden">{timeElapsed}m</span>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="py-4 sm:py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-4 sm:space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
                Order Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Progress value={progressPercentage} className="h-2 sm:h-3" />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>Order Placed</span>
                <span>Complete</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {orderSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.status} className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? step.color : 'bg-gray-200'
                      } text-white flex-shrink-0`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium text-sm sm:text-base ${
                            isCurrent ? 'text-orange-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="animate-pulse text-xs">
                              Current
                            </Badge>
                          )}
                          {isCompleted && !isCurrent && (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                          )}
                        </div>
                        {isCurrent && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {step.status === 'pending' && 'We received your order and are getting started'}
                            {step.status === 'preparing' && 'Our chefs are preparing your delicious meal'}
                            {step.status === 'ready' && 'Your order is ready! Please wait for service'}
                            {step.status === 'served' && 'Your order has been served. Enjoy your meal!'}
                            {step.status === 'completed' && 'Thank you for dining with us!'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Order ID:</span>
                <span className="font-mono text-xs sm:text-sm break-all">{orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Total Amount:</span>
                <span className="font-semibold text-sm sm:text-base">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Order Time:</span>
                <span className="text-sm">{new Date(order.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Status:</span>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button onClick={onGoBack} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Menu</span>
              <span className="sm:hidden">Back to Menu</span>
            </Button>
            {canEditOrder() ? (
              <Button 
                onClick={() => setEditOrderDialogOpen(true)} 
                variant="secondary" 
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Edit Order</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                disabled
                title={order?.status === 'ready' || order?.status === 'served' || order?.status === 'completed' 
                  ? 'Order cannot be edited at this stage' 
                  : 'Editing not available'}
              >
                <Edit className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Edit Order</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()} 
              variant="secondary" 
              className="flex-1"
            >
              <span className="hidden sm:inline">Refresh Status</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={editOrderDialogOpen} onOpenChange={setEditOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Your Order</DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              You can modify your order while it's being prepared. Changes will be sent to the kitchen immediately.
            </p>
          </DialogHeader>
          
          {editedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items in your order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Order Items */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Current Order Items</h3>
                <div className="space-y-2 sm:space-y-3">
                  {editedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">${item.price} each</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderItemQuantity(item.id, 0)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 ml-1 sm:ml-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total */}
                <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-base sm:text-lg font-semibold">Total:</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">${getTotalAmount().toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditOrderDialogOpen(false)}
                  disabled={isUpdatingOrder}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateOrder}
                  disabled={isUpdatingOrder || editedItems.length === 0}
                  className="w-full sm:w-auto"
                >
                  {isUpdatingOrder ? 'Updating...' : 'Update Order'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracker; 