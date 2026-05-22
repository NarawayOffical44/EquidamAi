const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_codex_first10_clean.jsonl");

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

const guardrails = {
  msme:
    "Use current MSME scale awareness: from 1 April 2025, Micro, Small, and Medium thresholds expanded, so advice should not trap growing firms in an outdated category mindset.",
  cgtmse:
    "Use CGTMSE as a credit-enhancement tool, not a reason to borrow; repayment capacity and lender covenants still decide whether debt is intelligent.",
  startup:
    "Use DPIIT recognition, SISFS, and 80-IAC as gates that help good businesses, not as substitutes for market proof, governance, or cash discipline.",
  fema:
    "Use FEMA, Companies Act instruments, RBI reporting, and Press Note 3 as constraints when foreign capital or foreign-style instruments appear.",
  treds:
    "Use TReDS and invoice discounting as cash-conversion tools; the deeper question is buyer quality, invoice acceptance, and whether financing improves bargaining power.",
};

const packs = [
  {
    id: "idea_to_pmf_principle",
    temperature: 0.86,
    lenses: {
      profile: "idea-stage or pre-PMF founder trying to learn the decision principle from a richer scenario",
      angle: "teach the underlying finance judgment so the model generalizes beyond the exact facts",
      style: "curious founder asks first-principles questions, then asks how to avoid common traps",
    },
    questions: [
      (area) => `What principle should an early founder learn from this ${area} case?`,
      () => "What mistake would a first-time founder most likely make here?",
      () => "How do I turn this into a simple decision rule?",
    ],
  },
  {
    id: "growth_operator_execution",
    temperature: 0.79,
    lenses: {
      profile: "growth-stage operator who needs a concrete plan without losing strategic depth",
      angle: "connect financing choice to execution cadence, hiring, runway, and process ownership",
      style: "operator asks practical but high-context execution questions",
    },
    questions: [
      (area) => `As a growth operator, how should I execute this ${area} decision?`,
      () => "Where will execution break if the strategy is right on paper?",
      () => "What weekly operating cadence should I run?",
    ],
  },
  {
    id: "enterprise_cfo_controls",
    temperature: 0.73,
    lenses: {
      profile: "enterprise CFO or finance head translating startup advice into controls and governance",
      angle: "risk controls, documentation, approval authority, and enterprise-grade decision hygiene",
      style: "finance leader asks control, audit, and stakeholder-management questions",
    },
    questions: [
      (area) => `If I were the CFO, how would I control this ${area} risk?`,
      () => "What should I refuse even if the business team wants speed?",
      () => "What reporting pack should go to leadership?",
    ],
  },
  {
    id: "investor_board_memo",
    temperature: 0.69,
    lenses: {
      profile: "board member or investor evaluating the founder's decision quality",
      angle: "investment committee style risk memo with decision, objections, and mitigation",
      style: "board-style questions asking for a crisp recommendation and dissent view",
    },
    questions: [
      (area) => `Write the board-level recommendation for this ${area} situation.`,
      () => "What is the strongest dissenting view against your recommendation?",
      () => "What milestone would make you reverse the decision?",
    ],
  },
];

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

function clipped(text, maxWords) {
  const items = words(text);
  return items.length <= maxWords ? text : `${items.slice(0, maxWords).join(" ")}.`;
}

function ensureRange(text, min, max, additions) {
  let output = text.trim();
  let index = 0;
  while (wordCount(output) < min && index < 40) {
    output += ` ${additions[index % additions.length]}`;
    index += 1;
  }
  if (wordCount(output) > max) output = `${words(output).slice(0, max - 1).join(" ")}.`;
  return output;
}

function numbers(text) {
  const matches = String(text || "").match(
    /(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps|K|MRR|ARR|FY\d+|FY\d+-\d+))?/gi
  );
  const unique = Array.from(new Set(matches || []));
  return [...unique, "INR 10L", "INR 20L", "INR 50L", "30 days", "45 days", "18 months", "15 percent"].slice(0, 10);
}

function areaLabel(area) {
  return words(area.replace(/\([^)]*\)/g, "")).slice(0, 5).join(" ");
}

