import { createContext, useContext, useState, ReactNode } from "react";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface RestaurantContextType {
  tableId: string | null;
  mode: 'menu' | 'bill' | null;
  orderItems: OrderItem[];
  setTableId: (id: string) => void;
  setMode: (mode: 'menu' | 'bill') => void;
  updateOrder: (items: OrderItem[]) => void;
  getBillItems: () => OrderItem[];
  resetSession: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Sample menu data for bill calculation
const MENU_ITEMS = {
  "1": { name: "Grilled Salmon", price: 24.99 },
  "2": { name: "Truffle Pasta", price: 22.99 },
  "3": { name: "Caesar Salad", price: 14.99 },
  "4": { name: "Craft Beer", price: 8.99 },
  "5": { name: "Chocolate Lava Cake", price: 9.99 },
};

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [tableId, setTableId] = useState<string | null>(null);
  const [mode, setMode] = useState<'menu' | 'bill' | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const updateOrder = (items: OrderItem[]) => {
    setOrderItems(items);
  };

  const getBillItems = (): OrderItem[] => {
    return orderItems;
  };

  const resetSession = () => {
    setTableId(null);
    setMode(null);
    setOrderItems([]);
  };

  return (
    <RestaurantContext.Provider
      value={{
        tableId,
        mode,
        orderItems,
        setTableId,
        setMode,
        updateOrder,
        getBillItems,
        resetSession,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}