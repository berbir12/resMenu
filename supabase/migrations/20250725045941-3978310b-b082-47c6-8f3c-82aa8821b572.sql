-- Completely disable RLS for orders table (simplest solution for development)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Update QR codes to use UUIDs instead of table numbers
UPDATE public.restaurant_tables 
SET qr_code_data = json_build_object('tableUuid', id, 'type', 'dual-purpose')
WHERE qr_code_data::text LIKE '%"tableId"%';

-- Update the updated_at column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;