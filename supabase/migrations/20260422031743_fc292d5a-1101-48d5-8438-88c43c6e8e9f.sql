-- Демо: Free tier with limited trends/search but unlimited analysis & script
UPDATE public.plans
SET
  price_rub = 0,
  duration_days = 30,
  features = '["Анализ видео","AI Сценарий","3 тренда на категорию","5 результатов поиска","<span class=\"text-muted-foreground\">Безлимитный поиск</span>","<span class=\"text-muted-foreground\">Безлимитные тренды</span>"]'::jsonb,
  usage_limits = NULL
WHERE name = 'Пробный';

-- 1 month: 9 900₸
UPDATE public.plans
SET
  price_rub = 9900,
  duration_days = 30,
  features = '["Анализ видео — безлимитно","AI Сценарий — безлимитно","Безлимитные тренды","Безлимитный поиск"]'::jsonb,
  usage_limits = NULL
WHERE name = '1 мес';

-- 3 months: 25 200₸ (8 400₸/mo, -15%)
UPDATE public.plans
SET
  price_rub = 25200,
  duration_days = 90,
  features = '["Анализ видео — безлимитно","AI Сценарий — безлимитно","Безлимитные тренды","Безлимитный поиск","Экономия 15%"]'::jsonb,
  usage_limits = NULL
WHERE name = '3 мес';