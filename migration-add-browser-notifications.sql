-- Add browser_notifications table for storing browser push notifications
-- This table stores notifications that will be displayed to users in the browser

CREATE TABLE public.browser_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT '/favicon.ico',
  url TEXT DEFAULT '/dashboard',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create index for efficient queries
CREATE INDEX idx_browser_notifications_user_id ON public.browser_notifications(user_id);
CREATE INDEX idx_browser_notifications_read ON public.browser_notifications(read);
CREATE INDEX idx_browser_notifications_created_at ON public.browser_notifications(created_at);

-- Enable RLS
ALTER TABLE public.browser_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own notifications" ON public.browser_notifications 
  FOR ALL USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.browser_notifications IS 'Browser push notifications for users';
COMMENT ON COLUMN public.browser_notifications.user_id IS 'User who will receive the notification';
COMMENT ON COLUMN public.browser_notifications.title IS 'Notification title';
COMMENT ON COLUMN public.browser_notifications.body IS 'Notification body text';
COMMENT ON COLUMN public.browser_notifications.icon IS 'Notification icon URL';
COMMENT ON COLUMN public.browser_notifications.url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN public.browser_notifications.read IS 'Whether the notification has been read';
COMMENT ON COLUMN public.browser_notifications.expires_at IS 'When the notification expires and should be deleted';
