export interface SubNiche {
  key: string;
  label: string;
}

export interface NicheGroup {
  key: string;
  label: string;
  emoji: string;
  subNiches: SubNiche[];
}

export const NICHE_GROUPS: NicheGroup[] = [
  {
    key: "business",
    label: "Бизнес и деньги",
    emoji: "💰",
    subNiches: [
      { key: "finance", label: "Финансы и инвестиции" },
      { key: "crypto", label: "Криптовалюта" },
      { key: "business_ideas", label: "Бизнес идеи" },
      { key: "marketing", label: "Маркетинг и SMM" },
      { key: "freelance", label: "Фриланс и карьера" },
      { key: "ecommerce", label: "E-commerce и маркетплейсы" },
    ],
  },
  {
    key: "beauty",
    label: "Бьюти",
    emoji: "💄",
    subNiches: [
      { key: "skincare", label: "Уход за кожей" },
      { key: "makeup", label: "Макияж" },
      { key: "haircare", label: "Волосы и прически" },
      { key: "manicure", label: "Маникюр и ногти" },
      { key: "cosmetology", label: "Косметология" },
      { key: "perfume", label: "Парфюмерия" },
    ],
  },
  {
    key: "fashion",
    label: "Мода",
    emoji: "👗",
    subNiches: [
      { key: "clothing", label: "Одежда и стиль" },
      { key: "shoes", label: "Обувь" },
      { key: "accessories", label: "Аксессуары и сумки" },
      { key: "luxury_fashion", label: "Люкс и бренды" },
      { key: "jewelry", label: "Украшения и часы" },
      { key: "shopping", label: "Шопинг" },
    ],
  },
  {
    key: "food",
    label: "Еда и рестораны",
    emoji: "🍔",
    subNiches: [
      { key: "recipes", label: "Рецепты" },
      { key: "home_cooking", label: "Домашняя кухня" },
      { key: "restaurants", label: "Рестораны и кафе" },
      { key: "street_food", label: "Уличная еда" },
      { key: "desserts", label: "Десерты и выпечка" },
      { key: "coffee_tea", label: "Кофе и чай" },
    ],
  },
  {
    key: "fitness",
    label: "Фитнес и здоровье",
    emoji: "🏋️",
    subNiches: [
      { key: "home_workouts", label: "Тренировки дома" },
      { key: "gym", label: "Тренажерный зал" },
      { key: "weight_loss", label: "Похудение и диета" },
      { key: "yoga", label: "Йога и растяжка" },
      { key: "healthy_lifestyle", label: "ЗОЖ" },
      { key: "sports_nutrition", label: "Спортивное питание" },
    ],
  },
  {
    key: "sports",
    label: "Спорт",
    emoji: "⚽",
    subNiches: [
      { key: "football", label: "Футбол" },
      { key: "mma_boxing", label: "ММА / Бокс" },
      { key: "basketball", label: "Баскетбол" },
      { key: "sports_news", label: "Спортивные новости" },
      { key: "extreme_sports", label: "Экстремальный спорт" },
    ],
  },
  {
    key: "education",
    label: "Образование",
    emoji: "📚",
    subNiches: [
      { key: "languages", label: "Языки" },
      { key: "english", label: "Английский язык" },
      { key: "school_ent", label: "ЕНТ / Школа" },
      { key: "online_courses", label: "Онлайн курсы" },
      { key: "books", label: "Книги" },
    ],
  },
  {
    key: "gaming",
    label: "Гейминг",
    emoji: "🎮",
    subNiches: [
      { key: "mobile_games", label: "Мобильные игры" },
      { key: "pc_games", label: "PC и консоли" },
      { key: "game_reviews", label: "Обзоры игр" },
      { key: "streaming", label: "Стриминг" },
      { key: "esports", label: "Киберспорт" },
    ],
  },
  {
    key: "tech",
    label: "IT / Технологии",
    emoji: "💻",
    subNiches: [
      { key: "programming", label: "Программирование" },
      { key: "gadgets", label: "Гаджеты и смартфоны" },
      { key: "tech_reviews", label: "Обзоры техники" },
      { key: "apps", label: "Приложения" },
    ],
  },
  {
    key: "auto",
    label: "Авто",
    emoji: "🚗",
    subNiches: [
      { key: "auto_reviews", label: "Авто обзоры" },
      { key: "chinese_auto", label: "Китайские авто" },
      { key: "tuning", label: "Тюнинг" },
      { key: "auto_repair", label: "Ремонт и лайфхаки" },
      { key: "electric_vehicles", label: "Электромобили" },
      { key: "moto", label: "Мотоциклы" },
    ],
  },
  {
    key: "home",
    label: "Дом",
    emoji: "🏠",
    subNiches: [
      { key: "renovation", label: "Ремонт" },
      { key: "interior", label: "Интерьер и дизайн" },
      { key: "furniture", label: "Мебель" },
      { key: "organization", label: "Организация пространства" },
      { key: "garden", label: "Сад и огород" },
    ],
  },
  {
    key: "family",
    label: "Семья",
    emoji: "👩‍👧",
    subNiches: [
      { key: "motherhood", label: "Материнство" },
      { key: "pregnancy", label: "Беременность" },
      { key: "parenting", label: "Воспитание детей" },
      { key: "family_life", label: "Семейная жизнь" },
      { key: "wedding", label: "Свадьба" },
    ],
  },
  {
    key: "psychology",
    label: "Психология",
    emoji: "🧠",
    subNiches: [
      { key: "relationships", label: "Отношения" },
      { key: "self_development", label: "Саморазвитие" },
      { key: "motivation", label: "Мотивация" },
      { key: "mental_health", label: "Ментальное здоровье" },
      { key: "productivity", label: "Продуктивность" },
    ],
  },
  {
    key: "entertainment",
    label: "Развлечения",
    emoji: "🎭",
    subNiches: [
      { key: "humor", label: "Юмор и скетчи" },
      { key: "memes", label: "Мемы" },
      { key: "challenges", label: "Челленджи" },
      { key: "asmr", label: "ASMR" },
    ],
  },
  {
    key: "media",
    label: "Медиа",
    emoji: "🎬",
    subNiches: [
      { key: "music", label: "Музыка" },
      { key: "cinema", label: "Кино и сериалы" },
      { key: "dance", label: "Танцы" },
      { key: "anime", label: "Аниме" },
    ],
  },
  {
    key: "animals",
    label: "Животные",
    emoji: "🐶",
    subNiches: [
      { key: "pets", label: "Домашние животные" },
      { key: "pet_care", label: "Уход за животными" },
    ],
  },
  {
    key: "travel",
    label: "Путешествия",
    emoji: "✈️",
    subNiches: [
      { key: "travel_general", label: "Путешествия" },
      { key: "hotels", label: "Отели и туризм" },
      { key: "kazakhstan_travel", label: "Казахстан туризм" },
    ],
  },
  {
    key: "ai",
    label: "AI",
    emoji: "🤖",
    subNiches: [
      { key: "neural_networks", label: "Нейросети" },
      { key: "ai_tools", label: "AI инструменты" },
      { key: "ai_generation", label: "AI генерация" },
      { key: "chatgpt", label: "ChatGPT / LLM" },
    ],
  },
  {
    key: "hobby",
    label: "Хобби",
    emoji: "🎨",
    subNiches: [
      { key: "crafts", label: "Рукоделие и DIY" },
      { key: "drawing", label: "Рисование" },
      { key: "photography", label: "Фото и видеосъёмка" },
    ],
  },
  {
    key: "medicine",
    label: "Медицина",
    emoji: "🏥",
    subNiches: [
      { key: "doctors", label: "Врачи и советы" },
      { key: "dentistry", label: "Стоматология" },
      { key: "pharmacy", label: "Аптека и лекарства" },
      { key: "nutrition_health", label: "Нутрициология" },
    ],
  },
  {
    key: "realestate",
    label: "Недвижимость",
    emoji: "🏢",
    subNiches: [
      { key: "apartments", label: "Квартиры и аренда" },
      { key: "mortgage", label: "Ипотека" },
      { key: "new_buildings", label: "Новостройки и ЖК" },
      { key: "construction", label: "Строительство" },
    ],
  },
  {
    key: "blogging",
    label: "Блогинг",
    emoji: "📱",
    subNiches: [
      { key: "content_creation", label: "Создание контента" },
      { key: "video_editing", label: "Монтаж видео" },
      { key: "promotion", label: "Продвижение" },
      { key: "monetization", label: "Монетизация" },
      { key: "personal_brand", label: "Личный бренд" },
    ],
  },
  {
    key: "kazakh_culture",
    label: "Казахская культура",
    emoji: "🇰🇿",
    subNiches: [
      { key: "kazakh_cuisine", label: "Казахская кухня" },
      { key: "kazakh_history", label: "История Казахстана" },
      { key: "kazakh_traditions", label: "Традиции и обычаи" },
      { key: "kazakh_language", label: "Казахский язык" },
      { key: "kazakh_music", label: "Казахская музыка" },
      { key: "kazakh_celebrities", label: "Казахские звёзды" },
    ],
  },
];
];

