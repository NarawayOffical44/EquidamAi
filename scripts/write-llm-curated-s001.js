const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "synthetic",
  "evaldam_training_llm_generated_curated.jsonl",
);

const record = {
  scenario_id: "S001",
  area: "Valuation Method Selection Logic",
  difficulty: "medium",
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
  sample_index: 1,
  lenses: {
    profile: "first-time technical founder with limited finance experience",
    angle: "valuation method selection, runway pressure, and term-sheet quality",
    style: "what, how, why progression",
  },
  conversation: [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
    },
    {
      role: "user",
      content: "What valuation method should I actually use here, and which offer is fair for our stage?",
    },
    {
      role: "assistant",
      content: `<thinking>
Rahul is not pre-revenue and not mature enough for stable cash-flow forecasting. He has INR 4.2L MRR, so ARR is about INR 50.4L. At 18 percent month-on-month growth, he is showing early pull, but 8 customers and 4 months runway make the data promising rather than institutional-grade. DCF should be rejected because a 14-month SaaS company cannot defend 5-year cash flows, discount rates, churn, or terminal value with precision. Berkus is useful for pre-revenue idea-risk scoring, but it underweights actual MRR. Scorecard is more relevant, then I should sanity-check against ARR multiples.

Offer 1: INR 1.5Cr at INR 12Cr post-money means 12.5 percent dilution and about 23.8x ARR. Offer 2: INR 2Cr at INR 18Cr post-money means 11.1 percent dilution and about 35.7x ARR. The second is rich but not absurd if growth quality is real. Self-check: am I overvaluing growth? Possibly, because customer concentration, churn, gross margin, and sales cycle are missing. Still, the right recommendation is not DCF; it is Scorecard plus revenue-multiple discipline and term-sheet review under Companies Act 2013 issuance mechanics.
</thinking>

Use Scorecard as the primary method, cross-check it with ARR multiple, and ignore DCF for the decision. On headline economics, the Bengaluru offer is better: more capital, lower dilution, and a valuation that rewards traction rather than just idea risk.

**Why this works in Indian context:**
Indian seed investors usually price a company like this through comparable seed rounds, founder quality, traction, market size, and round supply-demand, not through textbook DCF. Your INR 50.4L ARR and 18 percent month-on-month growth place you beyond a pure Berkus case, while still too early for predictable cash-flow valuation. Also, the round must be documented cleanly through private placement or rights issue mechanics under the Companies Act 2013; the valuation method is only one part of making the financing usable. At this stage, the right method should explain investor behaviour and also survive diligence. Scorecard does that better than Berkus because it captures team, market, traction, competition, and funding climate in one practical frame.

**How to execute:**
1. In the next 48 hours, build a one-page valuation bridge: INR 4.2L MRR, INR 50.4L ARR, 18 percent monthly growth, 8 paying customers, and 4 months runway.
2. Use INR 12Cr post-money as the conservative anchor and INR 18Cr as the growth-case anchor; write the implied dilution beside each offer: 12.5 percent for Offer 1 and 11.1 percent for Offer 2.
3. Ask both investors within 3 days for the full term sheet, not only valuation: liquidation preference, ESOP expansion, anti-dilution, board rights, pro-rata, information rights, and founder vesting.
4. Treat 1x non-participating liquidation preference and broad-based weighted-average anti-dilution as acceptable; mark participating preference, full ratchet, excessive vetoes, or forced ESOP expansion as valuation reducers.
5. Run a runway model: with INR 1.5Cr, decide whether you get at least 15 months; with INR 2Cr, target 18 months and a Series A narrative at INR 15-20L MRR.
6. Negotiate closing speed because 4 months runway is weak leverage; aim to sign within 21 days and receive money within 30-40 days after documents, bank KYC, and board approvals.
7. Prepare a short counter to the CA's DCF: use it only as supporting documentation if needed, while your investor deck shows Scorecard, ARR multiple, customer proof, and the next 3 milestone gates.

**Bottom line:**
Choose the Bengaluru offer if terms are clean. If its control terms are aggressive, take the Mumbai offer only if it has founder-friendly documents and can close faster; do not let a DCF spreadsheet override market evidence from actual angels. Your decision should read like a financing strategy, not a valuation-method debate.`,
    },
    {
      role: "user",
      content: "How should I compare the two term sheets if the valuation headline is not enough?",
    },
    {
      role: "assistant",
      content: `<thinking>
The question is about converting valuation into real founder outcome. Offer 2 has INR 2Cr at INR 18Cr post, so Rahul sells 11.1 percent. Offer 1 has INR 1.5Cr at INR 12Cr post, so he sells 12.5 percent. Pure dilution says Offer 2 wins by 1.4 percentage points and gives INR 50L more runway. But term-sheet economics can easily erase this. A 15 percent pre-money ESOP refresh, participating liquidation preference, full-ratchet anti-dilution, or heavy veto rights can make a higher valuation worse in practice.

Need compare control and downside. Since the company has 8 customers and 4 months runway, the next round may happen before the business is fully derisked. If the next round is flat or down, anti-dilution matters. Indian angel rounds often use CCPS for preference rights, so the Articles of Association and shareholders agreement matter as much as the offer email. Self-check: do I need to pick one now? No, the sharper move is to create a red-flag scoring grid, assign economic cost to each term, then choose the highest clean net offer within the 30-day deadline.
</thinking>

Compare them on net founder outcome, not post-money valuation. Start with Offer 2 as the default winner, then subtract value for every term that reduces control, creates hidden dilution, or makes the next round harder.

**Why this works in Indian context:**
Indian angel and seed rounds are often implemented through CCPS, so preferences, conversion rights, anti-dilution, reserved matters, and board rights become binding through the shareholders agreement and Articles under the Companies Act 2013. A higher valuation with full-ratchet anti-dilution or participating liquidation can behave worse than a lower valuation with clean 1x non-participating preference. Since typical Indian seed dilution is around 15-22 percent, both offers are numerically reasonable; the document quality is the real separator. This is especially important because Indian follow-on investors often re-open earlier SHA terms during diligence. A messy angel round can slow Series A by 30-60 days even when the operating metrics look strong.

**How to execute:**
1. Create a 10-point term grid today: valuation, cheque size, closing time, liquidation preference, anti-dilution, ESOP demand, board seat, veto rights, founder vesting, and investor value-add.
2. Give each term a red, amber, or green score by tomorrow evening; red means it can cost more than INR 50L of value or block the next round.
3. Price the ESOP clause explicitly: if either investor demands a 10 percent pool pre-money, calculate Rahul and co-founder dilution before the investor money enters.
4. Reject any participating liquidation preference; a 1x non-participating structure is the clean market standard for an angel-stage SaaS round.
5. Reject full-ratchet anti-dilution; accept only broad-based weighted-average anti-dilution, ideally limited to qualified financing events.
6. Call 3 founders backed by each angel syndicate within 5 days and ask two direct questions: did they close on promised timelines, and did they help during the next fundraise?
7. Build a Series A simulation: assume the company raises INR 8-12Cr in 18 months at INR 45-60Cr post-money, with a 10-12 percent ESOP pool. Compare founder ownership after that, not only today.
8. Write the decision memo in 1 page and circulate it to co-founders before signing; include the chosen offer, rejected risks, expected closing date, and ownership after the next round.

**Bottom line:**
Offer 2 is better if it has clean economics and normal governance. Offer 1 becomes better only if Offer 2 contains hidden preference, full ratchet, excessive vetoes, or a slow closing timeline that risks your 4-month runway. The right choice is the offer that keeps the company fundable after this round, not the one that wins a screenshot comparison.`,
    },
    {
      role: "user",
      content: "Why should I not just use my CA's DCF and push for the highest possible price?",
    },
    {
      role: "assistant",
      content: `<thinking>
Rahul wants to maximize price, but the risk is building the round around a fragile valuation story. A DCF needs revenue forecasts, churn assumptions, gross margin, CAC payback, discount rate, terminal value, and long-term free cash flow. With only 8 paying customers and INR 4.2L MRR, every one of those assumptions can swing valuation by 2x or 3x. Pushing for the highest price may also create future round pressure. If he accepts INR 18Cr post today, the Series A investor will expect enough progress to justify a material markup, maybe INR 45-60Cr post within 18 months. That requires reaching perhaps INR 15L+ MRR with stronger retention.

Need distinguish tax valuation from investment pricing. A CA may prepare a valuation report for Companies Act or Income Tax Act documentation, but that is not the same as choosing the best venture financing method. Angel tax under Section 56(2)(viib) has been abolished for relevant new issuances from FY 2024-25, but proper documentation still matters. Self-check: is high valuation always bad? No. It is good when milestone-consistent and paired with clean terms. It is bad when it creates a down-round setup or dirty rights.
</thinking>

Do not use DCF as the negotiation center. Use a defensible market valuation, accept a strong but achievable price, and optimize for clean terms plus enough runway to reach the next milestone.

**Why this works in Indian context:**
In India, a CA valuation report can support compliance, but investors still price early SaaS through traction, comparable rounds, founder-market fit, and forward milestones. Section 56(2)(viib) concerns have reduced after the angel-tax abolition for FY 2024-25 onward, but Companies Act 2013 filings, board approvals, share valuation support, and clean cap-table records remain important. A high seed valuation that cannot be grown into a stronger Series A often damages credibility with Indian VCs. The practical issue is signalling: if you price like a company already at institutional quality, your next 12-18 months must prove that with retention, repeatable sales, and cleaner metrics.

**How to execute:**
1. Ask your CA within 2 days to prepare only the compliance valuation support, not the commercial negotiation thesis.
2. Set a Series A milestone map: in 18 months, target INR 15-20L MRR, at least 25-40 customers, gross margin above 70 percent, and churn evidence across 2 renewal cycles.
3. Back-solve valuation: if Series A must happen at INR 45-60Cr post-money, then INR 18Cr seed post-money requires roughly a 2.5-3.3x markup, which is achievable only with clean growth.
4. Avoid optimizing from INR 18Cr to INR 22Cr if it delays closing by 30 days; with 4 months runway, lost time can cost more than 2-3 percent dilution.
5. Keep the round size aligned to milestones: INR 2Cr should finance hiring 2-3 core roles, sales experiments, and product reliability, not uncontrolled burn.
6. Use a board-approved cap table and proper allotment documents under the Companies Act 2013 so the next investor does not find defects during diligence.
7. Document investor rights in plain language: no participating preference, no full ratchet, no founder-hostile reserved matters, and no unclear advisory share promises.
8. Keep one downside model where growth slows to 8 percent month-on-month and runway falls below 6 months; if that model creates a flat round, lower the seed price or improve terms now.

**Bottom line:**
The best seed round is not the highest theoretical price; it is the round that funds the next 18 months without poisoning Series A. Take the highest clean offer that you can grow into, and keep DCF in the compliance folder rather than the investor pitch. Your strongest negotiation line is disciplined ambition: high enough to respect traction, clean enough to compound.`,
    },
  ],
};

function readExistingRecords(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existing = readExistingRecords(outputPath);
if (existing.some((item) => item.batch === record.batch && item.scenario_id === record.scenario_id)) {
  throw new Error(`${record.scenario_id} already exists in ${record.batch}`);
}

fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, "utf8");
console.log(`appended ${record.scenario_id} to ${outputPath}`);
