
UPDATE plans SET price_rub = 0, tokens_included = 150, max_requests = 150, max_tracked_accounts = 1,
  features = '["~138 видео іздеу", "3 AI видео анализ", "3 сценарий генерациясы", "1 аккаунт Разведкада", "1 кілт Контент-радарда"]'::jsonb,
  updated_at = now()
WHERE name = 'Старт';

UPDATE plans SET price_rub = 4990, tokens_included = 2500, max_requests = 2500, max_tracked_accounts = 30,
  features = '["~2 300 видео іздеу", "180 AI видео анализ", "90 сценарий генерациясы", "30 аккаунт Разведкада", "30 кілт Контент-радарда"]'::jsonb,
  updated_at = now()
WHERE name = 'Про';

UPDATE plans SET price_rub = 19990, tokens_included = 25000, max_requests = 25000, max_tracked_accounts = 200,
  features = '["~23 000 видео іздеу", "200 AI видео анализ", "200 сценарий генерациясы", "200 аккаунт Разведкада", "200 кілт Контент-радарда"]'::jsonb,
  updated_at = now()
WHERE name = 'Бизнес';
