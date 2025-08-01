-- Create menu_items table for restaurant menu management
CREATE TABLE public.menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  preparation_time INTEGER, -- in minutes
  dietary_info TEXT[], -- array of dietary tags (vegetarian, vegan, gluten-free, etc.)
  spicy_level INTEGER DEFAULT 0 CHECK (spicy_level >= 0 AND spicy_level <= 5), -- 0-5 scale
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurant_settings table for restaurant configuration
CREATE TABLE public.restaurant_settings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Restaurant Name',
  contact TEXT,
  operating_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default restaurant settings
INSERT INTO public.restaurant_settings (name, contact, operating_hours) 
VALUES ('CHANOLY NOODLE', '+1 (555) 123-4567', 'Mon-Sun: 11:00 AM - 10:00 PM');

-- Insert some sample menu items
INSERT INTO public.menu_items (name, description, price, category, preparation_time, dietary_info, spicy_level) VALUES
('Grilled Salmon', 'Fresh Atlantic salmon grilled to perfection with herbs and lemon', 24.99, 'Main Course', 20, ARRAY['gluten-free'], 1),
('Truffle Pasta', 'Homemade pasta with truffle cream sauce and parmesan', 22.99, 'Main Course', 15, ARRAY['vegetarian'], 0),
('Caesar Salad', 'Crisp romaine lettuce with caesar dressing and croutons', 14.99, 'Appetizer', 8, ARRAY['vegetarian'], 0),
('Craft Beer', 'Local craft beer selection', 8.99, 'Beverages', 2, ARRAY['gluten-free'], 0),
('Chocolate Lava Cake', 'Warm chocolate cake with molten center and vanilla ice cream', 9.99, 'Dessert', 10, ARRAY['vegetarian'], 0),
('Spicy Ramen', 'Traditional ramen with spicy broth and tender pork', 18.99, 'Main Course', 12, ARRAY['none'], 3),
('Vegetable Stir Fry', 'Fresh vegetables stir-fried in light soy sauce', 16.99, 'Main Course', 10, ARRAY['vegetarian', 'vegan'], 2),
('Green Tea', 'Premium Japanese green tea', 4.99, 'Beverages', 3, ARRAY['vegan', 'gluten-free'], 0);

-- Enable Row Level Security
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items (public read for menu display)
CREATE POLICY "Anyone can view menu items" 
ON public.menu_items 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify menu items" 
ON public.menu_items 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for restaurant_settings
CREATE POLICY "Anyone can view restaurant settings" 
ON public.restaurant_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify restaurant settings" 
ON public.restaurant_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 