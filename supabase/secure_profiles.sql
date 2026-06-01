-- Run this script in your Supabase SQL Editor to secure your profiles table.
-- This prevents users from seeing other users' profile data (the vulnerability reported by your friend).

-- 1. Enable Row Level Security (RLS) on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly permissive policies (if any)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;

-- 3. Create secure policies:

-- Allow users to view ONLY their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING ( auth.uid() = id );

-- Allow users to insert ONLY their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Allow users to update ONLY their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Note: The admin API routes use the SERVICE_ROLE_KEY, which automatically bypasses RLS,
-- so your backend API routes will still work perfectly.
