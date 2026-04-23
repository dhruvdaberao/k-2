-- Add delivery_address JSONB column to orders table
-- This stores the full structured address at the time of checkout
-- Run this in the Supabase SQL Editor

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address JSONB DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN orders.delivery_address IS 'Structured delivery address captured at checkout time: { full_name, phone, address_line, city, state, pincode }';
