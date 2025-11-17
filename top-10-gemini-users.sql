-- Top 10 Users Ranked by Google Gemini API Usage
-- This query ranks users by their total Gemini API calls in the last 30 days

WITH product_analyses AS (
  -- Each product analysis uses Gemini API
  SELECT 
    user_id,
    COUNT(*) as gemini_calls
  FROM products
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
),

lead_analyses AS (
  -- Each lead with AI analysis uses Gemini API
  SELECT 
    user_id,
    COUNT(*) as gemini_calls
  FROM leads
  WHERE ai_analysis IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
),

total_usage AS (
  -- Combine all Gemini API calls per user
  SELECT 
    COALESCE(pa.user_id, la.user_id) as user_id,
    COALESCE(pa.gemini_calls, 0) as product_calls,
    COALESCE(la.gemini_calls, 0) as lead_calls,
    (COALESCE(pa.gemini_calls, 0) + COALESCE(la.gemini_calls, 0)) as total_gemini_calls
  FROM product_analyses pa
  FULL OUTER JOIN lead_analyses la ON pa.user_id = la.user_id
)

-- Rank and show top 10 users
SELECT 
  ROW_NUMBER() OVER (ORDER BY tu.total_gemini_calls DESC) as rank,
  pr.full_name,
  pr.email,
  tu.product_calls,
  tu.lead_calls,
  tu.total_gemini_calls,
  pr.subscription_status,
  pr.created_at as user_since
FROM total_usage tu
JOIN profiles pr ON tu.user_id = pr.id
WHERE tu.total_gemini_calls > 0
ORDER BY tu.total_gemini_calls DESC
LIMIT 10;




