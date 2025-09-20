-- Migration script for leads discovery system
-- Run this in your Supabase SQL Editor

-- Create leads table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  reddit_post_id TEXT NOT NULL,
  reddit_post_url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  subreddit TEXT NOT NULL,
  author TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  relevance_score DECIMAL(3,1) DEFAULT 0.0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reddit_post_id)
);

-- Add missing columns to existing leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(3,1) DEFAULT 0.0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Add missing columns to existing products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pain_points TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ideal_customer_profile TEXT;

-- Create background_jobs table for lead discovery
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'reddit_monitoring',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'error')),
  interval_minutes INTEGER DEFAULT 60,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, job_type)
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own leads' AND tablename = 'leads') THEN
        CREATE POLICY "Users can manage own leads" ON public.leads FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own background jobs' AND tablename = 'background_jobs') THEN
        CREATE POLICY "Users can manage own background jobs" ON public.background_jobs FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_product_id ON public.leads(product_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_relevance_score ON public.leads(relevance_score);

CREATE INDEX IF NOT EXISTS idx_background_jobs_user_id ON public.background_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_product_id ON public.background_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON public.background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_next_run ON public.background_jobs(next_run);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_updated_at') THEN
        CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_background_jobs_updated_at') THEN
        CREATE TRIGGER update_background_jobs_updated_at BEFORE UPDATE ON public.background_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        -- Only set next_run if it's not already set (for immediate execution)
        IF NEW.next_run IS NULL THEN
            NEW.next_run = NOW() + (NEW.interval_minutes || ' minutes')::INTERVAL;
        END IF;
    ELSE
        NEW.next_run = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for next_run calculation (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_next_run_trigger') THEN
        CREATE TRIGGER calculate_next_run_trigger BEFORE INSERT OR UPDATE ON public.background_jobs FOR EACH ROW EXECUTE FUNCTION calculate_next_run();
    END IF;
END $$;
