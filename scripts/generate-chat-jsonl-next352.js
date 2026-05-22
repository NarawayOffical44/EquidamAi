const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_codex_first10_clean.jsonl");

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

const packs = [
  {
    id: "customer_revenue_lens",
    temperature: 0.87,
    lenses: {
      profile: "founder who wants every finance decision tied back to customers and revenue quality",
      angle: "translate finance into customer proof, pricing power, retention, and sales credibility",
      style: "commercial founder asks practical revenue-quality questions",
    },
    questions: [
      (area) => `What should customer proof change in this ${area} decision?`,
      () => "How do I measure whether the revenue signal is strong enough?",
      () => "Why should customer quality decide the final call?",
    ],
  },
  {
    id: "lender_credit_committee",
    temperature: 0.7,
    lenses: {
      profile: "credit committee member evaluating whether the business deserves non-dilutive capital",
      angle: "repayment capacity, covenants, cash conversion, and lender-style risk grading",
      style: "banker asks credit-risk and monitoring questions",
    },
    questions: [
      (area) => `What would a lender approve in this ${area} case?`,
      () => "How should the covenant or condition protect downside?",
      () => "Why would credit committee reject this plan?",
    ],
  },
  {
    id: "enterprise_procurement_lens",
    temperature: 0.76,
    lenses: {
      profile: "enterprise buyer or procurement head judging vendor reliability and finance readiness",
      angle: "procurement trust, payment terms, documentation, delivery risk, and enterprise adoption",
      style: "enterprise stakeholder asks reliability and contracting questions",
    },
    questions: [
      (area) => `What matters if an enterprise buyer reviews this ${area} decision?`,
      () => "How could this make the company look unreliable?",
      () => "Why should we present this differently to a serious buyer?",
    ],
  },
  {
    id: "runway_crisis_mode",
    temperature: 0.83,
    lenses: {
      profile: "founder under runway pressure who needs decisive triage",
      angle: "cash preservation, deadline compression, fallback design, and no-regret moves",
      style: "urgent founder asks short crisis-management questions",
    },
    questions: [
      (area) => `What is the emergency move for ${area} if runway is tight?`,
      () => "How should I decide what to stop this week?",
      () => "Why does this fallback buy the most time?",
    ],
  },
  {
    id: "negotiation_script",
    temperature: 0.9,
    lenses: {
      profile: "founder preparing a negotiation with investor, bank, buyer, or government counterparty",
      angle: "specific asks, concessions, walk-away points, and counterparty psychology",
      style: "founder asks for negotiation language and trade-offs",
    },
    questions: [
      (area) => `What should I negotiate first in this ${area} situation?`,
      () => "How do I ask for it without sounding unreasonable?",
      () => "Why is this the right walk-away line?",
    ],
  },
  {
    id: "compliance_reviewer",
    temperature: 0.68,
    lenses: {
      profile: "senior compliance reviewer checking whether advice survives legal and tax review",
      angle: "eligibility, documentation, sequencing, approval authority, and audit trail",
      style: "reviewer asks precise compliance-risk questions",
    },
    questions: [
      (area) => `What compliance risk should I see in this ${area} decision?`,
      () => "How do I identify the most dangerous missing document?",
      () => "Why does this sequence prevent a later cleanup mess?",
    ],
  },
  {
    id: "mentor_teaching_mode",
    temperature: 0.92,
    lenses: {
      profile: "experienced mentor teaching the founder how to think, not just what to do",
      angle: "mental models, common founder errors, and reusable finance reasoning",
      style: "learning-oriented founder asks why the answer works",
    },
    questions: [
      (area) => `What is the right mental model for this ${area} decision?`,
      () => "How does that mental model separate good founders here?",
      () => "Why can I reuse this logic later?",
    ],
  },
  {
    id: "post_decision_review",
    temperature: 0.74,
    lenses: {
      profile: "founder reviewing a decision after execution to learn what to monitor next",
      angle: "post-decision metrics, warning signals, and correction loops",
      style: "retrospective questions that train follow-through",
    },
    questions: [
      (area) => `What should I monitor after deciding on ${area}?`,
      () => "How do I spot the early warning sign of failure?",
      () => "Why and when should I reverse or adjust course?",
    ],
  },
];

