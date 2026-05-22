const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_llm_generated_curated.jsonl");
const system = { role: "system", content: "You are Evaldam AI, an expert in Indian startup and MSME finance." };
const base = { generator_model: "chatgpt-codex", generation_method: "per_sample_llm_authored_in_chat", batch: "batch001_target44" };

function a(thinking, rec, why, steps, bottom) {
  return {
    role: "assistant",
    content: `<thinking>\n${thinking}\n</thinking>\n\n${rec}\n\n**Why this works in Indian context:**\n${why}\n\n**How to execute:**\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**Bottom line:**\n${bottom}`,
  };
}

function rec(id, index, area, difficulty, lenses, qs, answers) {
  return {
    ...base,
    scenario_id: id,
    area,
    difficulty,
    sample_index: index,
    lenses,
    conversation: [system, { role: "user", content: qs[0] }, answers[0], { role: "user", content: qs[1] }, answers[1], { role: "user", content: qs[2] }, answers[2]],
  };
}

const records = {
  S015: rec("S015", 15, "Founder Equity Split & Co-founder Agreements", "medium", {
    profile: "technical founder and incoming business co-founder formalizing before pre-seed",
    angle: "fair split, reverse vesting, and investor-ready founder documents",
    style: "what, how, why progression",
  }, [
    "What equity split should we choose before raising the INR 1.5Cr pre-seed?",
    "How do we formalize this so neither founder feels cheated later?",
    "Why is reverse vesting necessary if we trust each other already?",
  ], [
    a(
      "Amit has 8 months of solo product work, 2 paying pilots, and technical ownership. Ravi is joining full-time now with INR 25L personal capital, sales pipeline, and business execution. A pure 50-50 split ignores Amit's prior risk; 60-40 may underweight Ravi's future operating role and cash contribution. The advisor's 55-45 with reverse vesting is the most balanced because it respects past contribution without freezing the next 4 years around the first 8 months. Self-check: should the INR 25L buy extra equity separately? It should be documented either as founder capital, loan, or share subscription, not blurred into sweat equity.",
      "Use 55-45 in Amit's favour, with both founders under 4-year reverse vesting and Ravi's INR 25L documented separately.",
      "Indian pre-seed investors care less about perfect equality and more about a founder split that will survive stress. Under the Companies Act 2013, share issuance, loans, and founder agreements need clean records before an INR 1.5Cr round. A 55-45 split is defensible because Amit created the MVP and pilots, while Ravi is taking real future risk by quitting Goldman and bringing capital.",
      [
        "Finalize the split this week: Amit 55 percent, Ravi 45 percent before ESOP and investors.",
        "Document Ravi's INR 25L as either equity at incorporation valuation or a founder loan; do not leave it informal.",
        "Put both founders on 4-year reverse vesting with a 1-year cliff and monthly vesting after the cliff.",
        "Give Amit vesting credit for 8 months only if both agree the MVP work was full-time and company-specific.",
        "Create a 8-10 percent ESOP pool before pre-seed if hiring is expected in the next 12 months.",
        "Sign IP assignment, confidentiality, non-compete limits, decision rights, and deadlock provisions before pitching angels.",
      ],
      "Choose the split that can survive both investor diligence and founder resentment. 55-45 with clean vesting is stronger than 50-50 with hidden bitterness or 60-40 with weak future alignment."
    ),
    a(
      "The risk is not only the initial percentage; it is ambiguity. If Ravi's capital, Amit's past work, IP ownership, and future roles are not documented, the first investor will find a messy founder story. The documents should separate four things: share ownership, vesting, money contributed, and operating responsibilities. Self-check: should this wait until the pre-seed lawyer drafts everything? No. Founder documents should be agreed before external negotiation because investors may push their own terms into any unresolved gap.",
      "Create a founder agreement pack before the pre-seed term sheet. The documents should make ownership, money, vesting, and roles unambiguous.",
      "Indian startups often break later because founder promises were made on WhatsApp but never mapped into shareholder records. Under Companies Act 2013 practice, the cap table, board approvals, share certificates, and registers must match the founder agreement. Investors will also want proof that all MVP IP belongs to the company, not to Amit personally or an old freelance arrangement.",
      [
        "Within 3 days, write a founder term sheet covering split, vesting, salary, role, decision rights, and exit treatment.",
        "Within 7 days, incorporate or update company records so the cap table reflects the agreed structure.",
        "Execute IP assignment from Amit to the company for the MVP, codebase, designs, customer materials, and domain assets.",
        "Document Ravi's INR 25L with bank trail, board note, and agreed treatment as loan or equity.",
        "Define reserved matters: fundraising, hiring above INR 20L annual salary, debt, pivots, and sale of company.",
        "Set founder salaries after pre-seed, even if low, so personal cash stress does not distort decisions.",
      ],
      "A fair split is only half the job. The real protection is a document set that a future investor, founder spouse, or departing founder cannot reinterpret."
    ),
    a(
      "Trust is useful but not a governance mechanism. Reverse vesting protects both founders against the real risk that one person leaves after receiving a large percentage. Amit has already worked 8 months, while Ravi is joining now; both still need to earn the future. Investors will almost certainly ask for vesting before the INR 1.5Cr pre-seed because unvested founder commitment protects the company. Self-check: is reverse vesting insulting? No, if it applies to both founders and gives reasonable credit for past work.",
      "Reverse vesting is necessary because founder equity should reward future commitment, not only day-one optimism.",
      "Indian angels and micro-VCs increasingly expect founder vesting, especially when a company is pre-seed and founder contribution is still evolving. Without vesting, a departed founder can hold 40-50 percent and block fundraising, ESOP grants, or a strategic sale. The Companies Act 2013 documents and SHA can implement repurchase or transfer mechanics, but only if the agreement is signed before conflict begins.",
      [
        "Use 4-year vesting for both founders, with a 1-year cliff and monthly vesting thereafter.",
        "Give Amit up to 8 months vesting credit if Ravi accepts that prior MVP work created company value.",
        "Give Ravi no automatic vesting for the INR 25L; money contribution should be treated separately from service vesting.",
        "Define good leaver and bad leaver terms with different treatment for vested and unvested shares.",
        "Allow company buyback or transfer of unvested shares at nominal value if a founder exits early.",
        "Add acceleration only for acquisition, such as 25-50 percent single-trigger or double-trigger, not automatic full acceleration.",
      ],
      "Reverse vesting is not a trust problem; it is a continuity tool. It keeps both founders committed and makes the company investable before outsiders write cheques."
    ),
  ]),

  S016: rec("S016", 16, "Raising First Round vs Bootstrapping Decision", "medium", {
    profile: "vernacular content founder choosing between angel capital and bootstrapping",
    angle: "runway, dilution, and milestone-based fundraising",
    style: "what, how, why progression",
  }, [
    "What should I choose: the INR 80L pre-seed now or bootstrap longer?",
    "How do I negotiate the angel offer without losing the 30-day deadline?",
    "Why not wait until INR 10-15L MRR and raise at a much better valuation?",
  ], [
    a(
      "Sneha has INR 1.6L MRR, 220 paying subscribers, 12 percent monthly growth, and 6 months runway. The offer is INR 80L at INR 5Cr post-money, so dilution is 16 percent. That is within typical pre-seed dilution, but the valuation is not generous. Bootstrapping to INR 10-15L MRR could improve terms, but she may not have enough runway to reach that without starving product and distribution. Self-check: is the local angel network strategic enough? Unknown, so terms and usefulness matter.",
      "Take the pre-seed only if the terms are clean and the money gives at least 15-18 months runway. Otherwise negotiate a smaller or milestone-based raise.",
      "In India, vernacular content businesses often need time to prove retention, paid conversion, and low-cost distribution across tier-2 and tier-3 users. INR 1.6L MRR is real traction, but not enough to assume fundraising will be easier in 6 months. A 16 percent dilution is acceptable if the SHA is clean under Companies Act 2013 documentation and there are no aggressive control rights.",
      [
        "Model runway with INR 80L: founder salary, 2 content hires, product improvements, marketing tests, and 6 months buffer.",
        "Set the next milestone as INR 6-8L MRR in 12 months, not vague growth.",
        "Ask for 1x non-participating liquidation preference, no full ratchet, no heavy vetoes, and standard information rights.",
        "Negotiate valuation to INR 6Cr post-money or reduce round size to INR 60L if the investor cannot move.",
        "Keep monthly burn below INR 5L until paid acquisition economics are proven.",
        "Do not take money from angels who add reporting pressure but no distribution, hiring, or follow-on support.",
      ],
      "The best answer is not blindly raise or proudly bootstrap. Take clean capital if it buys a serious milestone; reject it if it only buys dilution and noise."
    ),
    a(
      "The deadline creates pressure, but Sneha still has leverage because she has paying users and 12 percent monthly growth. The negotiation should focus on terms and milestone fit, not just valuation. If she pushes too hard for price, the local angel network may walk. If she accepts everything, she may lock in a weak round. Self-check: should she run a broad process in 30 days? No, that is too short. She can create selective competition from 5-8 aligned angels while negotiating the current offer.",
      "Negotiate with a short, specific counter: better valuation or smaller cheque, clean terms, and a fast closing schedule.",
      "Indian angel rounds often become messy when founders accept verbal commitments without clear share subscription, valuation support, board approvals, and investor rights. Since the offer expires in 30 days, you need a controlled process. A clean round at INR 5-6Cr post-money is better than an inflated round that takes 90 days and drains runway.",
      [
        "Within 48 hours, ask for the full term sheet, not just valuation and cheque size.",
        "Counter with INR 80L at INR 6Cr post-money, or INR 60L at INR 5Cr post-money.",
        "Request closing within 30 days after documents, with money wired in one tranche.",
        "Reject participating liquidation preference, full ratchet, broad veto lists, or forced founder salary restrictions.",
        "Prepare a 12-month use-of-funds plan tied to MRR, retention, content supply, and subscriber acquisition.",
        "Speak to 5 alternate angels in 10 days to test whether the current offer is market or underpriced.",
      ],
      "Use the deadline to force clarity, not panic. The right deal is a clean pre-seed that gives enough runway to make the next raise optional."
    ),
    a(
      "Waiting could produce a higher valuation, but only if she survives and grows efficiently. Going from INR 1.6L to INR 10-15L MRR may take 12-18 months. At 12 percent monthly growth, math looks promising, but churn, content fatigue, pricing, and acquisition saturation can slow it. She has only 6 months runway, so waiting requires cost cuts or near-perfect execution. Self-check: is dilution avoidance worth underfunding growth? Not if the company misses the window to build category leadership.",
      "Do not wait purely for a better valuation. Wait only if you can extend runway beyond 12 months while maintaining growth.",
      "Indian content platforms face distribution volatility: algorithm changes, creator costs, payment friction, and language-market fragmentation. A founder can destroy momentum by underfunding content and product quality. Raising now under Companies Act 2013 compliant documents may be rational if the capital funds measurable traction. Bootstrapping is better only when revenue growth itself funds the next stage.",
      [
        "Calculate cash-out date under current burn and under a lean plan; if either is below 9 months, waiting is risky.",
        "Estimate how much capital is needed to reach INR 8L MRR; if it exceeds internal cash, raise now.",
        "Run a no-raise plan for 90 days: reduce burn, improve renewal, and test price increases.",
        "If MRR grows from INR 1.6L to INR 2.5L in 90 days without extra capital, renegotiate from strength.",
        "If growth slows below 8 percent monthly, take the angel money or find a smaller bridge.",
        "Preserve optionality by taking clean money, not expensive money; terms matter more than cousin-versus-friend advice.",
      ],
      "A future INR 10-15L MRR raise is attractive, but it is not guaranteed. Capital now is worth taking if it materially increases the chance of reaching that milestone."
    ),
  ]),

  S017: rec("S017", 17, "Government Grant Application Strategy (Deep-Tech Hardware)", "hard", {
    profile: "deep-tech hardware founder with 5 months runway and borderline grant eligibility",
    angle: "eligibility realism, grant timing, and parallel runway financing",
    style: "what, how, why progression",
  }, [
    "What grant route should I pursue: NIDHI-PRAYAS, BIRAC BIG, SISFS, or something else?",
    "How should I sequence grants and runway funding over the next 5 months?",
    "Why is NIDHI-PRAYAS probably a bad fit if it is non-dilutive?",
  ], [
    a(
      "Arjun has a completed prototype, 3 paying deployments, INR 2.8L MRR, INR 11.2L bank balance, and INR 2.3L monthly burn. NIDHI-PRAYAS is meant for idea-to-prototype support, has an INR 10L scale, and generally does not fit a post-prototype revenue-stage company. BIRAC BIG is up to INR 50L but biotech-specific; water quality monitoring may qualify only if framed as environmental biotech with strong biological detection, not just IoT sensing. SISFS is more stage-appropriate because it supports market entry and commercialization for DPIIT-recognised startups. Self-check: grant money may arrive too late for runway.",
      "Prioritize SISFS, explore BIRAC BIG only if the biotech angle is defensible, and do not rely on NIDHI-PRAYAS for this stage.",
      "In Indian grant funding, eligibility fit matters more than grant attractiveness. NIDHI-PRAYAS is strong for prototype creation, but HydroSense already has paid municipal and industrial deployments. SISFS can support proof validation, market entry, commercialization, or scaling through incubators. BIRAC BIG may be valuable only if the contamination-detection science has a biotechnology component; otherwise reviewers may see it as environmental IoT.",
      [
        "Ask your incubator within 3 days whether they are an approved SISFS incubator or can refer you to one.",
        "Prepare a SISFS request around INR 40-50L for commercialization, field validation, certifications, and manufacturing readiness.",
        "Send a 1-page eligibility note to BIRAC before applying; ask whether heavy-metal water detection qualifies under their biotech scope.",
        "Drop NIDHI-PRAYAS unless the TBI confirms a new prototype version is eligible in writing.",
        "Use current customers as proof: BBMP, Hubballi-Dharwad, and Aditya Birla Chemicals should provide deployment letters.",
        "Start a parallel bridge track because grant approval may take 2-4 months and your runway is under 5 months.",
      ],
      "The right grant is the one aligned to your current stage, not the one with the cleanest headline. SISFS plus parallel bridge capital is the safest route."
    ),
    a(
      "Grant timelines and runway are mismatched. With INR 11.2L cash and INR 2.3L burn, Arjun has under 5 months. A grant decision can take most of that time, and first tranche disbursement can lag approval. Need create parallel tracks: non-dilutive application, customer advances, bank working capital, and angel bridge. Self-check: should he pause sales to write grants? No. Paid deployments are the strongest grant evidence and financing evidence.",
      "Run grants and runway funding in parallel. Treat grants as upside capital, not the only survival plan.",
      "Indian government grant processes are valuable but not designed as emergency payroll financing. SISFS, BIRAC BIG, and incubator-linked grants require screening, committee review, documentation, and milestone-based disbursement. A hardware startup with municipal and industrial deployments has better leverage with customers, lenders, and strategic angels than a pre-prototype company. Use that leverage before the bank balance becomes desperate.",
      [
        "Week 1: freeze cash burn, delay non-critical component purchases, and extend runway from 5 months toward 6 months.",
        "Week 1-2: request 3-month advance payments or annual contracts from the 3 paying customers with 5-10 percent discount.",
        "Week 2: submit SISFS expression through the best-fit incubator with deployment letters and milestone budget.",
        "Week 2-4: approach 8-10 strategic angels from water, IoT, industrial compliance, and climate-tech backgrounds for INR 40-60L bridge.",
        "Week 3: ask bank for a small working-capital line against receivables or purchase orders; keep debt below 6 months revenue visibility.",
        "Month 2-3: submit BIRAC BIG only after eligibility comfort; do not spend 40 founder-hours on a weak-fit application.",
      ],
      "Your company should not die waiting for a grant. Use grants to extend commercialization, while customer advances and bridge money protect survival."
    ),
    a(
      "NIDHI-PRAYAS is tempting because it is non-dilutive, but the eligibility mismatch is dangerous. The product crossed prototype stage 9 months ago and has 3 paying sites. Grant committees may reject because the scheme is for converting ideas into prototypes, not funding deployed hardware operations. The INR 10L amount is also too small relative to INR 2.3L monthly burn and commercialization needs. Self-check: could a second-generation sensor qualify? Maybe, but only if scoped as a new prototype and accepted by the TBI.",
      "NIDHI-PRAYAS is probably a poor use of founder time unless your incubator confirms eligibility for a new prototype scope.",
      "In India, non-dilutive does not mean low-cost. A weak-fit grant can cost weeks of founder attention and still reject you for stage mismatch. NIDHI-PRAYAS is valuable for idea-to-prototype innovators; HydroSense needs commercialization capital, certification, manufacturing, and deployment support. SISFS and possibly BIRAC BIG are closer to that stage, while revenue-backed customer advances are faster than all grant routes.",
      [
        "Write one eligibility email to the TBI: state completed prototype, 3 paying deployments, INR 2.8L MRR, and proposed new prototype scope.",
        "If the TBI cannot confirm eligibility in writing within 7 days, stop pursuing NIDHI-PRAYAS this quarter.",
        "Do not redesign the company narrative just to fit a INR 10L grant; that weakens future applications.",
        "Use the same effort to create a SISFS commercialization budget and customer proof pack.",
        "If applying for a new sensor variant, separate expenses clearly from existing deployed product costs.",
        "Keep grant applications truthful; misrepresenting stage can create future compliance and reputation risk.",
      ],
      "The best non-dilutive money is not the easiest-sounding scheme; it is the scheme that matches the company's real stage. NIDHI-PRAYAS likely does not."
    ),
  ]),

  S018: rec("S018", 18, "ESOP Pool Creation and Pre-Money vs Post-Money Dilution", "medium", {
    profile: "sole SaaS founder negotiating first institutional ESOP pool",
    angle: "pool shuffle, hiring plan, and employee grant design",
    style: "what, how, why progression",
  }, [
    "What ESOP pool should I accept if the VC is asking for 18 percent?",
    "How should I allocate ESOPs across early employees and future senior hires?",
    "Why does creating the pool pre-money dilute me so much?",
  ], [
    a(
      "Priya owns 100 percent, is raising INR 3Cr at INR 25Cr pre-money, INR 28Cr post-money, so investor ownership is 10.71 percent before ESOP shuffle. The VC wants an 18 percent post-money pool created before investment, meaning Priya absorbs it, not the investor. With 11 employees and expected growth to 25-30 before Series A, some pool is necessary. But 18 percent is high for a company already at INR 6.4L MRR. Self-check: a solo founder needs hiring equity more than a co-founder team, but not an unlimited pool.",
      "Counter with 12-14 percent ESOP, with only 10-12 percent created pre-money and any further refresh shared at Series A.",
      "Indian VCs commonly ask for a pre-money ESOP pool so the new investor's ownership is not diluted immediately. That is market practice, but the size remains negotiable. Under Companies Act 2013 ESOP rules, the pool needs shareholder approval and a formal plan; verbal promises to early employees are not enough. For a 19-month B2B SaaS with INR 6.4L MRR and 14 customers, 18 percent is more than the next 18 months likely require.",
      [
        "Model 3 cases: 18 percent pre-money, 14 percent pre-money, and 12 percent pre-money plus Series A refresh.",
        "Show the investor the hiring plan: VP Engineering, VP Sales, 4-6 engineers, 2 customer success, and 2 product roles.",
        "Offer 12 percent as the base and 14 percent as fallback if the VC closes quickly and keeps other terms clean.",
        "Reject 18 percent unless unused pool protection or shared future refresh is agreed.",
        "Document all grants with 4-year vesting, 1-year cliff, exercise price, and board approval.",
        "Explain early employee grants before closing so morale does not suffer after the round announcement.",
      ],
      "You need an ESOP pool, but not an 18 percent founder-funded pool by default. Tie the number to hiring, not investor habit."
    ),
    a(
      "The pool must cover promises already made and hires needed before Series A. Early employees who joined at month 4 deserve recognition, but future senior hires can consume more equity. Need avoid granting too much emotionally. A VP Engineering or VP Sales may need 0.75-1.5 percent; senior engineers may need 0.2-0.6 percent; early general employees may receive 0.05-0.25 percent depending on role and salary sacrifice. Self-check: should all 11 employees get grants? Probably yes, but not equal grants.",
      "Allocate ESOPs by role impact, scarcity, and risk already taken. Keep at least 40 percent of the pool unallocated for future hires.",
      "In India, ESOP value is often misunderstood because employees face perquisite tax on exercise and capital gains on sale, with limited liquidity in private companies. A transparent plan matters as much as grant size. DPIIT-recognised startups may have some tax deferral benefits for eligible employees, but the plan still needs clean grant letters, vesting, exercise window, and board approvals.",
      [
        "Reserve 2-3 percent total for the 3-5 earliest high-impact employees who joined before product-market proof.",
        "Reserve 2-3 percent for VP Engineering or VP Product if those roles are not yet hired.",
        "Reserve 1-1.5 percent for a first VP Sales or enterprise GTM leader.",
        "Reserve 2-3 percent for senior engineers, product managers, and customer success leaders before Series A.",
        "Keep 4-5 percent unallocated in a 12-14 percent pool so hiring does not stall.",
        "Use a written ESOP explainer covering vesting, tax, exercise, leaver clauses, and exit treatment.",
      ],
      "ESOP is not a reward pool to empty immediately. It is hiring currency, retention architecture, and a trust instrument for employees who understand the rules."
    ),
    a(
      "The pool shuffle is arithmetic. The investor wants to buy 10.71 percent of the company for INR 3Cr. If the 18 percent pool is created before investment, Priya's 100 percent is reduced first, then the investor enters and preserves its full percentage. If the pool were created after investment, both Priya and investor would share dilution. Self-check: is the investor doing something illegal? No, it is a common economic negotiation. But Priya should understand the cost.",
      "It dilutes you because the pool is inserted before the VC buys shares, so the VC does not share that dilution.",
      "Indian term sheets often describe this politely as an ESOP pool to be created pre-closing. The economic effect is that founder ownership funds future employee equity. Under Companies Act 2013 approvals, the pool creation and investment allotment are separate steps, so the sequence matters. The headline INR 25Cr pre-money can be misleading if the founder has to create a large pool before the investor's money comes in.",
      [
        "Ask the lawyer for a pre-closing and post-closing cap table showing Priya, ESOP pool, and investor separately.",
        "Calculate investor ownership first: INR 3Cr divided by INR 28Cr equals 10.71 percent.",
        "Then show founder ownership under 18 percent, 14 percent, and 12 percent pre-money pools.",
        "Ask the VC to share at least part of any pool above 12 percent post-money.",
        "Negotiate unused pool treatment before Series A; unused options should not automatically justify another large top-up.",
        "Do not trade ESOP pushback for worse liquidation preference or anti-dilution rights.",
      ],
      "The pool is not free just because no cash leaves the company. It is paid for in founder ownership, so negotiate the amount and timing with the same seriousness as valuation."
    ),
  ]),

  S019: rec("S019", 19, "TReDS Invoice Discounting for MSME Cash Flow Management", "medium", {
    profile: "manufacturing MSME owner afraid to pressure large buyers despite cash crunch",
    angle: "TReDS execution, buyer leverage, and cash-flow stabilization",
    style: "what, how, why progression",
  }, [
    "What should I do first to unlock cash from the INR 42L unpaid invoices?",
    "How do I convince buyers to accept invoices on TReDS without damaging relationships?",
    "Why does Section 43B(h) change my leverage with large buyers?",
  ], [
    a(
      "Rakesh has INR 42L unpaid invoices, INR 31L overdue beyond 60 days, salary delays, fully drawn INR 14L CC limit, and three buyers making up 78 percent revenue. TReDS is the best first move for accepted invoices from large buyers, but buyer acceptance is the gate. Need preserve relationships while stabilizing cash. Self-check: should he file with MSEFC immediately? Not first. That may be a later escalation for chronic non-payment.",
      "Start TReDS onboarding immediately and target the cleanest INR 20-25L invoices first. Use MSEFC or legal escalation only after commercial attempts fail.",
      "TReDS is RBI-regulated and built for MSME receivable discounting. Platforms such as RXIL, M1xchange, and Invoicemart can finance accepted invoices, often without recourse after buyer acceptance. MSMED Act 2006 gives a 45-day payment framework, but practical recovery starts with invoice acceptance and buyer finance-team cooperation. Section 43B(h) gives additional tax pressure on buyers delaying MSME payments.",
      [
        "This week, complete seller onboarding on RXIL and one backup platform such as M1xchange or Invoicemart.",
        "Prepare invoice packs: purchase order, delivery proof, acceptance, GST invoice, e-way bill if applicable, and buyer contact.",
        "Start with undisputed invoices from the buyer most likely to cooperate.",
        "Ask each buyer whether they are already onboarded on any TReDS platform.",
        "Use TReDS proceeds to clear salary delays and critical raw material purchases first.",
        "Track discount rate, acceptance time, settlement date, and buyer response for every invoice.",
      ],
      "Your immediate goal is not to fight all buyers. It is to convert clean receivables into cash quickly, then use the data to fix payment discipline."
    ),
    a(
      "Buyer acceptance is relational. Rakesh fears losing customers, so he needs to frame TReDS as supply-chain stability, not accusation. Large buyers also benefit because TReDS can help them support MSME vendors without immediately changing payment terms. Need maybe one buyer at a time. Self-check: will all buyers agree? No, especially the smaller or bureaucratic ones. Start with the defence PSU or strongest corporate finance team.",
      "Position TReDS as a vendor-stability process that protects supply continuity. Do not open with legal threats.",
      "In Indian B2B manufacturing, even valid MSME rights can damage relationships if raised aggressively. A finance-head conversation works better than a legal notice at the first step. TReDS is familiar to many large corporates and PSUs, and MSME seller onboarding is generally not the hard part; buyer acceptance is. Section 15 of the MSMED Act remains your background leverage, not your first sentence.",
      [
        "Call the buyer finance head, not only the procurement officer; invoice acceptance usually sits with finance.",
        "Say the goal is steady production and timely salary payments, not penalty interest.",
        "Offer a 60-day pilot: 3 invoices on TReDS, no change in product pricing, no public dispute.",
        "Send a one-page note with invoice list, Udyam number, overdue days, and preferred platform.",
        "Ask buyers to accept invoices within 5 working days after delivery confirmation.",
        "If a buyer refuses, ask for written payment date and escalation contact instead of arguing immediately.",
      ],
      "The tone should be firm but commercial. You are asking buyers to finance what they already owe, not asking for charity or confrontation."
    ),
    a(
      "Section 43B(h) changes the buyer's economics. If a buyer delays payment to a registered MSME beyond the MSMED Act timeline, the buyer may lose tax deduction timing for that payable. This gives finance teams a reason to prioritize MSME payments before year-end. Need avoid saying it magically guarantees payment. It is leverage, not collection by itself. Self-check: use it on all three buyers at once? No, calibrate by relationship and overdue severity.",
      "Section 43B(h) gives you a finance-team argument: delayed MSME payments can hurt the buyer's tax deduction timing.",
      "Before Section 43B(h), many large buyers treated MSME payment delay as cheap working capital. Now delayed payments to registered MSMEs can create tax consequences, making finance teams more attentive. Combined with MSMED Act Sections 15 and 16, you have both payment-timeline and interest leverage. But practical impact depends on clear Udyam status, accepted goods, undisputed invoices, and documented payment terms.",
      [
        "Add your Udyam number and MSME status to all invoices and statements of account.",
        "Send a 45-day reminder that references MSMED Act payment timelines and Section 43B(h) politely.",
        "Attach invoice ageing so the buyer's finance team can see tax-risk exposure by amount.",
        "Prioritize invoices above INR 5L and overdue more than 60 days for escalation.",
        "Avoid threatening MSEFC in the first email; use it only if buyer ignores repeated written reminders.",
        "Keep delivery and acceptance proof ready because leverage weakens if there is a quality dispute.",
      ],
      "Section 43B(h) does not collect cash automatically, but it changes the buyer's cost of delaying you. Use it as structured leverage, not anger."
    ),
  ]),

  S020: rec("S020", 20, "DPIIT Recognition and Section 80-IAC Tax Holiday Strategy", "hard", {
    profile: "AI SaaS founder planning DPIIT and tax strategy before seed conversations",
    angle: "DPIIT timing, IMB approval, and tax holiday window selection",
    style: "what, how, why progression",
  }, [
    "What should I do now about DPIIT recognition and the 80-IAC tax holiday?",
    "How should I time the tax holiday if profits may start in FY 2026-27?",
    "Why does DPIIT recognition matter if I am not profitable yet?",
  ], [
    a(
      "Vikram incorporated on 12 March 2024, has FY25 revenue INR 86L with loss INR 41L, projected FY26 revenue INR 1.32Cr, and possible FY27 profit INR 60-90L. He has not applied for DPIIT recognition. Need separate DPIIT recognition from 80-IAC IMB approval. Recognition should be done now because it helps benefits and investor diligence. 80-IAC claim should be timed after IMB approval and meaningful profits. Self-check: tax law section mapping may change under new framework, but startup process still needs recognition and approval.",
      "Apply for DPIIT recognition immediately, then prepare for IMB approval. Do not choose the tax-holiday years until profit visibility is stronger.",
      "DPIIT recognition under the startup framework is the gateway for many Indian startup benefits. Section 80-IAC-style profit deduction requires more than recognition; it needs separate approval and careful timing. Since the company is loss-making now and may profit only in FY 2026-27, claiming too early would waste value. The incorporation date is comfortably within the extended startup window described in current policy discussions.",
      [
        "File DPIIT recognition within 7 days with incorporation details, innovation note, product screenshots, customer proof, and founder details.",
        "Prepare an innovation memo showing why NeuroBrief is AI legal-tech product IP, not routine IT services.",
        "Track revenue, losses, and expected profit by financial year through FY 2030.",
        "Apply for IMB approval once the recognition is in place and product evidence is stronger.",
        "Do not select tax-holiday years while FY profit is zero or uncertain.",
        "Keep seed investors informed that DPIIT recognition is in progress; it improves diligence posture.",
      ],
      "Recognition now, tax holiday later. The strategic error would be waiting on DPIIT until profit appears and then rushing the approval process."
    ),
    a(
      "The tax holiday is valuable only in profitable years. FY25 is loss-making. FY26 may still be investment-heavy. FY27 may bring INR 60-90L profit, but if growth continues, FY28-FY30 could be larger. Need model 3 consecutive years within allowed window, while considering MAT and carried-forward losses. Self-check: should he wait forever? No, approval early and selection later is the right balance.",
      "Model the tax holiday as a 3-year option. Use it when profits are materially larger, not merely positive.",
      "Indian founders often misunderstand 80-IAC as an immediate badge benefit. It is a profit-linked deduction, so timing determines value. A legal-tech SaaS product may show operating leverage after cloud cost stabilizes and enterprise subscriptions grow. MAT can still create cash tax, and carried-forward losses may already reduce taxable profit. Therefore the best year is not the first profitable year; it is the first year of a high-profit 3-year block.",
      [
        "Create 3 profit scenarios for FY27-FY31: conservative, base, and upside.",
        "Compare claiming FY27-FY29 versus FY28-FY30 versus FY29-FY31.",
        "Include cloud GPU spend, senior ML hiring, legal data licensing, and seed-round hiring in profit estimates.",
        "Adjust for carried-forward losses before calculating deduction value.",
        "Run MAT impact separately so cash tax is not underestimated.",
        "Review the decision 90 days before each year-end with audited run-rate numbers.",
      ],
      "The best timing is when the deduction covers real taxable profit. Get approval early, then preserve the option until the profit curve is worth protecting."
    ),
    a(
      "DPIIT recognition matters before profit because it affects credibility, eligibility, and future optionality. Vikram has seed conversations starting Q1 FY27. Investors may value clean startup recognition, potential tax benefits, ESOP tax deferral eligibility, and scheme access. It can also support procurement and government-facing credibility for legal-tech. Self-check: does DPIIT guarantee tax holiday? No, but not having it blocks or delays multiple paths.",
      "DPIIT recognition matters now because it keeps future benefits open and makes the company cleaner for seed diligence.",
      "Indian seed investors check whether a startup has handled basic recognition, compliance, and benefit eligibility. DPIIT recognition can support access to startup schemes, tax-benefit pathways, intellectual-property facilitation, and certain procurement advantages. It also helps position NeuroBrief as an innovation-led product company. Waiting until profitability compresses the timeline for IMB approval and may cause the company to miss planning windows.",
      [
        "Use DPIIT recognition as part of the seed data room: certificate, application note, product proof, and innovation explanation.",
        "Map which benefits matter: 80-IAC, ESOP-related startup treatment, IP facilitation, grants, and procurement positioning.",
        "Use recognition to strengthen enterprise trust, especially with law firms and in-house legal teams evaluating Indian AI tools.",
        "Keep all claims accurate; DPIIT recognition should not overstate regulatory approval or legal accuracy of the AI product.",
        "Update board records once recognition is received and assign one owner for startup benefit compliance.",
        "Tell investors the company is not claiming tax benefit yet; it is preserving eligibility and approval pathways.",
      ],
      "DPIIT recognition is not valuable only after profit. It is an early infrastructure step that prevents future tax and funding options from becoming last-minute paperwork."
    ),
  ]),

  S021: rec("S021", 21, "Angel Round Term Sheet Comparison and Negotiation", "hard", {
    profile: "edtech founder comparing higher valuation with aggressive angel rights",
    angle: "angel term-sheet economics, liquidation structure, and control risk",
    style: "what, how, why progression",
  }, [
    "What angel term sheet should I choose for GuruShala?",
    "How should I negotiate the aggressive terms without losing the round?",
    "Why is participating liquidation so bad if the cheque helps us grow?",
  ], [
    a(
      "Aisha has INR 4.1L MRR, 22,000 paying users, 14 percent monthly organic growth, and 38 percent gross margin. Term Sheet A from Lighthouse is INR 1.2Cr at INR 10Cr post, so 12 percent dilution, but has 1x participating liquidation with no cap and full ratchet. Need likely compare to Term Sheet B, but visible facts already make A risky. In edtech with moderate gross margin, downside terms matter. Self-check: valuation alone is not enough.",
      "Do not choose the aggressive term sheet unless participating liquidation and full ratchet are removed. A clean lower-glamour offer is better.",
      "Indian angel rounds should not carry growth-stage downside protection for a first external cheque. A 1x non-participating liquidation preference is the cleaner standard; participating preference with no cap can take value twice. Full-ratchet anti-dilution is also excessive for an edtech startup still proving margins. These rights become binding through SHA and AoA documents under the Companies Act 2013.",
      [
        "Compare term sheets on effective economics, not headline valuation.",
        "Reject uncapped participating liquidation; counter with 1x non-participating.",
        "Reject full ratchet; counter with broad-based weighted-average anti-dilution or no anti-dilution for an angel round.",
        "Limit drag-along to a higher threshold and board approval, not simple investor pressure.",
        "Accept normal pro-rata and information rights if economics are clean.",
        "Choose the term sheet that preserves Series A fundability, even if the cheque is slightly smaller.",
      ],
      "For a first angel round, dirty rights are more dangerous than slightly lower valuation. Keep the cap table simple enough for the next institutional investor."
    ),
    a(
      "Negotiation should preserve relationship while removing non-market economics. Lighthouse has a credible lead, so Aisha should not insult the term sheet; she should explain that these terms are not appropriate for a first angel round. Need offer trade-offs: keep valuation, keep board observer maybe, remove full ratchet and participating preference. Self-check: should she threaten to walk? Use deadline and standards, not drama.",
      "Send a focused redline with 3 must-change terms and 2 acceptable concessions.",
      "Indian angels may copy VC-style clauses without considering their effect on future rounds. A founder who can explain market standards looks stronger, not difficult. Since GuruShala is DPIIT-recognised and has INR 4.1L MRR, Aisha has enough traction to ask for cleaner economics. Companies Act 2013 documents should not be loaded with terms that a Series A lead will immediately reopen.",
      [
        "Within 24 hours, send a note: valuation and cheque are acceptable, but liquidation and anti-dilution are not.",
        "Counter liquidation to 1x non-participating with no participation.",
        "Replace full ratchet with broad-based weighted average, limited to qualified financing.",
        "Offer standard investor information rights and pro-rata as concessions.",
        "Limit board seat to observer until the round crosses INR 2Cr or an institutional investor enters.",
        "Give a 5-day response deadline so you can move to the other offer if terms remain dirty.",
      ],
      "The negotiation should sound like cleanup, not rejection. Keep the investor's cheque welcome, but make the terms Series-A-compatible before signing."
    ),
    a(
      "Participating liquidation changes exit distribution. If investor puts INR 1.2Cr and has 1x participating, they first take INR 1.2Cr back, then also participate pro-rata in remaining proceeds. With no cap, the investor benefits in both downside and upside. For a modest acquisition, this can reduce founder and co-founder payout materially. Self-check: if company becomes huge, does it matter less? Yes, but early terms should not assume only huge outcomes.",
      "Participating liquidation is bad because it lets the investor get paid twice before common shareholders fully benefit.",
      "In Indian startup practice, 1x non-participating preference is the founder-friendly norm for early rounds. Participating preference may be seen in tougher or later deals, but uncapped participation in an angel round is aggressive. It can create misalignment because the investor is protected in medium exits while founders and employees bear more risk. Future VCs may ask to clean it up before investing.",
      [
        "Model exit values at INR 15Cr, INR 25Cr, and INR 50Cr under participating versus non-participating preference.",
        "Show founder and co-founder payout after the INR 1.2Cr preference is paid.",
        "Include ESOP holders in the model; employee upside also suffers from heavy preferences.",
        "Ask for 1x non-participating as the default.",
        "If investor insists, cap participation at 2x total return, but treat that as fallback, not target.",
        "Do not accept participating preference and full ratchet together; that is too much downside protection.",
      ],
      "The cheque helps growth, but the wrong preference can tax every future outcome. Take capital that compounds with the company, not capital that takes value twice."
    ),
  ]),

  S022: rec("S022", 22, "CGTMSE Collateral-Free Debt versus Equity Dilution Trade-Off", "medium", {
    profile: "risk-averse SaaS founder comparing CGTMSE debt with equity dilution",
    angle: "debt capacity, expansion ROI, and founder ownership protection",
    style: "what, how, why progression",
  }, [
    "What should I choose for the INR 80L expansion: CGTMSE debt or equity?",
    "How do I make the debt safer given my fear of loans?",
    "Why not take equity if it feels psychologically safer than debt?",
  ], [
    a(
      "Karthik needs INR 80L for sales, integrations, multi-region setup, and working capital. The business has INR 4.2L MRR, 47 customers, LTV/CAC 3.6, and 22 percent quarterly growth. CGTMSE term loan is INR 80L, 84 months, 12-month principal moratorium, likely no collateral. Equity would avoid repayment but dilute founders. Need recommend debt if cash flows can cover EMI after moratorium. Self-check: SaaS borrowing before strong MRR can be risky, but use of funds is expansion-linked.",
      "Choose CGTMSE-backed debt if EMI after moratorium is comfortably covered by projected MRR. It preserves ownership for a business with improving traction.",
      "CGTMSE is designed to support collateral-free credit for micro and small enterprises, reducing the need for family property security. For a SaaS company with INR 4.2L MRR and measurable LTV/CAC, debt can be sensible if used for revenue-generating expansion. Equity is better for uncertain product discovery; this plan is mostly sales, integrations, infrastructure, and working-capital runway.",
      [
        "Ask the bank for the exact interest rate, EMI after 12 months, processing fee, guarantee fee, and prepayment rules.",
        "Model MRR after 12 months under conservative, base, and upside cases.",
        "Take the loan only if EMI is below 12-15 percent of conservative monthly gross profit.",
        "Disburse in tranches: INR 32L sales hiring, INR 18L integrations, INR 14L infrastructure, INR 16L cushion.",
        "Keep 6 months EMI reserve once repayment starts.",
        "Avoid personal collateral or family property if CGTMSE coverage is available.",
      ],
      "Debt is not automatically dangerous; poorly matched debt is. If repayment is sized conservatively, CGTMSE debt can fund growth without giving up a large ownership slice."
    ),
    a(
      "Karthik's fear comes from family history, so the structure must reduce emotional and financial risk. The loan must be matched to revenue milestones, not taken as one large undisciplined amount. Need include covenants, moratorium, insurance, reserve, tranche control. Self-check: should he take less than INR 80L? Possibly if bank allows phased drawdown or if expansion can be staged.",
      "Make the debt safer by staging drawdown, protecting cash reserve, and linking spend to measurable revenue milestones.",
      "Indian MSME debt becomes dangerous when founders borrow against optimism and family collateral. CGTMSE-backed lending is specifically useful because it can reduce collateral pressure, but repayment discipline still matters. The bank will underwrite cash flow, GST, banking conduct, and promoter credibility. A risk-averse founder should use debt with controls, not avoid it blindly.",
      [
        "Negotiate phased disbursement: INR 40L first, remaining INR 40L after sales hires and integrations show progress.",
        "Keep principal moratorium for 12 months and confirm interest-only cash outflow during that period.",
        "Set a board rule: no second tranche unless MRR crosses INR 6L or pipeline coverage exceeds 3x monthly sales target.",
        "Maintain a separate debt-service reserve equal to 6 months interest or EMI.",
        "Avoid using term-loan money for experiments with no payback path.",
        "Review collections monthly; if churn rises or sales cycle stretches, pause hiring before repayment stress builds.",
      ],
      "The safer version of debt is not smaller ambition; it is tighter control. Borrow in a way that lets the company slow down before the loan becomes a crisis."
    ),
    a(
      "Equity feels safer because there is no EMI, but it is expensive if the company grows. Karthik owns 76 percent; co-founders own 14 and 8 percent; ESOP 2 percent. Raising INR 80L equity at an early valuation could dilute 8-15 percent or more, and future rounds will dilute again. Debt has repayment risk, but no permanent ownership loss. Self-check: equity is better if expansion outcome is highly uncertain. Here, customer base and LTV/CAC provide some confidence.",
      "Equity is psychologically easier but economically expensive if the expansion works. Use equity only if repayment risk is genuinely too high.",
      "Indian founders often overvalue avoiding EMIs and undervalue permanent dilution. If FleetForge can use INR 80L to increase MRR materially, giving up equity now may cost far more than interest. CGTMSE exists to make growth credit accessible without heavy collateral. That said, debt should not be used to hide weak unit economics; it works only if customer acquisition and retention are already credible.",
      [
        "Compare total interest cost over 7 years with equity value given up at 3 future valuation points.",
        "If INR 80L equity costs 10 percent today, model what that 10 percent is worth at INR 50Cr and INR 100Cr valuations.",
        "Use equity if conservative cash flow cannot cover EMI after moratorium.",
        "Use debt if MRR growth to INR 8-10L within 12-15 months is realistic.",
        "Consider a hybrid: INR 50L CGTMSE debt plus INR 30L angel bridge if risk feels too concentrated.",
        "Do not choose equity only because of past family trauma; choose based on company cash-flow capacity.",
      ],
      "Equity removes repayment pressure but sells future upside. If the company can service debt safely, CGTMSE financing is the more ownership-efficient choice."
    ),
  ]),
};

function readExistingRecords(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

const scenarioId = process.argv[2];
if (!scenarioId || !records[scenarioId]) {
  throw new Error(`Pass one scenario id. Available: ${Object.keys(records).sort().join(", ")}`);
}

const record = records[scenarioId];
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existing = readExistingRecords(outputPath);
if (existing.some((item) => item.batch === record.batch && item.scenario_id === record.scenario_id)) {
  throw new Error(`${record.scenario_id} already exists in ${record.batch}`);
}

fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, "utf8");
console.log(`appended ${record.scenario_id} to ${outputPath}`);
