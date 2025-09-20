-- Fix user data isolation issues
-- This script ensures all tables have proper RLS policies

-- Enable RLS on all tables that might be missing it
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own background jobs" ON public.background_jobs;
DROP POLICY IF EXISTS "Users can manage own lead analytics" ON public.lead_analytics;

-- Create comprehensive RLS policies for background_jobs
CREATE POLICY "Users can view own background jobs" ON public.background_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own background jobs" ON public.background_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own background jobs" ON public.background_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own background jobs" ON public.background_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for lead_analytics
CREATE POLICY "Users can view own lead analytics" ON public.lead_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead analytics" ON public.lead_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead analytics" ON public.lead_analytics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead analytics" ON public.lead_analytics
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure all existing tables have proper RLS policies
-- Products policies (ensure they exist)
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Leads policies (ensure they exist)
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

CREATE POLICY "Users can view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- API keys policies (ensure they exist)
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;

CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies (ensure they exist)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- User subreddits policies (ensure they exist)
DROP POLICY IF EXISTS "Users can view own subreddits" ON public.user_subreddits;
DROP POLICY IF EXISTS "Users can insert own subreddits" ON public.user_subreddits;
DROP POLICY IF EXISTS "Users can delete own subreddits" ON public.user_subreddits;

CREATE POLICY "Users can view own subreddits" ON public.user_subreddits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subreddits" ON public.user_subreddits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subreddits" ON public.user_subreddits
  FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies (ensure they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'products', 'leads', 'background_jobs', 'api_keys', 'subscriptions', 'user_subreddits', 'lead_analytics')
ORDER BY tablename;

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