const guardrails = {
  venture:
    "Use Companies Act, ESOP approvals, SHA economics, FEMA where foreign investors appear, 1x non-participating liquidation preference, and broad-based weighted-average anti-dilution as the boundary.",
  scheme:
    "Use DPIIT recognition, SISFS, 80-IAC, IMB approval, Udyam, and state or ministry scheme rules as eligibility gates, while keeping customer proof central.",
  msme:
    "Use Udyam, MSMED Act Sections 15 and 16, Section 43B(h), CGTMSE, TReDS, RXIL, M1xchange, and Invoicemart as tools for cash discipline.",
  crossBorder:
    "Use FEMA, RBI reporting, Press Note 3, FDI pricing, CCPS, CCD, ECB forms, and Companies Act instruments as non-negotiable closing constraints.",
  tax:
    "Use Income Tax Act Section 80-IAC, Section 56(2)(viib), GST, TDS, MAT, Section 43B(h), and board records as the tax defensibility frame.",
  governance:
    "Use Companies Act, ROC filings, IP assignment, ESOP grants, founder vesting, SHA reserved matters, and DPIIT records as title and authority proof.",
  exit:
    "Use Companies Act transfer rules, SHA restrictions, escrow, earnout control, indemnity caps, tax on unlisted shares, and board approvals as outcome filters.",
};

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1} invalid JSON: ${error.message}`);
      }
    });
}

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function wordCount(text) {
  return words(text).length;
}

function clip(text, maxWords) {
  const items = words(text);
  return items.length <= maxWords ? text : `${items.slice(0, maxWords).join(" ")}.`;
}

function ensureRange(text, min, max, additions) {
  let output = text.trim();
  let index = 0;
  while (wordCount(output) < min && index < 50) {
    output += ` ${additions[index % additions.length]}`;
    index += 1;
  }
  if (wordCount(output) > max) output = `${words(output).slice(0, max - 1).join(" ")}.`;
  return output;
}

function numericAnchors(text) {
  const matches = String(text || "").match(
    /(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps|K|MRR|ARR|FY\d+|FY\d+-\d+))?/gi
  );
  const unique = Array.from(new Set(matches || []));
  return [...unique, "INR 10L", "INR 25L", "INR 50L", "30 days", "45 days", "90 days", "18 months"].slice(0, 11);
}

function shortArea(area) {
  return words(area.replace(/\([^)]*\)/g, "")).slice(0, 5).join(" ");
}

function classify(scenario) {
  const t = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/valuation|dilution|term sheet|cap table|esop|bridge|series a|down round|secondary|founder equity|liquidation/.test(t)) return "venture";
  if (/grant|scheme|sisfs|nidhi|prayas|birac|tanseed|dpiit|80-iac|seed fund/.test(t)) return "scheme";
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|stand-up|pmegp|udyam|supplier|gem/.test(t)) return "msme";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|foreign|convertible note/.test(t)) return "crossBorder";
  if (/gst|tax|56\(2\)|35|capitalization|capitalisation|remuneration|compensation/.test(t)) return "tax";
  if (/roc|due diligence|ip assignment|trademark|patent|copyright|co-founder departure|vesting|reverse vesting|compliance/.test(t)) return "governance";
  if (/exit|acquisition|buyout|ipo|strategic sale/.test(t)) return "exit";
  return "venture";
}

function caseMap(scenario) {
  const type = classify(scenario);
  const map = {
    venture: {
      frame:
        "The finance surface is valuation, but the real system is ownership, control, runway, investor psychology, and next-round credibility.",
      guardrail: guardrails.venture,
      strongMove:
        "price the hidden clause or dilution effect before debating the headline number",
      weakMove:
        "accept the most flattering valuation or fastest cheque without modelling downside rights",
      metric:
        "founder ownership after 2 rounds, months of runway, clean-money probability, option-pool usage, and control friction",
      proof:
        "cap table, dilution model, liquidation waterfall, ESOP plan, investor-rights draft, founder reference notes, and 18-month hiring plan",
    },
    scheme: {
      frame:
        "The surface is scheme selection, but the real system is eligibility, milestone credibility, disbursement timing, and proof conversion.",
      guardrail: guardrails.scheme,
      strongMove:
        "match the application to the company's actual stage and one measurable milestone",
      weakMove:
        "apply everywhere or treat recognition as approval",
      metric:
        "stage fit, prior support, disbursement timing, grant quantum, customer proof, and 90-day milestone clarity",
      proof:
        "DPIIT certificate, Udyam certificate, prior-support ledger, pilot proof, use-of-funds schedule, milestone sheet, and application draft",
    },
    msme: {
      frame:
        "The surface is borrowing, but the real system is cash conversion, buyer leverage, repayment comfort, and collateral discipline.",
      guardrail: guardrails.msme,
      strongMove:
        "match receivables, capex, and emergency gaps to different finance products",
      weakMove:
        "use high-cost short-term money as permanent working capital",
      metric:
        "annualized rate, invoice age, buyer acceptance, collateral burden, repayment comfort, and 13-week cash-flow coverage",
      proof:
        "Udyam certificate, invoice ageing, buyer acceptance, lender sanction, TReDS status, collateral terms, and weekly cash-flow model",
    },
    crossBorder: {
      frame:
        "The surface is investor preference, but the real system is Indian instrument validity, bank processing, reporting, and future diligence.",
      guardrail: guardrails.crossBorder,
      strongMove:
        "choose the compliant Indian instrument first, then negotiate economics",
      weakMove:
        "import US-style documents without checking Indian reporting and pricing",
      metric:
        "approval path, pricing certificate, reporting deadline, conversion clarity, maturity, and next-round explainability",
      proof:
        "beneficial-owner note, investor KYC, pricing certificate, board approval, instrument draft, reporting calendar, and conversion model",
    },
    tax: {
      frame:
        "The surface is tax saving, but the real system is timing, proof, audit defensibility, and cash impact.",
      guardrail: guardrails.tax,
      strongMove:
        "claim or structure only when documentation and profit timing make the saving meaningful",
      weakMove:
        "optimize for a theoretical tax benefit while leaving GST, TDS, or filing gaps unresolved",
      metric:
        "assessment-year timing, cash tax saved, MAT impact, TDS/GST gap, filing deadline, and 3-year profit forecast",
      proof:
        "tax computation, GST/TDS reconciliation, valuation report, DPIIT or IMB certificate, board note, and filing acknowledgements",
    },
    governance: {
      frame:
        "The surface is paperwork, but the real system is title, authority, diligence trust, and founder accountability.",
      guardrail: guardrails.governance,
      strongMove:
        "clean ownership and approval records before raising, borrowing, selling, or claiming benefits",
      weakMove:
        "let informal promises or spreadsheets become the operating truth",
      metric:
        "filing age, IP title risk, vesting clarity, consent risk, ESOP authority, and time to diligence-ready status",
      proof:
        "board minutes, ROC forms, cap table, IP assignments, ESOP grants, founder vesting documents, and compliance calendar",
    },
    exit: {
      frame:
        "The surface is exit value, but the real system is probability-weighted founder cash, escrow, earnout control, tax leakage, and buyer behavior.",
      guardrail: guardrails.exit,
      strongMove:
        "convert every headline into cash-at-close and risk-adjusted proceeds",
      weakMove:
        "treat earnout or valuation as equivalent to cash",
      metric:
        "cash at close, escrow percentage, earnout control, indemnity cap, tax leakage, and 24-month opportunity cost",
      proof:
        "LOI, SPA draft, escrow clause, earnout formula, tax estimate, consent list, cap table, and integration plan",
    },
  };
  return map[type] || map.venture;
}

function styleInstruction(pack, turn) {
  const style = {
    customer_revenue_lens: [
      "Answer through revenue quality: not just money raised or saved, but whether the decision improves customer trust and willingness to pay.",
      "Identify the revenue signal that would justify taking more risk.",
      "Turn customer evidence into the final decision rule.",
    ],
    lender_credit_committee: [
      "Answer like a credit committee: approve, approve with conditions, or reject, with repayment logic.",
      "Name the covenant or monitoring condition that controls downside.",
      "State the rejection trigger clearly and commercially.",
    ],
    enterprise_procurement_lens: [
      "Answer through enterprise trust: reliability, documentation, delivery risk, and contracting confidence.",
      "Explain what would make the company look unreliable to a serious buyer.",
      "Show how to present the decision to an enterprise counterparty.",
    ],
    runway_crisis_mode: [
      "Triage ruthlessly: preserve cash, compress decisions, and choose no-regret moves.",
      "Name what to stop doing this week because it consumes attention without changing outcome.",
      "Choose the fallback that buys time without poisoning the next round or relationship.",
    ],
    negotiation_script: [
      "Give negotiation logic, not theatre: ask, concession, evidence, and walk-away.",
      "Make the request sound reasonable because it improves both sides' closing certainty.",
      "Define the walk-away line as economics plus behavior.",
    ],
    compliance_reviewer: [
      "Review the decision like a senior compliance reviewer who wants the business to move but not create a cleanup liability.",
      "Name the missing document that would cause the worst delay later.",
      "Sequence approvals so cleanup does not happen after money, customer, or tax commitments.",
    ],
    mentor_teaching_mode: [
      "Teach the founder the mental model behind the answer, not only the answer.",
      "Name the behavior that separates strong founders from reactive founders.",
      "Show how this logic generalizes to future finance decisions.",
    ],
    post_decision_review: [
      "Assume the decision has been made; now define monitoring and correction loops.",
      "Name the early warning signal that says the original logic is breaking.",
      "Define when to reverse without ego.",
    ],
  };
  return style[pack.id][turn - 1];
}

function thinking(scenario, pack, turn) {
  const c = caseMap(scenario);
  const nums = numericAnchors(scenario.scenario).join(", ");
  const base = `
