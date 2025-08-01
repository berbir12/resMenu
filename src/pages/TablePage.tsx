import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const TablePage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (tableId) {
      // Redirect to the main flow with the table UUID
      // This will trigger the QR scanner logic to determine menu vs bill mode
      navigate(`/?tableId=${tableId}`, { replace: true });
      
      toast({
        title: "Table Detected",
        description: `Redirecting to table ${tableId.slice(0, 8)}...`,
      });
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