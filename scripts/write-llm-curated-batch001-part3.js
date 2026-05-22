const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_llm_generated_curated.jsonl");
const system = { role: "system", content: "You are Evaldam AI, an expert in Indian startup and MSME finance." };
const base = { generator_model: "chatgpt-codex", generation_method: "per_sample_llm_authored_in_chat", batch: "batch001_target44" };

function ans(thinking, rec, why, steps, bottom) {
  return { role: "assistant", content: `<thinking>\n${thinking}\n</thinking>\n\n${rec}\n\n**Why this works in Indian context:**\n${why}\n\n**How to execute:**\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**Bottom line:**\n${bottom}` };
}

function make(id, sample_index, area, difficulty, profile, angle, qs, answers) {
  return {
    ...base,
    scenario_id: id,
    area,
    difficulty,
    sample_index,
    lenses: { profile, angle, style: "what, how, why progression" },
    conversation: [system, { role: "user", content: qs[0] }, answers[0], { role: "user", content: qs[1] }, answers[1], { role: "user", content: qs[2] }, answers[2]],
  };
}

const records = {
  S023: make("S023", 23, "Cap Table Architecture for Seed and Series A Planning", "hard",
    "fintech founder cleaning up note conversion and seed planning",
    "convertible note impact, ESOP sizing, and Series A readiness",
    [
      "What cap table should I show before raising the seed round?",
      "How do I handle the friends-and-family note conversion cleanly?",
      "Why is the 3 percent fully vested early ESOP a problem?",
    ],
    [
      ans(
        "Suresh has 82 percent, Rohan 9 percent, Megha 6 percent, one employee 3 percent fully vested, plus a INR 22L friends-and-family note with INR 4Cr cap and 20 percent discount. The note will convert at seed, likely at the cap if seed valuation is above INR 4Cr. That means the F&F group gets a meaningful stake before new seed investors enter. Need show pre-note, post-note, post-seed, and post-ESOP views. Self-check: current ownership adds to 100 percent before conversion, so dilution has not yet been recognized.",
        "Show a fully diluted cap table with the note converted first, then seed investor dilution, then ESOP refresh.",
        "Indian seed investors will not accept a cap table that ignores an outstanding convertible. Since the company handles payments, UPI flows, MCA audit trails, and TDS layers, governance discipline matters. The Companies Act 2013 records, note documents, board approvals, and future share issuance must reconcile. A fintech investor will also care that ESOP and founder ownership remain investable after conversion.",
        [
          "Create four views: current issued cap table, note-converted cap table, post-seed cap table, and post-Series A simulation.",
          "Calculate F&F conversion at INR 4Cr post-money cap and compare it with the 20 percent discount outcome.",
          "Model the seed round at 15, 18, and 22 percent dilution.",
          "Create a formal ESOP pool of 8-10 percent before or alongside seed, replacing the informal old pool.",
          "Show founder combined ownership after seed and projected Series A; keep Suresh meaningfully above 50 percent after seed if possible.",
          "Reconcile the cap table with SHAs, note agreements, board minutes, and statutory registers before diligence.",
        ],
        "The cap table should show all dilution before investors discover it. Convert the note in the model now, then negotiate seed from the real fully diluted base."
      ),
      ans(
        "The F&F note has two economic features: INR 4Cr post-money cap and 20 percent discount. At a seed valuation above INR 4Cr, the cap likely gives better economics to noteholders. Need not treat friends informally just because they are friendly; conversion must be documented. Interest, maturity, and qualified financing trigger matter. Self-check: can Suresh renegotiate them? Possibly, but only carefully because trust and legal rights matter.",
        "Convert the note exactly according to its terms unless noteholders voluntarily agree to a cleanup amendment.",
        "In India, informal friends-and-family instruments create diligence pain when the conversion math is unclear. If the note was documented as a convertible instrument, the board should follow the trigger, valuation cap, discount, and any interest terms. If foreign holders exist, FEMA and pricing rules may also matter. A clean conversion schedule prevents a seed investor from pausing the round to audit old promises.",
        [
          "Read the note for principal, interest, maturity, qualified financing threshold, cap, discount, and MFN rights.",
          "Prepare a conversion schedule showing shares issued to each of the investors.",
          "Send the schedule to all noteholders before seed documents are signed.",
          "If dilution is too high, ask for voluntary partial conversion or side-letter cleanup, but do not pressure small family investors unfairly.",
          "Take board approval for conversion and update statutory registers after allotment.",
          "Show seed investors the signed conversion consent or clear legal basis for automatic conversion.",
        ],
        "A messy note conversion can poison an otherwise strong fintech seed round. Put the math on paper, get consent where needed, and let the new investor enter a clean company."
      ),
      ans(
        "The 3 percent fully vested ESOP to one early employee is large because it is already fixed before the company has a proper pool. It may be deserved, but investors will ask whether it was approved, documented, and taxed correctly. It also leaves no structured employee equity for future hires. Self-check: should they claw it back? Not unless documents permit and the employee agrees. Better to formalize and build a proper pool around it.",
        "The issue is not that 3 percent is impossible; it is that it is informal, fully vested, and not integrated into a proper ESOP architecture.",
        "Indian ESOPs need proper company approvals, grant letters, vesting terms, exercise price, and records. A fully vested 3 percent early grant can be acceptable for a truly critical early employee, but it becomes a diligence issue if it was promised casually. Future fintech hires in engineering, compliance, and enterprise sales will also need options, so a single old grant cannot be the whole plan.",
        [
          "Verify whether the 3 percent grant was legally approved or only promised.",
          "If only promised, convert it into a formal grant with board and shareholder approvals.",
          "If already issued, confirm tax, accounting, and register treatment.",
          "Create a new 8-10 percent ESOP pool including or excluding the 3 percent transparently.",
          "Set future vesting as 4 years with 1-year cliff; avoid more fully vested grants.",
          "Explain the old grant to seed investors as historical retention, not ongoing allocation practice.",
        ],
        "A big early ESOP grant can be defended if it is clean. What cannot be defended is a casual promise sitting outside the legal cap table."
      ),
    ]),

  S024: make("S024", 24, "MSME Schemes, Udyam Registration and Priority Sector Benefits", "medium",
    "food-processing MSME owner planning INR 1.4Cr expansion",
    "scheme matching, bank leverage, and capacity expansion finance",
    [
      "What MSME benefits should I use for the INR 1.4Cr expansion?",
      "How should I structure the funding mix for equipment and working capital?",
      "Why does Udyam matter if I already have FSSAI and BIS certifications?",
    ],
    [
      ans(
        "Devanand has INR 3.8Cr turnover, INR 1.6Cr plant investment, 31 employees, FSSAI Central License, BIS in two categories, and Udyam Small registration. Expansion needs INR 1.4Cr: INR 95L equipment, INR 22L civil, INR 23L working capital. Need use Udyam benefits for credit, collateral reduction, TReDS, procurement, and delayed payment discipline. Self-check: grants may not cover this quickly; bank-linked financing is primary.",
        "Use Udyam to negotiate MSME bank finance and CGTMSE-backed credit first; treat subsidies as upside, not the main expansion source.",
        "For Indian food-processing MSMEs, Udyam registration converts the business into a recognized MSME borrower and supplier. CGTMSE can support collateral-free credit for eligible micro and small enterprises, while priority-sector lending improves bank appetite. FSSAI and BIS prove product compliance, but they do not unlock MSME credit classification by themselves. Section 43B(h) and MSMED Act payment rules can also improve cash conversion from private-label buyers.",
        [
          "Prepare a project report for INR 1.4Cr with equipment quotation, civil estimate, working-capital build-up, and capacity increase.",
          "Ask the bank for CGTMSE-backed term loan coverage for equipment and civil work.",
          "Use working-capital limits for the INR 23L inventory and receivables requirement, not a long-term loan.",
          "Check food-processing state subsidy or PMFME-style support only if timelines match the expansion.",
          "Register large private-label invoices on TReDS if buyers are onboarded.",
          "Use Udyam status in buyer contracts and invoices to improve 45-day payment discipline.",
        ],
        "The expansion should be bank-led and MSME-enabled. Use schemes to reduce collateral and cash-cycle pressure, not as a substitute for a bankable project."
      ),
      ans(
        "Equipment has a longer useful life, civil work is semi-fixed, and working capital rotates with inventory and receivables. Funding all INR 1.4Cr through one product would be inefficient. Need match tenor to asset. Equipment can be term debt; civil may be term or promoter contribution; working capital should be CC/OD or invoice finance. Self-check: should promoter contribute? Yes, some margin money improves bank comfort.",
        "Split the financing: term loan for INR 95L equipment, promoter contribution or term component for civil work, and working-capital line for INR 23L.",
        "Indian MSME banks prefer clear end-use. A term loan repaid over 5-7 years fits machinery, while working capital should be reviewed against stock and debtors. CGTMSE can reduce collateral pressure, but the bank will still expect margin money, GST returns, bank statements, and repayment capacity. A food-processing unit with 62 percent capacity utilization can justify expansion if orders or distribution are credible.",
        [
          "Put INR 15-20L promoter contribution into the project if possible; it improves lender confidence.",
          "Ask for a 5-7 year machinery loan with 6-12 month moratorium during installation and ramp-up.",
          "Keep civil work tightly budgeted; overruns should not consume working-capital money.",
          "Request a separate cash-credit enhancement for raw material, packaging, and receivables.",
          "Use buyer purchase orders or distributor commitments to support the loan file.",
          "Track DSCR under conservative sales assumptions; do not assume 100 percent capacity use immediately.",
        ],
        "The right funding mix follows the asset. Long-life equipment gets term debt; rotating stock gets working capital; promoter margin protects the whole structure."
      ),
      ans(
        "FSSAI and BIS prove food and quality compliance. Udyam proves MSME status. Different counterparties care about different proofs. Banks, buyers, TReDS platforms, and government procurement systems use Udyam for MSME classification. Without active Udyam usage, Devanand misses credit and payment leverage. Self-check: Udyam is not a quality certificate; it complements FSSAI/BIS.",
        "Udyam matters because it creates MSME identity for credit, procurement, and payment rights; FSSAI and BIS do not do that.",
        "In India, a food-processing unit needs multiple layers of credibility. FSSAI lets you legally sell food products, BIS supports product-standard confidence, and Udyam unlocks MSME-linked treatment. Under the MSMED Act, registered MSMEs get delayed-payment protection. Under Section 43B(h), buyers have tax pressure to pay registered MSMEs on time. Banks also use MSME tagging for priority-sector and scheme-linked credit.",
        [
          "Put Udyam number on invoices, vendor forms, and bank documents.",
          "Give Udyam, FSSAI, BIS, GST returns, and audited financials together in loan applications.",
          "Ask buyers to update vendor master records with MSME status.",
          "Monitor receivables above 45 days and send structured reminders.",
          "Use FSSAI/BIS in sales and Udyam in finance conversations; do not mix their purpose.",
          "Review classification annually as investment and turnover grow.",
        ],
        "FSSAI and BIS help you sell confidently. Udyam helps you finance and collect confidently. For expansion, you need all three working together."
      ),
    ]),

  S025: make("S025", 25, "Founder Equity Renegotiation and Reverse-Vesting", "hard",
    "three co-founders correcting an unfair split after 18 months of unequal contribution",
    "equity reset, vesting, and conflict-safe negotiation",
    [
      "What should we do about the original 40-30-30 split now that contributions changed?",
      "How do we renegotiate without blowing up the company before fundraising?",
      "Why is reverse vesting still possible after 18 months?",
    ],
    [
      ans(
        "Cloudkraft's original 40-30-30 split no longer matches contribution. Aniket worked full-time throughout, Rohan joined meaningfully later, and Sneha took a Big Tech job in month 3. Without reverse vesting, everyone legally owns their issued shares, but investor diligence will see dead equity risk. Need recommend negotiated reset, not unilateral change. Self-check: Sneha may have legitimate personal reasons, but company equity must reflect company contribution.",
        "Renegotiate into a contribution-based cap table with reverse vesting from now onward. Do not enter fundraising with the current structure untouched.",
        "Indian SaaS investors will treat an inactive 30 percent founder as a major red flag. Under Companies Act 2013 records, shares cannot simply be edited, so the solution needs consent, transfer, buyback, or restructuring. The cleanest path is a founder settlement: preserve dignity, recognize past contribution, and move unearned upside back to active founders or ESOP.",
        [
          "Create a factual contribution timeline for all 18 months: full-time status, code, sales, customers, fundraising, and product work.",
          "Propose a new structure such as Aniket 50-55 percent, Rohan 25-30 percent, Sneha 5-10 percent vested/advisor, and 10 percent ESOP.",
          "Offer Sneha advisory equity only if she commits defined monthly hours and deliverables.",
          "Use share transfer or buyback only after legal and tax review.",
          "Put all remaining founder shares under reverse vesting for 36-48 months.",
          "Complete this before term sheets; investors should not be asked to solve founder misalignment.",
        ],
        "The current split is not fundable if one 30 percent founder is mostly inactive. Fix it through consent and documentation before the market forces a harsher cleanup."
      ),
      ans(
        "This is emotionally hard because college-friend history can overwhelm business logic. Need process: facts, neutral facilitator, options, legal mechanics, no blame. If Aniket attacks Sneha, conflict escalates. If he avoids it, fundraising suffers. Self-check: should they threaten dilution? No. Use investor-readiness and fairness framing.",
        "Run a structured founder reset process: facts first, options second, legal documents third.",
        "Indian founder disputes often become destructive because renegotiation starts as accusation. A better process separates contribution from character. Investors accept equity resets when they are voluntary, documented, and completed before financing. The SHA, Articles, and statutory registers must reflect the final position; side promises will not be enough.",
        [
          "Hold a 2-hour founder meeting with a written agenda and no live percentage negotiation in the first 30 minutes.",
          "Agree on objective facts: months full-time, revenue closed, code shipped, customers supported, and capital contributed.",
          "Create 3 proposed outcomes: minimal adjustment, balanced reset, and investor-ready reset.",
          "Use a neutral lawyer or experienced founder to facilitate the second meeting.",
          "Give Sneha a fair choice: reduced founder stake, advisor role, or exit with a small retained stake.",
          "Sign the final arrangement within 21 days and update company records immediately.",
        ],
        "The goal is not punishment; it is making the cap table match reality. A respectful reset gives the company a chance to raise without carrying silent resentment."
      ),
      ans(
        "Reverse vesting after 18 months is possible if founders consent. It cannot magically undo already owned shares unless documents allow it, but founders can sign new restriction agreements, transfer unearned shares, or create vesting on remaining equity. Investors may require this as a condition to funding. Self-check: retrospective vesting can feel unfair, so credit for real past contribution is important.",
        "Reverse vesting is still possible through a new founder stock restriction agreement, but it must be voluntary and properly documented.",
        "Under Indian private company practice, founder shares are governed by shareholding records, Articles, and contracts. If there was no original reverse-vesting agreement, the company needs consent-based restructuring. Investors ask for this because an early leaver with large equity can block morale, hiring, and future rounds. Reverse vesting aligns future ownership with future work.",
        [
          "Recognize vested contribution for the first 18 months instead of pretending everyone starts from zero.",
          "Put remaining founder equity under 36-month vesting with monthly vesting from signing.",
          "Define good leaver, bad leaver, death/disability, termination, and voluntary exit treatment.",
          "Create company repurchase or transfer rights for unvested shares.",
          "Add acceleration only for change of control, and avoid full acceleration on any small event.",
          "Update Articles and SHA if needed so the vesting mechanics are enforceable.",
        ],
        "Reverse vesting after the fact is not ideal, but it is far better than leaving dead equity untouched. The key is consent, fairness, and clean legal mechanics."
      ),
    ]),

  S026: make("S026", 26, "Bridge Round versus Priced Seed Round Decision", "hard",
    "healthtech founder deciding whether to bridge before stronger seed metrics",
    "runway extension, valuation timing, and hospital-sales milestones",
    [
      "What should I raise now: a bridge round or a priced seed round?",
      "How should I structure the bridge so it does not hurt the seed round?",
      "Why not raise the priced seed now and remove runway risk?",
    ],
    [
      ans(
        "Ramya has INR 3.1L MRR, 11 hospitals, INR 19L cash, INR 2.7L burn, and under 7 months runway. She believes 4-5 more months can take MRR to INR 7-8L with 6 late-stage hospitals and upsell. A priced seed now may price the company off current weak metrics. A bridge can buy time, but too much bridge or bad terms can create cap-table issues. Self-check: if procurement slips, bridge may not be enough.",
        "Raise a small bridge now, not a full priced seed, if late-stage hospitals are genuinely close to conversion.",
        "Indian healthtech hospital sales cycles are slow but milestone-driven. A jump from INR 3.1L to INR 7-8L MRR materially changes the seed story and could support INR 20-25Cr post-money. Raising a priced seed too early after burning the INR 95L pre-seed may signal weak momentum. Use a bridge to reach the milestone, not to postpone hard decisions.",
        [
          "Raise INR 40-60L bridge, enough for 5-6 months of runway plus closing buffer.",
          "Use a convertible instrument compatible with Indian company law, such as CCPS or CCD, not a casual SAFE.",
          "Set conversion at the next priced seed with a 15-20 percent discount and a valuation cap that does not punish founders.",
          "Tie use of funds to 6 hospital conversions and medication-safety upsell.",
          "Ask existing investors to participate at least pro-rata; outside investors read that signal.",
          "Start priced seed conversations only after MRR crosses INR 6L or signed LOIs convert.",
        ],
        "The bridge is justified only if it buys a specific valuation step-up. Raise enough to hit INR 7-8L MRR, not enough to drift."
      ),
      ans(
        "Bridge terms should be simple, capped, and future-round compatible. If the bridge has high interest, low cap, senior rights, or maturity pressure, it can scare seed investors. Need structure conversion trigger and discount. Indian instruments need legal validity; foreign investors would need FEMA-compliant securities. Self-check: should bridge be debt? Healthtech cash flows may not support fixed repayment, so convertible is better.",
        "Structure the bridge as a clean convertible security that automatically converts into the priced seed.",
        "For Indian startups, bridge rounds should not create parallel cap tables or repayment cliffs. CCPS or CCD structures are more workable than informal notes if documented properly. The Companies Act 2013, valuation support, and investor approvals should be handled upfront. The next seed lead should see the bridge as milestone financing, not distressed rescue.",
        [
          "Set the bridge size at INR 40-60L, not INR 1Cr+, unless signed hospital contracts support it.",
          "Use 15 percent discount as default; go to 20 percent only if investors demand risk compensation.",
          "Set valuation cap around the expected seed range, not far below the last round.",
          "Avoid repayment maturity within 12 months; use automatic conversion on qualified financing.",
          "Avoid investor control rights beyond basic information rights.",
          "Disclose bridge conversion fully in the seed cap-table model.",
        ],
        "A good bridge disappears neatly into the seed round. A bad bridge becomes the first thing the seed lead wants to renegotiate."
      ),
      ans(
        "Priced seed now removes immediate uncertainty, but at a cost. With INR 3.1L MRR and recent burn, investors may price defensively or ask for heavy dilution. If she can credibly reach INR 7-8L MRR in 4-5 months, the valuation and investor quality can improve. Self-check: if hospital conversions are uncertain, waiting is risky. Need recommend decision trigger.",
        "Do not raise a priced seed now unless the bridge cannot be closed or hospital conversions are not as certain as believed.",
        "Indian healthtech investors value hospital logos, deployment depth, renewal evidence, and clinical workflow adoption. Six more hospitals and upsell revenue change the risk profile. A priced seed at current metrics may be cheaper in certainty but expensive in dilution. The better founder outcome is to finance the milestone cheaply and price the company after evidence improves.",
        [
          "Ask each late-stage hospital for written procurement status and expected purchase-order date.",
          "If at least 4 of 6 hospitals can close within 120 days, bridge first.",
          "If fewer than 3 are credible, raise priced seed now or cut burn harder.",
          "Set a 90-day internal deadline: if MRR is not above INR 5L, begin priced round regardless.",
          "Keep monthly burn below INR 3L until bridge closes.",
          "Prepare seed materials in parallel so the priced round can launch immediately after milestones hit.",
        ],
        "A priced seed is safer only if the milestone story is weak. If the pipeline is real, the bridge is the more valuation-efficient path."
      ),
    ]),

  S027: make("S027", 27, "Series A Term Sheet Negotiation and Lead Investor Selection", "hard",
    "B2B SaaS founder comparing three Series A offers with different hidden costs",
    "lead quality, control terms, and strategic restriction risk",
    [
      "What Series A term sheet should I choose among A, B, and C?",
      "How do I negotiate the best parts without losing the lead investor?",
      "Why is the strategic CVC offer risky despite the highest valuation?",
    ],
    [
      ans(
        "ShipDesk has INR 28L MRR, INR 3.36Cr ARR, 71 percent gross margin, 134 percent NRR, and strong growth. A offers INR 28Cr at INR 138Cr post with clean economics but heavy governance. B offers INR 32Cr at INR 127Cr post, higher dilution and a participating feature. C offers best valuation and lowest dilution but strategic restrictions. Self-check: strategic commercial lock-in may hurt platform neutrality. Recommendation likely A if governance is softened.",
        "Choose Term Sheet A if you can reduce governance overreach. It has the cleanest economics and best balance of capital, brand, and future fundability.",
        "Indian SaaS Series A rounds typically accept 1x non-participating liquidation and broad-based weighted-average anti-dilution. A fits that economic standard; B adds a participating feature that can tax moderate exits; C adds strategic restrictions that can affect customer trust and carrier neutrality. Series A terms will be embedded in SHA and AoA documents under Companies Act 2013, so control terms matter as much as valuation.",
        [
          "Ask A to reduce board rights from 2 seats including chairman to 1 board seat plus observer.",
          "Reduce 18 reserved matters to a focused list covering financing, M&A, debt, budget, and senior hiring.",
          "Negotiate no-shop from 60 days to 30-45 days.",
          "Reject B's participating feature unless removed completely.",
          "Reject C's ROFR above 25 percent and MFN commercial terms as platform-strategy risks.",
          "Accept A's 15 percent post-money ESOP only if existing 9 percent pool counts fully.",
        ],
        "A is not perfect, but it is the most financeable Series A base. Clean economics with negotiated governance beats higher valuation with strategic handcuffs."
      ),
      ans(
        "Aditya has strong metrics, so negotiation should be specific, not broad. A is likely best lead but asks too much board control. Need use B and C as leverage carefully. Ask A for governance cleanup; offer certainty and speed. Self-check: pushing all terms may annoy A. Prioritize board, reserved matters, no-shop.",
        "Negotiate A around governance, not valuation. Keep economics stable and ask for founder-operating flexibility.",
        "Indian Tier-1 VCs care about whether founders know which terms truly matter. If you ask for valuation, board, ESOP, pro-rata, and no-shop changes together, the negotiation looks unfocused. A's economic terms are already market-standard. The issue is control: 2 board seats, chairman right, 18 reserved matters, and long no-shop can slow operations in a fast-scaling SaaS company.",
        [
          "Send A a redline within 48 hours with only 4 asks: 1 board seat, narrower reserved matters, 45-day no-shop, and ESOP clarity.",
          "Offer to keep INR 110Cr pre-money and INR 28Cr cheque unchanged.",
          "Use your metrics as support: INR 3.36Cr ARR, 134 percent NRR, 71 percent gross margin.",
          "Tell B you will engage only if the participating feature is removed.",
          "Tell C strategic discussions can continue separately from the financing round.",
          "Run founder and seed-investor consent before signing no-shop.",
        ],
        "Do not over-negotiate the good offer into a lost offer. Fix the terms that affect operating control and future financing."
      ),
      ans(
        "C looks attractive: INR 25Cr at INR 155Cr post, only 16.1 percent dilution, clean preference. But strategic CVC has ROFR on future rounds or secondary above 25 percent, MFN commercial terms, and preferred carrier commitment. ShipDesk aggregates seven carriers; neutrality is core. If one logistics conglomerate gets preferential commercial rights, other carriers and customers may distrust the platform. Self-check: C could help distribution, but strategic dependence is dangerous.",
        "The CVC offer is risky because it can compromise carrier neutrality and future investor flexibility.",
        "Indian strategic capital can be useful when commercial alignment is narrow and non-exclusive. Here the investor is also tied to one logistics network, while ShipDesk's value comes from aggregating multiple carriers. ROFR and MFN rights can scare future VCs because they create a strategic overhang. A preferred-carrier obligation may also reduce customer trust if brands believe recommendations are biased.",
        [
          "Ask C to separate investment from commercial agreement entirely.",
          "Remove ROFR on future rounds and secondary; allow only standard pro-rata.",
          "Remove MFN on commercial terms with the parent.",
          "Make any carrier-volume commitment non-exclusive, performance-based, and terminable within 12 months.",
          "Ask 5 large customers whether strategic carrier ownership would affect trust.",
          "Use C as a commercial partner only after Series A, not as lead investor with control rights.",
        ],
        "C is the best-looking valuation and the hardest-to-price strategic cost. A platform company should not sell neutrality cheaply."
      ),
    ]),

  S028: make("S028", 28, "Convertible Note vs SAFE vs CCPS Instrument Selection for Indian Startups", "hard",
    "fintech founder choosing a compliant instrument for mixed Indian and foreign investors",
    "CCPS versus SAFE, FEMA compliance, and externalization timing",
    [
      "What instrument should I use for this INR 1.8Cr mixed investor round?",
      "How do I handle the US SAFE investors without externalizing now?",
      "Why not flip to Delaware now and issue standard SAFEs?",
    ],
    [
      ans(
        "Nisha has Indian angels INR 50L, US syndicate INR 80L, Singapore family office INR 50L, and an Indian private company. Standard YC SAFE is not a clean Indian company instrument because Indian law and FEMA expect recognized securities with conversion mechanics. CCPS can work for Indian and foreign investors with proper pricing and FC-GPR reporting. Self-check: mixing SAFE, note, and CCPS creates cap-table complexity. Recommendation: use CCPS for the whole round.",
        "Use CCPS for the full INR 1.8Cr round. Do not mix Indian CCPS with US SAFE and Singapore note structures.",
        "For an Indian private limited company, foreign investment should come through FEMA-compliant instruments such as equity, CCPS, or CCDs. A standard SAFE is familiar to US angels but not cleanly recognized for Indian issuance. CCPS gives conversion terms, investor rights, valuation support, and RBI/AD bank reporting through FC-GPR where applicable. It also keeps one cap table before Series A.",
        [
          "Set one CCPS term sheet for all investors with the same valuation cap or priced terms.",
          "Use INR subscription amounts and clear conversion mechanics.",
          "Prepare valuation support under Rule 11UA or appropriate pricing norms.",
          "Complete KYC and inward remittance process for US and Singapore investors.",
          "File FC-GPR through the AD bank after allotment to foreign investors.",
          "Avoid side letters giving foreign investors better economic terms than Indian angels.",
        ],
        "The cleanest round is one instrument, one cap table, and one compliance process. CCPS is less trendy than a SAFE, but it is much safer for this Indian company."
      ),
      ans(
        "US investors want SAFE because it is familiar, fast, and cheap. Nisha should not dismiss them; she should translate economics into CCPS. A post-money SAFE can be mirrored through CCPS conversion terms: valuation cap, discount if needed, qualified financing conversion, and investor information rights. Need manage expectations and timeline. Self-check: some US angels may refuse Indian paperwork; better to lose them than create illegal complexity.",
        "Offer SAFE-like economics through CCPS documentation instead of issuing an actual YC SAFE.",
        "Foreign angels investing into Indian startups need to accept Indian compliance realities. FEMA, AD bank KYC, pricing, and FC-GPR filings are normal parts of the process. If the US syndicate is serious about India exposure, CCPS should be acceptable when the economic outcome is explained clearly. The founder's job is to reduce unfamiliarity, not compromise legal structure.",
        [
          "Send a 1-page explainer comparing YC SAFE economics with Indian CCPS economics.",
          "Keep the same post-money cap logic if commercially agreed, but implement it through CCPS terms.",
          "Use one counsel-led closing checklist for foreign KYC, remittance, allotment, and reporting.",
          "Give US investors a clear timeline: 3-5 weeks for documentation and bank processing.",
          "Offer standard information rights and pro-rata if they need comfort.",
          "Do not promise Delaware conversion or future flip as a condition unless the board later approves it.",
        ],
        "Make the US investors comfortable with the economics, not the document brand. A SAFE-looking outcome can be achieved without an Indian SAFE."
      ),
      ans(
        "Externalization can make US fundraising easier, but now it costs INR 30-50L, takes 4-6 months, triggers tax and FEMA work, and distracts from a INR 1.8Cr round. For a fintech infrastructure startup at INR 6.2L MRR, the opportunity cost is high. Also the India reverse-flip trend means externalization is no longer automatically viewed as superior. Self-check: if US market is core, flip may matter later. But not for this small round.",
        "Do not flip to Delaware now. Defer externalization until Series A unless a lead investor makes it essential.",
        "Indian startups increasingly weigh externalization against tax, FEMA, operational, and future reverse-flip costs. Section 9 tax issues, ODI reporting, share swap mechanics, and valuation can make the process expensive. For a first INR 1.8Cr round, the structure cost could consume 15-25 percent of the capital raised. CCPS lets Nisha close now and preserve optionality.",
        [
          "Estimate flip cost in cash and time: INR 30-50L and 4-6 months.",
          "Ask whether the US syndicate is worth that cost; INR 80L does not justify it alone.",
          "Keep Indian parent structure for now and raise through CCPS.",
          "Add a future restructuring clause only if approved by majority investors and founders.",
          "Revisit externalization at Series A if a US institutional lead requires it.",
          "Preserve clean tax and FEMA records so future restructuring remains possible.",
        ],
        "A Delaware flip is a strategic restructuring, not a workaround for a small SAFE preference. Close the Indian round cleanly and revisit structure when the investor base justifies it."
      ),
    ]),

  S029: make("S029", 29, "External Commercial Borrowing for Tech Startups", "hard",
    "Series B SaaS CFO evaluating US venture debt pushdown into India",
    "ECB compliance, parent funding alternatives, and tax cost",
    [
      "What is the cleanest way to push USD 3M into the Indian subsidiary?",
      "How do I compare ECB versus equity infusion from the US parent?",
      "Why is the SOFR plus 650bps venture debt pricing a problem for ECB?",
    ],
    [
      ans(
        "CloudCue has a US parent, Indian subsidiary, USD 4M venture debt offer at SOFR + 650bps, 24-month maturity, and plan to push USD 3M to India. ECB under RBI has minimum average maturity of 3 years and all-in-cost ceiling around SOFR + 550bps for this tenor in the source facts. The US loan is 24 months and more expensive. Parent-to-subsidiary equity infusion is clean but leaves debt at parent. Self-check: pushing down debt may create compliance friction not worth it.",
        "Use equity infusion from the US parent into India for the USD 3M unless the lender can restructure pricing and maturity to ECB-compliant terms.",
        "Under RBI's ECB framework, maturity, eligible lender status, end-use, reporting, and all-in-cost ceiling matter. A parent loan to the Indian subsidiary can work only if it satisfies ECB rules, including Form ECB and monthly ECB-2 reporting. If the underlying US debt is SOFR + 650bps and 24 months, passing it through as ECB creates cost and maturity mismatch. Equity infusion through FC-GPR is simpler.",
        [
          "Ask the US lender whether it can offer 36-month maturity and pricing within ECB all-in-cost limits.",
          "If not, keep the debt at the US parent and infuse equity into India.",
          "File FC-GPR for the equity infusion into the Indian subsidiary.",
          "Use India funds for data-center capex and hiring with board-approved budget.",
          "Keep USD 1M at parent for US sales as planned.",
          "Document transfer pricing for any intercompany services and cost allocations.",
        ],
        "The cleanest structure is the one that does not fight RBI rules. If debt terms cannot be ECB-compliant, fund India with parent equity."
      ),
      ans(
        "ECB gives Indian entity debt and possible interest deduction but brings RBI reporting, withholding tax, transfer pricing, thin-cap risk under Section 94B, and maturity/cost limits. Equity is cleaner from compliance and no repayment burden in India, but no interest deduction. Need compare cash tax versus operational simplicity. Self-check: EBITDA positive means debt service possible, but compliance burden matters.",
        "Compare ECB and equity on 5 axes: compliance, cost, tax deduction, repayment pressure, and speed.",
        "Indian subsidiaries of externalized SaaS companies often prefer equity infusion when the parent has already raised capital or debt. ECB can be efficient when terms fit RBI rules and interest deductibility is valuable. But associated-enterprise debt creates Section 94B thin-cap considerations, transfer pricing requirements, and withholding under Section 195. Equity reduces these frictions even if it sacrifices interest deduction.",
        [
          "Create a comparison table for ECB versus equity with timeline, filings, tax, cash flow, and covenant impact.",
          "For ECB, model Form ECB, monthly ECB-2, all-in-cost ceiling, maturity, end-use, withholding, and Section 94B.",
          "For equity, model FC-GPR, valuation, no repayment, and no Indian interest deduction.",
          "Check whether India EBITDA can support interest without breaching thin-cap limits.",
          "Ask tax team to model India-US DTAA withholding on interest if ECB is used.",
          "Choose equity if speed and clean compliance are more valuable than interest deduction.",
        ],
        "ECB is not automatically more sophisticated. For this transaction, equity infusion may be the cleaner CFO decision unless debt terms are redesigned."
      ),
      ans(
        "The problem is pass-through economics. If the parent borrows at SOFR + 650bps but ECB cap is SOFR + 550bps, the Indian entity cannot simply pay the full cost without breaching all-in-cost rules. The parent would absorb spread or restructure. Also 24-month maturity conflicts with 3-year minimum average maturity. Self-check: can parent lend at lower rate and eat difference? Yes, but then parent has cash drag and transfer pricing questions.",
        "SOFR + 650bps is a problem because Indian ECB rules cap what the subsidiary can pay and require longer maturity.",
        "RBI's ECB framework is designed to regulate foreign currency borrowing cost and maturity for Indian borrowers. The Indian subsidiary cannot ignore the all-in-cost ceiling just because the US parent borrowed at a higher price. If intercompany pricing is artificially low, transfer pricing and parent-level economics must still be explained. If maturity is too short, the structure may fail before pricing is even considered.",
        [
          "Ask lender for a separate India-compliant tranche or amendment: 3-year maturity and lower all-in cost.",
          "If lender refuses, do not push the debt down as ECB.",
          "Have the parent retain debt service responsibility and inject equity instead.",
          "Model FX risk if any India cash flow is expected to service USD obligations indirectly.",
          "Keep board minutes explaining why equity was chosen over ECB.",
          "Revisit ECB later if market pricing falls or a longer-tenor facility is available.",
        ],
        "The US debt offer may be good for the parent but bad as an India pushdown. Compliance math, not headline availability, should drive the structure."
      ),
    ]),

  S030: make("S030", 30, "GST Registration Threshold and Composition Scheme Decision", "medium",
    "bakery cafe owner planning second location and online sales",
    "GST registration, composition scheme, and channel-wise tax treatment",
    [
      "What GST route should I choose before opening the Baner location?",
      "How do I handle cafe, B2B bakery supply, and Swiggy/Zomato channels together?",
      "Why not stay unregistered until I actually cross INR 40L turnover?",
    ],
    [
      ans(
        "Vivek has FY turnover INR 38L, cafe retail INR 22L, B2B INR 16L, and projected INR 75-85L next year. GST not registered. Restaurant/cafe services may already cross INR 20L service threshold. Composition scheme at 5 percent may be simpler but restricts ITC and inter-state supplies; regular scheme may be better due to capex and B2B input credits. Self-check: GST classification for mixed food supplies is nuanced; still, registration now is clearly safer.",
        "Register for GST now and likely choose the regular scheme, not composition, because expansion and B2B supply make ITC and channel flexibility valuable.",
        "In India, GST threshold analysis for food businesses is channel-specific. Cafe/restaurant supply, bakery wholesale, and online aggregator sales can have different treatment. With projected turnover of INR 75-85L and a second location in Pune, staying unregistered is not realistic. Composition is simpler but can become expensive if you lose input tax credit on INR 12L equipment and monthly raw material purchases.",
        [
          "Register under GST before Baner launch and D2C rollout.",
          "Map supplies into cafe restaurant service, B2B bakery goods, and online aggregator sales.",
          "Choose regular scheme if input tax credit on equipment, packaging, and raw materials is meaningful.",
          "Use the same Maharashtra GSTIN for both Pune locations unless separate registration is operationally needed.",
          "Set billing software to separate 5 percent restaurant supply from taxable bakery goods.",
          "Review aggregator treatment under Section 9(5) for Swiggy/Zomato sales.",
        ],
        "The business is no longer too small for GST planning. Register now and build channel-wise compliance before expansion creates messy backdated exposure."
      ),
      ans(
        "Need operational GST plan. Cafe has restaurant service. B2B bakery supply may be goods with different rates and ITC. Aggregator sales under Section 9(5) may place tax payment on platform for restaurant services, but records still matter. Second location under same state can use same GSTIN. Need accounting separation. Self-check: one blended tax treatment would be dangerous.",
        "Handle the business channel by channel in accounting, even if the same GSTIN covers both locations.",
        "Indian GST compliance becomes difficult when food businesses mix dine-in, takeaway, wholesale, and platform sales without separate ledgers. Section 9(5) changes tax payment responsibility for notified aggregator supplies, but it does not remove the need for reconciliation. B2B customers may need GST invoices and may care about their own ITC. Regular scheme gives better tracking for growth.",
        [
          "Create separate sales ledgers: cafe dine-in/takeaway, B2B bakery wholesale, own D2C, and aggregator sales.",
          "Tag input purchases by use: restaurant, bakery wholesale, shared overhead, and capex.",
          "Configure POS invoices with correct GST classification and rate.",
          "Reconcile Swiggy/Zomato statements monthly with books and bank receipts.",
          "Issue proper tax invoices to B2B corporate customers.",
          "Review ITC eligibility monthly; do not claim credits blindly on restricted restaurant inputs.",
        ],
        "GST will be manageable if the accounting architecture is clean from day 1. The mistake is treating all food revenue as one bucket."
      ),
      ans(
        "Staying unregistered may look attractive because current turnover is INR 38L, near goods threshold. But cafe service threshold may already be INR 20L; next-year projection crosses both thresholds. If he waits, he risks late registration, inability to claim input credit on capex, B2B customer friction, and penalties. Self-check: if all supplies were goods under INR 40L, waiting might be arguable; mixed cafe service makes it weak.",
        "Do not wait. Register before expansion so tax, invoices, and input credits start cleanly.",
        "Indian GST is not only about last year's turnover; liability can arise when thresholds and supply type are crossed. A cafe plus commissary plus D2C model is not the same as a tiny home bakery. With INR 12L capex and INR 4-5L monthly raw material purchases planned, registration timing affects credit and pricing decisions. Late cleanup is usually more expensive than early compliance.",
        [
          "Estimate date when FY27 turnover crosses INR 40L and service/cafe revenue crosses INR 20L.",
          "Register before that date, preferably before signing Baner lease and buying equipment.",
          "Tell B2B customers the GSTIN will be active before new supply contracts.",
          "Adjust menu and wholesale pricing to account for GST treatment.",
          "Train cashier and accounts person on invoice categories before launch.",
          "Run first 3 GST return cycles with careful reconciliation.",
        ],
        "Waiting saves a little paperwork now but creates tax, pricing, and credit confusion later. Register before growth forces you to do it under pressure."
      ),
    ]),
};

function readExistingRecords(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

const scenarioId = process.argv[2];
if (!scenarioId || !records[scenarioId]) throw new Error(`Pass one scenario id. Available: ${Object.keys(records).sort().join(", ")}`);
const record = records[scenarioId];
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existing = readExistingRecords(outputPath);
if (existing.some((item) => item.batch === record.batch && item.scenario_id === record.scenario_id)) throw new Error(`${record.scenario_id} already exists in ${record.batch}`);
fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, "utf8");
console.log(`appended ${record.scenario_id} to ${outputPath}`);