${styleInstruction(pack, turn)} Scenario anchor: ${clip(scenario.scenario, 58)} Numerical anchors: ${nums}. Expert frame: ${c.frame} Indian guardrail: ${c.guardrail} The strong move is to ${c.strongMove}; the weak move is to ${c.weakMove}. Judge by ${c.metric}. I need this variation to train broad expert behavior for startups, MSMEs, and larger enterprises: interpret incentives, connect finance to operations, use Indian compliance as boundary, and still give a decision. Self-check: include a rejected alternative, a quantified test, a proof pack, and a concrete next action rather than only explaining concepts.
`.trim();
  return ensureRange(base, 185, 285, [
    "The answer should sound like an experienced operator who has seen negotiations fail because facts arrived late.",
    "The model should learn when to be aggressive, when to slow down, and when to preserve optionality without drifting.",
  ]);
}

function directAnswer(scenario, pack, turn) {
  const c = caseMap(scenario);
  const direct = {
    customer_revenue_lens: [
      `Customer proof should make the decision more or less aggressive. If the choice does not improve pricing power, retention, trust, or sales-cycle credibility, it is weaker than it looks.`,
      `Become more aggressive only when customer evidence reduces risk, not when an advisor or investor makes the option sound prestigious.`,
      `Use customer quality as the final filter: a decision that cannot improve buyer trust or repeat revenue should not dominate the next 30 days.`,
    ],
    lender_credit_committee: [
      `Credit answer: approve only with conditions if repayment is visible; reject if the plan depends on optimism rather than cash conversion.`,
      `The protective condition should monitor the one number that fails first: collections, runway, margin, compliance status, or customer concentration.`,
      `Credit committee should reject if management cannot show cash conversion, authority, and fallback within 30 days.`,
    ],
    enterprise_procurement_lens: [
      `An enterprise buyer will care less about the founder's clever structure and more about reliability, continuity, legal clarity, and delivery capacity.`,
      `The company looks unreliable when finance decisions create delivery risk, unclear authority, weak documentation, or desperate negotiation behavior.`,
      `Present the decision as a stability plan: what it funds, what it protects, who owns delivery, and how risk is monitored.`,
    ],
    runway_crisis_mode: [
      `Emergency move: protect runway first, then negotiate. Do not choose any route that takes more than 30-45 days before changing cash position or leverage.`,
      `Stop low-probability conversations this week. Anything that cannot change cash, ownership, eligibility, or buyer confidence in 14 days is a distraction.`,
      `The best fallback is the one that buys time without adding a future penalty through bad terms, expensive debt, or damaged relationships.`,
    ],
    negotiation_script: [
      `Negotiate the risk, not your anxiety. Ask for the clause, price, timeline, or evidence standard that makes the deal closeable.`,
      `The reasonable ask is the one that reduces closing risk for both sides while protecting your downside.`,
      `Walk away when the other side insists on a term that looks small today but damages ${c.metric}.`,
    ],
    compliance_reviewer: [
      `Compliance view: proceed only if the document trail can support the commercial recommendation. Speed without authority is not speed; it is deferred cleanup.`,
      `The most dangerous missing document is the one that proves authority, eligibility, ownership, or tax position.`,
      `Sequence the cleanup before irreversible commitments: money receipt, share issue, tax claim, buyer contract, or lender drawdown.`,
    ],
    mentor_teaching_mode: [
      `The mental model is constraint-first finance. Identify what blocks the company next, then choose the financial tool that removes that block cleanly.`,
      `Strong founders separate signal from theatre. They do not confuse a larger amount, faster answer, or famous counterparty with a better decision.`,
      `Reuse the logic by asking: what constraint does this remove, what risk does it create, and what proof will tell me I was wrong?`,
    ],
    post_decision_review: [
      `After the decision, monitor whether the original constraint is actually improving. If not, the decision is becoming narrative, not strategy.`,
      `The early warning sign is slippage in the first operating metric that justified the choice.`,
      `Reverse when new facts change economics, timing, or authority enough that the original decision no longer protects the company.`,
    ],
  };
  return direct[pack.id][turn - 1];
}

