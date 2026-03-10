UPDATE public.trend_settings
SET value = value || '{
  "daily_routines": {"kk": 100, "ru": 100, "en": 100},
  "morning_routine": {"kk": 100, "ru": 100, "en": 100},
  "life_hacks": {"kk": 100, "ru": 100, "en": 100},
  "minimalism": {"kk": 100, "ru": 100, "en": 100},
  "aesthetic": {"kk": 100, "ru": 100, "en": 100},
  "self_care": {"kk": 100, "ru": 100, "en": 100}
}'::jsonb,
updated_at = now()
WHERE key = 'category_limits';