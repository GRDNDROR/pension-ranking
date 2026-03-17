export const SCORING_WEIGHTS = {
  returns: {
    weight: 0.35, // primary factor - long-term returns
    subWeights: {
      trailing5Yr: 0.30, // strongest signal for long-term performance
      trailing3Yr: 0.20,
      yearToDate: 0.05,
      sharpeRatio: 0.20, // risk-adjusted returns
      consistency: 0.10, // standard deviation of annual returns - lower is better
      alpha: 0.15, // excess return above benchmark
    },
  },
  actuarialBalance: {
    weight: 0.25, // crucial indicator of fund health & solvency
  },
  serviceQuality: {
    weight: 0.15, // CMA service index + availability + responsiveness
  },
  claimsApproval: {
    weight: 0.10, // claims approval rates - critical for retirees
  },
  fees: {
    weight: 0.0, // removed
    subWeights: {
      managementFee: 0.7,
      depositFee: 0.3,
    },
  },
  fundSize: {
    weight: 0.05, // stability indicator
  },
  netFlow: {
    weight: 0.10, // fund attractiveness - joining vs leaving balance
  },
  trackFlexibility: {
    weight: 0.0, // merged into serviceQuality
  },
} as const;

/** Target range for final score rescaling */
export const FINAL_SCORE_RANGE = { min: 35, max: 95 } as const;

/**
 * Small fund reliability discount.
 * Funds below this threshold get their actuarial and claims scores
 * pulled toward neutral (50), because small sample sizes make those
 * metrics unreliable (one disability claim can swing the actuarial balance).
 */
export const SMALL_FUND_DISCOUNT = {
  /** Below this total company assets (in millions), scores are discounted */
  assetThresholdMillions: 50_000, // 50 billion
  /** Minimum discount factor (for very small funds) - 1.0 = no discount */
  minReliabilityFactor: 0.3,
} as const;

export const PENALTIES = {
  noHealthDeclaration: {
    maxDeduction: 8,
    description: "קבלת מבוטחים ללא הצהרת בריאות - סיכון אקטוארי",
  },
  limitedTrackOptions: {
    maxDeduction: 5,
    description: "הגבלה למסלול השקעה אחד לתגמולים ואחד לפיצויים",
  },
  verySmallFund: {
    maxDeduction: 10,
    assetThresholdMillions: 5_000, // 5 billion - raised threshold
    description: "קרן קטנה - חוסר יציבות, ניסיון מוגבל בתביעות",
  },
  actuarialDeficit: {
    maxDeduction: 10,
    description: "גירעון אקטוארי - עלול להוביל להפחתת תשואות",
  },
  negativeNetFlow: {
    maxDeduction: 8,
    description: "זרימת כספים שלילית - יותר עוזבים ממצטרפים",
  },
} as const;
