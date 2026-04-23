-- Add delivery_address JSONB column to orders table
-- This stores the full structured address at the time of checkout
-- Run this in the Supabase SQL Editor

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address JSONB DEFAULT NULL;

-- Add cancelled_at timestamp column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.delivery_address IS 'Structured delivery address captured at checkout time: { full_name, phone, address_line, city, state, pincode }';
COMMENT ON COLUMN orders.cancelled_at IS 'Timestamp when order was cancelled by the user';