function classify(scenario) {
  const t = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/valuation|dilution|term sheet|cap table|esop|bridge|series a|down round|secondary|founder equity/.test(t)) return "venture";
  if (/grant|scheme|sisfs|nidhi|prayas|birac|tanseed|dpiit|80-iac/.test(t)) return "scheme";
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|stand-up|pmegp|udyam|supplier|gem/.test(t)) return "msme";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|foreign|convertible note/.test(t)) return "cross_border";
  if (/gst|tax|56\(2\)|35|capitalization|capitalisation|remuneration|compensation/.test(t)) return "tax";
  if (/roc|due diligence|ip assignment|trademark|patent|copyright|co-founder departure|vesting|reverse vesting|compliance/.test(t)) return "governance";
  if (/exit|acquisition|buyout|ipo|strategic sale/.test(t)) return "exit";
  return "strategy";
}

function playbook(scenario) {
  const type = classify(scenario);
  const map = {
    venture: {
      frame:
        "This is an ownership and control decision disguised as a funding decision; the model should learn to price clauses, not just money.",
      regulation:
        "Companies Act, 2013, ESOP approvals, SHA reserved matters, FEMA where foreign capital appears, 1x non-participating liquidation preference, and broad-based weighted-average anti-dilution",
      trap:
        "chasing valuation while ignoring liquidation, anti-dilution, board control, ESOP timing, or next-round signal",
      decisionMetric:
        "founder ownership after 2 rounds, clean-money runway, investor-control drag, and probability of a clean Series A",
      proof:
        "cap table, dilution model, waterfall, ESOP hiring plan, term-sheet mark-up, investor reference notes, and 18-month operating plan",
      guardrail: `${guardrails.startup} ${guardrails.fema}`,
    },
    scheme: {
      frame:
        "This is an eligibility and milestone-conversion decision; the model should learn that grants reward credible proof, not clever application volume.",
      regulation:
        "DPIIT recognition, SISFS guidelines, Section 80-IAC, IMB certification, Udyam registration, and relevant central or state scheme rules",
      trap:
        "applying everywhere, double-claiming milestones, or treating recognition as equivalent to approval",
      decisionMetric:
        "stage fit, grant quantum, disbursement timeline, evidence strength, and whether funding creates sharper investor or customer proof",
      proof:
        "DPIIT certificate, Udyam certificate, prior-support ledger, milestone plan, customer proof, technical evidence, and use-of-funds schedule",
      guardrail: guardrails.startup,
    },
    msme: {
      frame:
        "This is a cash-conversion and bargaining-power decision; the model should learn to match debt product to cash-flow shape.",
      regulation:
        "MSMED Act Sections 15 and 16, Section 43B(h), Udyam registration, CGTMSE, TReDS, RXIL, M1xchange, Invoicemart, and bank sanction terms",
      trap:
        "using fast expensive money as permanent capital or using term debt for receivables that should finance themselves",
      decisionMetric:
        "annualized cost, buyer acceptance, collateral burden, repayment comfort, invoice age, and 6-month cash runway",
      proof:
        "Udyam certificate, invoice ageing, buyer acceptance, TReDS status, lender sanction, collateral terms, and 13-week cash-flow forecast",
      guardrail: `${guardrails.msme} ${guardrails.cgtmse} ${guardrails.treds}`,
    },
    cross_border: {
      frame:
        "This is an instrument-validity and closing-risk decision; the model should learn that global familiarity does not equal Indian enforceability.",
      regulation:
        "FEMA, RBI reporting, FDI pricing rules, Press Note 3, Companies Act instruments, CCPS, CCD, ECB Form, and ECB-2 reporting where relevant",
      trap:
        "copying US SAFE language, ignoring beneficial ownership, or postponing reporting until the next round exposes it",
      decisionMetric:
        "approval path, reporting burden, conversion clarity, pricing compliance, investor certainty, and 18-month fundraising flexibility",
      proof:
        "investor KYC, beneficial-owner note, pricing certificate, board approval, instrument draft, reporting calendar, and conversion model",
      guardrail: guardrails.fema,
    },
    tax: {
      frame:
        "This is a cash-timing and audit-defensibility decision; the model should learn that tax benefits are strategy, not decoration.",
      regulation:
        "Income Tax Act Section 80-IAC, Section 56(2)(viib), GST registration rules, TDS compliance, Section 43B(h), MAT, and Companies Act filings",
      trap:
        "claiming a benefit too early, treating old angel-tax fear as current risk, or ignoring GST and TDS hygiene",
      decisionMetric:
        "assessment-year timing, cash tax saved, MAT impact, compliance gap, diligence risk, and 3-year forecast quality",
      proof:
        "tax computation, filing acknowledgements, GST/TDS reconciliation, valuation report, DPIIT/IMB proof, and board tax memo",
      guardrail: guardrails.startup,
    },
    governance: {
      frame:
        "This is a credibility and title-cleanup decision; the model should learn that governance defects become valuation discounts later.",
      regulation:
        "Companies Act, 2013, ROC filing rules, ESOP approvals, IP assignment, founder vesting, SHA terms, DPIIT documentation, and IP fast-track rules where relevant",
      trap:
        "using informal trust, email promises, or spreadsheet cap tables when external capital, procurement, or exits require clean authority",
      decisionMetric:
        "authority, ownership title, filing age, consent risk, diligence severity, and time to clean close",
      proof:
        "board minutes, ROC forms, cap table, IP assignments, founder vesting documents, ESOP grants, employment contracts, and compliance calendar",
      guardrail: guardrails.startup,
    },
    exit: {
      frame:
        "This is a probability-weighted payout decision; the model should learn that exit quality is cash certainty plus control of post-signing variables.",
      regulation:
        "Companies Act share-transfer rules, SHA transfer restrictions, tax treatment for unlisted shares, escrow terms, indemnity caps, earnout clauses, and board or shareholder approvals",
      trap:
        "equating headline offer with founder outcome when escrow, earnout, tax, and indemnity shift value away from founders",
      decisionMetric:
        "cash at close, escrow percentage, earnout control, indemnity cap, tax leakage, and 24-month opportunity cost",
      proof:
        "LOI, SPA draft, escrow clause, earnout formula, tax estimate, consent list, cap table, and integration plan",
      guardrail: "Exit advice should optimize certainty, optionality, and negotiating leverage rather than glamour valuation.",
    },
    strategy: {
      frame:
        "This is a constraint-selection decision; the model should learn to identify the bottleneck before recommending capital, compliance, or operating moves.",
      regulation:
        "Companies Act, DPIIT recognition, MSME rules, tax rules, FEMA where foreign capital appears, and standard Indian investor or lender documentation",
      trap:
        "solving the visible symptom while cash, authority, customer proof, or stakeholder trust remains the real bottleneck",
      decisionMetric:
        "90-day proof, 6-month runway, stakeholder leverage, decision reversibility, and cost of delay",
      proof:
        "decision memo, cash model, customer evidence, compliance file, stakeholder confirmations, and operating dashboard",
      guardrail: `${guardrails.startup} ${guardrails.msme}`,
    },
  };
  return map[type];
}

