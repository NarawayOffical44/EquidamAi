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
  scenario_id: "S003",
  area: "Founder Dilution & ESOP Strategy",
  difficulty: "medium",
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
  sample_index: 3,
  lenses: {
    profile: "methodical fintech founders preparing for an institutional seed round",
    angle: "pre-money ESOP dilution, allocation discipline, and negotiation leverage",
    style: "what, how, why progression",
  },
  conversation: [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
    },
    {
      role: "user",
      content: "What ESOP pool and dilution should we accept before signing this seed round?",
    },
    {
      role: "assistant",
      content: `<thinking>
Arjun and Sneha are raising INR 6Cr at INR 30Cr post-money, so investor ownership is 20 percent. The VC asks for a 12 percent ESOP pool created pre-money. Because the founders currently own 100 percent, the pool shuffle comes entirely from them before the investor enters. If the post-money target is INR 30Cr and the investment is INR 6Cr, the nominal pre-money is INR 24Cr. A 12 percent post-money ESOP pool created pre-money means the founders reserve 12 percent of the final company, then the investor gets 20 percent. Founders together move to about 68 percent, not 80 percent. That is a major economic hit, though still potentially acceptable for a fintech growing at INR 8L MRR and 22 percent month-on-month.

Need set market range. A seed-stage Indian SaaS or fintech ESOP pool is often 8-12 percent if the company needs senior leadership before Series A. They already promised 2 senior hires meaningful equity, so a pool below 8 percent may be fake. Self-check: is 12 percent automatically unfair? No. It is high but defensible if hiring needs are real. The negotiation should be 10 percent pre-money or 12 percent with partial post-money sharing.
</thinking>

Accept an ESOP pool, but do not accept the 12 percent pre-money ask without negotiation. Counter with 10 percent pre-money, or 12 percent split so that 8 percent is pre-money and 4 percent is created post-money.

**Why this works in Indian context:**
Indian seed VCs often ask for an ESOP pool before investment because they want hiring dilution borne by existing founders, not by the new investor. ESOPs in a private company need board and shareholder approvals under the Companies Act 2013 and the Companies (Share Capital and Debentures) Rules, so the pool cannot remain an informal promise. Since you are at INR 8L MRR, 22 percent month-on-month growth, and 9 months runway, a real pool is useful, but the pool size should match the next 12-18 months of hiring. In fintech, the hiring map usually includes engineering, compliance, risk, partnerships, and enterprise sales, so a zero-pool strategy is not credible. The error is not creating an ESOP; the error is letting the investor define it without tying it to actual roles.

**How to execute:**
1. Model the cap table today with 3 cases: 12 percent pre-money pool, 10 percent pre-money pool, and 8 percent pre-money plus 4 percent post-money refresh.
2. In the VC counter, show the founder impact clearly: INR 6Cr on INR 30Cr post-money already gives the investor 20 percent; a full 12 percent pool takes founders near 68 percent combined.
3. Ask for a hiring plan-based pool, not an arbitrary pool: 2 senior hires now, 4-6 mid-level hires before Series A, and a small retention reserve.
4. Keep minimum pool size at 8 percent because verbal promises to 2 senior people must be formalized before closing.
5. Push back above 10 percent unless the VC agrees to share the next refresh post-money at Series A.
6. Put an ESOP allocation schedule into the closing checklist within 15 days: role, grant size, vesting, cliff, exercise price, and board approval date.
7. Use standard 4-year vesting with a 1-year cliff for new senior hires; give early employees some recognition grant with vesting credit only if they have genuinely carried early risk.
8. Keep 2 percent of the pool unallocated after the first grant cycle, because unexpected senior hiring needs often appear during regulatory, banking-partnership, or enterprise-sales expansion.

**Bottom line:**
The pool is necessary, but the full 12 percent pre-money structure is expensive. Your clean position is 10 percent pre-money now, documented properly, with the next ESOP refresh shared with future investors instead of silently loaded onto founders today. This gives the VC a credible hiring reserve while keeping founder dilution within a range that still looks healthy for Series A.`,
    },
    {
      role: "user",
      content: "How should we allocate ESOPs and vesting for the two senior hires already promised equity?",
    },
    {
      role: "assistant",
      content: `<thinking>
Need give allocation guidance without knowing exact roles. They have 2 senior people promised meaningful equity, likely senior leadership or critical ICs. In an Indian seed-stage fintech at INR 8L MRR, meaningful equity should be specific but not excessive. If these are VP-level hires, ranges could be 0.75-1.5 percent each depending on function, cash compensation trade-off, and scarcity. If senior ICs, 0.25-0.75 percent is more realistic. Total committed to the 2 hires should probably be 1.5-2.5 percent, leaving most of the 10-12 percent pool for Series A hiring.

Need mention tax and instrument realities. ESOP exercise in India can trigger perquisite tax, with some deferral benefits for eligible DPIIT-recognised startups, but employees still care about exercise price, exercise window, and liquidity. The company must move from verbal promises to board-approved grants. Self-check: should they give vesting credit for the verbal period? Maybe limited credit if the people already joined and accepted lower cash, but not for candidates who only received loose promises. Need recommend a structured grant matrix and no open-ended "meaningful equity" language.
</thinking>

Convert verbal promises into written, board-approved grants before the round closes. For two genuinely senior hires, reserve around 1.5-2.5 percent total, not the entire pool.

**Why this works in Indian context:**
Indian employees often hear ESOP promises casually, but enforceability and trust come from grant letters, board approvals, vesting terms, and a real ESOP plan under the Companies Act 2013 framework. Fintech hiring is competitive, so a credible ESOP package can reduce cash burn, but over-granting before Series A weakens founder ownership and leaves no hiring budget. Employee tax also matters: ESOPs can create perquisite tax on exercise and capital gains tax on sale, so grant size alone is not the full value story. A good grant letter should therefore explain vesting, exercise window, strike price, and liquidity conditions. That clarity makes a smaller grant feel more trustworthy than a larger vague promise.

**How to execute:**
1. Classify the 2 senior people by role this week: VP Engineering or Head of Risk can justify 0.75-1.25 percent; senior IC or early manager should be closer to 0.25-0.75 percent.
2. Cap total immediate grants at 2.5 percent of the company, leaving at least 7.5 percent in a 10 percent pool for future hires.
3. Use 4-year vesting with a 1-year cliff, then monthly vesting over 36 months; avoid full vesting on joining.
4. If someone already worked for 6 months below market salary, consider 3-6 months vesting credit, but document the reason in the board note.
5. Add leaver clauses: unvested options lapse on exit, vested options have a 90-180 day exercise window, and termination-for-cause treatment is stricter.
6. Set exercise price with valuation support and keep it explainable; employees should know that ESOP value comes from future company value, not a guaranteed cash bonus.
7. Create a one-page ESOP explainer for employees within 10 days covering vesting, exercise, tax timing, liquidity, and what happens during acquisition or IPO.
8. Review the pool every quarter at the board level; grant in batches after performance evidence rather than distributing the full pool before Series A hiring is clear.

**Bottom line:**
The two promised hires should receive real grants, but the grants must be sized by role and locked into formal documents. A strong ESOP plan balances trust, retention, and future hiring capacity; it is not a blank cheque for every early conversation. The founders should leave the round with employees trusting the plan and investors seeing unused equity capacity for the next layer of leadership. That balance matters more than sounding generous in offer calls today, clearly.`,
    },
    {
      role: "user",
      content: "Why does a pre-money ESOP pool cost us more, and can we push back?",
    },
    {
      role: "assistant",
      content: `<thinking>
Need explain pool shuffle simply. In a post-money investment of INR 30Cr with INR 6Cr coming in, the investor gets 20 percent. If the ESOP pool is created pre-money, founders absorb it before the investor enters. So founders are diluted first by the 12 percent pool and then by the investor's 20 percent stake. If the pool were created post-money, everyone including the investor would share the dilution. That is why the lawyer says founders lose 3-4 percent extra: the investor preserves its target percentage while founders fund future hiring.

Need calculate pushback. If founders currently 50-50 and no pool, after 12 percent pre-money pool and 20 percent investor, founders together are around 68 percent, about 34 percent each. With a 10 percent pre-money pool, founders together are roughly 70 percent. With pool sharing post-money, founders can retain several points more. Self-check: will VC reject pushback? Maybe not if framed around hiring model and founder ownership at Series A, not emotion. Need recommend specific asks and fallback.
</thinking>

Yes, push back. The right argument is not "ESOP is unfair"; it is "the pool size and timing should match the hiring plan, and future investors should share future hiring dilution."

**Why this works in Indian context:**
The pre-money ESOP pool shuffle is common in Indian VC term sheets, but it is still negotiable when the founders can show a hiring model. The Companies Act 2013 process makes ESOP creation a formal shareholder action, so the cap-table effect should be visible before signing, not discovered after allotment. Since Indian seed rounds usually dilute founders 15-22 percent for the investor alone, adding a 12 percent founder-funded pool makes this round economically closer to a much heavier dilution event. Investors know this; the reason they ask is to protect their entry ownership. Founders can accept the commercial logic while still negotiating the number and timing.

**How to execute:**
1. Put the math in the next negotiation email: INR 6Cr at INR 30Cr post-money equals 20 percent investor ownership before ESOP effects.
2. Show founder ownership under 3 cases: 12 percent pre-money pool around 68 percent combined, 10 percent pre-money around 70 percent combined, and shared post-money refresh preserving more founder ownership.
3. Offer a principled counter: create 8-10 percent pre-money now, then refresh to 12-14 percent at Series A with the new investor sharing dilution.
4. Tie every 1 percent of pool to a hiring need: 2 senior hires, 3 engineering hires, 1 risk/compliance hire, and 1 sales leader over 12-18 months.
5. Ask for unused pool protection: if more than 4 percent remains unused before Series A, it should be considered in the next pool calculation.
6. Do not trade ESOP pushback for bad investor rights; keep 1x non-participating liquidation preference and broad-based weighted-average anti-dilution as non-negotiable quality lines.
7. Finalize the ESOP plan, SHA, AoA amendments, and board approvals in one closing sequence so there is no mismatch between promise, cap table, and legal documents.
8. If the VC refuses all movement, ask for something measurable in return: faster close within 30 days, stronger hiring support, or a written agreement that Series A pool refresh will be shared.

**Bottom line:**
Pre-money ESOP costs more because it loads hiring dilution onto founders before the VC buys its 20 percent. Push back with math, not frustration: accept a real pool, reduce the pre-money portion, and make future hiring dilution shared with future capital. That keeps the negotiation professional and protects the ownership story you will need in the next institutional round. It also shows the VC you understand cap-table mechanics before signing, clearly.`,
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
