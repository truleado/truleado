-- Fix RLS policies to allow proper database operations
-- Run this in your Supabase SQL editor

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('products', 'leads', 'profiles')
ORDER BY tablename, policyname;

-- Create a service role user for the application
-- This allows the app to bypass RLS when needed
DO $$
BEGIN
    -- Check if service role exists
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'truleado_service') THEN
        CREATE ROLE truleado_service;
        GRANT USAGE ON SCHEMA public TO truleado_service;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO truleado_service;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO truleado_service;
    END IF;
END $$;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create more permissive policies for development
-- These allow authenticated users to access their own data
CREATE POLICY "Authenticated users can manage products" ON products
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can manage leads" ON leads
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can manage profiles" ON profiles
FOR ALL USING (auth.uid() = id);

-- Allow service role to bypass RLS for system operations
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant service role permissions
GRANT ALL ON products TO truleado_service;
GRANT ALL ON leads TO truleado_service;
GRANT ALL ON profiles TO truleado_service;

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid
  )::uuid
$$;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('products', 'leads', 'profiles')
ORDER BY tablename, policyname;