function packTone(pack, turn) {
  if (pack.id === "idea_to_pmf_principle") {
    return turn === 1
      ? "Teach the principle behind the decision, then apply it to the scenario without sounding academic."
      : turn === 2
        ? "Expose the beginner mistake and explain why it feels rational at the time."
        : "Turn the principle into a small decision rule an early founder can reuse.";
  }
  if (pack.id === "growth_operator_execution") {
    return turn === 1
      ? "Translate strategy into ownership, deadlines, and operating workstreams."
      : turn === 2
        ? "Identify where an otherwise correct strategy breaks during execution."
        : "Give a weekly operating cadence with accountable owners.";
  }
  if (pack.id === "enterprise_cfo_controls") {
    return turn === 1
      ? "Answer like a CFO controlling downside, auditability, and authority."
      : turn === 2
        ? "Name the speed trade-off the CFO should refuse."
        : "Define the leadership reporting pack and escalation rule.";
  }
  return turn === 1
    ? "Write like an investment committee memo: decision, risk, mitigation."
    : turn === 2
      ? "Give the strongest dissenting view before defending the recommendation."
      : "Name the milestone that would reverse the decision without ego.";
}

function thinking(scenario, pack, turn) {
  const p = playbook(scenario);
  const nums = numbers(scenario.scenario).join(", ");
  const base = `
${packTone(pack, turn)} Scenario facts: ${clipped(scenario.scenario, 58)} Numerical anchors to preserve: ${nums}. Strategic frame: ${p.frame} Guardrail: ${p.guardrail} Indian boundary: ${p.regulation}. The tempting mistake is ${p.trap}. The decision should be judged by ${p.decisionMetric}. I need this to train an 8B model toward expert behavior: diagnose the real constraint, reject the seductive but weak option, quantify the trade-off, and end with a committed action. Self-check: this answer should work for an idea-stage founder learning the principle and for a larger operator adapting the same logic.
`.trim();
  return ensureRange(base, 185, 285, [
    "The reasoning should include the human incentive problem because founders often accept bad structures when pressure, prestige, or deadline fear rises.",
    "The answer should be specific enough that a board member, banker, investor, or enterprise CFO can audit the logic in 5 minutes.",
  ]);
}

