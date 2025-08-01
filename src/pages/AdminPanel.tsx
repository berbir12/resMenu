import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Home,
  Settings,
  LogOut,
  Loader2,
  Search,
  Eye,
  Clock,
  Utensils,
  Leaf,
  Wheat,
  Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from "@/integrations/supabase/types";

type RestaurantSettingsRow = {
  id: number;
  name: string;
  contact: string;
  operating_hours: string;
  updated_at: string;
};

const AdminPanel = () => {
  // All hooks at the top
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    preparation_time: "",
    dietary_info: [] as string[],
    spicy_level: "0"
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({ table_number: '' });
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [editTable, setEditTable] = useState<any | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ user_id: '', username: '', role: '' });
  const [isEditStaffDialogOpen, setIsEditStaffDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<any | null>(null);
  const [settings, setSettings] = useState<RestaurantSettingsRow | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffActionLoading, setStaffActionLoading] = useState(false);
  
  // New state for enhanced menu management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Dietary options - these can be moved to database later
  const dietaryOptions = [
    { value: "vegetarian", label: "Vegetarian", icon: Leaf },
    { value: "vegan", label: "Vegan", icon: Leaf },
    { value: "gluten-free", label: "Gluten Free", icon: Wheat },
    { value: "spicy", label: "Spicy", icon: Flame }
  ];

  // Spicy levels - these can be moved to database later
  const spicyLevels = [
    { value: "0", label: "Not Spicy" },
    { value: "1", label: "Mild" },
    { value: "2", label: "Medium" },
    { value: "3", label: "Hot" },
    { value: "4", label: "Very Hot" },
    { value: "5", label: "Extreme" }
  ];

  useEffect(() => {
    // Check authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      // Check admin role
      supabase
        .from("admin_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data || data.role !== "admin") {
            setIsAdmin(false);
            setAdminError(
              error?.message ||
              (!data ? "No admin profile found for this user." : `Role is not admin: ${data.role}`)
            );
            console.error("Admin role check failed:", error, data);
          } else {
            setIsAdmin(true);
            setAdminError(null);
            fetchTables();
          }
        });
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders."
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchMenuItems();
      fetchStaff();
      fetchSettings();
      fetchOrders();
    }
  }, [user, isAdmin]);

  const fetchTables = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');
      
      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tables"
      });
    } finally {
      setTableLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    setMenuLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id');
      if (error) throw error;
      setMenuItems(data || []);
      
      // Extract unique categories from menu items
      const uniqueCategories = [...new Set(data?.map(item => item.category).filter(Boolean) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load menu items"
      });
    } finally {
      setMenuLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at');
      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff."
      });
    } finally {
      setStaffLoading(false);
    }
  };

  const addStaff = async () => {
    if (!newStaff.user_id || !newStaff.username || !newStaff.role) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "User ID, username, and role are required."
      });
      return;
    }
    if (!isAdmin) return;
    setStaffActionLoading(true);
    try {
      const { error } = await supabase.from('admin_profiles').insert([
        {
          user_id: newStaff.user_id,
          username: newStaff.username,
          role: newStaff.role
        }
      ]);
      if (error) throw error;
      setIsAddStaffDialogOpen(false);
      setNewStaff({ user_id: '', username: '', role: '' });
      fetchStaff();
      toast({
        variant: "default",
        title: "Staff Added",
        description: `${newStaff.username} was added as ${newStaff.role}.`
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add staff."
      });
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleEditStaff = async () => {
    if (!editStaff.username || !editStaff.role) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Username and role are required."
      });
      return;
    }
    if (!isAdmin) return;
    setStaffActionLoading(true);
    try {
      const { error } = await supabase.from('admin_profiles').update({
        username: editStaff.username,
        role: editStaff.role
      }).eq('id', editStaff.id);
      if (error) throw error;
      setIsEditStaffDialogOpen(false);
      setEditStaff(null);
      fetchStaff();
      toast({
        variant: "default",
        title: "Staff Updated",
        description: `${editStaff.username} was updated.`
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update staff."
      });
    } finally {
      setStaffActionLoading(false);
    }
  };

  const deleteStaff = async (id: string) => {
    if (!isAdmin) return;
    setStaffActionLoading(true);
    try {
      const { error } = await supabase.from('admin_profiles').delete().eq('id', id);
      if (error) throw error;
      fetchStaff();
      toast({
        variant: "default",
        title: "Staff Deleted",
        description: "Staff was deleted."
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete staff."
      });
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const addMenuItem = async () => {
    if (!isAdmin) return;
    if (!newItem.name || !newItem.price) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Name and price are required."
      });
      return;
    }
    setMenuActionLoading(true);
    try {
      const { error } = await supabase.from('menu_items').insert([
        {
          name: newItem.name,
          description: newItem.description || null,
          price: parseFloat(newItem.price),
          category: newItem.category || null,
          available: true,
          image_url: newItem.image_url || null,
          preparation_time: newItem.preparation_time ? parseInt(newItem.preparation_time) : null,
          dietary_info: newItem.dietary_info.length > 0 ? newItem.dietary_info : null,
          spicy_level: parseInt(newItem.spicy_level)
        }
      ]);
      if (error) throw error;
      setIsAddDialogOpen(false);
      setNewItem({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        preparation_time: "",
        dietary_info: [],
        spicy_level: "0"
      });
      fetchMenuItems();
      toast({
        variant: "default",
        title: "Menu Item Added",
        description: newItem.name + " was added to the menu."
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add menu item."
      });
    } finally {
      setMenuActionLoading(false);
    }
  };

  const handleEditMenuItem = async () => {
    if (!editItem || !editItem.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No item selected for editing."
      });
      return;
    }
    
    if (!editItem.name || !editItem.price) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Name and price are required."
      });
      return;
    }
    
    if (!isAdmin) return;
    try {
      const { error } = await supabase.from('menu_items').update({
        name: editItem.name,
        description: editItem.description || null,
        price: parseFloat(editItem.price),
        category: editItem.category || null,
        available: editItem.available,
        image_url: editItem.image_url || null,
        preparation_time: editItem.preparation_time ? parseInt(editItem.preparation_time) : null,
        dietary_info: editItem.dietary_info?.length > 0 ? editItem.dietary_info : null,
        spicy_level: parseInt(editItem.spicy_level || "0")
      }).eq('id', editItem.id);
      if (error) throw error;
      setEditDialogOpen(false);
      setEditItem(null);
      fetchMenuItems();
      toast({
        variant: "default",
        title: "Menu Item Updated",
        description: editItem.name + " was updated."
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update menu item."
      });
    }
  };

  const toggleAvailability = async (id: number, current: boolean) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !current })
        .eq('id', id);
      if (error) throw error;
      fetchMenuItems();
      toast({
        variant: "default",
        title: "Availability Updated",
        description: "Menu item availability was updated."
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability."
      });
    }
  };

  const deleteMenuItem = async (id: number) => {
    if (!isAdmin) return;
    setMenuActionLoading(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchMenuItems();
      toast({
        variant: "default",
        title: "Menu Item Deleted",
        description: "Menu item was deleted."
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete menu item."
      });
    } finally {
      setMenuActionLoading(false);
    }
  };

  const addTable = async () => {
    if (!newTable.table_number) {
      toast({
        variant: "destructive",
        title: "Missing Field",
        description: "Table number is required."
      });
      return;
    }
    if (!isAdmin) return;
    setTableActionLoading(true);
    try {
      const { error } = await supabase.from('restaurant_tables').insert([
        {
          table_number: Number(newTable.table_number),
          qr_code_data: '',
          status: 'active'
        }
      ]);
      if (error) throw error;
      setIsAddTableDialogOpen(false);
      setNewTable({ table_number: '' });
      fetchTables();
      toast({
        variant: "default",
        title: "Table Added",
        description: `Table ${newTable.table_number} was added.`
      });
    } catch (error) {
      console.error('Error adding table:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add table."
      });
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleEditTable = async () => {
    if (!editTable.table_number) {
      toast({
        variant: "destructive",
        title: "Missing Field",
        description: "Table number is required."
      });
      return;
    }
    if (!isAdmin) return;
    try {
      const { error } = await supabase.from('restaurant_tables').update({
        table_number: Number(editTable.table_number)
      }).eq('id', editTable.id);
      if (error) throw error;
      setIsEditTableDialogOpen(false);
      setEditTable(null);
      fetchTables();
      toast({
        variant: "default",
        title: "Table Updated",
        description: `Table ${editTable.table_number} was updated.`
      });
    } catch (error) {
      console.error('Error updating table:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update table."
      });
    }
  };

  const deleteTable = async (id: number) => {
    if (!isAdmin) return;
    setTableActionLoading(true);
    try {
      const { error } = await supabase.from('restaurant_tables').delete().eq('id', String(id));
      if (error) throw error;
      fetchTables();
      toast({
        variant: "default",
        title: "Table Deleted",
        description: "Table was deleted."
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete table."
      });
    } finally {
      setTableActionLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      setSettings(data || null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load restaurant settings."
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !settings.name) {
      toast({
        variant: "destructive",
        title: "Missing Field",
        description: "Restaurant name is required."
      });
      return;
    }
    if (!isAdmin) return;
    try {
      let error;
      if (settings.id) {
        ({ error } = await supabase
          .from('restaurant_settings')
          .update({
            name: settings.name,
            contact: settings.contact,
            operating_hours: settings.operating_hours,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id));
      } else {
        ({ error } = await supabase
          .from('restaurant_settings')
          .insert([
            {
              name: settings.name,
              contact: settings.contact,
              operating_hours: settings.operating_hours,
              updated_at: new Date().toISOString()
            }
          ]));
      }
      if (error) throw error;
      fetchSettings();
      toast({
        variant: "default",
        title: "Settings Saved",
        description: "Restaurant settings updated."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings."
      });
    }
  };

  // Analytics calculations
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? (orders.reduce((sum, o) => sum + Number(o.total_amount), 0) / totalOrders) : 0;

  // Enhanced menu filtering and sorting
  const filteredAndSortedMenuItems = menuItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "price") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase();
        bValue = bValue?.toString().toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  // Popular items calculation
  const itemCounts: Record<string, number> = {};
  orders.forEach((order) => {
    try {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      items.forEach((item: any) => {
        if (item.name) {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
        }
      });
    } catch {}
  });
  const popularItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
  // Recent activity
  const recentOrders = orders.slice(0, 5);

  // Early returns (no hooks after this)
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div>Access denied. You do not have admin privileges.</div>
          {adminError && <div className="text-red-500 mt-2">{adminError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your restaurant system</p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Back to Main
              </Button>
            </Link>
            <Link to="/staff">
              <Button variant="secondary">Staff Dashboard</Button>
            </Link>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-success mr-2" />
                <span className="text-2xl font-bold">${totalRevenue.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingCart className="w-4 h-4 text-primary mr-2" />
                <span className="text-2xl font-bold">{totalOrders}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-primary mr-2" />
                <span className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-primary mr-2" />
                <span className="text-2xl font-bold">{menuItems.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="tables">Table QR Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="menu" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={newItem.category}
                          onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                          placeholder="Enter category (e.g., Main Course, Appetizer)"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Enter item description"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                          placeholder="Enter price"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preparation_time">Prep Time (min)</Label>
                        <Input
                          id="preparation_time"
                          type="number"
                          value={newItem.preparation_time}
                          onChange={(e) => setNewItem({...newItem, preparation_time: e.target.value})}
                          placeholder="Minutes"
                        />
                      </div>
                      <div>
                        <Label htmlFor="spicy_level">Spicy Level</Label>
                        <Select value={newItem.spicy_level} onValueChange={(value) => setNewItem({...newItem, spicy_level: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {spicyLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={newItem.image_url}
                        onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <Label>Dietary Information</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {dietaryOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={newItem.dietary_info.includes(option.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const updated = newItem.dietary_info.includes(option.value)
                                  ? newItem.dietary_info.filter((d: string) => d !== option.value)
                                  : [...newItem.dietary_info, option.value];
                                setNewItem({...newItem, dietary_info: updated});
                              }}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              {option.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button onClick={addMenuItem} className="w-full" disabled={menuActionLoading}>
                        {menuActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                        Add Item
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
            
            {menuLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedMenuItems.length === 0 ? (
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Utensils className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No menu items found</h3>
                      <p className="text-muted-foreground text-center">
                        {searchTerm || selectedCategory !== "All" 
                          ? "Try adjusting your search or filter criteria."
                          : "Get started by adding your first menu item."
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedMenuItems.map((item) => (
                    <Card key={item.id} className="bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {item.image_url && (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {item.name}
                                  {item.spicy_level > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {spicyLevels.find(l => l.value === item.spicy_level.toString())?.label}
                                    </Badge>
                                  )}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary">{item.category}</Badge>
                                  <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                    {item.available ? "Available" : "Unavailable"}
                                  </Badge>
                                  {item.preparation_time && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {item.preparation_time}min
                                    </Badge>
                                  )}
                                  {item.dietary_info?.map((diet: string) => {
                                    const option = dietaryOptions.find(o => o.value === diet);
                                    if (!option) return null;
                                    const Icon = option.icon;
                                    return (
                                      <Badge key={diet} variant="outline" className="flex items-center gap-1">
                                        <Icon className="w-3 h-3" />
                                        {option.label}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">${item.price}</span>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => { setPreviewDialogOpen(true); setPreviewItem(item); }}
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => toggleAvailability(item.id, item.available)}
                                title="Toggle Availability"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => { setEditDialogOpen(true); setEditItem(item); }}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteMenuItem(item.id)} 
                                disabled={menuActionLoading}
                                title="Delete"
                              >
                                {menuActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Table QR Codes</CardTitle>
                <Button onClick={() => setIsAddTableDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Table
                </Button>
              </CardHeader>
              <CardContent>
                {tableLoading ? (
                  <div className="flex justify-center items-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tables.map((table) => (
                      <div key={table.id} className="relative">
                        <QRCodeGenerator tableUuid={table.id} tableNumber={table.table_number} />
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="outline" onClick={() => { setIsEditTableDialogOpen(true); setEditTable(table); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteTable(table.id)} disabled={tableActionLoading}>
                            {tableActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Add Table Dialog */}
            <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Table</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-table-number">Table Number</Label>
                    <Input
                      id="add-table-number"
                      value={newTable.table_number}
                      onChange={e => setNewTable({ table_number: e.target.value })}
                      placeholder="Enter table number"
                    />
                  </div>
                  {isAdmin && (
                    <Button onClick={addTable} className="w-full" disabled={tableActionLoading}>
                      {tableActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                      Add Table
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {/* Edit Table Dialog */}
            <Dialog open={isEditTableDialogOpen} onOpenChange={setIsEditTableDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Table</DialogTitle>
                </DialogHeader>
                {editTable && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-table-number">Table Number</Label>
                      <Input
                        id="edit-table-number"
                        value={editTable.table_number}
                        onChange={e => setEditTable({ ...editTable, table_number: e.target.value })}
                        placeholder="Enter table number"
                      />
                    </div>
                    {isAdmin && (
                      <Button onClick={handleEditTable} className="w-full">Save Changes</Button>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6">
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {popularItems.length === 0 ? (
                      <div>No data available.</div>
                    ) : (
                      popularItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{item}</span>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ordersLoading ? (
                      <div>Loading...</div>
                    ) : recentOrders.length === 0 ? (
                      <div>No recent orders.</div>
                    ) : (
                      recentOrders.map((activity, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Order {activity.id.slice(0, 8)} - {activity.status}</p>
                            <p className="text-sm text-muted-foreground">Table: {activity.table_id} | {new Date(activity.created_at).toLocaleString()}</p>
                          </div>
                          <Badge variant="outline">${activity.total_amount}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Restaurant Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div>Loading...</div>
                ) : settings ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="restaurant-name">Restaurant Name</Label>
                      <Input
                        id="restaurant-name"
                        value={settings.name}
                        onChange={e => setSettings({ ...settings, name: e.target.value })}
                        placeholder="Enter restaurant name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact">Contact Information</Label>
                      <Input
                        id="contact"
                        value={settings.contact}
                        onChange={e => setSettings({ ...settings, contact: e.target.value })}
                        placeholder="Enter contact information"
                      />
                    </div>
                    <div>
                      <Label htmlFor="operating-hours">Operating Hours</Label>
                      <Input
                        id="operating-hours"
                        value={settings.operating_hours}
                        onChange={e => setSettings({ ...settings, operating_hours: e.target.value })}
                        placeholder="Enter operating hours"
                      />
                    </div>
                    {isAdmin && (
                      <Button onClick={saveSettings}>Save Settings</Button>
                    )}
                  </div>
                ) : (
                  <div>No settings found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Staff Management</CardTitle>
                <Button onClick={() => setIsAddStaffDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Staff
                </Button>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="flex justify-center items-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">Username</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map((s) => (
                          <tr key={s.id}>
                            <td className="px-4 py-2">{s.username}</td>
                            <td className="px-4 py-2">{s.role}</td>
                            <td className="px-4 py-2">{s.user_id}</td>
                            <td className="px-4 py-2">
                              <Button size="sm" variant="outline" onClick={() => { setIsEditStaffDialogOpen(true); setEditStaff(s); }} disabled={staffActionLoading}>
                                {staffActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteStaff(s.id)} disabled={staffActionLoading}>
                                {staffActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Add Staff Dialog */}
            <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-staff-user-id">User ID</Label>
                    <Input
                      id="add-staff-user-id"
                      value={newStaff.user_id}
                      onChange={e => setNewStaff({ ...newStaff, user_id: e.target.value })}
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-staff-username">Username</Label>
                    <Input
                      id="add-staff-username"
                      value={newStaff.username}
                      onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-staff-role">Role</Label>
                    <Input
                      id="add-staff-role"
                      value={newStaff.role}
                      onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                      placeholder="Enter role (e.g. admin, staff)"
                    />
                  </div>
                  <Button onClick={addStaff} className="w-full" disabled={staffActionLoading}>
                    {staffActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                    Add Staff
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Edit Staff Dialog */}
            <Dialog open={isEditStaffDialogOpen} onOpenChange={setIsEditStaffDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Staff</DialogTitle>
                </DialogHeader>
                {editStaff && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-staff-username">Username</Label>
                      <Input
                        id="edit-staff-username"
                        value={editStaff.username}
                        onChange={e => setEditStaff({ ...editStaff, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-staff-role">Role</Label>
                      <Input
                        id="edit-staff-role"
                        value={editStaff.role}
                        onChange={e => setEditStaff({ ...editStaff, role: e.target.value })}
                        placeholder="Enter role (e.g. admin, staff)"
                      />
                    </div>
                    <Button onClick={handleEditStaff} className="w-full" disabled={staffActionLoading}>
                      {staffActionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                      Save Changes
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editItem.name}
                    onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editItem.category || ''}
                    onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                    placeholder="Enter category (e.g., Main Course, Appetizer)"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editItem.description || ''}
                  onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                  placeholder="Enter item description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Price *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editItem.price}
                    onChange={e => setEditItem({ ...editItem, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-preparation_time">Prep Time (min)</Label>
                  <Input
                    id="edit-preparation_time"
                    type="number"
                    value={editItem.preparation_time || ''}
                    onChange={e => setEditItem({ ...editItem, preparation_time: e.target.value })}
                    placeholder="Minutes"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-spicy_level">Spicy Level</Label>
                  <Select value={editItem.spicy_level?.toString() || "0"} onValueChange={(value) => setEditItem({ ...editItem, spicy_level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spicyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-image_url">Image URL</Label>
                <Input
                  id="edit-image_url"
                  value={editItem.image_url || ''}
                  onChange={e => setEditItem({ ...editItem, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label>Dietary Information</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {dietaryOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={(editItem.dietary_info || []).includes(option.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const currentDietary = editItem.dietary_info || [];
                          const updated = currentDietary.includes(option.value)
                            ? currentDietary.filter((d: string) => d !== option.value)
                            : [...currentDietary, option.value];
                          setEditItem({ ...editItem, dietary_info: updated });
                        }}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Button onClick={handleEditMenuItem} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Menu Item</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {previewItem.image_url ? (
                  <img 
                    src={previewItem.image_url} 
                    alt={previewItem.name} 
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-lg text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{previewItem.name}</h3>
                <p className="text-lg text-muted-foreground">{previewItem.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{previewItem.category}</Badge>
                  <Badge className={previewItem.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {previewItem.available ? "Available" : "Unavailable"}
                  </Badge>
                  {previewItem.preparation_time && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {previewItem.preparation_time}min
                    </Badge>
                  )}
                  {previewItem.dietary_info?.map((diet: string) => {
                    const option = dietaryOptions.find(o => o.value === diet);
                    if (!option) return null;
                    const Icon = option.icon;
                    return (
                      <Badge key={diet} variant="outline" className="flex items-center gap-1">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </Badge>
                    );
                  })}
                  {previewItem.spicy_level > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {spicyLevels.find(l => l.value === previewItem.spicy_level.toString())?.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;