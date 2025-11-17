-- Find users with high Gemini API usage
-- This estimates usage based on product analyses, lead analyses, and keyword research

-- Products analyzed (each uses Gemini API)
WITH product_analyses AS (
  SELECT 
    user_id,
    COUNT(*) as product_count
  FROM products
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
),

-- Leads with AI analysis (each uses Gemini API)
lead_analyses AS (
  SELECT 
    user_id,
    COUNT(*) as lead_count
  FROM leads
  WHERE ai_analysis IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
),

-- Estimate keyword research (research sessions likely use Gemini)
-- Note: This is an estimate - actual tracking would require a usage table
combined_usage AS (
  SELECT 
    p.user_id,
    COALESCE(pa.product_count, 0) as product_analyses,
    COALESCE(la.lead_count, 0) as lead_analyses,
    (COALESCE(pa.product_count, 0) + COALESCE(la.lead_count, 0)) as estimated_total_calls
  FROM profiles p
  LEFT JOIN product_analyses pa ON p.id = pa.user_id
  LEFT JOIN lead_analyses la ON p.id = la.user_id
  WHERE (COALESCE(pa.product_count, 0) + COALESCE(la.lead_count, 0)) > 0
)

SELECT 
  cu.user_id,
  pr.email,
  pr.full_name,
  cu.product_analyses,
  cu.lead_analyses,
  cu.estimated_total_calls,
  pr.subscription_status
FROM combined_usage cu
JOIN profiles pr ON cu.user_id = pr.id
WHERE cu.estimated_total_calls >= 10  -- Users with 10+ API calls in last 30 days
ORDER BY cu.estimated_total_calls DESC
LIMIT 50;