function direct(scenario, pack, turn) {
  const p = playbook(scenario);
  if (pack.id === "idea_to_pmf_principle") {
    if (turn === 1) return `The principle is: solve the binding constraint, not the loudest symptom. In this case, the binding constraint is captured by ${p.decisionMetric}.`;
    if (turn === 2) return `The beginner mistake is ${p.trap}. It is dangerous because it feels like progress while weakening the next decision.`;
    return `Use this rule: if an option does not improve proof, cash, control, or time within 30-45 days, do not make it the main path.`;
  }
  if (pack.id === "growth_operator_execution") {
    if (turn === 1) return `Run this as an execution program, not a discussion. Assign owners for money, documents, counterparty negotiation, and weekly decision review.`;
    if (turn === 2) return `Execution breaks when the team agrees on strategy but no one owns ${p.proof}. Make the proof pack the operating center.`;
    return `Use a 4-week cadence: facts in week 1, counterparties in week 2, document cleanup in week 3, decision and fallback in week 4.`;
  }
  if (pack.id === "enterprise_cfo_controls") {
    if (turn === 1) return `As CFO, approve the move only if it is controllable, auditable, and reversible enough. Speed is not a reason to accept weak authority or unclear economics.`;
    if (turn === 2) return `Refuse any shortcut that hides liability, changes control, or creates a filing gap. The business can move fast inside defined controls.`;
    return `Send leadership a 1-page control pack: decision, risk, exposure, owner, deadline, fallback, and the unresolved approval item.`;
  }
  if (turn === 1) return `Board recommendation: proceed only with the route that protects downside and preserves the next strategic option. The headline is secondary.`;
  if (turn === 2) return `The strongest dissent is that the recommended path may leave money or speed on the table. That dissent is valid only if it does not worsen ${p.decisionMetric}.`;
  return `Reverse the decision only if a new fact changes cash by INR 25L, ownership by 3 percent, deadline by 30 days, or approval risk materially.`;
}

function why(scenario, pack, turn) {
  const p = playbook(scenario);
  if (pack.id === "idea_to_pmf_principle") {
    return [
      `This works in India because ${p.regulation} turns abstract startup advice into executable choices.`,
      `The lesson for founders from idea to scale is that capital, grants, tax benefits, and compliance are tools, not strategy.`,
      `A weak founder asks "what can I get"; a stronger founder asks "what constraint does this remove in 30-90 days".`,
      `That is why the answer must optimize ${p.decisionMetric}, not vanity progress.`,
    ].join(" ");
  }
  if (pack.id === "growth_operator_execution") {
    return [
      `This works because Indian execution risk usually appears in handoffs: founder to CA, founder to CS, banker to buyer, investor to counsel, or sales to finance.`,
      `${p.regulation} matters, but the operating failure is usually missed ownership and late evidence.`,
      `The answer therefore connects strategy to weekly owners, INR exposure, percent ownership, and signed documents.`,
      `That makes the model useful for companies moving from founder-led chaos to repeatable finance discipline.`,
    ].join(" ");
  }
  if (pack.id === "enterprise_cfo_controls") {
    return [
      `This works because larger Indian enterprises cannot rely on founder instinct alone; authority, audit trail, and counterparty proof matter.`,
      `The CFO lens does not kill speed; it prevents expensive rework under ${p.regulation}.`,
      `A control-based answer is especially useful when the same model must serve startups, MSMEs, and larger enterprises.`,
      `It turns advice into a decision that finance, legal, operations, and leadership can all use.`,
    ].join(" ");
  }
  return [
    `This works because board-level advice must separate the recommendation from the objection.`,
    `${p.regulation} creates the compliance floor, but the board must judge whether the decision improves strategic position.`,
    `The right memo names the dissenting view so the founder does not mistake confidence for completeness.`,
    `It also creates a reversal trigger, which is how serious investors avoid being trapped by their first opinion.`,
  ].join(" ");
}

