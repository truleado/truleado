-- Fix RLS policies for testing and development
-- This script addresses the "new row violates row-level security policy" error

-- First, let's check current RLS policies
-- You can run this in your Supabase SQL editor

-- Temporarily disable RLS for testing (BE CAREFUL IN PRODUCTION!)
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or better yet, create proper policies for testing

-- Create a test user profile if it doesn't exist
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  'Test User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create policies that allow the test user to access everything
CREATE POLICY IF NOT EXISTS "Test user can do everything on products" ON products
FOR ALL USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY IF NOT EXISTS "Test user can do everything on leads" ON leads
FOR ALL USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY IF NOT EXISTS "Test user can do everything on profiles" ON profiles
FOR ALL USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid);

-- Alternative: Create a more permissive policy for development
-- (Only use this in development, never in production!)

-- For development only - allow all operations
-- DROP POLICY IF EXISTS "Test user can do everything on products" ON products;
-- DROP POLICY IF EXISTS "Test user can do everything on leads" ON leads;
-- DROP POLICY IF EXISTS "Test user can do everything on profiles" ON profiles;

-- CREATE POLICY "Allow all for development" ON products FOR ALL USING (true);
-- CREATE POLICY "Allow all for development" ON leads FOR ALL USING (true);
-- CREATE POLICY "Allow all for development" ON profiles FOR ALL USING (true);

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('products', 'leads', 'profiles')
ORDER BY tablename, policyname;
