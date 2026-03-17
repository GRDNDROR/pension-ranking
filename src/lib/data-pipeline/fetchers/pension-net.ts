import {
  CKAN_BASE_URL,
  PENSION_NET_RESOURCE_ID,
  CKAN_PAGE_SIZE,
} from "@/lib/constants/data-sources";

/**
 * CKAN record from the pension-net dataset.
 * Handles both the historical (2011-2023) and current (2024+) schemas.
 * Key differences:
 *   - Historical: WITHDRAWLS (typo), YEAR_TO_DATE_YIELD, ACTUARIAL_ADJUSTMENT
 *   - Current:   WITHDRAWALS, YEAR_BEGINNING_YIELD, TARGET_POPULATION
 */
export interface CKANRecord {
  _id: number;
  FUND_ID: number;
  FUND_NAME: string;
  FUND_CLASSIFICATION: string;
  MANAGING_CORPORATION: string;
  REPORT_PERIOD: number;
  INCEPTION_DATE: string;
  // Current schema fields
  TARGET_POPULATION?: string;
  SPECIALIZATION?: string;
  SUB_SPECIALIZATION?: string;
  WITHDRAWALS?: number | null;
  YEAR_BEGINNING_YIELD?: number | null;
  // Historical schema fields
  WITHDRAWLS?: number | null;        // typo in historical data
  YEAR_TO_DATE_YIELD?: number | null; // historical equivalent of YEAR_BEGINNING_YIELD
  ACTUARIAL_ADJUSTMENT?: number | null;
  REPORTING_YEAR?: number;
  // Common fields
  DEPOSITS: number | null;
  INTERNAL_TRANSFERS: number | null;
  NET_MONTHLY_DEPOSITS: number | null;
  TOTAL_ASSETS: number | null;
  MONTHLY_YIELD: number | null;
  YIELD_TRAILING_3_YRS: number | null;
  YIELD_TRAILING_5_YRS: number | null;
  AVG_ANNUAL_YIELD_TRAILING_3YRS: number | null;
  AVG_ANNUAL_YIELD_TRAILING_5YRS: number | null;
  STANDARD_DEVIATION: number | null;
  AVG_ANNUAL_MANAGEMENT_FEE: number | null;
  AVG_DEPOSIT_FEE: number | null;
  ALPHA: number | null;
  SHARPE_RATIO: number | null;
  LIQUID_ASSETS_PERCENT: number | null;
  STOCK_MARKET_EXPOSURE: number | null;
  FOREIGN_EXPOSURE: number | null;
  FOREIGN_CURRENCY_EXPOSURE: number | null;
  MANAGING_CORPORATION_LEGAL_ID: string;
}

interface CKANResponse {
  success: boolean;
  result: {
    records: CKANRecord[];
    total: number;
    limit: number;
    offset: number;
    fields: Array<{ id: string; type: string }>;
  };
  error?: { message: string };
}

/**
 * Fetches pension fund data from the data.gov.il CKAN API.
 * Handles pagination automatically.
 * @param options.resourceId - Optional resource ID (defaults to current/latest resource)
 * @param options.reportPeriod - Optional filter by specific period
 * @param options.limit - Page size (defaults to CKAN_PAGE_SIZE)
 * @param options.maxRecords - Safety limit (defaults to 50000)
 */
export async function fetchPensionNetData(options?: {
  resourceId?: string;
  reportPeriod?: number;
  limit?: number;
  maxRecords?: number;
}): Promise<CKANRecord[]> {
  const allRecords: CKANRecord[] = [];
  let offset = 0;
  const limit = options?.limit ?? CKAN_PAGE_SIZE;
  const maxRecords = options?.maxRecords ?? 50000;

  while (allRecords.length < maxRecords) {
    const params = new URLSearchParams({
      resource_id: options?.resourceId ?? PENSION_NET_RESOURCE_ID,
      limit: String(limit),
      offset: String(offset),
      sort: "REPORT_PERIOD desc",
    });

    if (options?.reportPeriod) {
      params.set(
        "filters",
        JSON.stringify({ REPORT_PERIOD: options.reportPeriod })
      );
    }

    const url = `${CKAN_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CKAN API HTTP error: ${response.status}`);
    }

    const data: CKANResponse = await response.json();

    if (!data.success) {
      throw new Error(`CKAN API error: ${data.error?.message || "Unknown"}`);
    }

    allRecords.push(...data.result.records);

    if (
      allRecords.length >= data.result.total ||
      data.result.records.length < limit
    ) {
      break;
    }

    offset += limit;
  }

  return allRecords;
}

/**
 * Fetches the latest available report period from the API.
 */
export async function fetchLatestPeriod(): Promise<number> {
  const params = new URLSearchParams({
    resource_id: PENSION_NET_RESOURCE_ID,
    limit: "1",
    sort: "REPORT_PERIOD desc",
    fields: "REPORT_PERIOD",
  });

  const url = `${CKAN_BASE_URL}?${params.toString()}`;
  const response = await fetch(url);
  const data: CKANResponse = await response.json();

  if (!data.success || data.result.records.length === 0) {
    throw new Error("Failed to fetch latest period");
  }

  return data.result.records[0].REPORT_PERIOD;
}
