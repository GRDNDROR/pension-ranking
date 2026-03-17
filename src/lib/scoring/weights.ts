export const SCORING_WEIGHTS = {
  returns: {
    weight: 0.3,
    subWeights: {
      trailing5Yr: 0.25,
      trailing3Yr: 0.2,
      yearToDate: 0.1,
      sharpeRatio: 0.2,
      consistency: 0.1, // standard deviation of annual returns - lower is better
      alpha: 0.15, // excess return above benchmark
    },
  },
  fees: {
    weight: 0.1, // reduced - fees shown are per-track (external mgmt costs), not per-member
    subWeights: {
      managementFee: 0.6,
      depositFee: 0.4,
    },
  },
  actuarialBalance: {
    weight: 0.2, // key indicator of fund health
  },
  fundSize: {
    weight: 0.1,
  },
  serviceQuality: {
    weight: 0.15, // real CMA service index data (2024)
  },
  netFlow: {
    weight: 0.05, // net deposits / total assets - fund attractiveness
  },
  claimsApproval: {
    weight: 0.05, // reduced - no real data yet, neutral score
  },
  trackFlexibility: {
    weight: 0.05, // reduced - static data
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
