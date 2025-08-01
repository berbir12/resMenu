import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, ChefHat, Utensils, Receipt, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderTrackerProps {
  tableId: string;
  orderId: string;
  onGoBack: () => void;
  onOrderComplete: () => void;
}

interface Order {
  id: string;
  table_id: string;
  items: string;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
  created_at: string;
  updated_at: string;
}

const OrderTracker = ({ tableId, orderId, onGoBack, onOrderComplete }: OrderTrackerProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { toast } = useToast();

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

      setOrder(data);
      
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
          setOrder(payload.new as Order);
          
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
            Back to Menu
          </Button>
          <h2 className="font-semibold text-orange-600">Order #{orderId.slice(0, 8)}</h2>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{getEstimatedTime()}</span>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Order Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Order Placed</span>
                <span>Complete</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? step.color : 'bg-gray-200'
                      } text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            isCurrent ? 'text-orange-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="animate-pulse">
                              Current
                            </Badge>
                          )}
                          {isCompleted && !isCurrent && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {isCurrent && (
                          <p className="text-sm text-muted-foreground mt-1">
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
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Time:</span>
                <span>{new Date(order.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={onGoBack} variant="outline" className="flex-1">
              Back to Menu
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="secondary" 
              className="flex-1"
            >
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker; 