/** Flat map: sub_niche_key → parent niche key */
export const SUB_NICHE_TO_NICHE: Record<string, string> = {};
/** Flat map: sub_niche_key → label */
export const SUB_NICHE_LABELS: Record<string, string> = {};

for (const group of NICHE_GROUPS) {
  for (const sub of group.subNiches) {
    SUB_NICHE_TO_NICHE[sub.key] = group.key;
    SUB_NICHE_LABELS[sub.key] = sub.label;
  }
}

/** Old category → new niche mapping */
export const OLD_CATEGORY_TO_NICHE: Record<string, string> = {
  animals: "animals",
  art: "hobby",
  auto: "auto",
  beauty: "beauty",
  books: "education",
  business: "business",
  cinema: "media",
  comedy: "entertainment",
  dance: "media",
  diy: "home",
  education: "education",
  entertainment: "entertainment",
  family: "family",
  fashion: "fashion",
  fitness: "fitness",
  food: "food",
  gaming: "gaming",
  lifestyle: "beauty",
  marketing: "business",
  medicine: "medicine",
  music: "media",
  news: "entertainment",
  podcast: "media",
  psychology: "psychology",
  realestate: "realestate",
  religion: "psychology",
  shopping: "fashion",
  sports: "sports",
  tech: "tech",
  travel: "travel",
};
