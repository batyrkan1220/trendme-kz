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
    label: "Бизнес және ақша",
    emoji: "💰",
    subNiches: [
      { key: "finance", label: "Финансы" },
      { key: "investing", label: "Инвестиции" },
      { key: "crypto", label: "Криптовалюта" },
      { key: "business_ideas", label: "Бизнес идеи" },
      { key: "startups", label: "Стартапы" },
      { key: "marketing", label: "Маркетинг" },
      { key: "smm", label: "SMM" },
      { key: "target_ads", label: "Таргет реклама" },
      { key: "sales", label: "Продажи" },
      { key: "online_business", label: "Онлайн бизнес" },
      { key: "freelance", label: "Фриланс" },
      { key: "career", label: "Карьера" },
    ],
  },
  {
    key: "beauty",
    label: "Бьюти",
    emoji: "💄",
    subNiches: [
      { key: "cosmetology", label: "Косметология" },
      { key: "skincare", label: "Уход за кожей (Skincare)" },
      { key: "makeup", label: "Макияж" },
      { key: "haircare", label: "Уход за волосами" },
      { key: "hairstyles", label: "Прически" },
      { key: "barbershop", label: "Барбершоп" },
      { key: "manicure", label: "Маникюр" },
      { key: "pedicure", label: "Педикюр" },
      { key: "laser_epilation", label: "Лазерная эпиляция" },
      { key: "plastic_surgery", label: "Пластическая хирургия" },
      { key: "beauty_hacks", label: "Бьюти лайфхаки" },
    ],
  },
  {
    key: "fashion",
    label: "Мода",
    emoji: "👗",
    subNiches: [
      { key: "clothing", label: "Одежда" },
      { key: "women_clothing", label: "Женская одежда" },
      { key: "men_clothing", label: "Мужская одежда" },
      { key: "kids_clothing", label: "Детская одежда" },
      { key: "shoes", label: "Обувь" },
      { key: "bags", label: "Сумки" },
      { key: "accessories", label: "Аксессуары" },
      { key: "streetwear", label: "Streetwear" },
      { key: "luxury_fashion", label: "Luxury fashion" },
      { key: "branded_clothing", label: "Брендовая одежда" },
      { key: "shopping", label: "Шопинг" },
    ],
  },
  {
    key: "food",
    label: "Еда и рестораны",
    emoji: "🍔",
    subNiches: [
      { key: "recipes", label: "Рецепты" },
      { key: "quick_recipes", label: "Быстрые рецепты" },
      { key: "home_cooking", label: "Домашняя кухня" },
      { key: "national_cuisine", label: "Национальная кухня" },
      { key: "fastfood", label: "Фастфуд" },
      { key: "restaurants", label: "Рестораны" },
      { key: "restaurant_reviews", label: "Обзоры ресторанов" },
      { key: "cafes", label: "Кафе" },
      { key: "street_food", label: "Уличная еда" },
      { key: "food_delivery", label: "Доставка еды" },
      { key: "cooking_hacks", label: "Кулинарные лайфхаки" },
      { key: "desserts", label: "Десерты" },
      { key: "baking", label: "Выпечка" },
    ],
  },
  {
    key: "fitness",
    label: "Фитнес и здоровье",
    emoji: "🏋️",
    subNiches: [
      { key: "fitness_general", label: "Фитнес" },
      { key: "home_workouts", label: "Тренировки дома" },
      { key: "gym", label: "Тренажерный зал" },
      { key: "weight_loss", label: "Похудение" },
      { key: "muscle_gain", label: "Набор массы" },
      { key: "yoga", label: "Йога" },
      { key: "pilates", label: "Пилатес" },
      { key: "healthy_lifestyle", label: "Здоровый образ жизни" },
      { key: "diet", label: "Диета" },
      { key: "sports_nutrition", label: "Спортивное питание" },
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
      { key: "auto_hacks", label: "Авто лайфхаки" },
      { key: "auto_repair", label: "Авто ремонт" },
      { key: "auto_news", label: "Авто новости" },
      { key: "car_dealership", label: "Авто салон" },
      { key: "electric_vehicles", label: "Электромобили" },
    ],
  },
  {
    key: "home",
    label: "Дом",
    emoji: "🏠",
    subNiches: [
      { key: "renovation", label: "Ремонт" },
      { key: "interior", label: "Интерьер" },
      { key: "home_design", label: "Дизайн дома" },
      { key: "furniture", label: "Мебель" },
      { key: "cozy_home", label: "Уют в доме" },
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
      { key: "newborns", label: "Новорожденные" },
      { key: "parenting", label: "Воспитание детей" },
      { key: "family_life", label: "Семейная жизнь" },
    ],
  },
  {
    key: "psychology",
    label: "Психология",
    emoji: "🧠",
    subNiches: [
      { key: "psychology_general", label: "Психология" },
      { key: "relationships", label: "Психология отношений" },
      { key: "self_development", label: "Саморазвитие" },
      { key: "motivation", label: "Мотивация" },
      { key: "mental_health", label: "Ментальное здоровье" },
    ],
  },
  {
    key: "entertainment",
    label: "Развлечения",
    emoji: "🎮",
    subNiches: [
      { key: "humor", label: "Юмор" },
      { key: "sketches", label: "Скетчи" },
      { key: "memes", label: "Мемы" },
      { key: "challenges", label: "Челленджи" },
      { key: "reactions", label: "Реакции" },
    ],
  },
  {
    key: "media",
    label: "Медиа",
    emoji: "🎬",
    subNiches: [
      { key: "music", label: "Музыка" },
      { key: "cinema", label: "Кино" },
      { key: "series", label: "Сериалы" },
      { key: "pop_culture", label: "Поп культура" },
      { key: "dance", label: "Танцы" },
    ],
  },
  {
    key: "animals",
    label: "Животные",
    emoji: "🐶",
    subNiches: [
      { key: "dogs", label: "Собаки" },
      { key: "cats", label: "Кошки" },
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
      { key: "hotels", label: "Отели" },
      { key: "tourism", label: "Туризм" },
      { key: "travel_hacks", label: "Лайфхаки путешествий" },
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
      { key: "ai_avatars", label: "AI аватары" },
      { key: "ai_video", label: "AI видео" },
    ],
  },
  {
    key: "hobby",
    label: "Хобби",
    emoji: "🎨",
    subNiches: [
      { key: "crafts", label: "Рукоделие" },
      { key: "diy", label: "DIY" },
      { key: "drawing", label: "Рисование" },
      { key: "photography", label: "Фотография" },
    ],
  },
  {
    key: "other",
    label: "Другое",
    emoji: "🔮",
    subNiches: [
      { key: "esoteric", label: "Эзотерика" },
      { key: "tarot", label: "Таро" },
      { key: "astrology", label: "Астрология" },
    ],
  },
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
  books: "psychology",
  business: "business",
  cinema: "media",
  comedy: "entertainment",
  dance: "media",
  diy: "home",
  education: "psychology",
  entertainment: "entertainment",
  family: "family",
  fashion: "fashion",
  fitness: "fitness",
  food: "food",
  gaming: "entertainment",
  lifestyle: "beauty",
  marketing: "business",
  medicine: "fitness",
  music: "media",
  news: "other",
  podcast: "media",
  psychology: "psychology",
  realestate: "home",
  religion: "other",
  shopping: "fashion",
  sports: "fitness",
  tech: "ai",
  travel: "travel",
};
