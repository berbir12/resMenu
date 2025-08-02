import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Phone, Clock, Leaf, Wheat, Flame, Search, Filter, Edit, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  dietary_info?: string[];
  spicy_level?: number;
  preparation_time?: number;
  available: boolean;
}

import { OrderItem, useRestaurant } from '@/components/RestaurantContext';

interface MenuDisplayProps {
  tableId: string;
  onOrderUpdate: (items: OrderItem[]) => void;
  onSendOrder?: () => void;
}

const MenuDisplay: React.FC<MenuDisplayProps> = ({ tableId, onOrderUpdate, onSendOrder }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const { orderItems, updateOrder } = useRestaurant();
  const [editOrderDialogOpen, setEditOrderDialogOpen] = useState(false);

  // Dietary options with icons
  const dietaryOptions = [
    { value: "vegetarian", label: "Vegetarian", icon: Leaf, color: "bg-green-100 text-green-800" },
    { value: "vegan", label: "Vegan", icon: Leaf, color: "bg-emerald-100 text-emerald-800" },
    { value: "gluten-free", label: "Gluten Free", icon: Wheat, color: "bg-yellow-100 text-yellow-800" },
    { value: "spicy", label: "Spicy", icon: Flame, color: "bg-red-100 text-red-800" }
  ];

  // Spicy levels
  const spicyLevels = [
    { value: 0, label: "Not Spicy", color: "bg-gray-100 text-gray-800" },
    { value: 1, label: "Mild", color: "bg-yellow-100 text-yellow-800" },
    { value: 2, label: "Medium", color: "bg-orange-100 text-orange-800" },
    { value: 3, label: "Hot", color: "bg-red-100 text-red-800" },
    { value: 4, label: "Very Hot", color: "bg-red-200 text-red-900" },
    { value: 5, label: "Extreme", color: "bg-red-300 text-red-950" }
  ];

  // Sync orderItems with parent component
  useEffect(() => {
    onOrderUpdate(orderItems);
  }, [orderItems, onOrderUpdate]);

  useEffect(() => {
    const fetchMenu = async () => {
      setMenuLoading(true);
      setMenuError(null);
      
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('available', true)
          .order('category')
          .order('name');
          
        if (error) {
          console.error('Menu fetch error:', error);
          // If table doesn't exist, use fallback data
          if (error.code === '42P01') { // Table doesn't exist
            console.log('Menu table not found, using fallback data');
            const fallbackMenu = [
              { 
                id: 1, 
                name: 'Pad Thai', 
                description: 'Classic Thai stir-fried rice noodles with eggs, tofu, and peanuts', 
                price: 16.99, 
                category: 'Noodles',
                image_url: null,
                dietary_info: ['vegetarian'],
                spicy_level: 2,
                preparation_time: 15,
                available: true
              },
              { 
                id: 2, 
                name: 'Tom Yum Soup', 
                description: 'Spicy and sour soup with shrimp, lemongrass, and mushrooms', 
                price: 14.99, 
                category: 'Soups',
                image_url: null,
                dietary_info: ['spicy'],
                spicy_level: 3,
                preparation_time: 12,
                available: true
              },
              { 
                id: 3, 
                name: 'Green Curry', 
                description: 'Creamy coconut curry with vegetables and choice of protein', 
                price: 18.99, 
                category: 'Main Courses',
                image_url: null,
                dietary_info: ['spicy'],
                spicy_level: 2,
                preparation_time: 20,
                available: true
              },
              { 
                id: 4, 
                name: 'Thai Iced Tea', 
                description: 'Sweet and creamy traditional Thai tea', 
                price: 4.99, 
                category: 'Beverages',
                image_url: null,
                dietary_info: [],
                spicy_level: 0,
                preparation_time: 3,
                available: true
              },
              { 
                id: 5, 
                name: 'Mango Sticky Rice', 
                description: 'Sweet sticky rice with fresh mango and coconut sauce', 
                price: 8.99, 
                category: 'Desserts',
                image_url: null,
                dietary_info: ['vegetarian'],
                spicy_level: 0,
                preparation_time: 8,
                available: true
              },
            ];
            setMenuItems(fallbackMenu);
          } else {
            setMenuError('Failed to load menu.');
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to load menu.'
            });
          }
        } else {
          setMenuItems(data || []);
        }
      } catch (err) {
        console.error('Menu fetch exception:', err);
        setMenuError('Failed to load menu.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load menu.'
        });
      }
      
      setMenuLoading(false);
    };
    fetchMenu();
  }, []);

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  // Enhanced filtering with search
  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.available;
  });

  const updateQuantity = (itemId: number, change: number) => {
    const existingItem = orderItems.find(item => item.id === itemId);
    
    if (existingItem) {
      if (existingItem.quantity + change <= 0) {
        const filtered = orderItems.filter(item => item.id !== itemId);
        updateOrder(filtered);
      } else {
        const updated = orderItems.map(item =>
          item.id === itemId 
            ? { ...item, quantity: item.quantity + change }
            : item
        );
        updateOrder(updated);
      }
    } else if (change > 0) {
      const menuItem = menuItems.find(item => item.id === itemId);
      if (menuItem) {
        const newItem: OrderItem = {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: change
        };
        const updated = [...orderItems, newItem];
        updateOrder(updated);
      }
    }
  };

  const callWaiter = async () => {
    try {
      // Update the order in database to mark waiter called
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
      } else {
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

  const updateOrderItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item from order
      const updatedItems = orderItems.filter(item => item.id !== itemId);
      updateOrder(updatedItems);
    } else {
      // Update item quantity
      const updatedItems = orderItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      updateOrder(updatedItems);
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          CHANOLY NOODLE
        </h1>
        
        <p className="text-muted-foreground">Table {tableId}</p>
      </div>

      {menuLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading our delicious menu...</p>
          </div>
        </div>
      ) : menuError ? (
        <div className="text-center text-red-500 py-8">{menuError}</div>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search for your favorite dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "menu" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMenu.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <p className="text-lg mb-2">No dishes found</p>
                  <p className="text-sm">
                    {searchTerm || selectedCategory !== "All" 
                      ? "Try adjusting your search or filter criteria."
                      : "Our menu is being prepared. Please check back soon!"
                    }
                  </p>
                </div>
              </div>
            ) : (
              filteredMenu.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  {/* Item Image */}
                  {item.image_url && (
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-orange-600 text-white text-xs">
                          ${item.price}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{item.name}</span>
                          {item.spicy_level && item.spicy_level > 0 && (
                            <Badge 
                              className={`${spicyLevels.find(l => l.value === item.spicy_level)?.color} text-xs flex-shrink-0`}
                              variant="outline"
                            >
                              <Flame className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">{spicyLevels.find(l => l.value === item.spicy_level)?.label}</span>
                              <span className="sm:hidden">{item.spicy_level}</span>
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-600 leading-relaxed text-sm line-clamp-2">
                          {item.description}
                        </CardDescription>
                        
                        {/* Dietary Information */}
                        {item.dietary_info && item.dietary_info.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {item.dietary_info.map((diet) => {
                              const option = dietaryOptions.find(o => o.value === diet);
                              if (!option) return null;
                              const Icon = option.icon;
                              return (
                                <Badge key={diet} className={`${option.color} text-xs`} variant="outline">
                                  <Icon className="w-3 h-3 mr-1" />
                                  <span className="hidden sm:inline">{option.label}</span>
                                  <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Preparation Time */}
                        {item.preparation_time && (
                          <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{item.preparation_time} min</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Price (if no image) */}
                      {!item.image_url && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl sm:text-2xl font-bold text-orange-600">${item.price}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={!orderItems.find(order => order.id === item.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-medium text-sm">
                          {orderItems.find(order => order.id === item.id)?.quantity || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="fresh"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="rounded-full px-3 sm:px-4 text-xs sm:text-sm"
                      >
                        Add to Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {orderItems.length > 0 && (
          <Button 
            onClick={() => setEditOrderDialogOpen(true)} 
            variant="outline" 
            className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white text-xs sm:text-sm"
          >
            <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Edit Order ({totalItems})</span>
            <span className="sm:hidden">Edit ({totalItems})</span>
          </Button>
        )}
        <Button 
          onClick={callWaiter} 
          variant="outline" 
          className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white text-xs sm:text-sm"
        >
          <Phone className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Call Waiter</span>
          <span className="sm:hidden">Waiter</span>
        </Button>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={editOrderDialogOpen} onOpenChange={setEditOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Your Order</DialogTitle>
          </DialogHeader>
          
          {orderItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items in your order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Order Items */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Current Order Items</h3>
                <div className="space-y-2 sm:space-y-3">
                  {orderItems.map((item) => (
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
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditOrderDialogOpen(false);
                    toast({
                      title: "Order Updated",
                      description: "Your order has been updated successfully."
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuDisplay;