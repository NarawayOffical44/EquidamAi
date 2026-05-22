const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "data", "synthetic", "evaldam_chat_generated_first10.jsonl");

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

function assistant(thinking, recommendation, why, steps, bottom) {
  return {
    role: "assistant",
    content: `<thinking>\n${thinking}\n</thinking>\n\n${recommendation}\n\n**Why this works in Indian context:**\n${why}\n\n**How to execute:**\n${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n**Bottom line:**\n${bottom}`,
  };
}

const records = [
  {
    scenario_id: "S001",
    area: "Valuation Method Selection Logic",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.72,
    lenses: {
      profile: "first-time founder with deep technical background but no finance experience",
      angle: "emphasise cap table and dilution math with explicit numerical worked examples",
      style: "user asks direct yes-or-no questions, wanting a clear commit answer with reasoning",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "Should I use Berkus, Scorecard, or DCF for this round, and which angel offer is actually better?",
      },
      assistant(
        "Rahul is post-revenue but still seed-stage: INR 4.2L MRR means INR 50.4L ARR, 8 customers, 18 percent month-on-month growth, and only 4 months runway. DCF should be rejected because predictable 5-year cash flows do not exist yet. Pure Berkus should also be rejected because it is mainly useful before revenue. Scorecard plus SaaS ARR multiple is the better anchor. Offer 1 is INR 1.5Cr at INR 12Cr post, so dilution is 12.5 percent and valuation is about 23.8x ARR. Offer 2 is INR 2Cr at INR 18Cr post, so dilution is 11.1 percent and valuation is about 35.7x ARR. Self-check: higher valuation can hide aggressive terms, so the recommendation cannot rely only on price.",
        "Use Scorecard plus ARR multiple, not DCF. Prefer the Bengaluru INR 2Cr at INR 18Cr post offer if the terms are clean.",
        "Indian seed investors usually triangulate traction, team, market, and comparable SaaS multiples rather than accepting a spreadsheet DCF. Section 56(2)(viib) angel tax is not a blocker for shares issued from Assessment Year 2025-26 onward, but term-sheet quality under Companies Act documentation still matters.",
        [
          "Within 3 days, ask both angels for full term sheets covering liquidation preference, ESOP pool, anti-dilution, board rights, and pro-rata.",
          "Model the exact dilution: Offer 1 costs 12.5 percent; Offer 2 costs 11.1 percent while giving INR 50L extra capital.",
          "Reject any participating liquidation preference; accept only 1x non-participating liquidation preference.",
          "Reject full-ratchet anti-dilution; accept broad-based weighted-average anti-dilution only.",
          "Use the 30-day decision window to run 3 founder references for each angel, including one failed portfolio company.",
          "Close by day 21 because 4 months runway gives you weak leverage after legal diligence starts.",
        ],
        "Offer 2 is economically superior: more cash, less dilution, stronger signal. If Offer 2 has dirty terms, take the lower valuation with cleaner rights because a bad seed term sheet can damage Series A."
      ),
      {
        role: "user",
        content: "My CA says DCF looks more formal and investors respect it. Is ignoring DCF risky?",
      },
      assistant(
        "The risk is not in preparing DCF; the risk is using it as the main valuation argument. With INR 50.4L ARR, 8 customers, 18 percent MoM growth, and 4 months runway, every DCF variable will be guessed: churn, pricing, CAC, gross margin, discount rate, and terminal value. A DCF could show INR 12Cr or INR 40Cr by changing two assumptions. Indian angels know this. The CA's concern is documentation comfort, not investor decision logic. Self-check: for income-tax valuation, a merchant banker valuation may still be required depending on the instrument and timing, but that is compliance support, not negotiation logic.",
        "Do not lead with DCF. Keep a light valuation note for compliance, but negotiate using Scorecard, ARR multiple, and runway math.",
        "Indian startup rounds need both commercial logic and clean Companies Act paperwork. For an early SaaS round, the investor's economic decision is traction-led, while the valuation report is a supporting document if shares or CCPS are issued.",
        [
          "Prepare a 2-page valuation memo in 5 days: ARR, growth, customer quality, churn assumptions, and comparable Indian SaaS range.",
          "Ask the CA to produce a compliance valuation note only after the instrument is decided, likely equity or CCPS.",
          "Use INR 50.4L ARR as the anchor and explain why 24x to 36x ARR is the current offer range.",
          "Run a downside case: if growth drops from 18 percent to 8 percent MoM, defend a INR 14-18Cr post-money range.",
          "Keep the DCF as appendix material; do not let it become the headline in investor calls.",
        ],
        "Ignoring DCF as a negotiation method is not risky. Depending on instrument and documentation, ignoring valuation paperwork may be risky, so separate commercial valuation from compliance valuation."
      ),
      {
        role: "user",
        content: "If the higher offer asks for a 15 percent ESOP pool pre-money, does it still win?",
      },
      assistant(
        "A 15 percent pre-money ESOP request changes the deal materially. On INR 18Cr post with INR 2Cr investment, investor dilution is still 11.1 percent. But if the 15 percent pool is created before investment, the founders absorb that pool before the angel enters. The final cap table becomes roughly 73.9 percent founders, 15 percent ESOP, 11.1 percent investor. Without that pool, founders would retain 88.9 percent after investment. The real founder cost is not just 11.1 percent; it is 26.1 percent including the pool. Self-check: some ESOP expansion is legitimate before hiring, but 15 percent at seed is high unless two senior hires are imminent.",
        "With a 15 percent pre-money ESOP pool, the higher offer wins only if you truly need that pool in the next 12 months. Otherwise push it to 8-10 percent.",
        "Indian seed rounds commonly use ESOP pools, but pre-money pools shift cost to founders. The Companies Act, 2013 ESOP process requires board and shareholder approvals, so the pool should match a real hiring plan, not investor convenience.",
        [
          "Build a 12-month hiring plan within 48 hours: list roles, joining dates, salary gaps, and equity bands.",
          "Offer 8 percent pre-money now plus automatic top-up discussion at Series A if senior hiring exceeds plan.",
          "Reserve 1-2 percent for a CTO or VP Engineering, 0.25-0.75 percent for senior ICs, and 0.05-0.25 percent for early managers.",
          "Ask the investor to move any pool above 10 percent post-money, sharing dilution between founders and investor.",
          "Do not sign until the ESOP clause states vesting over 4 years with a 1-year cliff and board-approved grant process.",
        ],
        "At 15 percent pre-money, the headline INR 18Cr valuation is less attractive than it looks. Negotiate the pool first; valuation comes second."
      ),
    ],
  },
  {
    scenario_id: "S002",
    area: "Complex Multi-Scheme Grant Eligibility",
    difficulty: "Hard",
    generator_model: "codex-chat-generated",
    temperature: 0.69,
    lenses: {
      profile: "methodical and risk-averse founder who wants every step laid out clearly",
      angle: "emphasise specific document and process steps the founder needs to action this week",
      style: "user asks comparison and trade-off questions between two or three specific options",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "I can apply to only two schemes this quarter. Which two should I choose for my agritech hardware startup?",
      },
      assistant(
        "Priya is DPIIT-recognized, Udyam Micro, 11 months old, with only INR 2.8L pilot revenue. She needs non-dilutive or soft capital and credible hardware validation. SISFS is a strong fit because it supports proof-of-concept, trials, market entry, and commercialization: up to INR 20L grant and up to INR 50L debt or convertible debt. TANSEED is relevant because state programs often move faster and can validate local manufacturing. NIDHI-PRAYAS is weaker if the startup has already crossed prototype into pilots, though still possible if the sensor needs a major prototype iteration. Krishi Udaan is more market-access and accelerator-like than direct funding. Self-check: applying to two schemes does not itself disqualify her, but prior monetary government support above INR 10L can affect SISFS.",
        "Apply to SISFS and TANSEED this quarter. Keep NIDHI-PRAYAS as a backup only if the incubator agrees your soil sensor is still at prototype stage.",
        "SISFS is a DPIIT-linked central scheme built for early startups, while TANSEED can add state-level credibility for a Tamil Nadu hardware founder. Your Udyam Micro status helps with MSME positioning, but the grant decision will still turn on innovation, market need, pilot evidence, and team capacity.",
        [
          "This week, prepare one master dossier: DPIIT certificate, Udyam certificate, incorporation documents, cap table, pitch deck, and pilot invoices for INR 2.8L.",
          "For SISFS, shortlist 5 incubators that have agritech, hardware, or deeptech portfolios; do not apply randomly.",
          "For TANSEED, tailor the deck to Tamil Nadu jobs, farmer adoption, local manufacturing, and Coimbatore supply-chain depth.",
          "Do not claim mass-market readiness; position current pilots as product trials and request INR 15-20L for validation.",
          "Create a 90-day milestone plan: 50 sensors, 3 districts, 300 farmer readings, and 2 paid institutional buyers.",
          "Track prior government support carefully; if you receive more than INR 10L monetary support first, re-check SISFS eligibility before signing.",
        ],
        "Your best two applications are SISFS for larger structured seed support and TANSEED for faster state relevance. NIDHI-PRAYAS is useful only if your current pilots can honestly be framed as prototype validation, not commercial deployment."
      ),
      {
        role: "user",
        content: "My mentor says SISFS is obvious. Why not pair it with NIDHI-PRAYAS instead of TANSEED?",
      },
      assistant(
        "SISFS plus NIDHI-PRAYAS looks logical because both support early technical innovation, but eligibility stage is the issue. NIDHI-PRAYAS is intended for converting an idea into a prototype, commonly up to INR 10L, and is not meant for pure software or companies already beyond prototype stage. Priya already has pilot installations and INR 2.8L revenue. That does not automatically disqualify her, but it creates a narrative risk. SISFS can handle prototype, product trials, and market entry, so it fits the current stage better. TANSEED may accept pilot-stage startups more comfortably. Self-check: if the soil sensor still needs a new hardware version before commercialization, NIDHI-PRAYAS can become viable.",
        "Pair SISFS with TANSEED unless you can document a genuine unresolved prototype milestone. If yes, replace TANSEED with NIDHI-PRAYAS.",
        "Indian grant programs are stage-sensitive. DPIIT recognition opens the SISFS door, but NIDHI-PRAYAS through DST-backed incubators is stricter about prototype stage and applicant maturity.",
        [
          "Write a one-page stage memo in 24 hours: idea, prototype, pilot, commercial product, and current evidence.",
          "If current sensors are version 0 and need redesign, define a NIDHI milestone such as waterproof casing, calibration accuracy, or battery life.",
          "If current sensors are already sellable, prioritize TANSEED and frame the need as deployment capital, not invention capital.",
          "Email 3 PRAYAS centers with the same stage memo and ask for written eligibility feedback within 7 days.",
          "Do not submit contradictory applications; SISFS cannot say market-entry while PRAYAS says idea-to-prototype without explaining the difference.",
        ],
        "The wrong grant is not just a rejection risk; it can weaken your future narrative. Choose the scheme whose stage language matches the facts you can prove."
      ),
      {
        role: "user",
        content: "Will applying to multiple government schemes make SISFS reject me automatically?",
      },
      assistant(
        "Multiple applications do not create automatic SISFS rejection. The risk is receiving or hiding prior monetary support. SISFS typically restricts startups that have received more than INR 10L monetary support under another central or state government scheme, excluding items like prize money, subsidized workspace, or founder allowances depending on the scheme language. Priya has INR 2.8L revenue, not government support. If TANSEED approves funding before SISFS decision, the amount and purpose matter. Self-check: incubators may ask for declarations, so the safest approach is transparent sequencing and a support ledger.",
        "No, multiple applications are not the problem. Undisclosed or excessive prior government funding is the problem.",
        "SISFS is administered through approved incubators under DPIIT, and incubators evaluate both eligibility and fit. Government schemes in India often require self-declarations, so inconsistent disclosure can hurt more than the fact of applying.",
        [
          "Create a government-support ledger today with columns for scheme, amount, date, purpose, disbursed/not disbursed, and non-monetary benefits.",
          "Disclose all live applications in a short note; state that no government monetary support above INR 10L has been received.",
          "If TANSEED approves first, ask whether the support is grant, equity, debt, or reimbursement before accepting.",
          "If the approved amount exceeds INR 10L, get SISFS incubator guidance before executing the grant agreement.",
          "Keep scheme purposes separate: SISFS for sensor trials or market entry, TANSEED for state deployment, not duplicate invoices.",
          "Retain all sanction letters and utilization certificates for at least 3 financial years.",
        ],
        "Apply to multiple schemes, but manage sequencing and disclosure tightly. A clean paper trail is the difference between parallel applications and eligibility confusion."
      ),
    ],
  },
  {
    scenario_id: "S003",
    area: "Founder Dilution & ESOP Strategy",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.74,
    lenses: {
      profile: "founder overwhelmed by conflicting advice from CA, lawyer, mentor, and angel friends",
      angle: "emphasise cap table and dilution math with explicit numerical worked examples",
      style: "user asks numerical math-check questions wanting the calculation verified",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "Is a 12 percent ESOP pool pre-money standard, and how much extra dilution does it cost us?",
      },
      assistant(
        "The round is INR 6Cr at INR 30Cr post-money, so investor ownership is 20 percent and pre-money value is INR 24Cr. If a 12 percent ESOP pool is created pre-money, the final cap table after the round is roughly founders 68 percent, ESOP 12 percent, investor 20 percent. Without a pool, founders would have 80 percent after investment. If the same 12 percent pool were created post-money, it would dilute both founders and investor, leaving founders around 70.4 percent, investor 17.6 percent, pool 12 percent. The pre-money request costs founders about 2.4 percentage points more than a post-money pool. Self-check: a seed investor may reasonably ask for an ESOP pool, but 12 percent should be tied to actual hiring needs.",
        "A 12 percent ESOP pool is common-ish, but 12 percent pre-money is investor-favorable. Push for 8-10 percent pre-money or 12 percent post-money.",
        "Indian VC term sheets often place ESOP pools pre-money, but the economic effect is founder dilution. Under Companies Act, 2013 and the Companies Share Capital and Debentures Rules, ESOPs need proper board/shareholder approvals and grant terms, so the pool should match a real hiring plan.",
        [
          "Model three cases in 24 hours: 8 percent pre-money, 10 percent pre-money, and 12 percent post-money.",
          "List the 2 senior hires already promised equity and reserve named bands before signing the SHA.",
          "Use 4-year vesting with a 1-year cliff for all new ESOP grants.",
          "Ask the VC to accept 10 percent pre-money now and a Series A top-up only if utilization crosses 70 percent.",
          "Document founder dilution after this round: at 12 percent pre-money, each 50 percent founder drops to about 34 percent post-round.",
          "Complete ESOP board and shareholder approvals within 30 days after closing, not informally by email.",
        ],
        "Your lawyer is directionally right. The pre-money pool is not fatal, but 12 percent should be negotiated down unless you have a near-term hiring plan that uses it."
      ),
      {
        role: "user",
        content: "We promised meaningful equity to two senior hires. How much should we actually reserve for them?",
      },
      assistant(
        "The startup has INR 8L MRR, 22 percent MoM growth, and is raising INR 6Cr, so senior hires can reasonably expect real ownership but not founder-level grants. A VP Engineering or Head of Risk at this stage might justify 0.75-1.5 percent depending on seniority and cash discount. A strong product, sales, or compliance leader may justify 0.3-0.8 percent. If two senior hires need meaningful equity, reserve 2-2.5 percent total, not the full 12 percent. Self-check: fintech may need regulated-risk and compliance talent, so under-reserving for a risk leader can become expensive later.",
        "Reserve 2.5 percent for the two promised hires and keep the total pool at 10 percent pre-money if possible.",
        "In India, senior startup ESOP expectations are rising, but grants still need to reflect role, salary sacrifice, vesting, and replacement risk. Companies Act ESOP documentation must specify eligibility, vesting, exercise price, and approval process.",
        [
          "Allocate 1.25 percent for the most critical hire if they own engineering, risk, or regulated partnerships.",
          "Allocate 0.5-0.75 percent for the second senior hire unless they are joining at CXO level with a major cash cut.",
          "Keep 2 percent for next 6 months hiring, 3 percent for months 6-18, and 2-3 percent buffer for exceptional roles.",
          "Use quarterly vesting after a 1-year cliff and allow board-approved acceleration only on acquisition.",
          "Set exercise price and exercise window before offer letters go out; avoid vague phrases like meaningful equity.",
          "Review ESOP utilization every 90 days until Series A.",
        ],
        "The promised hires do not justify giving the VC a blank 12 percent pre-money pool. Name the grants, price the roles, and negotiate the unused buffer."
      ),
      {
        role: "user",
        content: "If the VC refuses to reduce the pool, should we walk away from the INR 6Cr round?",
      },
      assistant(
        "Walking away depends on alternatives, not annoyance. The company has INR 8L MRR, 22 percent MoM growth, 9 months runway, and is raising from a Tier-1 Indian VC. A 12 percent pre-money pool plus 20 percent investor ownership leaves founders at 68 percent total, or 34 percent each. That is still fundable for Series A. If the pool were 10 percent, founders would keep 70 percent total, or 35 percent each. The difference is 2 percentage points total, worth INR 60L at the INR 30Cr post valuation. Self-check: bad governance rights would be more dangerous than the pool itself.",
        "Do not walk away only because of the 12 percent pool. Walk away only if the VC also insists on full-ratchet anti-dilution, participating liquidation, or excessive control rights.",
        "Indian seed rounds often include investor-friendly ESOP mechanics, but market-standard downside protection is still 1x non-participating liquidation and broad-based weighted-average anti-dilution. The Companies Act process can handle the pool if economics are understood.",
        [
          "Trade the 12 percent pool for cleaner rights: 1x non-participating liquidation, no full ratchet, and standard pro-rata only.",
          "Ask for the unused pool above 8 percent to be reviewed before Series A if less than 50 percent is granted in 12 months.",
          "Protect founder salaries and hiring budget in the business plan so the pool does not replace fair cash pay.",
          "Cap any investor consent items to major actions above INR 25L or strategic matters, not daily operations.",
          "Close within 45 days if legal terms are clean; your 9-month runway is good but not infinite.",
        ],
        "Accept the pool if the rest of the term sheet is clean and the VC quality is real. Spend negotiation energy on control and downside terms, not only on 2 percentage points."
      ),
    ],
  },
  {
    scenario_id: "S004",
    area: "MSME Debt Products & Working Capital",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.66,
    lenses: {
      profile: "non-technical founder from a family business background, comfortable with numbers but unfamiliar with VC mechanics",
      angle: "emphasise immediate cash-flow and runway consequences over the next 6 months",
      style: "user asks comparison and trade-off questions between two or three specific options",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "Should I take the SBI CGTMSE loan, NBFC invoice discounting, or TReDS for this INR 1Cr need?",
      },
      assistant(
        "Vikram needs two different products: INR 60L for a dyeing unit and INR 40L working capital. A single product should not solve both. TReDS at 9-10.5 percent is best for receivables stuck at INR 1.8Cr, especially because buyers are large garment exporters. SBI's CGTMSE-backed term loan at 11.2 percent is better for the dyeing unit because asset life is longer than invoice cycles. The NBFC invoice discounting at 14.5 percent is fastest but expensive; it should be emergency use only. Self-check: the dyeing unit order deadline is 45 days, so speed matters, but not enough to overpay on the full INR 1Cr.",
        "Use TReDS for receivables and SBI CGTMSE for the dyeing unit. Avoid the 14.5 percent NBFC unless cash is needed within 72 hours.",
        "As a Udyam-registered Small enterprise, you can use MSME-specific rails. TReDS platforms such as RXIL, M1xchange, and Invoicemart are designed for receivable financing, while CGTMSE can support collateral-free credit for micro and small enterprises.",
        [
          "Start RXIL onboarding this week for invoices against the 3 large exporters and target INR 80L-1Cr financing.",
          "Use the SBI CGTMSE term loan only for the INR 60L dyeing unit and match repayment to machine cash flows.",
          "Keep INR 40L working capital flexible through TReDS, not a long-term term loan.",
          "Compare effective cost: TReDS around 9-10.5 percent, SBI 11.2 percent, NBFC 14.5 percent.",
          "Ask exporters to confirm invoice acceptance within 7 days because TReDS pricing depends on buyer confirmation.",
          "Keep NBFC sanction ready only as a fallback for the last 10 days before the order deadline.",
        ],
        "Split the problem. Receivables should finance working capital; term debt should finance the dyeing unit. That gives speed without locking the whole INR 1Cr at the highest rate."
      ),
      {
        role: "user",
        content: "My buyers take 90 days. Can MSME payment rules help me pressure them without damaging relationships?",
      },
      assistant(
        "Yes, but use the rules as leverage, not as the first message. Section 15 of the MSMED Act requires payment to MSME suppliers within 45 days of acceptance. Section 16 imposes compound interest at three times the RBI bank rate for delayed payment. Section 43B(h) of the Income Tax Act also creates tax pressure on buyers because unpaid MSME dues beyond the statutory timeline can affect deduction timing. Self-check: a harsh legal notice may hurt future orders, so the first move should be commercial and documentation-led.",
        "Use MSME rules to renegotiate credit from 90 days to 45-60 days, while offering TReDS as a relationship-friendly financing route.",
        "Indian buyers increasingly care about MSME payable disclosure and Section 43B(h) timing. A polite Udyam-backed payment note can work better than a legal threat if the buyer values vendor continuity.",
        [
          "Send each buyer your Udyam certificate and a payment-term alignment letter within 5 working days.",
          "Propose 45 days for new invoices or TReDS acceptance within 7 days of goods acceptance.",
          "For existing INR 1.8Cr receivables, ask for written confirmation of acceptance and scheduled payment dates.",
          "Escalate only invoices beyond 60 days to finance heads, not procurement executives.",
          "Keep MSME Samadhaan as a last resort for invoices older than 90 days and strategically non-critical buyers.",
          "Track delayed-payment interest separately, but do not book it aggressively unless recovery is realistic.",
        ],
        "Yes, the law gives leverage. Use it to create a financing process and shorter terms, not to start a fight with your top buyers."
      ),
      {
        role: "user",
        content: "If RXIL onboarding takes too long, should I take the NBFC money now?",
      },
      assistant(
        "The decision depends on delay cost versus interest cost. On INR 40L working capital, a 14.5 percent annual rate costs about INR 48,000 per month. TReDS at 10 percent costs about INR 33,000 per month. The difference is roughly INR 15,000 per month per INR 40L. If missing the dyeing unit order risks more than INR 15,000-30,000 per month in contribution, temporary NBFC funding is acceptable. Self-check: if the NBFC has processing fees, foreclosure charges, or personal guarantees, the headline 14.5 percent understates cost.",
        "Take NBFC funding only as a bridge for 30-60 days and only for the minimum gap, not the full INR 1Cr.",
        "TReDS is the better MSME financing rail, but Indian MSMEs sometimes need bridge liquidity while platform onboarding and buyer confirmation finish. CGTMSE and TReDS should remain the permanent structure.",
        [
          "Ask RXIL for a written onboarding timeline within 48 hours and identify missing buyer documents.",
          "If RXIL exceeds 14 days, draw only INR 20-40L from the NBFC for immediate working capital.",
          "Negotiate zero foreclosure penalty after 30 days before signing the NBFC agreement.",
          "Use SBI term loan documents for the INR 60L machine in parallel; do not delay asset financing.",
          "Repay the NBFC first from the first TReDS disbursement or buyer collection.",
          "Do not pledge all receivables to the NBFC if that blocks RXIL financing.",
        ],
        "Bridge financing is fine; permanent expensive financing is not. Use the NBFC for speed only if the order economics clearly justify it."
      ),
    ],
  },
  {
    scenario_id: "S005",
    area: "Indian Angel & Early VC Psychology",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.78,
    lenses: {
      profile: "founder anxious about a specific downside risk who needs reassurance grounded in facts",
      angle: "emphasise negotiation leverage points; founder wants to know what they can push back on",
      style: "user asks panicked urgent questions, short and stressed in tone",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "Fourteen angels mostly rejected me. Is my consumer health app just unfundable in India?",
      },
      assistant(
        "The company is not automatically unfundable, but the current pitch is not clearing Indian angel thresholds. You have 12K downloads and 800 DAU, which is useful engagement, but no revenue and only 5 months runway. Indian angels in crowded consumer health usually want one of three proofs: monetization, retention, or distribution advantage. Eleven declines and two ghosts mean the narrative lacks a wedge, not necessarily that the business is dead. Self-check: shifting to US angels through AngelList will not fix weak monetization unless there is a US market, Delaware structure, or global network angle.",
        "Do not pivot the whole company yet. Run a 30-day monetization and retention proof sprint, then re-pitch a narrower set of angels.",
        "Indian angels are more revenue-sensitive in consumer categories than generic US startup advice suggests. If you later take foreign money into an Indian company, instruments usually need to be FEMA-compliant CCPS or CCDs, because SAFE is not recognized for Indian-incorporated companies.",
        [
          "For 30 days, test one paid plan at INR 199-499 per month with your 800 DAU audience.",
          "Measure day-7 and day-30 retention; target at least 25 percent day-7 and 10 percent day-30 for a serious re-pitch.",
          "Convert 50-100 paying users before returning to angels; even INR 25K MRR changes the conversation.",
          "Rewrite the pitch around one wedge: specific condition, specific user segment, or specific acquisition channel.",
          "Approach 8 angels with consumer health or wellness portfolios, not 30 generic names.",
          "Use DPIIT recognition if not already done; it helps with credibility and scheme access, not valuation by itself.",
        ],
        "You have a proof problem, not a death sentence. Give angels revenue or retention evidence within 30 days before deciding on a major pivot."
      ),
      {
        role: "user",
        content: "Should I stop pitching Indian angels and try US angels on AngelList instead?",
      },
      assistant(
        "US angels can help only if the story fits their pattern. A Bengaluru consumer health app with 12K downloads, 800 DAU, no revenue, and India-first users is not automatically more attractive in the US. AngelList investors may ask about US market expansion, incorporation structure, data privacy, healthcare claims, and payment willingness. Indian angels rejected you for being too early or crowded; US angels may say the same with less context. Self-check: if the product has English-speaking global users or a US clinical/wellness wedge, testing US angels can be useful as a side channel.",
        "Do not shift fully to US angels. Spend 80 percent effort on Indian traction and 20 percent on carefully targeted global angels.",
        "Indian companies raising foreign angel money must think about FEMA pricing, FDI sector rules, and instruments such as CCPS or CCDs. A generic US SAFE workflow does not map cleanly to an Indian private company.",
        [
          "Keep 4 weeks focused on India traction: paid conversion, retention, and a sharper niche.",
          "Create a separate 10-slide global deck only if at least 20 percent of users are outside India or expansion is credible.",
          "If a US angel is serious, structure through CCPS or CCDs after checking FEMA pricing with the company secretary process.",
          "Do not spend more than INR 1L on foreign fundraising setup until you have a verbal cheque above INR 50L.",
          "Ask every investor for a specific rejection reason and tag it as market, traction, team, category, or terms.",
          "Re-pitch Indian angels when you have 50 paying users or 3 weeks of retention data, whichever comes first.",
        ],
        "AngelList is not a shortcut around weak proof. Use it as a small experiment, not the main plan."
      ),
      {
        role: "user",
        content: "What exact pitch change would make Indian angels take the next meeting?",
      },
      assistant(
        "The pitch needs to move from broad consumer health to a narrow, monetizable wedge. Current facts are 12K downloads, 800 DAU, zero revenue, 5 months runway. Angels hear crowded app, unclear willingness to pay, and no moat. A better pitch says: one user segment, one painful health workflow, one measurable outcome, one paid conversion path. For example, instead of consumer health app, position as a chronic-condition adherence product for urban Indians aged 25-45 with INR 299 monthly plans and coach-assisted retention. Self-check: do not invent medical claims unless clinically supported, because healthcare advertising and data risk can backfire.",
        "Pitch a paid wedge, not an app. The next meeting should be about proof of willingness to pay and repeat usage.",
        "Indian early investors respond to category clarity and monetization discipline, especially when a sector is crowded. DPIIT recognition helps signal startup status, but the pitch must still show a path to revenue and defensibility.",
        [
          "Change slide 1 to the niche: condition, user, and paid outcome in 1 sentence.",
          "Replace vanity downloads with cohorts: 800 DAU, weekly active users, day-7 retention, and repeat sessions per user.",
          "Add a 30-day experiment slide targeting INR 25K-50K MRR from 50-100 paid users.",
          "Show acquisition math: cost per install, cost per activated user, and expected CAC payback under 3 months.",
          "Name 3 comparable Indian health/wellness models and explain why your wedge is narrower.",
          "Ask angels for INR 50L-80L to reach INR 3L MRR in 6 months, not an undefined seed round.",
        ],
        "The sharper pitch is: specific user, paid problem, 30-day proof, 6-month milestone. That gives angels a reason to continue instead of politely passing."
      ),
    ],
  },
  {
    scenario_id: "S006",
    area: "Real-World Trade-off Decision Making",
    difficulty: "Hard",
    generator_model: "codex-chat-generated",
    temperature: 0.71,
    lenses: {
      profile: "second-time founder who exited a previous company, financially sophisticated",
      angle: "emphasise downside risk and worst-case scenarios; founder is trying to identify what could go wrong",
      style: "user asks comparison and trade-off questions between two or three specific options",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "Should I take the INR 3Cr VC round, INR 80L RBF, or the FMCG acquisition offer?",
      },
      assistant(
        "The D2C brand has INR 1.4Cr ARR, 38 percent gross margin, 8 percent net loss, and 7 months runway. The VC round is INR 3Cr at INR 18Cr post, or 16.7 percent dilution, but it brings aggressive growth expectations. The RBF gives only INR 80L and repayment cap is 1.4x, so total repayment is INR 1.12Cr. At current monthly revenue of about INR 11.7L, 8 percent revenue share is only INR 94K per month, so repayment is slow unless growth improves. The acquisition gives INR 9Cr cash plus up to INR 4Cr earnout, around 6.4x current ARR upfront. Self-check: acquisition terms can hide earnout traps, but strategically it is the strongest risk-adjusted option.",
        "Prioritize the FMCG acquisition, but negotiate the earnout hard. Keep RBF as backup, and take VC only if you want a high-burn growth path.",
        "Indian D2C funding has become more margin-sensitive, and 38 percent gross margin is thin for a skincare brand unless repeat purchase and CAC are excellent. Acquisition documentation under Companies Act and FEMA if any foreign shareholder exists must be cleaner than a normal funding round.",
        [
          "Within 48 hours, request a written acquisition term sheet with INR 9Cr cash, closing conditions, indemnity cap, and earnout formula.",
          "Negotiate at least 70 percent of total consideration as fixed or time-bound cash, not discretionary targets.",
          "Cap indemnity at 10-15 percent of upfront consideration and limit survival to 18-24 months except fraud.",
          "Keep the INR 80L RBF warm for 21 days as negotiating leverage and runway insurance.",
          "Reject VC if it requires doubling ad spend before gross margin crosses 50 percent.",
          "Ask the FMCG buyer for role, budget, brand-control, and earnout reporting rights in writing.",
        ],
        "The acquisition is the best risk-adjusted choice because it pays real cash before runway pressure worsens. It becomes unattractive only if the INR 4Cr earnout is vague, discretionary, or tied to targets the buyer controls."
      ),
      {
        role: "user",
        content: "My advisor says the VC round values us at twice the acquisition. Why not chase the upside?",
      },
      assistant(
        "The VC post-money valuation is INR 18Cr, but it is not cash to you; it is a financing price tied to future execution. The acquisition gives INR 9Cr upfront cash plus INR 4Cr possible earnout. With 16.7 percent VC dilution, you retain more ownership but must grow into the valuation, likely with higher burn. At INR 1.4Cr ARR and 38 percent gross margin, the company may need margin expansion, repeat purchases, and CAC discipline before it deserves a larger D2C multiple. Self-check: if the brand can reach INR 5Cr ARR in 18 months with 55 percent gross margin, VC upside becomes more compelling.",
        "Do not compare INR 18Cr paper valuation to INR 9Cr cash. Compare expected founder outcome after 24 months.",
        "Indian consumer VCs price growth but punish weak contribution margins later. Revenue-based financing platforms like Velocity can bridge cash, but they do not solve brand positioning or margin structure.",
        [
          "Build a 24-month founder-outcome model with 3 cases: acquisition now, VC growth, and RBF bootstrap.",
          "For the VC case, model ad spend, CAC payback, gross margin moving from 38 percent to 50 percent, and next-round dilution of 18-25 percent.",
          "For acquisition, haircut the INR 4Cr earnout by 50 percent unless targets are objective and buyer-funded.",
          "For RBF, model INR 1.12Cr total repayment and monthly cash drag at 8 percent of revenue.",
          "Ask the VC for written growth milestones and reserve strategy for a bridge if Series A does not happen.",
          "If VC upside does not create at least 2.5x expected founder value over acquisition, do not take the risk.",
        ],
        "The advisor is comparing valuation labels. You should compare probability-weighted cash outcomes."
      ),
      {
        role: "user",
        content: "What earnout terms would make the acquisition too risky to sign?",
      },
      assistant(
        "The risky earnout is one where the FMCG buyer controls the inputs but you carry the consequence. If the INR 4Cr earnout depends on marketing budget, channel placement, SKU launch approvals, pricing, or inventory availability controlled by the buyer, it can become almost worthless. A 2-year earnout is acceptable only if targets are objective and funded. With INR 1.4Cr ARR today, a target like INR 4Cr ARR in year 1 and INR 8Cr in year 2 may be aggressive but possible with buyer distribution. A target like EBITDA margin above 18 percent while buyer controls costs is dangerous. Self-check: tax treatment and escrow timing also affect real proceeds.",
        "Do not sign if the earnout is discretionary, buyer-controlled, or uncapped on indemnity exposure.",
        "Indian M&A deals often use escrow, indemnity, and founder lock-in clauses. These are not bad by themselves, but the Companies Act transaction documents must precisely define consideration, conditions, and post-closing obligations.",
        [
          "Require objective earnout metrics: net revenue, gross contribution, or agreed SKU milestones, measured monthly.",
          "Tie buyer obligations to the earnout: minimum INR 1Cr marketing spend, channel access, and inventory support.",
          "Cap escrow at 10-15 percent of upfront INR 9Cr and release it within 12-18 months.",
          "Reject unlimited indemnity and broad business-performance warranties after closing.",
          "Add information rights: monthly MIS, marketplace dashboards, and channel sales reports for 24 months.",
          "Define founder role, salary, decision rights, and termination impact on earnout before signing.",
        ],
        "The acquisition is attractive only if cash is real and the earnout is measurable. If the buyer can move the goalposts, treat the offer as INR 9Cr, not INR 13Cr."
      ),
    ],
  },
  {
    scenario_id: "S007",
    area: "Term Sheet Comparison & Negotiation",
    difficulty: "Hard",
    generator_model: "codex-chat-generated",
    temperature: 0.68,
    lenses: {
      profile: "fast-moving founder who wants the sharp answer and trade-offs in 30 seconds",
      angle: "emphasise downside risk and worst-case scenarios; founder is trying to identify what could go wrong",
      style: "user asks direct yes-or-no questions, wanting a clear commit answer with reasoning",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "TS2 gives INR 1Cr more at a higher valuation. Should I take it over TS1?",
      },
      assistant(
        "No. TS2 looks better on headline but is materially worse on downside. TS1 gives INR 5Cr at INR 28Cr post, so dilution is 17.9 percent. TS2 gives INR 6Cr at INR 32Cr post, so dilution is 18.75 percent. The extra INR 1Cr is not free: TS2 has 1.5x participating liquidation capped at 3x, full-ratchet anti-dilution for 18 months, observer rights, and super pro-rata up to 2x. On a weak exit, TS2 can take INR 9Cr before participation and up to INR 18Cr capped return before common holders feel meaningful upside. Self-check: if TS1 has no hidden vetoes, it is clearly cleaner.",
        "Take TS1 unless TS2 removes participating liquidation and full-ratchet anti-dilution. The INR 1Cr extra is not worth the structural damage.",
        "In Indian seed and Series A markets, 1x non-participating liquidation and broad-based weighted-average anti-dilution are founder-friendlier standards. Full ratchet and participating preference are investor-aggressive terms that can damage future financing.",
        [
          "Tell TS2 within 48 hours that headline valuation is acceptable only with 1x non-participating liquidation.",
          "Demand removal of full ratchet and replacement with broad-based weighted-average anti-dilution.",
          "Reject super pro-rata above standard pro-rata; 2x creates allocation pressure in the next round.",
          "Accept one board seat, but push the observer to information rights only.",
          "Use TS1 as the signing baseline and close legal diligence within 30-45 days.",
          "If runway needs the extra INR 1Cr, negotiate a small extension from TS1 rather than accepting TS2's terms.",
        ],
        "TS1 is the better deal. TS2 is a classic higher-valuation trap."
      ),
      {
        role: "user",
        content: "How bad is the 1.5x participating liquidation if we sell for INR 40Cr?",
      },
      assistant(
        "TS2 invests INR 6Cr. A 1.5x preference gives INR 9Cr first. Because it is participating, the investor can then also participate in remaining proceeds until the 3x cap, meaning total proceeds can go up to INR 18Cr. On a INR 40Cr sale, after INR 9Cr preference, INR 31Cr remains. If the investor owns 18.75 percent, participation adds about INR 5.8Cr, so total investor proceeds become about INR 14.8Cr. Under 1x non-participating, the investor would choose between INR 6Cr or 18.75 percent of INR 40Cr, which is INR 7.5Cr. Self-check: exact math depends on option pool and conversion terms, but the direction is very clear.",
        "At a INR 40Cr exit, TS2 can pay the investor roughly INR 14.8Cr instead of INR 7.5Cr. That is a massive founder cost.",
        "This is why Indian founder-friendly term sheets use 1x non-participating liquidation. Participating preference changes the economics of modest exits and can make common shares feel underwater.",
        [
          "Build exit-waterfall cases at INR 25Cr, INR 40Cr, INR 75Cr, and INR 150Cr before signing.",
          "Send TS2 the INR 40Cr math and ask for 1x non-participating preference within 3 business days.",
          "Ask TS1 to confirm no participation, no senior preference stack, and no multiple above 1x.",
          "Check whether ESOP is included pre-money: TS1 has 15 percent, TS2 has 12 percent, so compare fully diluted ownership.",
          "Do not accept a cap as a compromise; a 3x cap is still too expensive for a Series A-style round.",
        ],
        "The participating preference is not legal boilerplate. It changes who gets paid on exactly the kind of exit Indian logistics SaaS companies often see."
      ),
      {
        role: "user",
        content: "Can I negotiate TS1's 15 percent pre-money ESOP without losing the term sheet?",
      },
      assistant(
        "Yes, but treat it as a calibrated ask, not a fight. TS1 already has cleaner investor protections: 1x non-participating liquidation, broad-based weighted-average anti-dilution, one board seat, and standard pro-rata. The 15 percent pre-money ESOP is high but not absurd for a company at INR 12L MRR planning senior hiring. If reduced to 12 percent, founders save 3 percentage points on the fully diluted cap table before future rounds. Self-check: if TS1's fund process requires 15 percent, asking for a utilization-based top-up may work better than asking for a flat cut.",
        "Negotiate TS1's pool from 15 percent to 12 percent now, with a Series A top-up if usage exceeds 70 percent.",
        "Indian VCs often ask for larger ESOP pools pre-money because they want the company hiring-ready after close. Companies Act ESOP approvals can be completed after closing, but the economic pool size must be in the term sheet.",
        [
          "Prepare a hiring plan for the next 18 months showing named roles and expected ESOP usage.",
          "Offer 12 percent pre-money plus automatic review if 8 percent is granted within 12 months.",
          "Do not trade ESOP reduction for worse liquidation, anti-dilution, or control rights.",
          "Ask for unallocated pool visibility in board MIS every quarter.",
          "Keep one board seat acceptable, but avoid investor consent on routine hires below INR 50L annual CTC.",
          "Target signing within 14 days so TS2 cannot reset the negotiation tempo.",
        ],
        "You can and should ask. But do not risk the clean term sheet for 3 percentage points if TS1 refuses politely."
      ),
    ],
  },
  {
    scenario_id: "S008",
    area: "Grant Rejection Analysis & Improvement",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.73,
    lenses: {
      profile: "founder who has been told something by an advisor and wants a second opinion before acting",
      angle: "emphasise specific document and process steps the founder needs to action this week",
      style: "user asks process and timeline questions: when, how long, what order",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "SISFS rejected us for weak scalability and unit economics. Should we reapply, change incubator, or pivot?",
      },
      assistant(
        "Do not pivot from one generic screening rejection. Anita has INR 80K MRR from 12 schools, a real rural Hindi-medium edtech wedge, and a team of 5. The feedback points to narrative and economics, not necessarily product failure. SISFS can provide up to INR 20L grant for proof-of-concept/prototype/product trials and up to INR 50L debt or convertible debt for market entry. At INR 80K MRR, annualized revenue is INR 9.6L, but the application likely failed to show how school count, revenue per school, onboarding cost, and renewal rate scale. Self-check: changing incubator helps only if the new incubator understands edtech or rural distribution.",
        "Reapply after 4 months with a rebuilt application and a better-fit incubator. Do not pivot the business only because of this rejection.",
        "SISFS is incubator-screened, so fit and narrative matter. DPIIT recognition opens the door, but the incubator still needs to believe the startup can use INR 20L-50L against measurable milestones.",
        [
          "This week, ask the rejecting incubator for a 15-minute feedback call and request specific weak sections.",
          "Within 14 days, rebuild unit economics: revenue per school, teacher onboarding cost, content cost, collection cycle, gross margin, and renewal assumption.",
          "Over 4 months, grow from 12 schools to at least 25 schools or show signed LOIs for the same.",
          "Create a grant milestone plan: INR 20L to reach 75 schools, 3 districts, and INR 3L MRR within 9 months.",
          "Shortlist 5 incubators with edtech, rural, language, or social-impact portfolios before reapplying.",
          "Keep the same core business; change the proof and the application story.",
        ],
        "Your mentor is partly right: this looks like an application problem. Fix the measurable business case before changing the business."
      ),
      {
        role: "user",
        content: "What exact unit economics should I show for rural schools before reapplying?",
      },
      assistant(
        "Show economics at the school level and cohort level. Current INR 80K MRR across 12 schools means average MRR per school is about INR 6,667. If onboarding a school costs INR 10,000 and gross margin is 65 percent, contribution per school is about INR 4,333 per month, so CAC payback is roughly 2.3 months. If gross margin is only 35 percent or collections take 120 days, the story weakens. The application likely failed because it said scalability without proving repeatable sales and collections. Self-check: rural edtech buyers may have seasonal budgets, so annual renewal and collection timing matter as much as MRR.",
        "Show per-school MRR, gross margin, onboarding cost, payback period, renewal rate, and collection days. Keep the math simple and auditable.",
        "SISFS incubators evaluate feasibility and commercialization, not just social impact. For Indian rural school sales, payment cycle, renewal, and district-level expansion proof are critical.",
        [
          "Create a one-page unit economics sheet within 7 days using actual invoices from all 12 schools.",
          "Report average MRR per school: INR 80K divided by 12, or about INR 6,667.",
          "Measure CAC separately for founder-led sales and paid sales; do not blend them without explanation.",
          "Show collection days by school and target below 60 days for new contracts.",
          "Track teacher activation: at least 70 percent of assigned teachers using the platform monthly.",
          "For reapplication, include a 9-month plan to reach INR 3L MRR and 75 schools.",
        ],
        "The strongest reapplication says: here is what one school is worth, here is what one school costs, and here is proof we can repeat it 50 more times."
      ),
      {
        role: "user",
        content: "Should I apply to a different incubator or go back to the same one after 4 months?",
      },
      assistant(
        "Apply to a different incubator if the original one lacks edtech or rural distribution depth. Go back to the same one only if they gave actionable feedback and showed interest in seeing an improved version. Incubator fit matters because SISFS committees compare you against other applicants in their pipeline. A deeptech incubator may not understand school sales, while a social-impact or education incubator may value rural Hindi-medium traction. Self-check: changing incubators without changing the application will likely produce the same rejection.",
        "Use a two-track plan: maintain the original relationship, but reapply through a better-fit edtech or social-impact incubator.",
        "Under SISFS, approved incubators are the practical gatekeepers. DPIIT status is necessary, but the incubator's domain comfort affects screening quality and recommendation strength.",
        [
          "Rank 10 incubators within 5 days by edtech portfolio, rural programs, grant disbursement history, and mentor availability.",
          "Send a 1-page teaser to 5 incubators before formal application and ask whether the stage fits their SISFS pipeline.",
          "Share 4-month progress with the original incubator, but do not rely only on them.",
          "Apply formally to 2 incubators maximum in the first reapplication wave to avoid scattered follow-up.",
          "Include rejection learnings in the new application: scalability proof, unit economics, and district expansion milestones.",
          "Set a reapplication date after you have at least 25 schools, INR 1.6L MRR, or signed LOIs that double current reach.",
        ],
        "A new incubator can help, but only after the evidence improves. Domain fit plus stronger metrics is the combination that changes the result."
      ),
    ],
  },
  {
    scenario_id: "S009",
    area: "Indian Tax Benefits for Startups & MSMEs",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.7,
    lenses: {
      profile: "founder with prior corporate finance experience (ex-banker or ex-CA) who already knows the basics",
      angle: "emphasise tax and compliance implications; founder is worried about regulatory exposure",
      style: "user asks direct yes-or-no questions, wanting a clear commit answer with reasoning",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "Is angel tax still a real risk on our INR 4Cr VC round after the 2024 abolition?",
      },
      assistant(
        "For fresh share issuances from FY 2024-25 relevant to Assessment Year 2025-26 onward, Section 56(2)(viib) angel tax is not applicable. So if Suresh raised INR 4Cr after 1 April 2024, the old angel-tax exposure on premium should not be the core worry. If any tranche was issued before 1 April 2024, then the old framework, DPIIT exemption conditions, Form 2 history, and valuation documentation may matter. The company has DPIIT recognition, INR 1.1Cr revenue, INR 22L net profit, and a INR 25Cr post-money VC round, which is normal for a deeptech startup. Self-check: angel tax is not the same as transfer pricing, FEMA, or share-allotment compliance.",
        "If the round closed after 1 April 2024, angel tax should not be a real risk. Still clean up valuation, allotment, and DPIIT records.",
        "The Income Tax Department notes Section 56(2)(viib) is not applicable from Assessment Year 2025-26. DPIIT recognition remains relevant for startup benefits, but angel tax should not be used to scare you on a current-year VC premium.",
        [
          "Confirm the exact share allotment date and board/shareholder approval date within 24 hours.",
          "If allotment happened after 1 April 2024, file the angel-tax concern as closed but keep the valuation memo.",
          "If any allotment happened before 1 April 2024, review DPIIT Form 2, eligible startup conditions, and valuation support.",
          "Check Companies Act filings: PAS-3, board resolutions, shareholder approvals, and updated cap table within 30 days.",
          "Maintain use-of-funds records for the INR 4Cr round for at least 7 financial years.",
          "Separate angel tax from 80-IAC planning; they use different eligibility filters.",
        ],
        "Your CA's warning may be outdated if the round is post-1 April 2024. The remaining risk is compliance hygiene, not angel tax on the premium."
      ),
      {
        role: "user",
        content: "We made only INR 22L profit. Should we claim Section 80-IAC now or save it?",
      },
      assistant(
        "Section 80-IAC gives 100 percent deduction on eligible profits for any 3 consecutive assessment years out of the first 10 years from incorporation, subject to DPIIT recognition and Inter-Ministerial Board certification. With only INR 22L net profit, using one of the 3 years now may be suboptimal if profits could be much larger later. Also, MAT at 15 percent can still apply, so the benefit is not always zero-tax cash magic. Since the company is deeptech with INR 1.1Cr revenue and recent INR 4Cr funding, profit may rise materially in years 3-6. Self-check: if future profitability is uncertain, saving forever can also waste the window.",
        "Do not rush to use 80-IAC on INR 22L profit unless this is the first year of a clear 3-year profit cycle.",
        "Indian startup tax holidays require both DPIIT recognition and separate IMB approval. The Income Tax framework allows choosing 3 consecutive years out of 10, so timing is a strategic choice.",
        [
          "Check incorporation date and confirm the company is within the 10-year eligibility window.",
          "Apply for or verify IMB certification before assuming 80-IAC is usable.",
          "Build a 5-year profit forecast within 10 days using conservative, base, and upside cases.",
          "If expected profit in the next 3 years exceeds INR 1Cr annually, save the 80-IAC block.",
          "If profits are unlikely to scale and cash is tight, consider starting the 3-year block now.",
          "Model MAT at 15 percent and credit utilization before deciding.",
        ],
        "For INR 22L profit, preservation is usually better. Use the 3-year tax holiday when the profit base is meaningful."
      ),
      {
        role: "user",
        content: "What compliance checklist should I finish this month to avoid tax surprises?",
      },
      assistant(
        "The priorities are share issuance, startup status, and profit deduction readiness. The company has DPIIT recognition from 8 months ago, a recent INR 4Cr VC round, INR 1.1Cr revenue, and INR 22L profit. That means the tax file should prove three things: the premium is not exposed to old angel-tax rules, the company qualifies for future startup benefits, and the financial statements support any deduction claim. Self-check: deeptech companies often miss TDS, related-party payments, R&D capitalization, and founder reimbursements, so the checklist should not be limited to the funding round.",
        "Finish a 30-day cleanup covering allotment filings, DPIIT/IMB status, TDS, revenue recognition, and 80-IAC timing.",
        "Indian startup tax benefits are document-driven. Section 80-IAC, Section 56(2)(viib), Companies Act filings, and TDS compliance sit in different systems but get reviewed together during diligence.",
        [
          "Day 1-3: verify share allotment date, PAS-3 filing, valuation report, bank credit, and investor KYC for the INR 4Cr.",
          "Day 4-7: download DPIIT certificate and check whether IMB approval for 80-IAC exists or must be applied for.",
          "Day 8-12: reconcile GST, TDS, payroll, and vendor payments for the financial year.",
          "Day 13-18: document R&D expenses, IP ownership, and capitalization policy for computer vision development.",
          "Day 19-24: prepare 5-year profit forecast to decide the 80-IAC claim window.",
          "Day 25-30: create a board note recording angel-tax position, tax holiday plan, and pending filings.",
        ],
        "The month-end goal is a clean audit trail. Once that exists, the angel-tax worry should drop and the 80-IAC decision becomes a planning question."
      ),
    ],
  },
  {
    scenario_id: "S010",
    area: "Stage-Specific Valuation Logic",
    difficulty: "Medium",
    generator_model: "codex-chat-generated",
    temperature: 0.75,
    lenses: {
      profile: "founder running an Indian-origin team and is unfamiliar with US-style instruments and structures",
      angle: "emphasise the difference between Indian market reality and what generic US-startup advice would say",
      style: "user asks open-ended what-should-I-do questions seeking strategic guidance",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "VCs are quoting INR 60Cr to INR 180Cr valuations. Which method actually applies to my fintech stage?",
      },
      assistant(
        "Vivek is not a pure SaaS company and not a mature NBFC. He has INR 8Cr disbursed, INR 90L annual revenue, 28 percent gross margin, and INR 12L profit. Revenue multiple alone misses loan-book quality. Loan-book multiple alone misses take-rate and risk-sharing. DCF is too sensitive unless cash flows are stable. For an NBFC-lite co-lending partner, the right valuation triangulates revenue multiple, disbursal growth, partner quality, credit risk, take-rate, regulatory defensibility, and profitability. INR 60Cr is 67x revenue; INR 180Cr is 200x revenue, which needs exceptional growth or strategic scarcity. Self-check: if the company has low credit exposure and strong bank partnerships, a premium can be justified, but not automatically.",
        "Use a hybrid fintech method: revenue multiple plus disbursal quality and regulatory-risk adjustment. Treat INR 60-90Cr as defensible and INR 180Cr as strategic-premium territory.",
        "Indian fintech valuations are shaped by RBI expectations, co-lending structure, FLDG exposure, compliance quality, and partner concentration. Generic US SaaS ARR multiple advice does not map cleanly to an Indian credit-linked business.",
        [
          "Build a valuation bridge with 3 anchors: INR 90L revenue, INR 8Cr disbursed, and INR 12L profit.",
          "Separate gross disbursal from net revenue and show take-rate by lending partner.",
          "Document credit exposure: first-loss default guarantee, collections responsibility, and delinquency data.",
          "Benchmark valuation cases at INR 60Cr, INR 90Cr, INR 120Cr, and INR 180Cr with dilution at each.",
          "Ask each VC to state which risk they are underwriting: revenue, book growth, compliance moat, or strategic access.",
          "Do not accept a high valuation if it comes with aggressive liquidation, ratchets, or impossible growth milestones.",
        ],
        "The spread exists because investors are valuing different businesses. Force them to value the same risk-adjusted fintech engine."
      ),
      {
        role: "user",
        content: "One VC says revenue multiple is wrong and only loan book matters. Is that fair?",
      },
      assistant(
        "It is only partly fair. Loan book matters because INR 8Cr disbursed indicates distribution and lender appetite. But if you are NBFC-lite and not holding the loan book, the book may not represent owned assets. The revenue of INR 90L shows monetization, while gross margin of 28 percent and profit of INR 12L show economic quality. A loan-book multiple can overvalue thin-margin pass-through volume or undervalue a high-quality platform with low balance-sheet risk. Self-check: if the company takes FLDG or credit losses, loan-book quality becomes much more important.",
        "Do not accept loan-book-only valuation. Use loan book as one input, but anchor final valuation to net revenue, take-rate, and risk exposure.",
        "In India, RBI-regulated lending models are judged on who owns credit risk, who controls customer acquisition, and who handles collections. Co-lending volume without clear economics is not enough.",
        [
          "Create a table for the last 12 months: disbursed amount, net revenue, take-rate, default rate, and partner share.",
          "Show whether your INR 8Cr disbursal is recurring monthly flow or one-time pilot volume.",
          "If FLDG exists, disclose cap, amount, and loss history; if not, state explicitly that credit exposure is limited.",
          "Calculate revenue multiple: INR 60Cr is 67x current revenue, so justify it through growth rate and margin expansion.",
          "Calculate book multiple only on active, performing, attributable book, not lifetime disbursal.",
          "Reject DCF unless the investor accepts a conservative 3-year operating plan instead of a 7-year fantasy.",
        ],
        "Loan book matters, but not alone. Your best argument is risk-adjusted revenue from a repeatable lending channel."
      ),
      {
        role: "user",
        content: "Should I accept the highest INR 180Cr valuation if it creates the least dilution?",
      },
      assistant(
        "Not automatically. A INR 180Cr valuation minimizes current dilution, but it can create a down-round trap if the company cannot grow into it. If you raise INR 20Cr at INR 180Cr post, dilution is 11.1 percent. The same INR 20Cr at INR 90Cr post is 22.2 percent. That looks like a huge win. But if the next round requires 3-5x growth and you miss, investors may demand full-ratchet protection, structured liquidation, or a flat/down round. In fintech, regulatory shocks can also slow growth. Self-check: high valuation is good only if terms and next-round milestones are realistic.",
        "Accept INR 180Cr only if terms are clean and the next 18-month plan can support at least INR 5-7Cr revenue run-rate.",
        "Indian fintech funding punishes compliance surprises and weak credit controls. A high headline valuation with aggressive downside protection can be worse than a lower clean round under Companies Act and SHA economics.",
        [
          "Ask the INR 180Cr VC for full terms: liquidation preference, anti-dilution, redemption, board control, and milestone covenants.",
          "Model the next round: what revenue, disbursal, delinquency, and partner concentration justify INR 300-500Cr?",
          "Reject full-ratchet anti-dilution and participating liquidation preference even if valuation is high.",
          "Keep dilution in a normal Series A band of 18-25 percent if the investor adds credibility and clean terms.",
          "Use INR 120Cr as a compromise ask if INR 180Cr comes with heavy structure.",
          "Close only after regulatory diligence on co-lending agreements, customer consent, and data handling is complete.",
        ],
        "Lowest dilution today is not always the best financing. Choose the highest clean valuation you can realistically grow into."
      ),
    ],
  },
];

for (const record of records) {
  if (record.conversation.length !== 7) {
    throw new Error(`${record.scenario_id} expected 7 conversation turns`);
  }

  const assistantTurns = record.conversation.filter((turn) => turn.role === "assistant");
  if (assistantTurns.length !== 3) {
    throw new Error(`${record.scenario_id} expected 3 assistant turns`);
  }

  for (const [index, turn] of assistantTurns.entries()) {
    for (const required of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!turn.content.includes(required)) {
        throw new Error(`${record.scenario_id} assistant turn ${index + 1} missing ${required}`);
      }
    }
  }
}

fs.writeFileSync(outputPath, records.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");

console.log(`Wrote ${records.length} records to ${outputPath}`);
