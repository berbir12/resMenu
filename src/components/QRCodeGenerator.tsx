import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  tableUuid: string;
  tableNumber?: number;
}

const QRCodeGenerator = ({ tableUuid, tableNumber }: QRCodeGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      setIsGenerating(true);
      try {
        // Use the exact same URL format that TablePage expects
        const tableUrl = `${window.location.origin}/table/${tableUuid}`;
        
        console.log('Generating QR code for URL:', tableUrl);
        console.log('Table UUID:', tableUuid, 'Table Number:', tableNumber);
        
        const url = await QRCode.toDataURL(tableUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeUrl(url);
        console.log('QR code generated successfully for table:', tableNumber || tableUuid.slice(0, 8));
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Validate UUID format first (same as all other components)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tableUuid)) {
      console.log('Invalid UUID format:', tableUuid);
      return;
    }

    generateQR();
  }, [tableUuid, tableNumber]);

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      const displayName = tableNumber ? `table-${tableNumber}` : `table-${tableUuid.slice(0, 8)}`;
      link.download = `${displayName}-qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const testQRCode = () => {
    const tableUrl = `${window.location.origin}/table/${tableUuid}`;
    window.open(tableUrl, '_blank');
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Table {tableNumber || tableUuid.slice(0, 8)}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {isGenerating && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}
        
        {qrCodeUrl && (
          <div className="flex justify-center">
            <img 
              src={qrCodeUrl} 
              alt={`QR Code for Table ${tableNumber || tableUuid.slice(0, 8)}`} 
              className="rounded-lg border-2 border-gray-200" 
            />
          </div>
        )}
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Scan to access table menu and orders</p>
          <p className="text-xs">URL: /table/{tableUuid.slice(0, 8)}...</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={downloadQR} variant="outline" className="flex-1" disabled={!qrCodeUrl}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={testQRCode} variant="secondary" className="flex-1" disabled={!qrCodeUrl}>
            Test QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;