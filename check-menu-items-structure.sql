-- Check the current structure of menu_items table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'menu_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing menu items
SELECT COUNT(*) as item_count FROM menu_items;

-- Show sample data if any exists
SELECT * FROM menu_items LIMIT 3; 