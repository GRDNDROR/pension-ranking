export const SCORING_WEIGHTS = {
  returns: {
    weight: 0.40, // primary factor - long-term returns are what matters most
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
    weight: 0.20, // key indicator of fund health & solvency
  },
  serviceQuality: {
    weight: 0.20, // CMA service index + availability + responsiveness
  },
  claimsApproval: {
    weight: 0.10, // claims approval rates - critical for retirees
  },
  fees: {
    weight: 0.0, // removed - not meaningful for pension fund quality comparison
    subWeights: {
      managementFee: 0.7,
      depositFee: 0.3,
    },
  },
  fundSize: {
    weight: 0.05, // stability indicator
  },
  netFlow: {
    weight: 0.05, // signal of fund attractiveness
  },
  trackFlexibility: {
    weight: 0.0, // merged into serviceQuality
  },
} as const;

/** Target range for final score rescaling */
export const FINAL_SCORE_RANGE = { min: 35, max: 95 } as const;

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
    maxDeduction: 6,
    assetThresholdMillions: 500,
    description: "קרן קטנה מאוד - חוסר יציבות פוטנציאלי",
  },
  actuarialDeficit: {
    maxDeduction: 10,
    description: "גירעון אקטוארי - עלול להוביל להפחתת תשואות",
  },
} as const;
