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
  scenario_id: "S002",
  area: "Complex Multi-Scheme Grant Eligibility",
  difficulty: "hard",
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
  sample_index: 2,
  lenses: {
    profile: "hardware founder with limited bandwidth and conflicting mentor advice",
    angle: "grant eligibility, sequencing, and practical win probability",
    style: "what, how, why progression",
  },
  conversation: [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
    },
    {
      role: "user",
      content: "What two schemes should I apply for this quarter, and which ones should I avoid?",
    },
    {
      role: "assistant",
      content: `<thinking>
Priya has an 11-month-old agritech hardware startup, DPIIT recognition, Udyam Micro registration, 3 people, and only INR 2.8L total revenue from pilots. The bottleneck is not eligibility alone; it is bandwidth and timing. SISFS fits because it supports proof-of-concept, prototype validation, market entry, commercialization, and scaling through incubators, with up to INR 20L grant and up to INR 50L debt or convertible debenture. TANSEED is state-level and likely more practical for a Tamil Nadu company because local relevance and faster founder access can matter. NIDHI-PRAYAS is weaker because it is meant for idea-to-prototype support, typically up to INR 10L, and her soil sensor is already in pilot installations. Krishi Udaan 2.0 sounds sector-relevant but is not the cleanest funding route for a soil-sensor hardware startup.

Need answer the disqualification worry. Applying to multiple schemes is not automatically disqualifying, but double funding the same cost head is a problem. Self-check: am I overweighting SISFS because the mentor said so? No. SISFS fits on eligibility and quantum; TANSEED fits on speed and local alignment. Recommendation: apply to SISFS and TANSEED now, park NIDHI-PRAYAS and Krishi Udaan.
</thinking>

Apply to SISFS and TANSEED this quarter. Do not spend this quarter on NIDHI-PRAYAS unless your incubator confirms a prototype-stage interpretation in writing, and treat Krishi Udaan 2.0 as ecosystem access, not core grant funding.

**Why this works in Indian context:**
SISFS is designed for DPIIT-recognised startups and can support proof-of-concept, prototype validation, market entry, commercialization, and scaling through approved incubators. Your INR 2.8L pilot revenue and Udyam Micro status make you early enough for grant support but mature enough to show field validation. TANSEED is more locally aligned for a Coimbatore hardware startup than a generic national logistics or agriculture facilitation program. NIDHI-PRAYAS is risky because your product has moved beyond idea-to-prototype into pilot deployment. The committee story should be: Indian small farmers need reliable, low-cost soil intelligence; your device has crossed lab risk; the next INR 20L-30L reduces field, manufacturing, and adoption risk. That story fits SISFS and TANSEED much more tightly.

**How to execute:**
1. This week, make SISFS your high-quantum track: target INR 20L grant for validation, field testing, calibration, farmer trials, and agronomy partnerships.
2. In parallel, make TANSEED your speed track: ask the state ecosystem contact for the next application window, pitch format, disbursement conditions, and 30-60 day decision timeline.
3. Do not claim the same expense twice; map SISFS to hardware validation and TANSEED to go-to-market pilots, channel demos, and Tamil Nadu farmer-cluster deployment.
4. Build a 12-month budget with 4 heads: sensor components, field deployment, agronomist validation, and farmer onboarding; keep every line item tied to INR amounts.
5. Ask your IIT-Madras mentor to support the technical validation section, not to decide scheme strategy alone.
6. Keep NIDHI-PRAYAS as a backup only if the incubator says your next sensor version counts as a new prototype and your turnover remains within its cap.
7. Put Krishi Udaan 2.0 in a partnership folder for later if you move into post-harvest logistics, perishables, or market-linkage use cases.
8. Create a rejection-proofing note before submission: explain why paid pilots do not make you too mature for SISFS, why you are still pre-scale, and why grant money will not subsidize routine operating losses.

**Bottom line:**
Your best two-shot portfolio is SISFS for larger non-dilutive capital and TANSEED for state-level speed. Applying to four schemes now will dilute the quality of your applications; two sharp submissions are better than four generic ones. Your goal this quarter is not maximum application count; it is maximum credible probability of money reaching the company before the pilots lose momentum.`,
    },
    {
      role: "user",
      content: "How should I sequence the applications and documents with only a three-person team?",
    },
    {
      role: "assistant",
      content: `<thinking>
The execution plan must fit a 3-person team. Hardware grant applications fail when founders describe the device but do not prove customer pain, field validation, unit economics, and deployment readiness. Priya should not run two independent application projects. She needs one master grant pack that can be adapted into SISFS and TANSEED formats. Core documents: DPIIT certificate, Udyam registration, incorporation documents, cap table, founder profiles, product note, pilot evidence, farmer economics, budget, bank details, and declarations about other government support. Since revenue is only INR 2.8L, the narrative should not oversell traction; it should show evidence density from pilots.

Need include timeline. SISFS through an incubator can take weeks to months depending on screening and expert committee cycles. TANSEED may be faster but can still require pitch prep. Self-check: should she wait to perfect data? No, with limited bandwidth she should freeze a version in 10 days, then improve during review. Need assign roles: founder technical, co-founder finance, mentor validation. Also make disclosure clean: multiple applications allowed, no duplicate reimbursement.
</thinking>

Build one master grant dossier first, then customize it into SISFS and TANSEED. Do not let each scheme create a separate documentation workflow.

**Why this works in Indian context:**
Indian grant committees reward clarity, evidence, and budget discipline more than polished startup jargon. SISFS incubators will look for DPIIT recognition, stage fit, fund use, and commercialization potential; TANSEED evaluators will care about Tamil Nadu relevance, local jobs, and deployability. Your Udyam Micro registration helps establish enterprise identity, but it will not substitute for field proof. Clean disclosure also matters because government schemes do not want duplicate funding for the same expense head. For hardware startups, the best application pack feels like diligence evidence: test data, deployment proof, manufacturing assumptions, and buyer willingness. That lets a reviewer understand why public money closes a specific risk gap rather than merely extending runway.

**How to execute:**
1. Day 1-2: create a shared evidence folder with DPIIT certificate, Udyam certificate, MCA incorporation documents, PAN, GST status if any, bank details, cap table, and founder KYC.
2. Day 3-5: write a 5-page master note covering farmer pain, sensor accuracy, deployment cost, pilot learnings, pricing, and why INR 20L-30L changes the next milestone.
3. Day 6-7: convert pilot evidence into exhibits: 3 installation photos, 2 farmer or FPO testimonials, calibration logs, and before-after decision examples from soil readings.
4. Day 8: prepare the budget in two tracks: SISFS for product validation and commercialization; TANSEED for Tamil Nadu pilots, field demos, and channel onboarding.
5. Day 9-10: run a mock committee with your IIT-Madras mentor, one agronomist, and one MSME finance person; force them to score technical risk, adoption risk, and budget realism.
6. Day 11-14: submit TANSEED if the window is open; submit SISFS through the strongest approved incubator within 7 days after the dossier is frozen.
7. Week 3 onward: maintain a grant tracker with application date, committee date, likely decision date, requested amount, and follow-up owner; update it every Friday.
8. Every 15 days, add new pilot evidence to the same dossier instead of rewriting the application; this keeps the team moving while giving committees fresher data when they ask follow-up questions.

**Bottom line:**
The right sequence is not SISFS first or TANSEED first; it is master dossier first, then two tailored applications. With 3 people, your advantage comes from reuse, clean evidence, and a disciplined 14-day submission sprint. The founder should spend most of her energy on proving the sensor works in farms, while the paperwork stays modular and controlled. That is how a small team looks serious without pretending to be a grant-writing department.`,
    },
    {
      role: "user",
      content: "Why not apply to all four schemes and maximize our chances?",
    },
    {
      role: "assistant",
      content: `<thinking>
This is a probability and opportunity-cost question. Applying to four schemes feels like diversification, but in grants the quality bar is non-linear. A weak application can damage credibility with incubators and state officials, and a 3-person hardware team cannot produce four tailored applications without distracting from pilots. SISFS and TANSEED have different but compatible narratives. NIDHI-PRAYAS likely conflicts with her stage because the product is already deployed in pilots and has INR 2.8L revenue. Krishi Udaan 2.0 is not the strongest direct-funding match for soil sensors unless tied to agriculture logistics or air cargo supply chains.

Need address multiple central schemes. There is no general rule that applying to more than one government program automatically disqualifies her. But most schemes require declarations of prior support, and double-dipping on the same milestone, equipment, or invoice can create rejection or recovery risk. Self-check: is avoiding applications too conservative? No, because the goal is highest expected funding per founder-hour. For this quarter, 2 applications plus customer pilots beat 4 scattered forms.
</thinking>

Do not apply to all four this quarter. Apply to the 2 highest-fit schemes now, keep 1 backup, and convert the fourth into a relationship-building channel rather than a funding bet.

**Why this works in Indian context:**
Indian public funding is not a lottery where more forms automatically improve odds. SISFS, NIDHI-PRAYAS, TANSEED, and Krishi Udaan-style programs are judged by different bodies, different stage assumptions, and different spending rules. Multiple applications are usually manageable if disclosed, but claiming the same sensor development cost under 2 schemes can create compliance risk. For a hardware startup, committee trust is built through precise stage fit and credible deployment data. Reviewers also talk to incubators, domain experts, and state ecosystem people; repeated weak submissions can make the startup look unfocused. A disciplined two-scheme strategy signals maturity and makes follow-up conversations sharper.

**How to execute:**
1. Rank schemes by fit, not popularity: SISFS 9/10, TANSEED 8/10, NIDHI-PRAYAS 4/10 for your current stage, Krishi Udaan 2.0 3/10 for direct funding relevance.
2. Cap application work at 35 founder-hours over 14 days; spend at least 60 founder-hours in the same month on pilot learning, farmer interviews, and sensor reliability.
3. Use a clean funding matrix: SISFS asks for INR 20L for validation and commercialization; TANSEED asks for a smaller state-linked amount for Tamil Nadu deployments.
4. Put a disclosure paragraph in both applications listing applied schemes, requested amounts, and non-overlapping expense heads.
5. Ask the NIDHI-PRAYAS program manager one written question: whether a second-generation sensor variant after paid pilots qualifies despite the original prototype being complete.
6. Use Krishi Udaan contacts for market access only if you start serving farmer-producer organizations, cold-chain operators, or perishable logistics players.
7. Reassess after 90 days: if SISFS is delayed and TANSEED rejects, then activate NIDHI-PRAYAS only with a new prototype scope and written eligibility comfort.
8. Keep a simple audit trail from day 1: invoices, quotations, payment proofs, deployment photos, and milestone reports separated by scheme, so later disbursement checks do not become a scramble.

**Bottom line:**
Applying everywhere is not a strategy; it is a bandwidth leak. Your strongest grant posture is two high-fit applications, transparent non-duplication of costs, and continuing field pilots so every review committee sees a startup getting more fundable each month. The best outcome is not just approval; it is approval without later compliance cleanup. Keep the quarter simple: win the two schemes most aligned with your stage, and use the remaining time to create stronger proof for the next review cycle. That discipline will matter more than one extra low-fit application, including for fundraising later.`,
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
