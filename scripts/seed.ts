/**
 * Seed script: fetches pension fund data from data.gov.il and populates the local database.
 *
 * Usage: npx tsx scripts/seed.ts [reportPeriod]
 * Example: npx tsx scripts/seed.ts 202412
 */

import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function main() {
  // Dynamic import to ensure data dir exists first
  const { runPipeline } = await import("@/lib/data-pipeline/pipeline");

  const periodArg = process.argv[2];
  const reportPeriod = periodArg ? parseInt(periodArg, 10) : undefined;

  if (reportPeriod && isNaN(reportPeriod)) {
    console.error("Invalid report period. Use YYYYMM format, e.g., 202412");
    process.exit(1);
  }

  console.log("=== Pension Ranking Data Seed ===");
  console.log(
    reportPeriod
      ? `Fetching data for period: ${reportPeriod}`
      : "Fetching latest available data"
  );
  console.log("");

  const result = await runPipeline({ reportPeriod });

  console.log("");
  console.log("=== Seed Complete ===");
  console.log(`Records processed: ${result.recordsProcessed}`);
  console.log(`Latest period: ${result.latestPeriod}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
