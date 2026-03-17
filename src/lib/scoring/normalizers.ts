/**
 * Min-max normalization: scales value to 0-100.
 * Higher raw value = higher score.
 */
export function normalizeMinMax(
  value: number | null,
  min: number,
  max: number
): number | null {
  if (value === null || value === undefined) return null;
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * Inverse min-max normalization: scales value to 0-100.
 * Lower raw value = higher score (used for fees, complaints).
 */
export function normalizeInverse(
  value: number | null,
  min: number,
  max: number
): number | null {
  if (value === null || value === undefined) return null;
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
}

/**
 * Logarithmic normalization for fund size.
 * Uses log scale because difference between 5B and 50B matters less
 * than the difference between 500M and 5B.
 */
export function normalizeLogScale(
  value: number | null,
  min: number,
  max: number
): number | null {
  if (value === null || value === undefined || value <= 0) return null;
  if (max <= min || min <= 0) return 50;
  const logValue = Math.log(value);
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  if (logMax === logMin) return 50;
  return Math.max(
    0,
    Math.min(100, ((logValue - logMin) / (logMax - logMin)) * 100)
  );
}

/**
 * Percentile-rank normalization: assigns score 0-100 based on position among peers.
 * Higher raw value = higher percentile. Handles ties by averaging rank positions.
 * Guarantees even distribution across the 0-100 range.
 */
export function normalizePercentile(
  value: number | null,
  allValues: (number | null)[]
): number | null {
  if (value === null || value === undefined) return null;
  const valid = allValues.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length <= 1) return 50;

  const belowCount = valid.filter((v) => v < value).length;
  const equalCount = valid.filter((v) => v === value).length;
  // Average rank for ties
  const percentile = ((belowCount + (equalCount - 1) / 2) / (valid.length - 1)) * 100;
  return Math.max(0, Math.min(100, percentile));
}

/**
 * Inverse percentile normalization: lower raw value = higher score.
 * Used for fees, standard deviation, and other "lower is better" metrics.
 */
export function normalizePercentileInverse(
  value: number | null,
  allValues: (number | null)[]
): number | null {
  const result = normalizePercentile(value, allValues);
  if (result === null) return null;
  return 100 - result;
}

/**
 * Rescales an array of scores to spread across a target range [targetMin, targetMax].
 * The highest input score maps to targetMax, lowest to targetMin.
 * Preserves relative differences between scores.
 */
export function rescaleToRange(
  scores: Array<{ id: string; score: number }>,
  targetMin: number,
  targetMax: number
): Map<string, number> {
  if (scores.length === 0) return new Map();

  const rawScores = scores.map((s) => s.score);
  const rawMin = Math.min(...rawScores);
  const rawMax = Math.max(...rawScores);

  const result = new Map<string, number>();
  if (rawMax === rawMin) {
    const mid = (targetMin + targetMax) / 2;
    for (const s of scores) {
      result.set(s.id, Math.round(mid * 10) / 10);
    }
    return result;
  }

  for (const s of scores) {
    const normalized = ((s.score - rawMin) / (rawMax - rawMin)) * (targetMax - targetMin) + targetMin;
    result.set(s.id, Math.round(normalized * 10) / 10);
  }
  return result;
}

/**
 * Extracts the min and max from an array of numeric values (ignoring nulls).
 */
export function getRange(values: (number | null)[]): {
  min: number;
  max: number;
} {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}
