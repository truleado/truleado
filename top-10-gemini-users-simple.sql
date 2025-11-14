-- Simplified: Top 10 Users by Gemini Usage (Just Names)
-- This is the simplest query to get just the top 10 user names

SELECT 
  pr.full_name,
  pr.email,
  (COALESCE(pa.product_count, 0) + COALESCE(la.lead_count, 0)) as total_calls
FROM profiles pr
LEFT JOIN (
  SELECT user_id, COUNT(*) as product_count
  FROM products
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) pa ON pr.id = pa.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as lead_count
  FROM leads
  WHERE ai_analysis IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) la ON pr.id = la.user_id
WHERE (COALESCE(pa.product_count, 0) + COALESCE(la.lead_count, 0)) > 0
ORDER BY total_calls DESC
LIMIT 10;