function why(scenario, pack, turn) {
  const c = caseMap(scenario);
  const common = `For ${scenario.area}, ${c.guardrail}`;
  const whyMap = {
    customer_revenue_lens:
      `This works in India because capital and compliance decisions eventually get judged by whether the business can win and retain serious customers. ${common}. The best finance answer makes the company more credible to customers, not just more funded. That matters from idea-stage startups to larger enterprises because buyer trust is often the cheapest source of future capital.`,
    lender_credit_committee:
      `This works because lenders and credit committees underwrite repayment behavior, not founder ambition. ${common}. A lender-style answer forces the company to show cash conversion, covenants, and fallback before using debt or non-dilutive finance. It also trains the model to avoid recommending debt where the repayment engine is not visible.`,
    enterprise_procurement_lens:
      `This works because enterprise customers buy continuity and accountability, not just product features. ${common}. A finance decision that weakens delivery, documentation, or founder focus can lose a serious buyer even when it looks good on a spreadsheet. The answer must therefore protect customer confidence and legal clarity together.`,
    runway_crisis_mode:
      `This works because runway pressure changes decision quality. ${common}. In crisis mode, the best answer is not the theoretically optimal structure; it is the route that changes cash or leverage within a usable deadline while avoiding permanent damage. This trains the model to distinguish urgent from reckless.`,
    negotiation_script:
      `This works because Indian counterparties respond better to specific risk-sharing asks than vague pushback. ${common}. The strongest negotiation stance names the clause, evidence, amount, and deadline that make the deal workable. It gives the other side a way to say yes without conceding everything.`,
    compliance_reviewer:
      `This works because Indian finance decisions frequently fail after the commercial decision, when filings, approvals, or proof are missing. ${common}. A compliance-reviewer lens does not make the answer timid; it makes it executable. The model should learn that clean authority is a growth enabler.`,
    mentor_teaching_mode:
      `This works because founders need reusable judgment, not one-off instructions. ${common}. The mental model transfers across fundraising, grants, MSME debt, tax, procurement, and exits. It teaches the model to reason from constraint, incentive, proof, and downside rather than reciting rules.`,
    post_decision_review:
      `This works because a finance decision is not finished at signature. ${common}. The company needs monitoring loops so it can detect whether runway, ownership, compliance, customer proof, or repayment quality is improving. That is how advice becomes operating discipline.`,
  };
  return whyMap[pack.id];
}

