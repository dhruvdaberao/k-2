-- Secure Supabase Storage Buckets
-- This prevents random visitors from uploading malware to your image buckets.

-- Ensure RLS is enabled on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone to READ (view) images from public buckets
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id IN ('product-images', 'carousel-images') );

-- 2. Restrict INSERT (upload) strictly to the admin email
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( auth.email() = 'keshvicrafts@gmail.com' );

-- 3. Restrict UPDATE (modify) strictly to the admin email
CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING ( auth.email() = 'keshvicrafts@gmail.com' );

-- 4. Restrict DELETE strictly to the admin email
CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING ( auth.email() = 'keshvicrafts@gmail.com' );
