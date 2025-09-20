-- Truleado Database Schema
-- This schema matches the actual application requirements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'past_due')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  features TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  pain_points TEXT[] DEFAULT '{}',
  ideal_customer_profile TEXT,
  subreddits TEXT[] DEFAULT '{}', -- Array of subreddit names
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subreddits table (master list of available subreddits)
CREATE TABLE public.subreddits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'entrepreneur', 'smallbusiness'
  display_name TEXT, -- e.g., 'Entrepreneur', 'Small Business'
  description TEXT,
  subscribers INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  category TEXT, -- e.g., 'business', 'tech', 'marketing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  reddit_post_id TEXT NOT NULL, -- Reddit's post ID
  reddit_post_url TEXT NOT NULL, -- Full Reddit URL
  title TEXT NOT NULL,
  content TEXT,
  subreddit TEXT NOT NULL, -- Subreddit name
  author TEXT NOT NULL, -- Reddit username
  score INTEGER DEFAULT 0, -- Reddit upvotes
  num_comments INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  tags TEXT[] DEFAULT '{}', -- User-defined tags
  notes TEXT, -- User notes about the lead
  ai_analysis JSONB, -- Store AI analysis results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reddit_post_id) -- Prevent duplicate leads per user
);

-- Create subscriptions table (Paddle integration)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id TEXT UNIQUE,
  paddle_plan_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table (user's external API credentials)
CREATE TABLE public.api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reddit_client_id TEXT,
  reddit_client_secret TEXT,
  openai_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subreddits table (many-to-many: users can select which subreddits to monitor)
CREATE TABLE public.user_subreddits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subreddit_id UUID REFERENCES public.subreddits(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subreddit_id)
);

-- Create lead_analytics table (for tracking lead performance)
CREATE TABLE public.lead_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  leads_found INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- Subreddits policies (public read, admin write)
CREATE POLICY "Anyone can view subreddits" ON public.subreddits
  FOR SELECT USING (true);

-- User subreddits policies
CREATE POLICY "Users can view own subreddits" ON public.user_subreddits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subreddits" ON public.user_subreddits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subreddits" ON public.user_subreddits
  FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Lead analytics policies
CREATE POLICY "Users can view own analytics" ON public.lead_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.lead_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.lead_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subreddits (matching the application's requirements)
INSERT INTO public.subreddits (name, display_name, description, category) VALUES
('entrepreneur', 'Entrepreneur', 'For entrepreneurs and business owners', 'business'),
('smallbusiness', 'Small Business', 'Small business discussions and advice', 'business'),
('marketing', 'Marketing', 'Marketing strategies, tips, and discussions', 'marketing'),
('startups', 'Startups', 'Startup discussions, advice, and networking', 'business'),
('saas', 'SaaS', 'Software as a Service discussions and reviews', 'tech'),
('webdev', 'Web Development', 'Web development discussions and resources', 'tech'),
('programming', 'Programming', 'Programming discussions and help', 'tech'),
('business', 'Business', 'General business discussions and advice', 'business'),
('productivity', 'Productivity', 'Productivity tools, tips, and discussions', 'productivity'),
('freelance', 'Freelance', 'Freelancing discussions and opportunities', 'business'),
('digitalnomad', 'Digital Nomad', 'Remote work and location independence', 'lifestyle'),
('sideproject', 'Side Project', 'Side project discussions and showcases', 'business'),
('indiehackers', 'Indie Hackers', 'Independent entrepreneurs and makers', 'business'),
('ecommerce', 'E-commerce', 'Online business and e-commerce discussions', 'business'),
('socialmedia', 'Social Media', 'Social media marketing and strategies', 'marketing'),
('seo', 'SEO', 'Search engine optimization discussions', 'marketing'),
('analytics', 'Analytics', 'Data analytics and business intelligence', 'tech'),
('automation', 'Automation', 'Business process automation', 'tech'),
('nocode', 'No Code', 'No-code and low-code development', 'tech'),
('ai', 'Artificial Intelligence', 'AI tools and discussions', 'tech');

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_product_id ON public.leads(product_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_subreddit ON public.leads(subreddit);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_subreddits_name ON public.subreddits(name);
CREATE INDEX idx_subreddits_active ON public.subreddits(active);
CREATE INDEX idx_user_subreddits_user_id ON public.user_subreddits(user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_lead_analytics_user_id ON public.lead_analytics(user_id);
CREATE INDEX idx_lead_analytics_date ON public.lead_analytics(date);

-- Create a view for lead statistics
CREATE VIEW public.lead_stats AS
SELECT 
  l.user_id,
  l.product_id,
  p.name as product_name,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE l.status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE l.status = 'contacted') as contacted_leads,
  COUNT(*) FILTER (WHERE l.status = 'interested') as interested_leads,
  COUNT(*) FILTER (WHERE l.status = 'converted') as converted_leads,
  COUNT(DISTINCT l.subreddit) as subreddits_monitored
FROM public.leads l
JOIN public.products p ON l.product_id = p.id
GROUP BY l.user_id, l.product_id, p.name;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