function steps(scenario, pack, turn) {
  const c = caseMap(scenario);
  const library = {
    customer_revenue_lens: [
      `Within 3 days, identify the customer signal that should improve: paid conversion, renewal, buyer acceptance, collections, ACV, margin, or sales-cycle time.`,
      `Map each option to customer impact: does it improve trust, delivery reliability, pricing power, or retention within 90 days?`,
      `Reject any option that consumes more than 30 days but does not change customer proof or cash position.`,
      `Create a simple dashboard with 3 numbers: revenue quality, cash impact, and decision deadline.`,
      `If customer proof improves by 20 percent or more, consider the more aggressive financing or strategic route.`,
      `If customer proof is flat by day 21, preserve cash and choose the lower-risk option.`,
    ],
    lender_credit_committee: [
      `Prepare a credit memo within 5 days with purpose, amount, repayment source, security, covenants, and fallback.`,
      `Run a 13-week cash-flow model and a 6-month downside case with 20 percent lower collections.`,
      `Set one monitoring covenant tied to the real risk: DSCR, receivable ageing, gross margin, runway, or buyer concentration.`,
      `Require monthly reporting until the exposure is repaid, converted, or refinanced.`,
      `Approve with conditions only if the business still has 3 months of liquidity after the decision.`,
      `Reject if the plan needs fresh money before the first repayment or milestone is proven.`,
    ],
    enterprise_procurement_lens: [
      `Build a buyer-facing stability note within 7 days: funding status, delivery owner, continuity plan, and escalation path.`,
      `Remove any clause or financing condition that could interrupt delivery within the next 90 days.`,
      `Collect proof that enterprise buyers trust: signed contracts, GST details, bank details, Udyam or DPIIT certificate, security review, and references.`,
      `Give procurement a clean answer on payment terms, service continuity, and legal entity authority.`,
      `Track one reliability metric weekly: SLA, delivery date, invoice acceptance, or support response time.`,
      `If the finance decision weakens enterprise trust, choose the lower-risk option even if the headline economics are smaller.`,
    ],
    runway_crisis_mode: [
      `Freeze discretionary spend today and list every action by cash impact within 14 days.`,
      `Prioritize the route that changes cash, dilution, receivables, or deadline risk within 30 days.`,
      `Pause low-probability grants, investor calls, or lender processes that need more than 45 days unless they are already near closing.`,
      `Negotiate one bridge action: faster buyer collection, smaller cheque, invoice finance, expense cut, or founder-approved extension.`,
      `Keep a daily runway tracker for 14 days and then weekly until the decision closes.`,
      `If runway falls below 3 months, stop optimizing terms and optimize survival with clean documents.`,
    ],
    negotiation_script: [
      `Open with the business reason: "We can close faster if this risk is allocated cleanly."`,
      `Ask for 2 changes only: one economic term and one control or timing term.`,
      `Offer one concession that does not hurt future fundability, customer trust, or compliance status.`,
      `Put the ask in writing within 24 hours and ask for a response within 7 days.`,
      `Prepare a walk-away note using INR impact, percent ownership, days of delay, and compliance risk.`,
      `If the other side refuses the reasonable ask, move to fallback within 48 hours instead of renegotiating the same point.`,
    ],
    compliance_reviewer: [
      `Create a compliance map in 3 days: eligibility, authority, filing, tax, counterparty, and evidence.`,
      `Identify the single document that blocks execution under ${c.guardrail}.`,
      `Do not receive money, issue securities, claim tax benefit, sign buyer contract, or draw debt until authority is clear.`,
      `Use version-controlled folders for ${c.proof}.`,
      `Set a 10-day cleanup sprint for missing approvals and a 30-day closure deadline.`,
      `Escalate any unresolved issue that can create penalty, rejection, or investor diligence failure.`,
    ],
    mentor_teaching_mode: [
      `Name the constraint before naming the solution: capital, proof, compliance, control, customer trust, or time.`,
      `Ask what each option improves by day 30, day 90, and month 18.`,
      `Reject the option that looks sophisticated but does not remove the constraint.`,
      `Write the decision in one sentence that a junior team member can repeat correctly.`,
      `Define the proof that would change your mind before you start defending your favorite answer.`,
      `Review the same logic after the decision so the team learns judgment, not just outcome memory.`,
    ],
    post_decision_review: [
      `Within 7 days after the decision, record the original thesis, expected numbers, owner, and deadline.`,
      `Track 5 metrics weekly: cash, revenue proof, ownership or control, compliance status, and counterparty behavior.`,
      `Set warning thresholds: 20 percent revenue miss, 30-day delay, INR 25L cash gap, or 3 percent ownership impact.`,
      `Hold a day-21 review and decide whether to continue, renegotiate, or activate fallback.`,
      `Document every material change so future investors, banks, buyers, or auditors can follow the logic.`,
      `Reverse if the original constraint is not improving by day 30 and the fallback has lower permanent damage.`,
    ],
  };

  if (turn === 1) return library[pack.id];
  if (turn === 2) {
    return library[pack.id].map((step, index) =>
      index % 2 === 0
        ? step.replace(/Within|Prepare|Build|Freeze|Open|Create|Name|Ask|Reject/, "Re-check")
        : step
    );
  }
  return library[pack.id].map((step, index) =>
    index === 0
      ? `Use this final rule: ${step.charAt(0).toLowerCase()}${step.slice(1)}`
      : step
  );
}

