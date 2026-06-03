-- Migration: Secure Orders & Order Items Tables
-- This ensures that users cannot extract all orders from the public anon key.

-- 1. Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. Drop overly permissive policies if they exist (clean up)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;

-- 4. Create Policy: Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- 5. Create Policy: Users can view their own order items
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Note: We do NOT allow users to INSERT/UPDATE/DELETE orders directly via the client API.
-- All inserts and updates for orders should go through the secure backend API 
-- (which uses the SUPABASE_SERVICE_ROLE_KEY and automatically bypasses RLS).
-- If there are any client-side inserts (e.g. legacy code), they will be blocked, 
-- which is exactly what we want for security.
