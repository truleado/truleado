-- Fix the database trigger to allow immediate job execution
-- Run this in your Supabase SQL Editor

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS calculate_next_run_trigger ON public.background_jobs;

-- Create a new trigger function that respects immediate execution
CREATE OR REPLACE FUNCTION calculate_next_run()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set next_run if it's not already set (for immediate execution)
    IF NEW.status = 'active' AND NEW.next_run IS NULL THEN
        NEW.next_run = NOW() + (NEW.interval_minutes || ' minutes')::INTERVAL;
    ELSIF NEW.status = 'active' AND NEW.next_run IS NOT NULL THEN
        -- Keep the existing next_run time (for immediate execution)
        NULL;
    ELSE
        NEW.next_run = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER calculate_next_run_trigger 
    BEFORE INSERT OR UPDATE ON public.background_jobs 
    FOR EACH ROW EXECUTE FUNCTION calculate_next_run();

-- Update existing jobs to run immediately
UPDATE public.background_jobs 
SET next_run = NOW() 
WHERE status = 'active' AND next_run > NOW();

-- Show the updated jobs
SELECT id, status, next_run, product_id, user_id 
FROM public.background_jobs 
WHERE status = 'active';
