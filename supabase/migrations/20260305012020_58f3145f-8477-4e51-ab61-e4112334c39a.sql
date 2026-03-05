UPDATE trend_settings 
SET value = jsonb_set(
  value, 
  '{travel}', 
  '["тур", "туризм", "травел", "путешествия", "travel", "trip", "vacation", "travel vlog", "саяхат", "travel tips", "backpacking", "explore", "путешествие 2026", "тревел влог"]'::jsonb
)
WHERE key = 'niche_queries';