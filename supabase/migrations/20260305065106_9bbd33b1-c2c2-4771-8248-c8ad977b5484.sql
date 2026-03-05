
UPDATE plans SET 
  price_rub = 0, tokens_included = 150, max_requests = 150, max_tracked_accounts = 1,
  features = '["~138 видео поисков", "3 AI анализа видео", "3 генерации сценариев", "1 аккаунт в Шпионаже", "1 ключ в Контент-радаре"]'::jsonb,
  updated_at = now()
WHERE name = 'Старт';

UPDATE plans SET 
  price_rub = 3300, tokens_included = 2500, max_requests = 2500, max_tracked_accounts = 30,
  features = '["~2 300 видео поисков", "180 AI анализов видео", "90 генераций сценариев", "30 аккаунтов в Шпионаже", "30 ключей в Контент-радаре"]'::jsonb,
  updated_at = now()
WHERE name = 'Про';

UPDATE plans SET 
  price_rub = 15800, tokens_included = 25000, max_requests = 25000, max_tracked_accounts = 200,
  features = '["~23 000 видео поисков", "200 AI анализов видео", "200 генераций сценариев", "200 аккаунтов в Шпионаже", "200 ключей в Контент-радаре"]'::jsonb,
  updated_at = now()
WHERE name = 'Бизнес';
