#!/usr/bin/env node
/**
 * Simple runner for the Funding Valuation Blog Engine.
 *
 * Usage:
 *   node scripts/generate-funding-valuation-blog.mjs --auto --count=1
 *   node scripts/generate-funding-valuation-blog.mjs --company="AcmeAI" --amount="$50M" --valuation="$450M" --round="Series B"
 *
 * It respects the same weekly limits, dedup, and publishing rules as the rest of the marketing blog system.
 */

import { runFundingValuationBlogEngine } from "../lib/marketing/funding-valuation-engine.ts";

const args = process.argv.slice(2);

function getArg(name) {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1] : null;
}

async function main() {
  const count = Number(getArg("count")) || 1;
  const dryRun = args.includes("--dry-run") || args.includes("--dryRun");

  let specificRaises = null;

  const company = getArg("company");
  if (company) {
    specificRaises = [
      {
        company,
        amountRaised: getArg("amount") || getArg("raised"),
        valuation: getArg("valuation"),
        round: getArg("round"),
      },
    ];
  }

  console.log("Running Funding Valuation Blog Engine...");
  console.log({ count, dryRun, specificRaises: specificRaises ? "provided" : "auto-discover" });

  const result = await runFundingValuationBlogEngine({
    count,
    specificRaises,
    dryRun,
  });

  console.log("\nResult:");
  console.dir(result, { depth: 3 });

  if (result.success) {
    console.log("\n✅ Done. New blog post(s) published (or would be, in dry-run).");
  } else {
    console.log("\n⚠️  Engine finished with issues (see above).");
  }
}

main().catch((err) => {
  console.error("Engine failed:", err);
  process.exit(1);
});
