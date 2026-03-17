import type { ManagementCompany, ScoringCategory } from "@/types/fund";

/**
 * Base fund type to scoring category mapping.
 * Used as the first step; retiree detection (based on fund name) refines this further.
 */
export const FUND_BASE_CATEGORIES: Record<string, "comprehensive" | "non_comprehensive"> = {
  comprehensive_new: "comprehensive",
  general: "non_comprehensive",
  supplementary: "non_comprehensive",
  other: "non_comprehensive",
};

export const CATEGORY_LABELS: Record<ScoringCategory, string> = {
  comprehensive: "מקיפה",
  non_comprehensive: "כללית/משלימה",
  comprehensive_retiree: "מקיפה - מקבלי קצבה",
  non_comprehensive_retiree: "כללית/משלימה - מקבלי קצבה",
};

/** Short labels for tabs/badges */
export const CATEGORY_SHORT_LABELS: Record<ScoringCategory, string> = {
  comprehensive: "מקיפה",
  non_comprehensive: "כללית/משלימה",
  comprehensive_retiree: "מקבלי קצבה",
  non_comprehensive_retiree: "מקבלי קצבה",
};

/** Categories that represent regular (non-retiree) funds */
export const REGULAR_CATEGORIES: ScoringCategory[] = ["comprehensive", "non_comprehensive"];

/** Categories that represent retiree funds */
export const RETIREE_CATEGORIES: ScoringCategory[] = ["comprehensive_retiree", "non_comprehensive_retiree"];

/** All scoring categories */
export const ALL_SCORING_CATEGORIES: ScoringCategory[] = [
  "comprehensive",
  "non_comprehensive",
  "comprehensive_retiree",
  "non_comprehensive_retiree",
];

export const MANAGEMENT_COMPANIES: ManagementCompany[] = [
  {
    id: "harel",
    nameHebrew: "הראל",
    nameEnglish: "Harel",
    websiteUrl: "https://www.harel-group.co.il",
  },
  {
    id: "menora",
    nameHebrew: "מנורה מבטחים",
    nameEnglish: "Menora Mivtachim",
    websiteUrl: "https://www.menoramivt.co.il",
  },
  {
    id: "meitav",
    nameHebrew: "מיטב",
    nameEnglish: "Meitav",
    websiteUrl: "https://www.meitav.co.il",
  },
  {
    id: "altshuler",
    nameHebrew: "אלטשולר שחם",
    nameEnglish: "Altshuler Shaham",
    websiteUrl: "https://www.as-invest.co.il",
  },
  {
    id: "clal",
    nameHebrew: "כלל",
    nameEnglish: "Clal",
    websiteUrl: "https://www.clalbit.co.il",
  },
  {
    id: "migdal",
    nameHebrew: "מגדל",
    nameEnglish: "Migdal",
    websiteUrl: "https://www.migdal.co.il",
  },
  {
    id: "phoenix",
    nameHebrew: "הפניקס",
    nameEnglish: "The Phoenix",
    websiteUrl: "https://www.fnx.co.il",
  },
  {
    id: "mor",
    nameHebrew: "מור",
    nameEnglish: "Mor",
    websiteUrl: "https://www.mor-inv.co.il",
  },
  {
    id: "infinity",
    nameHebrew: "אינפיניטי",
    nameEnglish: "Infinity",
    websiteUrl: "https://www.infinity.co.il",
  },
  {
    id: "psagot",
    nameHebrew: "פסגות",
    nameEnglish: "Psagot",
    websiteUrl: "https://www.psagot.co.il",
  },
  {
    id: "yelin-lapidot",
    nameHebrew: "ילין לפידות",
    nameEnglish: "Yelin Lapidot",
    websiteUrl: "https://www.yfrm.co.il",
  },
];

/**
 * Maps Hebrew company name variations (as they appear in data.gov.il) to canonical company IDs.
 */
