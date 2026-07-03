/**
 * Day 1-2 harness: run the extraction pipeline and audit engine end to end
 * against sample documents, without touching Supabase.
 *
 * The samples in freightcheck/samples/ are synthetic .txt stand-ins for real
 * scanned bills/contracts (built for the same reason the plan says "don't
 * write code before you have real documents" — swap them out for actual PDFs
 * and photos from a real transporter the moment you have them, and re-run
 * this until extraction reads ~95% right before wiring in the dashboard).
 *
 * Usage: npm run test:extraction   (requires ANTHROPIC_API_KEY in .env.local)
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { extractRateContract } from "@/lib/extraction/rateContract";
import { extractBillTrips } from "@/lib/extraction/bill";
import { runAudit } from "@/lib/audit/engine";
import type { PriorTripRef } from "@/lib/audit/types";

function loadSample(filename: string) {
  return {
    data: readFileSync(path.join(__dirname, "..", "samples", filename)),
    mediaType: "text/plain" as const,
    filename,
  };
}

async function main() {
  console.log("--- Extracting rate contract ---");
  const contract = await extractRateContract(loadSample("rate-contract-abc-transport.txt"));
  console.log(JSON.stringify(contract, null, 2));

  console.log("\n--- Extracting January bill ---");
  const janBill = await extractBillTrips(loadSample("bill-abc-transport-jan.txt"));
  console.log(JSON.stringify(janBill, null, 2));

  console.log("\n--- Extracting February bill ---");
  const febBill = await extractBillTrips(loadSample("bill-abc-transport-feb.txt"));
  console.log(JSON.stringify(febBill, null, 2));

  // Treat every January trip as already "in the database" so the audit
  // engine has something to check February's duplicates against — this is
  // what getPriorTrips() would return for a real transporter across bills.
  const priorTrips: PriorTripRef[] = janBill.trips.map((trip) => ({
    lr_number: trip.lr_number,
    vehicle_number: trip.vehicle_number,
    trip_date: trip.trip_date,
    destination: trip.destination,
    bill_id: "jan-bill",
  }));

  console.log("\n--- Auditing February bill against the contract + January history ---");
  const result = runAudit({
    trips: febBill.trips,
    rateLines: contract.rate_lines,
    priorTrips,
    lrNumbersWithPod: new Set(), // no PODs uploaded in this dry run
  });
  console.log(JSON.stringify(result, null, 2));

  console.log(
    `\nClaimed ₹${result.total_claimed} | Approved ₹${result.total_approved} | Flagged ₹${result.total_flagged}`
  );
  console.log(
    "\nExpect to see: a rate_mismatch on LR 4944 (billed ₹41000, contract says ₹38000 for Hyderabad→Chennai), " +
      "a duplicate on LR 4821 (billed again from December), a fuzzy duplicate on LR 5002 (same vehicle/date/" +
      "destination as December's LR 4879 under a new number), and an unknown_lane flag on the Hyderabad→Pune trip."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
