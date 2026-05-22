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
  scenario_id: "S005",
  area: "Indian Angel & Early VC Psychology",
  difficulty: "medium",
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
  sample_index: 5,
  lenses: {
    profile: "consumer founder frustrated by repeated angel rejection",
    angle: "investor psychology, traction reframing, and near-term survival",
    style: "what, how, why progression",
  },
  conversation: [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
    },
    {
      role: "user",
      content: "What is actually wrong with my angel pitch, and should I pivot the company?",
    },
    {
      role: "assistant",
      content: `<thinking>
Nikhil has 12K downloads and 800 DAU, which gives about 6.7 percent DAU/downloads. That is not bad for a 6-month consumer app, but he has zero revenue, only INR 8L savings, and 5 months runway. Indian angels are reacting to two risks: crowded consumer health category and no monetization evidence. The feedback "too early" and "show me revenue" probably means the pitch is feature-led rather than wedge-led. A full product pivot would be premature because some engagement exists. The pivot should be in proof: show retention, paid intent, acquisition channel quality, and a narrow health use case where users return.

Need recommend concrete repositioning. Indian angels often prefer business model validation earlier than US consumer angels, especially after expensive consumer-growth failures. If he shifts to US angels now, he may face the same issue plus cross-border structure friction. Self-check: is 14 pitches enough to conclude failure? Enough to conclude the current pitch is weak, not enough to kill the company. Recommend a 30-day traction reset before another 20 investor conversations.
</thinking>

Do not pivot the company yet. Pivot the pitch from "consumer health app with downloads" to "specific health behaviour wedge with retention, monetization tests, and a path to INR 5-10L MRR."

**Why this works in Indian context:**
Indian angels rarely fund broad consumer apps on downloads alone now; they want proof that users return, pay, or create a defensible distribution loop. Your 12K downloads and 800 DAU show interest, but without revenue or cohort retention, investors read it as attention rather than business quality. If you raise from Indian angels, the round will likely use equity or CCPS-style documentation under the Companies Act 2013, so they will diligence cap table, use of funds, and milestones. DPIIT recognition can help credibility, but it will not replace evidence of monetization. The reason the feedback sounds inconsistent is that each angel is describing the same underlying concern from a different angle: not enough proof that this can become a paid, repeat-use Indian health product.

**How to execute:**
1. Stop pitching for 21 days and rebuild the deck around 1 narrow wedge: for example diabetes habit tracking, women's hormonal health, or chronic-care reminders, not generic wellness.
2. Add 4 missing metrics to the first 3 slides: D7 retention, D30 retention, organic acquisition percentage, and activation rate from install to first completed health action.
3. Run a paid-intent test within 14 days: charge INR 99-299 for a premium plan, consultation bundle, or structured health program; even 50-100 paying users changes the conversation.
4. Segment the 800 DAU: identify the top 2 user cohorts by repeat usage, age group, health problem, city tier, and acquisition source.
5. Build a survival budget: with INR 8L and 5 months runway, cap burn at INR 1.4L/month until you have a stronger funding signal.
6. Replace "market is huge" slides with one behaviour loop: trigger, user action, health value, repeat reason, and monetization point.
7. Re-approach only 8-10 angels after the reset, prioritizing healthtech operators, doctors turned founders, consumer subscription investors, and angels who understand Indian CAC constraints.
8. Define the ask tightly: INR 40-60L to prove INR 2L MRR and D30 retention above 20 percent within 4 months.
9. Rewrite the opening line of the pitch so it names the user, pain, and repeated behaviour in 15 seconds; do not begin with app categories, TAM, or AI features.

**Bottom line:**
The rejection is not telling you the startup is dead; it is telling you the evidence is incomplete. Keep the product direction, sharpen the wedge, prove paid behaviour, and then restart fundraising with a more investor-legible story. Your next pitch should make an angel think, "this founder has found a painful repeat use case," not merely, "this founder has built another health app."`,
    },
    {
      role: "user",
      content: "How should I rebuild the next 30 days of fundraising and traction?",
    },
    {
      role: "assistant",
      content: `<thinking>
Need give a 30-day operating plan. Nikhil has 5 months runway, so he cannot spend 3 months in vague fundraising. He needs traction work and investor work in parallel, but the first 2 weeks should create new evidence. The plan should include user calls, cohort analysis, monetization experiment, deck rewrite, and targeted angel outreach. Since no revenue exists, the fastest credibility builder is a small paid pilot or subscription test. If he can get even INR 50K-1L MRR signal, the pitch changes materially.

Need avoid vanity metrics. Downloads are weak unless connected to active usage and retention. The 14 prior angel conversations are useful data; he should categorize objections and answer them directly. Self-check: should he raise a tiny bridge from friends immediately? Maybe only if the 30-day test works or if runway falls below 3 months. For now, conserve cash and build evidence. Need mention Indian regulatory/entity point: if raising, keep private placement documents and valuation support clean under Companies Act.
</thinking>

Run a 30-day evidence sprint, not a generic fundraising sprint. The goal is to create 3 new proof points before asking investors again: retention, paid intent, and a sharper market wedge.

**Why this works in Indian context:**
Indian angels often back founders when the round has a clear next milestone rather than a broad "build and grow" plan. In consumer health, the investor fear is that CAC rises faster than retention and that medical trust is hard to build. A focused 30-day sprint gives you fresh data without burning the full 5-month runway. If you do receive commitments, keep the issuance process compliant under the Companies Act 2013 instead of collecting informal money first and cleaning it later. This matters because small angel rounds can become messy when founders accept verbal cheques, delay allotment, or mix advisor promises with investor rights. A clean process makes the next investor believe the company is disciplined.

**How to execute:**
1. Days 1-3: analyze existing users by cohort; calculate D1, D7, D14, and D30 retention, plus the top 3 actions repeated by high-frequency users.
2. Days 4-7: conduct 25 user calls, with at least 10 from your most active cohort and 10 from users who dropped after day 1.
3. Days 8-14: launch one paid experiment at INR 99-299; do not overbuild, just test whether users pay for a structured outcome.
4. Days 15-18: rewrite the deck into 10 slides: wedge, user pain, traction quality, retention, monetization test, market, product loop, team, use of funds, and 4-month milestone.
5. Days 19-22: create a rejection-response slide answering the 3 common objections: crowded market, no revenue, and weak differentiation.
6. Days 23-30: approach 20 targeted investors in 4 buckets: healthtech founders, doctors with angel activity, consumer subscription angels, and Bengaluru/Mumbai operators who invest INR 10-25L tickets.
7. Keep the raise small: ask for INR 50-75L, not INR 2Cr, and tie it to reaching INR 5L MRR or 25 percent D30 retention in 6 months.
8. Track every conversation in a sheet with objection, follow-up date, cheque size, and decision status; do not let "send updates" become a dead pipeline.
9. Send a fortnightly investor update after the sprint starts: 5 metrics, 3 learnings, 1 ask, and a clear next milestone, so warm angels can watch momentum instead of making a binary decision today.

**Bottom line:**
Your next 30 days should produce evidence, not emotional recovery from rejection. If you return with retention cohorts, paid users, and a focused wedge, the same market can look fundable even without a full product pivot. The aim is to make rejection harder because the company has become easier to evaluate.`,
    },
    {
      role: "user",
      content: "Why not shift to US angels now if Indian angels are being too conservative?",
    },
    {
      role: "assistant",
      content: `<thinking>
Need compare India vs US angels. US angels may be more comfortable with pre-revenue consumer stories, but they still expect a strong insight, growth loop, or founder-market fit. Nikhil has 12K downloads, 800 DAU, no revenue, and unclear retention. That is unlikely to travel well internationally unless the market story is globally legible. Also, if the company is Indian-incorporated, US angels may prefer SAFE, but SAFE is not the normal recognized instrument for Indian private companies. Cross-border investment can require FEMA compliance, pricing rules, KYC, FC-GPR filings, and often CCPS or CCDs. That friction is not worth it before proof improves.

Need not reject US entirely. Use US angels selectively if they have India health or diaspora expertise. But shifting the entire strategy to AngelList now is likely avoidance of the real problem: weak proof. Self-check: is Indian conservatism the only issue? No. The same objections will appear in different words. Recommendation: build proof in India first; run selective US outreach later with structure ready.
</thinking>

Do not make US angels the main plan yet. Fix the traction story first, then use US outreach selectively for domain-fit investors who understand India or consumer health.

**Why this works in Indian context:**
For an Indian-incorporated startup, foreign angel money is not just a different email list. Investment documentation usually needs FEMA-compliant instruments such as CCPS or CCDs, pricing support, bank KYC, and post-allotment reporting like FC-GPR where applicable. Many US angels are used to YC-style SAFEs, but a simple SAFE does not map cleanly into an Indian private limited company structure. If your proof is still only 12K downloads and 800 DAU, adding cross-border friction before fixing retention and revenue is poor sequencing. Cross-border investors also ask a different kind of question: whether the insight can become venture scale despite India pricing, healthcare trust barriers, and distribution cost.

**How to execute:**
1. Keep India as the primary fundraising track for the next 45 days, because your users, health behaviour, CAC channels, and monetization tests are India-specific.
2. Create a separate US-diaspora list of only 10 investors, not 100; include healthtech operators, Indian-origin angels, and consumer subscription investors who have backed India-facing companies.
3. Do not pitch them until you have at least 1 paid experiment, D30 retention data, and a clear wedge that can be explained in 2 minutes.
4. If a US angel wants to invest, use proper Indian counsel to structure CCPS or CCDs instead of promising a standard SAFE that later creates compliance cleanup.
5. Keep ticket sizes practical: INR 8-20L equivalent per foreign angel is useful only if documentation cost and bank processing time do not outweigh the money.
6. Prepare a 6-month milestone plan showing how INR 50-75L gets you to revenue, retention, and a sharper seed round, not just app downloads.
7. If US angels ask for Delaware externalization at this stage, decline politely unless there is a clear institutional lead; restructuring can consume 2-3 months you do not have.
8. Use the US conversations as market feedback, not emotional validation; compare their objections against Indian angels' objections and fix the overlapping concerns first.
9. Keep any foreign cheque conditional on clean paperwork and timeline; a slow USD 10K cheque can distract more than it helps if bank KYC and documentation drag for weeks.

**Bottom line:**
Indian angels may be conservative, but the bigger issue is that your current proof is not yet strong enough. Build retention and paid intent first; then foreign angels become an optional extension, not an escape route. If US investors still like the company after that proof improves, they will join a stronger round instead of rescuing a weak one.`,
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
