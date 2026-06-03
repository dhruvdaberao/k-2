-- Add discount columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT null;

-- Add discount columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT null;
