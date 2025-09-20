# Supabase Setup Guide for Truleado

This guide will walk you through setting up Supabase for your Truleado application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `truleado` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this takes a few minutes)

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Other environment variables...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Step 4: Create Database Tables

**Option 1: Use the complete schema file (Recommended)**

Copy the contents of `database-schema.sql` and run it in your Supabase SQL Editor. This file contains the complete, optimized schema that matches your application requirements.

**Option 2: Run the SQL manually**

If you prefer to run the SQL step by step, use the following simplified version:

```sql
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
  target_audience TEXT,
  subreddits TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
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
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reddit_post_id)
);

-- Create subreddits table
CREATE TABLE public.subreddits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  subscribers INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
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

-- Create api_keys table
CREATE TABLE public.api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reddit_client_id TEXT,
  reddit_client_secret TEXT,
  openai_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (simplified version)
CREATE POLICY "Users can manage own data" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own leads" ON public.leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view subreddits" ON public.subreddits FOR SELECT USING (true);
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- Create user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default subreddits
INSERT INTO public.subreddits (name, display_name, description, category) VALUES
('entrepreneur', 'Entrepreneur', 'For entrepreneurs and business owners', 'business'),
('smallbusiness', 'Small Business', 'Small business discussions', 'business'),
('marketing', 'Marketing', 'Marketing strategies and tips', 'marketing'),
('startups', 'Startups', 'Startup discussions and advice', 'business'),
('saas', 'SaaS', 'Software as a Service discussions', 'tech'),
('webdev', 'Web Development', 'Web development discussions', 'tech'),
('programming', 'Programming', 'Programming discussions', 'tech'),
('business', 'Business', 'General business discussions', 'business'),
('productivity', 'Productivity', 'Productivity tools and tips', 'productivity'),
('freelance', 'Freelance', 'Freelancing discussions', 'business');
```

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. Go to **Authentication** → **Providers**
4. Enable **Email** provider
5. Optionally enable **Google** or other providers

## Step 6: Test Your Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000`
3. Try signing up with a test email
4. Check your Supabase dashboard to see if the user was created

## Step 7: Production Setup

For production deployment:

1. Update your environment variables with production URLs
2. Add your production domain to Supabase redirect URLs
3. Set up proper CORS policies
4. Configure email templates in Supabase

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**: Check that your environment variables are correctly set
2. **"Row Level Security" errors**: Make sure you've run the RLS policies SQL
3. **"Profile not created" error**: Check the trigger function is working
4. **CORS errors**: Add your domain to Supabase allowed origins

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

Once Supabase is set up:

1. Test the authentication flow
2. Set up Reddit API credentials
3. Configure Paddle for payments
4. Deploy to production

Your Truleado application is now ready to use Supabase as the backend!
