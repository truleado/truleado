-- Create table for Chat & Find search history
CREATE TABLE IF NOT EXISTS chat_find_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  parsed_query JSONB,
  total_leads_found INTEGER DEFAULT 0,
  search_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for individual search results
CREATE TABLE IF NOT EXISTS chat_find_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES chat_find_searches(id) ON DELETE CASCADE,
  lead_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  subreddit VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  relevance_score INTEGER DEFAULT 0,
  ai_analysis_reasons TEXT[],
  ai_sample_reply TEXT,
  ai_analysis_score INTEGER DEFAULT 0,
  lead_type VARCHAR(20) DEFAULT 'post',
  parent_post_title TEXT,
  parent_post_url TEXT,
  is_comment BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_find_searches_user_id ON chat_find_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_find_searches_created_at ON chat_find_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_find_results_search_id ON chat_find_results(search_id);
CREATE INDEX IF NOT EXISTS idx_chat_find_results_relevance_score ON chat_find_results(relevance_score DESC);

-- Add RLS policies
ALTER TABLE chat_find_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_find_results ENABLE ROW LEVEL SECURITY;

-- Policy for chat_find_searches
CREATE POLICY "Users can view their own search history" ON chat_find_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches" ON chat_find_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" ON chat_find_searches
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for chat_find_results
CREATE POLICY "Users can view their own search results" ON chat_find_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_find_searches 
      WHERE id = search_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own search results" ON chat_find_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_find_searches 
      WHERE id = search_id AND user_id = auth.uid()
    )
  );
