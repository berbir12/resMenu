import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  tableUuid: string;
  tableNumber?: number; // Optional for display purposes
}

const QRCodeGenerator = ({ tableUuid, tableNumber }: QRCodeGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const url = await QRCode.toDataURL(`${baseUrl}/table/${tableUuid}`, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [tableUuid]);

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      const displayName = tableNumber ? `table-${tableNumber}` : `table-${tableUuid.slice(0, 8)}`;
      link.download = `${displayName}-qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Table {tableNumber || tableUuid.slice(0, 8)}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {qrCodeUrl && (
          <div className="flex justify-center">
            <img src={qrCodeUrl} alt={`QR Code for Table ${tableNumber || tableUuid.slice(0, 8)}`} className="rounded-lg" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Scan to view menu and place orders
        </p>
        <Button onClick={downloadQR} variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;