export const COMPANY_NAME_MAP: Record<string, string> = {
  // Harel
  'הראל פנסיה וגמל בע"מ': "harel",
  'הראל פנסיה וגמל בע״מ': "harel",
  "הראל": "harel",
  // Menora
  'מנורה מבטחים פנסיה בע"מ': "menora",
  'מנורה מבטחים פנסיה וגמל בע"מ': "menora",
  "מנורה מבטחים": "menora",
  // Meitav
  'מיטב גמל ופנסיה בע"מ': "meitav",
  'מיטב דש גמל ופנסיה בע"מ': "meitav",
  "מיטב": "meitav",
  // Altshuler Shaham
  'אלטשולר שחם גמל ופנסיה בע"מ': "altshuler",
  "אלטשולר שחם": "altshuler",
  // Clal
  'כלל פנסיה וגמל בע"מ': "clal",
  'כלל ביטוח ופיננסים בע"מ': "clal",
  "כלל": "clal",
  // Migdal
  'מגדל מקפת קרנות פנסיה וקופות גמל בע"מ': "migdal",
  'מגדל חברה לביטוח בע"מ': "migdal",
  "מגדל": "migdal",
  // Phoenix
  'הפניקס פנסיה וגמל בע"מ': "phoenix",
  "הפניקס": "phoenix",
  // Mor
  'מור גמל ופנסיה בע"מ': "mor",
  "מור": "mor",
  // Infinity
  'אינפיניטי גמל ופנסיה בע"מ': "infinity",
  "אינפיניטי": "infinity",
  // Psagot
  'פסגות קופות גמל ופנסיה בע"מ': "psagot",
  "פסגות": "psagot",
  // Yelin Lapidot
  'ילין לפידות גמל ופנסיה בע"מ': "yelin-lapidot",
  "ילין לפידות": "yelin-lapidot",
};

/**
 * Known fund limitations used for penalty calculations.
 */
export const FUND_LIMITATIONS: Record<
  string,
  {
    acceptsWithoutHealthDeclaration: boolean;
    trackFlexibility: "full" | "limited" | "none";
    numberOfTagmulimTracks: number;
    numberOfPitzuyimTracks: number;
  }
> = {
  menora: {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "none",
    numberOfTagmulimTracks: 1,
    numberOfPitzuyimTracks: 1,
  },
  clal: {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "none",
    numberOfTagmulimTracks: 1,
    numberOfPitzuyimTracks: 1,
  },
  altshuler: {
    acceptsWithoutHealthDeclaration: true,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 8,
    numberOfPitzuyimTracks: 8,
  },
  meitav: {
    acceptsWithoutHealthDeclaration: true,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 8,
    numberOfPitzuyimTracks: 8,
  },
  mor: {
    acceptsWithoutHealthDeclaration: true,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 6,
    numberOfPitzuyimTracks: 6,
  },
  infinity: {
    acceptsWithoutHealthDeclaration: true,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 6,
    numberOfPitzuyimTracks: 6,
  },
  harel: {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 8,
    numberOfPitzuyimTracks: 8,
  },
  migdal: {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 8,
    numberOfPitzuyimTracks: 8,
  },
  phoenix: {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 8,
    numberOfPitzuyimTracks: 8,
  },
  psagot: {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 6,
    numberOfPitzuyimTracks: 6,
  },
  "yelin-lapidot": {
    acceptsWithoutHealthDeclaration: false,
    trackFlexibility: "full",
    numberOfTagmulimTracks: 6,
    numberOfPitzuyimTracks: 6,
  },
};

/**
 * CMA Service Quality Index 2024 scores per company.
 * Source: רשות שוק ההון - מדד השירות 2024
 * Scale: 0-100 (higher = better service)
 * Includes pension savings service index components:
 * - Customer satisfaction (55%), Public complaints (20%),
 * - Response times (10%), Fund allocation speed (10%), Digital service (5%)
 */
export const SERVICE_QUALITY_SCORES: Record<string, number> = {
  menora: 82,
  clal: 80,
  phoenix: 77,
  migdal: 77,
  harel: 77,
  altshuler: 74,
  meitav: 72,   // Based on CMA 2024 composite - mid-range service
  mor: 65,      // Smaller company, limited service infrastructure
  infinity: 60, // Small company, basic service availability
  psagot: 50,
  "yelin-lapidot": 50,
};

/**
 * Claims approval quality scores per company (0-100).
 * Based on CMA insurance service index claims component
 * and available public complaint data.
 */
export const CLAIMS_APPROVAL_SCORES: Record<string, number> = {
  menora: 80,
  migdal: 78,
  harel: 76,
  phoenix: 75,
  clal: 74,
  meitav: 70,
  altshuler: 68,
  mor: 65,
  infinity: 60,
  psagot: 50,
  "yelin-lapidot": 50,
};
