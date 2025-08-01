import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Utensils, Receipt, Loader2 } from "lucide-react";
import qrCodeIcon from "@/assets/qr-code-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  onTableScanned: (tableUuid: string, mode: 'menu' | 'tracker' | 'bill', orderId?: string) => void;
}

export function QRCodeScanner({ onTableScanned }: QRCodeScannerProps) {
  const [tableInput, setTableInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  // Function to determine the appropriate mode based on order status
  const determineMode = async (tableUuid: string): Promise<{ mode: 'menu' | 'tracker' | 'bill', orderId?: string }> => {
    try {
      console.log('Determining mode for table UUID:', tableUuid);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableUuid)) {
        console.log('Invalid UUID format:', tableUuid);
        throw new Error('Invalid table UUID format');
      }
      
      // Get table info for display purposes
      const { data: tableData, error: tableError } = await supabase
        .from('restaurant_tables')
        .select('id, table_number')
        .eq('id', tableUuid)
        .single();
      
      if (tableError || !tableData) {
        console.log('Table not found:', tableError);
        throw new Error('Table not found');
      }
      
      console.log('Found table:', tableData);
      console.log('Table UUID:', tableData.id, 'Table Number:', tableData.table_number);
      
      // Check for active orders for this table using the UUID directly
      console.log('Looking for orders with table_id (UUID):', tableUuid);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('table_id', tableUuid);
      
      if (orderError) {
        console.log('Order fetch error:', orderError);
        throw new Error('Failed to fetch order data');
      }
      
      console.log('Found orders:', orderData);
      
      // Filter active orders (not completed or cancelled) and sort by creation date
      const activeOrders = orderData
        ?.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
      
      console.log('Active orders (filtered):', activeOrders);
      
      // Determine mode based on order status
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
          return { mode: 'bill' };
        } else {
          console.log('Returning tracker mode - order is active but not served');
          return { mode: 'tracker', orderId: latestOrder.id };
        }
      }
      
      console.log('Returning menu mode - no active orders found');
      // Default to menu mode (no active orders)
      return { mode: 'menu' };
    } catch (error) {
      console.error('Error determining mode:', error);
      // Default to menu mode on error
      return { mode: 'menu' };
    }
  };

  // Simulate QR code scanning - in real app this would use camera
  const simulateQRScan = async (tableUuid: string) => {
    if (!tableUuid.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid table UUID'
      });
      return;
    }

    setScanning(true);
    try {
      const result = await determineMode(tableUuid);
      onTableScanned(tableUuid, result.mode, result.orderId);
      
      const modeLabels = {
        menu: 'Menu Mode',
        tracker: 'Order Tracker',
        bill: 'Bill Mode'
      };
      
      toast({
        title: "QR Code Scanned",
        description: `Table UUID: ${tableUuid.slice(0, 8)}... - ${modeLabels[result.mode]}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to scan QR code. Please try again.'
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header with QR Icon */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <img src={qrCodeIcon} alt="QR Code" className="w-12 h-12" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-orange-600">CHANOLY NOODLE</h1>
          <p className="text-muted-foreground">Scan your table's QR code to get started</p>
        </div>
      </div>

      {/* QR Scanner Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-orange-600">
            <QrCode className="w-6 h-6 mx-auto mb-2" />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Point your camera at the table's QR code</p>
            <p className="mt-1">Or enter your table number manually below</p>
          </div>

                     {/* Manual Input */}
           <div className="space-y-2">
             <Input
               placeholder="Enter table UUID (e.g., ed6578ac-701a-4403-86e9-406307bd58d7)"
               value={tableInput}
               onChange={(e) => setTableInput(e.target.value)}
               className="text-center"
               onKeyPress={(e) => {
                 if (e.key === 'Enter') {
                   simulateQRScan(tableInput);
                 }
               }}
             />
           </div>

          {/* Action Button */}
          <div className="space-y-2">
            <Button
              variant="menu"
              className="w-full"
              onClick={() => simulateQRScan(tableInput)}
              disabled={!tableInput.trim() || scanning}
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Instructions */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-0">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-orange-600 mb-2">How it works:</h3>
                     <ul className="text-sm text-muted-foreground space-y-1">
             <li>• <strong>Before meal:</strong> Scan to view menu and place orders</li>
             <li>• <strong>After meal:</strong> When order status is "served", scan to view bill</li>
             <li>• The same QR code serves both purposes automatically</li>
             <li>• Enter any table UUID to test the system</li>
           </ul>
        </CardContent>
      </Card>
    </div>
  );
}