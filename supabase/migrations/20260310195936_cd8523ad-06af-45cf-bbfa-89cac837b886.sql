UPDATE public.trend_settings
SET value = value || '{
  "daily_routines": {"kk": ["күнделікті рутин", "менің рутиным", "таңғы рутин тикток", "кешкі рутин"], "ru": ["рутина дня", "моя рутина", "daily routine", "утренняя рутина", "вечерняя рутина", "распорядок дня"], "en": ["daily routine", "my routine", "day in my life", "productive day routine", "night routine"]},
  "morning_routine": {"kk": ["таңғы рутин", "таңғы ритуал", "ерте тұру", "таңғы жаттығу"], "ru": ["утренний ритуал", "утренняя рутина", "morning routine", "утро продуктивного человека"], "en": ["morning routine", "5am morning routine", "productive morning", "healthy morning habits"]},
  "life_hacks": {"kk": ["лайфхактар", "пайдалы кеңестер", "өмірді жеңілдететін"], "ru": ["лайфхаки", "полезные лайфхаки", "лайфхаки для жизни", "лайфхаки для дома", "хитрости"], "en": ["life hacks", "useful life hacks", "hacks you need", "genius hacks", "tiktok life hacks"]},
  "minimalism": {"kk": ["минимализм", "қарапайым өмір", "артық заттардан арылу"], "ru": ["минимализм", "минималистичный образ жизни", "расхламление", "простая жизнь", "осознанное потребление"], "en": ["minimalism", "minimalist lifestyle", "declutter", "simple living", "less is more"]},
  "aesthetic": {"kk": ["эстетика", "эстетикалық видео", "көркем өмір"], "ru": ["эстетика", "aesthetic", "эстетичное видео", "эстетика жизни", "вайб", "мудборд"], "en": ["aesthetic", "aesthetic lifestyle", "aesthetic vlog", "cottagecore", "that girl aesthetic"]},
  "self_care": {"kk": ["өзіне күтім", "селф-кер", "өзін-өзі күту"], "ru": ["селф кер", "уход за собой", "self care", "забота о себе", "вечер ухода"], "en": ["self care", "self care routine", "pamper routine", "glow up", "self care day"]}
}'::jsonb,
updated_at = now()
WHERE key = 'niche_queries';