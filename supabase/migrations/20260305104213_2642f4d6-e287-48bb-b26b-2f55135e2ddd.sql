UPDATE plans 
SET features = '["Все функции платформы", "Тренды — только 5 видео"]'::jsonb,
    updated_at = now()
WHERE name = 'Пробный';