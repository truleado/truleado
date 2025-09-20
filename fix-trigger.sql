-- Fix the calculate_next_run trigger to allow immediate execution
-- Run this in your Supabase SQL Editor

-- Update the function to only set next_run if it's not already set
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
