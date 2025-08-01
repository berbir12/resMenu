import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, CreditCard, Receipt, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillDisplayProps {
  tableId: string;
  items: any[];
  onPayment: () => void;
  onGoBack: () => void;
  onUpdateOrder: (items: any[]) => void;
}

const BillDisplay: React.FC<BillDisplayProps> = ({ tableId, items, onPayment, onGoBack, onUpdateOrder }) => {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderStatus();
    // eslint-disable-next-line
  }, [tableId]);

  const fetchOrderStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate that tableId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableId)) {
        setError('Invalid table ID. Please scan the QR code again.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid table ID. Please scan the QR code again.'
        });
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('table_id', tableId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          setError('Orders table not found. Please contact support.');
        } else {
          setError('Failed to fetch order. Please try again.');
        }
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch order.'
        });
        return;
      }
      
      if (data && data.length > 0) {
        setCurrentOrder(data[0]);
        setOrderStatus(data[0].status);
      } else {
        setCurrentOrder(null);
        setOrderStatus('pending');
      }
    } catch (err) {
      setError('Failed to fetch order.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch order.'
      });
    }
    setLoading(false);
  };

  const callWaiter = async () => {
    try {
      if (currentOrder) {
        const { error } = await supabase
          .from('orders')
          .update({ waiter_called: true })
          .eq('id', currentOrder.id);
        
        if (error) throw error;
        
        toast({
          title: "Waiter Called",
          description: "A waiter will be with you shortly!"
        });
      }
    } catch (error) {
      console.error('Error calling waiter:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to call waiter"
      });
    }
  };

  const handlePayment = async () => {
    if (!currentOrder) return;
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', currentOrder.id);
    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process payment.'
      });
    } else {
      toast({
        title: 'Payment Processed',
        description: 'Thank you for your payment!'
      });
      onPayment();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'preparing': return Clock;
      case 'ready': return CheckCircle;
      case 'served': return CheckCircle;
      case 'completed': return CheckCircle;
      default: return Clock;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Your order has been received and is waiting to be prepared';
      case 'preparing': return 'Our kitchen is preparing your delicious meal';
      case 'ready': return 'Your order is ready! A waiter will bring it to your table shortly';
      case 'served': return 'Your meal has been served! You can now view your bill and make payment';
      case 'completed': return 'Thank you for dining with us!';
      default: return 'Order status unknown';
    }
  };

  const calculateSubtotal = () => {
    if (currentOrder && currentOrder.items) {
      let items: any[] = [];
      
      if (typeof currentOrder.items === 'string') {
        try {
          items = JSON.parse(currentOrder.items);
        } catch {
          items = [];
        }
      } else if (Array.isArray(currentOrder.items)) {
        items = currentOrder.items;
      } else if (currentOrder.items && typeof currentOrder.items === 'object') {
        items = [currentOrder.items];
      }
      
      if (!Array.isArray(items)) {
        items = [];
      }
      
      return items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
    }
    return 0;
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          CHANOLY NOODLE
        </h1>
        <p className="text-xl font-medium text-gray-700">Your Bill</p>
        <p className="text-muted-foreground">Table {tableId}</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 text-center">{error}</p>
            <Button onClick={onGoBack} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : currentOrder ? (
        <>
          {/* Order Status */}
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const StatusIcon = getStatusIcon(orderStatus);
                    return <StatusIcon className="w-6 h-6 text-orange-600" />;
                  })()}
                  <div>
                    <CardTitle className="text-lg">Order Status</CardTitle>
                    <CardDescription>{getStatusMessage(orderStatus)}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(orderStatus)}>
                  {orderStatus.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                let items: any[] = [];
                
                if (typeof currentOrder.items === 'string') {
                  try {
                    items = JSON.parse(currentOrder.items);
                  } catch {
                    items = [];
                  }
                } else if (Array.isArray(currentOrder.items)) {
                  items = currentOrder.items;
                } else if (currentOrder.items && typeof currentOrder.items === 'object') {
                  items = [currentOrder.items];
                }
                
                if (!Array.isArray(items)) {
                  items = [];
                }
                
                return (
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No items in order</p>
                    ) : (
                      items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              ×{item.quantity}
                            </Badge>
                          </div>
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8.5%)</span>
                  <span>${(subtotal * 0.085).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${(subtotal * 1.085).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={callWaiter} 
              variant="outline" 
              className="flex-1"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call Waiter
            </Button>
            
            {(orderStatus === 'ready' || orderStatus === 'served') && (
              <Button 
                onClick={handlePayment} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Bill
              </Button>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Order</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any active orders. Please place an order first.
            </p>
            <Button onClick={onGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillDisplay;