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
  scenario_id: "S006",
  area: "Real-World Trade-off Decision Making",
  difficulty: "hard",
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
  sample_index: 6,
  lenses: {
    profile: "D2C founder under deadline pressure with conflicting advisor opinions",
    angle: "risk-adjusted choice across VC, RBF, and acquisition",
    style: "what, how, why progression",
  },
  conversation: [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
    },
    {
      role: "user",
      content: "What should I choose between the VC round, RBF deal, and acquisition offer?",
    },
    {
      role: "assistant",
      content: `<thinking>
Meera has INR 1.4Cr ARR, 38 percent gross margin, 8 percent net loss, and 7 months runway. The VC offer is INR 3Cr at INR 18Cr post-money, so dilution is 16.7 percent and growth expectations rise sharply. The RBF offer is INR 80L at 8 percent monthly revenue, capped at 1.4x, so repayment cap is INR 1.12Cr. At INR 1.4Cr ARR, monthly revenue is about INR 11.7L; 8 percent sweep is roughly INR 94K/month today, increasing as revenue grows. The acquisition is INR 9Cr cash plus up to INR 4Cr earnout, so maximum INR 13Cr, but earnout and 2-year integration risk matter.

Need recommend. With only 38 percent gross margin, D2C skincare needs caution on VC-funded paid growth. RBF is less dilutive but too small to transform the company. Acquisition gives real liquidity but may cap upside and create earnout risk. Self-check: am I overweighting independence? The co-founder wants exit and runway is finite. Still, the best risk-adjusted move is negotiate acquisition seriously while keeping RBF as fallback, not take VC by default.
</thinking>

Run a dual track, but make the strategic acquisition the lead path if diligence confirms INR 9Cr upfront cash is firm. Use RBF as fallback; take the VC round only if acquisition terms weaken badly.

**Why this works in Indian context:**
Indian D2C funding has become more disciplined: investors now care about gross margin, repeat purchase, CAC payback, and channel concentration, not just ARR. At 38 percent gross margin and 8 percent net loss, a VC round can force aggressive growth before the unit economics are strong enough. The acquisition must be evaluated under Companies Act 2013 share-transfer or business-transfer mechanics and the Income Tax Act capital-gains impact, because headline cash is not the same as founder take-home. RBF is commercially simpler, but INR 80L may not change the company's long-term position. This is not a morality choice between ambition and exit; it is a risk-adjusted capital allocation decision. The buyer may value your brand, supply chain, and customer base more than financial investors do today.

**How to execute:**
1. In the next 48 hours, ask the FMCG buyer for a written LOI with INR 9Cr upfront, earnout formula, payment dates, founder lock-in, non-compete, and indemnity cap.
2. Model founder outcomes in 3 cases: immediate INR 9Cr sale, INR 13Cr max earnout, and failed earnout where only 60-70 percent of expected value is realized.
3. Keep the VC option warm, but ask for exact terms: liquidation preference, board rights, founder vesting, growth covenants, ESOP pool, and monthly burn expectations.
4. Use RBF only if you reject the acquisition and need 6-9 months to improve repeat purchase, gross margin, and contribution margin without dilution.
5. Set a minimum acquisition condition: at least 70 percent of consideration upfront or in escrow-backed fixed payment, not mostly discretionary earnout.
6. Build a 12-month independent plan: raise gross margin from 38 percent to 48 percent, cut net loss below 3 percent, and increase repeat purchase rate before taking VC.
7. Decide by day 18, not day 21, so legal review, tax review, and board approval do not happen under panic.
8. Align with the co-founder in writing: choose whether the company is being optimized for liquidity, independence, or venture-scale outcome before negotiating final terms.
9. Ask every option the same question: what does this do to founder stress, control, and probability of survival 12 months from now; then score it before emotions dominate.

**Bottom line:**
The acquisition is the best lead path if the INR 9Cr upfront is clean and founder obligations are reasonable. If the buyer loads value into a fragile earnout, use RBF to buy time and improve metrics; do not take VC money just because it feels like the startup answer. For this company, clean liquidity may be smarter than expensive growth theater.`,
    },
    {
      role: "user",
      content: "How should I negotiate and run the decision process in these 21 days?",
    },
    {
      role: "assistant",
      content: `<thinking>
Need propose a decision process under deadline. The FMCG offer expires in 21 days, so Meera needs parallel diligence, not sequential advice from co-founder, CA, and advisor. The biggest negotiation point is earnout definition. INR 9Cr cash is clear; INR 4Cr earnout can be valuable or worthless depending on targets, control, marketing budget, channel integration, SKU rationalization, and founder authority. VC term sheet also needs scrutiny because aggressive growth expectations may increase burn. RBF documents need revenue sweep mechanics and default triggers.

Need include tax/legal. A share sale versus asset sale changes tax, liabilities, GST, contracts, and employee transfer. Income Tax Act capital gains apply to share sale; business transfer can have different implications. Self-check: should she hire bankers? With 21 days and INR 9-13Cr size, a full banker process is too slow. She needs a tight negotiation checklist and lawyer-led redline. Recommendation: create a decision room, set non-negotiables, and request binding details by day 7.
</thinking>

Run a 3-track decision room for 21 days, but force all offers into comparable signed terms by day 7. Without written terms, advisor opinions are just noise.

**Why this works in Indian context:**
Indian founder exits often look attractive on headline value and then lose value through earnout ambiguity, indemnity holdbacks, tax leakage, and operational control after closing. The Companies Act 2013 mechanics, Income Tax Act capital-gains treatment, GST position for asset transfers, and assignment of marketplace/vendor contracts all affect real value. VC and RBF are faster to compare only after you convert them into cash-flow obligations and founder-control consequences. A structured process prevents the loudest advisor from becoming the decision-maker. It also protects co-founder trust: when both founders see the same scorecard, the discussion moves from personal preference to business consequence.

**How to execute:**
1. Day 1: create a one-page decision scorecard with 5 criteria: founder liquidity, company upside, execution risk, control loss, and 24-month stress level.
2. Day 2: ask the FMCG acquirer for a draft term sheet, diligence list, earnout formula, indemnity cap, holdback amount, non-compete scope, and founder role.
3. Day 3: ask the VC for a full term sheet and written growth plan assumptions: monthly burn, CAC budget, hiring plan, board rights, and next-round expectation.
4. Day 4: ask the RBF provider for repayment schedule examples at INR 10L, INR 15L, and INR 20L monthly revenue, plus all fees and default triggers.
5. Day 5-7: have legal and tax review compare share sale versus business transfer, including capital gains, GST, employee transfer, and contract assignment.
6. Day 8-12: negotiate the acquisition first: push for at least INR 9Cr fixed, earnout tied to controllable revenue or gross margin, and indemnity capped at 10-15 percent.
7. Day 13-16: run a co-founder decision meeting and document the chosen path; unresolved founder disagreement is itself a transaction risk.
8. Day 17-21: sign only if the chosen offer has clean economics, realistic obligations, and no hidden control trap; otherwise take RBF and continue operating.
9. Keep a single data room for all 3 tracks: monthly P&L, SKU margin, marketplace split, customer repeat rate, inventory ageing, GST filings, and key vendor contracts.
10. Ask your lawyer to mark each term as economic, control, tax, or operational risk so the final decision does not get buried in legal language.

**Bottom line:**
The decision process should turn 3 messy options into comparable risk-adjusted outcomes. Your default should be acquisition if upfront cash is protected, RBF if terms get messy, and VC only if you actively choose a high-growth, high-pressure path. The deadline is useful only if it forces clarity, not rushed surrender by founders today.`,
    },
    {
      role: "user",
      content: "Why not take the acquisition now since cash is guaranteed and my co-founder wants it?",
    },
    {
      role: "assistant",
      content: `<thinking>
Need challenge "cash is guaranteed." INR 9Cr cash may be guaranteed only after closing, conditions precedent, diligence, representations, indemnities, and holdbacks. Earnout up to INR 4Cr is definitely not guaranteed unless formula and control rights are clear. Co-founder preference matters, but the decision should not be driven only by fatigue or disagreement. Need compare to current independent value. INR 1.4Cr ARR at D2C margins could be valued around 1-3x revenue depending on brand quality and profitability, so INR 9Cr upfront is about 6.4x ARR, which is strong for a loss-making brand with 38 percent gross margin. That makes the offer serious.

Need recommend not blind acceptance. Accept if 4 conditions hold: cash fixed, liabilities capped, earnout fair, founder role tolerable. Self-check: am I being too cautious? Maybe, because a strong upfront exit is rare. But caution is about terms, not rejecting the offer. Need explain legal/tax under Companies Act and Income Tax Act. Also founder alignment: if one wants exit and one wants grow, acquisition may prevent internal fracture.
</thinking>

You should be open to taking the acquisition, but not because "cash is guaranteed." Take it only if the INR 9Cr upfront survives diligence, the earnout is measurable, and your post-sale obligations are bounded.

**Why this works in Indian context:**
Indian strategic acquisitions often mix upfront cash, deferred payments, earnouts, indemnity holdbacks, and founder lock-ins. Under Companies Act 2013 transaction documents and Income Tax Act treatment, the real founder outcome can differ sharply from the headline enterprise value. A 2-year earnout is especially sensitive because the buyer may control marketing spend, discounting, SKU decisions, marketplace strategy, and working capital. If the buyer controls the levers and you carry the target risk, the INR 4Cr earnout is more like hope than consideration. That does not make the acquisition bad; it means the fixed cash and operating control terms matter more than the maximum number on the offer letter.

**How to execute:**
1. Confirm whether INR 9Cr is fully payable at closing or subject to escrow, holdback, working-capital adjustment, debt adjustment, or indemnity reserve.
2. Cap your indemnity exposure at 10-15 percent of upfront consideration and keep survival periods reasonable, such as 12-24 months depending on claim type.
3. Rewrite the earnout so it is based on metrics you can influence: net revenue, gross margin, repeat purchase, or channel expansion with committed buyer support.
4. Demand a buyer obligation schedule: minimum marketing budget, marketplace access, manufacturing support, inventory funding, and approval rights during the 2-year earnout.
5. Clarify founder lock-in: role, salary, reporting manager, decision rights, termination consequences, non-compete period, and what happens if the buyer changes strategy.
6. Compare founder take-home after tax with the VC path: INR 9Cr upfront today may beat a theoretical INR 50Cr company later if dilution, burn, and failure risk are high.
7. Use the co-founder alignment issue constructively: if one founder is emotionally done, a clean sale may be better than raising VC with a divided leadership team.
8. Keep one walk-away line: if more than 40 percent of value shifts into discretionary earnout, or if indemnity is uncapped, reject and use RBF to improve the business.
9. Ask for founder termination protection: if the buyer removes you without cause during the 2-year earnout, unpaid earnout should accelerate or convert into a fixed payment.
10. Confirm treatment of inventory, receivables, customer data, trademarks, supplier deposits, and marketplace accounts; hidden exclusions can reduce the value of the deal.

**Bottom line:**
The acquisition may be the right answer, but it must be a clean exit, not a disguised employment contract with uncertain upside. Take guaranteed value seriously; verify what is actually guaranteed before you sign. A good exit should reduce risk for both founders, not trap them in 24 months of unclear targets.`,
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
