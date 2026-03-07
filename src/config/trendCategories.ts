import { NICHE_GROUPS, NicheGroup } from "./niches";

export interface TrendCategory {
  key: string;
  label: string;
  /** niche group keys that belong to this category */
  nicheKeys: string[];
}

export const TREND_CATEGORIES: TrendCategory[] = [
  {
    key: "for_you",
    label: "Для тебя",
    nicheKeys: [
      "beauty", "fashion", "food", "fitness", "home", "family",
      "animals", "travel", "medicine", "hobby", "kazakh_culture",
    ],
  },
  {
    key: "business",
    label: "Бизнес",
    nicheKeys: [
      "business", "tech", "ai", "realestate", "blogging", "education",
    ],
  },
  {
    key: "entertainment",
    label: "Развлечения",
    nicheKeys: [
      "entertainment", "media", "gaming", "sports", "psychology", "auto",
    ],
  },
];

/** Get NicheGroup objects for a category */
export function getNicheGroupsForCategory(categoryKey: string): NicheGroup[] {
  const cat = TREND_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return [];
  if (cat.nicheKeys.length === 0) return NICHE_GROUPS;
  return NICHE_GROUPS.filter((g) => cat.nicheKeys.includes(g.key));
}