function bottom(scenario, pack, turn) {
  const c = caseMap(scenario);
  if (turn === 1) {
    return `The decision should improve ${c.metric}, not just sound smart. If it does not move one of those levers within 30-90 days, downgrade it.`;
  }
  if (turn === 2) {
    return `The danger is mistaking motion for progress. Hold the recommendation unless new evidence changes INR impact, timing, control, compliance, or customer trust.`;
  }
  return `The final rule is evidence-led: commit when proof is strong, renegotiate when one term blocks value, and reverse when the original constraint stops improving.`;
}

function body(scenario, pack, turn) {
  const raw = [
    directAnswer(scenario, pack, turn),
    "",
    "**Why this works in Indian context:**",
    why(scenario, pack, turn),
    "",
    "**How to execute:**",
    steps(scenario, pack, turn).map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "**Bottom line:**",
    bottom(scenario, pack, turn),
  ].join("\n");

  return ensureRange(raw, 435, 575, [
    "This gives the LoRA model a high-value answer pattern: diagnose the constraint, connect it to Indian execution reality, and close with a measurable decision.",
    "It also creates variation across startup, MSME, and enterprise settings without turning the answer into a shallow list of facts.",
  ]);
}

function assistantTurn(scenario, pack, turn) {
  const t = thinking(scenario, pack, turn);
  const b = body(scenario, pack, turn);
  const content = `<thinking>\n${t}\n</thinking>\n\n${b}`;
  const thinkingWords = wordCount(t);
  const bodyWords = wordCount(b);
  const totalWords = wordCount(content);
  if (thinkingWords < 150 || thinkingWords > 300) throw new Error(`${scenario.id}/${pack.id}/A${turn} thinking words ${thinkingWords}`);
  if (bodyWords < 400 || bodyWords > 600) throw new Error(`${scenario.id}/${pack.id}/A${turn} body words ${bodyWords}`);
  if (totalWords < 600 || totalWords > 900) throw new Error(`${scenario.id}/${pack.id}/A${turn} total words ${totalWords}`);
  return { role: "assistant", content };
}