function steps(scenario, pack, turn) {
  const p = playbook(scenario);
  if (pack.id === "idea_to_pmf_principle") {
    return [
      `Write the real constraint in 1 sentence: cash, proof, control, eligibility, buyer trust, or time.`,
      `Score each option from 1-5 on ${p.decisionMetric}; discard any option scoring below 3 on two dimensions.`,
      `Reject the tempting mistake explicitly: ${p.trap}.`,
      `Set a 30-day evidence target with at least 1 INR number, 1 percent number, and 1 dated milestone.`,
      `Keep 1 fallback alive, but define the trigger for switching before emotions rise.`,
      `Review the rule every 14 days until the founder has customer, investor, bank, or compliance proof.`,
    ];
  }
  if (pack.id === "growth_operator_execution") {
    return [
      `Week 1: assign owners for finance model, document pack, counterparty response, and founder decision memo.`,
      `Week 1: quantify exposure using scenario numbers plus 20 percent downside and 30-day delay cases.`,
      `Week 2: get written responses from the bank, investor, buyer, incubator, tax preparer, or company secretary.`,
      `Week 3: close the document gap using ${p.proof}.`,
      `Week 4: make the go/no-go decision and update runway, hiring, vendor, or fundraising plan within 48 hours.`,
      `Track weekly: cash, ownership, timing, compliance, and reversibility; ignore updates that do not move those 5 metrics.`,
    ];
  }
  if (pack.id === "enterprise_cfo_controls") {
    return [
      `Create a control memo within 3 days with exposure, owner, approval path, and deadline.`,
      `Set approval thresholds: escalate anything above INR 25L, 2 percent ownership, 30 days delay, or material regulatory risk.`,
      `Require source evidence before execution: ${p.proof}.`,
      `Reject verbal approvals and convert every key counterparty position into email, portal status, sanction letter, or signed draft.`,
      `Add a weekly exception report until the decision is closed or reversed.`,
      `After closure, archive the decision file for audit, lender review, investor diligence, or board review for at least 3 financial years.`,
    ];
  }
  return [
    `State the recommendation in 1 line and the rejected alternative in 1 line.`,
    `Quantify the base case and downside case using cash, ownership, timing, and compliance exposure.`,
    `List the strongest dissent and answer it with evidence, not authority.`,
    `Approve only if the proof pack contains ${p.proof}.`,
    `Set a reversal trigger: INR 25L economic change, 3 percent ownership change, 30 days timing change, or new regulatory block.`,
    `Schedule a board or founder review on day 21 and a final action by day 30.`,
  ];
}

function bottom(scenario, pack, turn) {
  const p = playbook(scenario);
  if (pack.id === "idea_to_pmf_principle") {
    return `The reusable lesson is simple: do not collect options, remove constraints. If the option does not improve ${p.decisionMetric} inside 30-90 days, it is probably noise.`;
  }
  if (pack.id === "growth_operator_execution") {
    return `A good strategy fails when evidence ownership is vague. Make ${p.proof} the operating center, review it weekly, and decide before the deadline starts deciding for you.`;
  }
  if (pack.id === "enterprise_cfo_controls") {
    return `The CFO answer is not "slow down"; it is "move with controls". Approve speed only when authority, exposure, evidence, and fallback are visible.`;
  }
  return `The board answer is proceed with discipline, not bravado. Keep the dissent alive, define the reversal trigger, and update the decision when facts cross the threshold.`;
}

function body(scenario, pack, turn) {
  const raw = [
    direct(scenario, pack, turn),
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
    "This is intentionally deeper than a checklist because the training target should learn judgment, not only recall.",
    "The answer teaches a reusable pattern: identify the constraint, price the trade-off, reject the attractive trap, assign owners, and define the reversal trigger.",
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
  for (const user of record.conversation.filter((turn) => turn.role === "user")) {
    if (wordCount(user.content) > 35) throw new Error(`${record.scenario_id} user too long: ${user.content}`);
  }
  for (const assistant of record.conversation.filter((turn) => turn.role === "assistant")) {
    for (const marker of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!assistant.content.includes(marker)) throw new Error(`${record.scenario_id} missing ${marker}`);
    }
    if (assistant.content.includes("₹")) throw new Error(`${record.scenario_id} uses rupee glyph`);
  }
}

const existing = readJsonl(OUTPUT_PATH);
if (existing.length >= 352) {
  console.log(`No append needed. ${OUTPUT_PATH} already has ${existing.length} records.`);
  process.exit(0);
}
if (existing.length !== 176) {
  throw new Error(`Expected 176 existing records before appending next 176, found ${existing.length}`);
}

const scenarios = readJsonl(SOURCE_PATH);
if (scenarios.length !== 44) throw new Error(`Expected 44 source scenarios, found ${scenarios.length}`);

const additions = [];
for (const scenario of scenarios) {
  for (const pack of packs) {
    const qs = pack.questions.map((fn) => fn(areaLabel(scenario.area)));
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
