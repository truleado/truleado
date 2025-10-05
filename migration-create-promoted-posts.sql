-- Create promoted_posts table to store generated promotional posts
CREATE TABLE IF NOT EXISTS promoted_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  subreddit TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('educational', 'problem-solution', 'community', 'promotional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promoted_posts_user_id ON promoted_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_promoted_posts_product_id ON promoted_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_promoted_posts_created_at ON promoted_posts(created_at DESC);

-- Enable RLS
ALTER TABLE promoted_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own promoted posts" ON promoted_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promoted posts" ON promoted_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promoted posts" ON promoted_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own promoted posts" ON promoted_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promoted_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_promoted_posts_updated_at
  BEFORE UPDATE ON promoted_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_promoted_posts_updated_at();
