-- Create reddit_leads table
CREATE TABLE IF NOT EXISTS reddit_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  selftext TEXT,
  subreddit TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  url TEXT NOT NULL,
  created_utc BIGINT,
  author TEXT,
  reasoning TEXT,
  sample_pitch TEXT,
  keyword TEXT,
  product_name TEXT,
  product_description TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reddit_leads_user_id ON reddit_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_reddit_leads_saved_at ON reddit_leads(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_leads_subreddit ON reddit_leads(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_leads_keyword ON reddit_leads(keyword);

-- Enable Row Level Security
ALTER TABLE reddit_leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reddit leads" ON reddit_leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reddit leads" ON reddit_leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reddit leads" ON reddit_leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reddit leads" ON reddit_leads
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reddit_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reddit_leads_updated_at
  BEFORE UPDATE ON reddit_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_reddit_leads_updated_at();
