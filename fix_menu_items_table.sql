-- Add missing columns to menu_items table
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS dietary_info TEXT[];
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS spicy_level INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add check constraint for spicy_level (drop first if exists, then add)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_spicy_level' 
        AND table_name = 'menu_items'
    ) THEN
        ALTER TABLE public.menu_items ADD CONSTRAINT check_spicy_level CHECK (spicy_level >= 0 AND spicy_level <= 5);
    END IF;
END $$;

-- Update existing rows with default values
UPDATE public.menu_items 
SET 
  image_url = COALESCE(image_url, NULL),
  preparation_time = COALESCE(preparation_time, 15),
  dietary_info = COALESCE(dietary_info, ARRAY[]::TEXT[]),
  spicy_level = COALESCE(spicy_level, 0)
WHERE image_url IS NULL OR preparation_time IS NULL OR dietary_info IS NULL OR spicy_level IS NULL;

-- Create restaurant_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Restaurant Name',
  contact TEXT,
  operating_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO public.restaurant_settings (name, contact, operating_hours)
SELECT 'Restaurant Name', 'Contact Info', 'Operating Hours'
WHERE NOT EXISTS (SELECT 1 FROM public.restaurant_settings);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.menu_items;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.menu_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.menu_items;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.restaurant_settings;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.menu_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.menu_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.menu_items FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users only" ON public.restaurant_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
DROP TRIGGER IF EXISTS update_restaurant_settings_updated_at ON public.restaurant_settings;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_settings_updated_at BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 