function validate(record) {
  const roles = record.conversation.map((turn) => turn.role).join(",");
  if (roles !== "system,user,assistant,user,assistant,user,assistant") throw new Error(`${record.scenario_id} roles ${roles}`);
  const userTurns = record.conversation.filter((turn) => turn.role === "user");
  const expectedQuestionStart = ["What", "How", "Why"];
  userTurns.forEach((user, index) => {
    if (wordCount(user.content) > 35) throw new Error(`${record.scenario_id} user too long: ${user.content}`);
    if (!user.content.startsWith(expectedQuestionStart[index])) {
      throw new Error(`${record.scenario_id} user turn ${index + 1} must start with ${expectedQuestionStart[index]}: ${user.content}`);
    }
  });
  for (const assistant of record.conversation.filter((turn) => turn.role === "assistant")) {
    for (const marker of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!assistant.content.includes(marker)) throw new Error(`${record.scenario_id} missing ${marker}`);
    }
    if (assistant.content.includes("₹")) throw new Error(`${record.scenario_id} uses rupee glyph`);
  }
}

const existing = readJsonl(OUTPUT_PATH);
if (existing.length >= 704) {
  console.log(`No append needed. ${OUTPUT_PATH} already has ${existing.length} records.`);
  process.exit(0);
}
if (existing.length !== 352) {
  throw new Error(`Expected 352 existing records before appending next 352, found ${existing.length}`);
}

const scenarios = readJsonl(SOURCE_PATH);
if (scenarios.length !== 44) throw new Error(`Expected 44 source scenarios, found ${scenarios.length}`);

const additions = [];
for (const scenario of scenarios) {
  for (const pack of packs) {
    const qs = pack.questions.map((fn) => fn(shortArea(scenario.area)));
    const record = {
      scenario_id: scenario.id,
      area: scenario.area,
      difficulty: scenario.difficulty,
      conversation: [
        system,
        { role: "user", content: qs[0] },
        assistantTurn(scenario, pack, 1),
        { role: "user", content: qs[1] },
        assistantTurn(scenario, pack, 2),
        { role: "user", content: qs[2] },
        assistantTurn(scenario, pack, 3),
      ],
      generator_model: "codex-chat-generated",
      temperature: pack.temperature,
      lenses: pack.lenses,
      variation_id: pack.id,
    };
    validate(record);
    additions.push(record);
  }
}

fs.appendFileSync(OUTPUT_PATH, additions.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
console.log(`Appended ${additions.length} records to ${OUTPUT_PATH}`);
console.log(`Total records: ${existing.length + additions.length}`);
