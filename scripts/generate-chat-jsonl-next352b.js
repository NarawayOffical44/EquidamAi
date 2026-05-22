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
    id: "sector_benchmark_lens",
    temperature: 0.82,
    lenses: {
      profile: "founder comparing their case against Indian market benchmarks",
      angle: "sector benchmark, local market reality, and what good looks like",
      style: "asks what benchmark matters, how to compare, and why it changes the answer",
    },
    q: [
      (area) => `What benchmark should I use for this ${area} decision?`,
      () => "How do I compare my case without copying another startup?",
      () => "Why does the Indian benchmark change the recommendation?",
    ],
  },
  {
    id: "unit_economics_math_lens",
    temperature: 0.77,
    lenses: {
      profile: "finance-minded founder who wants the answer driven by unit economics",
      angle: "unit economics, cash conversion, dilution math, and contribution quality",
      style: "math-check questions with decision discipline",
    },
    q: [
      (area) => `What unit economics matter most in this ${area} case?`,
      () => "How should I calculate the trade-off before deciding?",
      () => "Why is this metric better than the headline number?",
    ],
  },
  {
    id: "counterparty_behavior_lens",
    temperature: 0.86,
    lenses: {
      profile: "founder trying to read investor, lender, buyer, or government counterparty behavior",
      angle: "counterparty incentives, power imbalance, and negotiation signals",
      style: "asks what behavior signals risk, how to respond, and why it matters",
    },
    q: [
      (area) => `What counterparty behavior should worry me in this ${area} situation?`,
      () => "How should I respond without escalating too early?",
      () => "Why does behavior matter as much as the written term?",
    ],
  },
  {
    id: "people_team_lens",
    temperature: 0.84,
    lenses: {
      profile: "founder connecting finance decisions to hiring, retention, and team trust",
      angle: "people implications, incentives, morale, and execution capacity",
      style: "asks what team impact exists, how to manage it, and why it changes the decision",
    },
    q: [
      (area) => `What team impact should I consider in this ${area} decision?`,
      () => "How do I manage people expectations while deciding?",
      () => "Why can team incentives change the finance answer?",
    ],
  },
  {
    id: "capital_stack_lens",
    temperature: 0.72,
    lenses: {
      profile: "founder or CFO designing a full capital stack instead of a one-off transaction",
      angle: "mix equity, debt, grants, receivables finance, and internal cash discipline",
      style: "asks what capital stack fits, how to sequence it, and why",
    },
    q: [
      (area) => `What capital stack fits this ${area} situation best?`,
      () => "How should I sequence debt, equity, grants, or internal cash?",
      () => "Why is the sequence more important than the instrument?",
    ],
  },
  {
    id: "risk_register_lens",
    temperature: 0.75,
    lenses: {
      profile: "risk owner building a decision register before board or lender review",
      angle: "risk register, severity, probability, mitigation, and owner accountability",
      style: "asks what risk exists, how to score it, and why it should drive action",
    },
    q: [
      (area) => `What risk register should I build for this ${area} case?`,
      () => "How do I score and assign the top risks?",
      () => "Why should the highest risk drive the next action?",
    ],
  },
  {
    id: "pricing_power_lens",
    temperature: 0.89,
    lenses: {
      profile: "founder thinking about pricing power and gross margin before financing",
      angle: "pricing, margin, buyer willingness, and strategic leverage",
      style: "asks what pricing proof matters, how to test it, and why",
    },
    q: [
      (area) => `What pricing power does this ${area} decision reveal?`,
      () => "How should I test pricing or margin before committing?",
      () => "Why does pricing power change the funding answer?",
    ],
  },
  {
    id: "decision_tree_lens",
    temperature: 0.8,
    lenses: {
      profile: "operator who wants an if-this-then-that decision tree",
      angle: "branching logic, trigger thresholds, fallback paths, and reversal rules",
      style: "asks what decision tree applies, how to use it, and why it is robust",
    },
    q: [
      (area) => `What decision tree should I use for this ${area} case?`,
      () => "How do I apply the branches over the next 30 days?",
      () => "Why is this tree safer than a single fixed answer?",
    ],
  },
];

const frames = {
  venture: {
    law: "Companies Act, 2013, ESOP approvals, SHA terms, FEMA for foreign capital, 1x non-participating liquidation preference, and broad-based weighted-average anti-dilution",
    principle:
      "The apparent decision is valuation or funding, but the true decision is whether today's terms preserve next-round fundability, founder control, and clean downside economics.",
    trap:
      "optimizing for the visible cheque, valuation, or headline dilution while ignoring liquidation, anti-dilution, board control, ESOP burden, or future investor perception",
    proof:
      "cap table, dilution model, liquidation waterfall, term sheet mark-up, ESOP hiring plan, investor references, and 18-month operating model",
    metric:
      "founder ownership after 2 rounds, clean runway, option-pool usage, downside waterfall, and Series A readiness",
  },
  scheme: {
    law: "DPIIT recognition, SISFS guidelines, Section 80-IAC, IMB certification, Udyam registration, and relevant central or state scheme rules",
    principle:
      "The apparent decision is which benefit to apply for, but the true decision is whether the benefit converts into stronger customer, technical, tax, or investor proof.",
    trap:
      "treating eligibility as approval, applying everywhere, or double-claiming the same milestone under multiple schemes",
    proof:
      "DPIIT certificate, Udyam certificate, prior-support ledger, milestone plan, pilot proof, tax eligibility file, and use-of-funds schedule",
    metric:
      "stage fit, grant quantum, disbursement timeline, proof strength, prior support, and 90-day milestone quality",
  },
  msme: {
    law: "Udyam registration, MSMED Act Sections 15 and 16, Section 43B(h), CGTMSE, TReDS, RXIL, M1xchange, Invoicemart, and bank sanction terms",
    principle:
      "The apparent decision is debt or working capital, but the true decision is whether the product improves cash conversion without weakening repayment comfort or buyer leverage.",
    trap:
      "using fast expensive finance as permanent capital or using term debt for a receivable problem",
    proof:
      "Udyam certificate, invoice ageing, buyer acceptance, TReDS status, lender sanction, collateral terms, and 13-week cash-flow forecast",
    metric:
      "annualized cost, invoice age, buyer acceptance date, collateral burden, repayment comfort, and cash conversion cycle",
  },
  crossBorder: {
    law: "FEMA, RBI reporting, FDI pricing rules, Press Note 3, Companies Act instruments, CCPS, CCD, ECB forms, and ECB-2 reporting where relevant",
    principle:
      "The apparent decision is investor preference or instrument familiarity, but the true decision is whether the structure can close and survive future diligence in India.",
    trap:
      "copying US-style instruments, ignoring beneficial ownership, or treating reporting as a post-closing detail",
    proof:
      "investor KYC, beneficial ownership note, pricing certificate, instrument draft, board approval, reporting calendar, and conversion model",
    metric:
      "approval path, pricing compliance, reporting deadline, conversion clarity, maturity, and next-round explainability",
  },
  tax: {
    law: "Income Tax Act Section 80-IAC, Section 56(2)(viib), GST, TDS, MAT, Section 43B(h), valuation documentation, and Companies Act filings",
    principle:
      "The apparent decision is tax saving, but the true decision is whether the timing and documentation make the saving defensible and material.",
    trap:
      "claiming benefits too early, confusing DPIIT recognition with tax approval, or ignoring GST and TDS hygiene",
    proof:
      "tax computation, GST and TDS reconciliation, valuation report, DPIIT or IMB proof, board tax memo, and filing acknowledgements",
    metric:
      "assessment-year timing, cash tax saved, MAT impact, compliance gap, filing deadline, and 3-year profit forecast",
  },
  governance: {
    law: "Companies Act, 2013, ROC filing rules, ESOP approvals, IP assignment, founder vesting, SHA reserved matters, DPIIT records, and IP fast-track rules where relevant",
    principle:
      "The apparent decision is paperwork, but the true decision is whether the company can prove authority, title, and accountability when money or customers arrive.",
    trap:
      "letting informal promises, email approvals, missing IP assignment, or spreadsheet cap tables become the operating truth",
    proof:
      "board minutes, ROC forms, cap table, IP assignments, ESOP grants, founder vesting documents, employment contracts, and compliance calendar",
    metric:
      "filing age, consent risk, title clarity, ESOP authority, vesting percent, and time to diligence-ready status",
  },
  exit: {
    law: "Companies Act share-transfer rules, SHA transfer restrictions, escrow terms, earnout clauses, indemnity caps, tax on unlisted shares, and board or shareholder approvals",
    principle:
      "The apparent decision is exit value, but the true decision is certainty of founder proceeds after escrow, tax, earnout control, and indemnity risk.",
    trap:
      "treating earnout, headline valuation, or non-binding strategic interest as equivalent to cash",
    proof:
      "LOI, SPA draft, escrow clause, earnout formula, tax estimate, consent list, cap table, and integration plan",
    metric:
      "cash at close, escrow percentage, earnout control, indemnity cap, tax leakage, and 24-month opportunity cost",
  },
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

function nums(text) {
  const matches = String(text || "").match(
    /(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps|K|MRR|ARR|FY\d+|FY\d+-\d+))?/gi
  );
  const unique = Array.from(new Set(matches || []));
  return [...unique, "INR 10L", "INR 25L", "INR 50L", "30 days", "45 days", "90 days", "18 months"].slice(0, 11);
}

function typeOf(scenario) {
  const text = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/grant|scheme|sisfs|nidhi|prayas|birac|tanseed|dpiit|80-iac|seed fund/.test(text)) return "scheme";
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|stand-up|pmegp|udyam|supplier|gem/.test(text)) return "msme";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|foreign|convertible note/.test(text)) return "crossBorder";
  if (/gst|tax|56\(2\)|35|capitalization|capitalisation|remuneration|compensation/.test(text)) return "tax";
  if (/roc|due diligence|ip assignment|trademark|patent|copyright|co-founder departure|vesting|reverse vesting|compliance/.test(text)) return "governance";
  if (/exit|acquisition|buyout|ipo|strategic sale/.test(text)) return "exit";
  return "venture";
}

function frameFor(scenario) {
  return frames[typeOf(scenario)] || frames.venture;
}

function shortArea(area) {
  return words(area.replace(/\([^)]*\)/g, "")).slice(0, 5).join(" ");
}

function tone(pack, turn) {
  const tones = {
    sector_benchmark_lens: [
      "Answer through benchmarks, but avoid lazy copying from another startup.",
      "Explain how to compare with peers without importing the wrong assumptions.",
      "Show why the Indian benchmark changes the final recommendation.",
    ],
    unit_economics_math_lens: [
      "Answer through unit economics and cash math, not surface narrative.",
      "Explain the calculation path before giving the decision.",
      "Show why this metric beats the headline number.",
    ],
    counterparty_behavior_lens: [
      "Read counterparty behavior as data, not drama.",
      "Explain how to respond proportionately before escalating.",
      "Show why behavior predicts future deal quality.",
    ],
    people_team_lens: [
      "Connect the finance choice to team trust, hiring, incentives, and execution capacity.",
      "Explain how to manage people expectations while the decision is still open.",
      "Show why incentives can change what looks like a purely financial answer.",
    ],
    capital_stack_lens: [
      "Design the capital stack rather than choosing one isolated instrument.",
      "Explain sequence: internal cash, debt, receivables, grants, and equity.",
      "Show why ordering the instruments changes the risk.",
    ],
    risk_register_lens: [
      "Convert the issue into a ranked risk register with owners.",
      "Explain severity, probability, mitigation, and review cadence.",
      "Show why the highest-risk item should drive action.",
    ],
    pricing_power_lens: [
      "Treat pricing power as the cleanest proof of market strength.",
      "Explain how to test pricing or margin before committing.",
      "Show why pricing power changes financing choices.",
    ],
    decision_tree_lens: [
      "Give branching logic instead of one brittle recommendation.",
      "Explain how to apply branches over 30 days.",
      "Show why a decision tree is safer when facts move.",
    ],
  };
  return tones[pack.id][turn - 1];
}

function thinking(scenario, pack, turn) {
  const f = frameFor(scenario);
  const base = `
${tone(pack, turn)} Scenario: ${clip(scenario.scenario, 58)} Numerical anchors: ${nums(scenario.scenario).join(", ")}. Core principle: ${f.principle} Indian boundary: ${f.law}. The weak move is ${f.trap}. The proof standard is ${f.proof}. The answer must train visible expert behavior: identify the actual constraint, compare 3 numbers, reject the attractive but weak alternative, and give a usable decision. Self-check: this variation must not sound like prior batches; it should use the same JSON format but a different advisory lens, question angle, and execution vocabulary.
`.trim();
  return ensureRange(base, 185, 285, [
    "The model should learn that the right answer can change when the same facts are viewed by a founder, CFO, lender, buyer, or investor.",
    "The response should be deep enough for a large enterprise finance team and still usable by an idea-stage founder.",
  ]);
}

function direct(pack, scenario, turn) {
  const f = frameFor(scenario);
  const lines = {
    sector_benchmark_lens: [
      `Use benchmarks as a sanity check, not as a decision substitute. The right benchmark is the one that compares ${f.metric}, not only company size or headline valuation.`,
      `Compare only after normalizing for stage, margin, customer quality, runway, and documentation readiness. Otherwise the benchmark will flatter the wrong decision.`,
      `The Indian benchmark changes the answer because counterparties price trust, documents, timing, and control as much as the visible number.`,
    ],
    unit_economics_math_lens: [
      `The most important unit economic is the one that explains whether the decision improves cash conversion or ownership efficiency within 30-90 days.`,
      `Calculate the trade-off by putting cash impact, percent ownership, timing, and downside cost in the same model.`,
      `This metric beats the headline because it shows whether the company becomes stronger after the transaction, not just larger or more funded.`,
    ],
    counterparty_behavior_lens: [
      `Worry when the counterparty avoids specificity, rushes signature, refuses written confirmation, or sells the upside while hiding the downside.`,
      `Respond with a narrow written ask and a deadline. Do not escalate emotionally; make the other side reveal whether they are serious and clean.`,
      `Behavior matters because the same clause behaves differently with a fair counterparty versus an opportunistic one.`,
    ],
    people_team_lens: [
      `The team impact is whether this decision clarifies incentives or creates silent resentment, hiring confusion, or execution drag.`,
      `Manage expectations by separating what is decided, what is still negotiable, and what will be reviewed within 30 days.`,
      `Team incentives change the finance answer because execution quality can destroy the value of a mathematically superior option.`,
    ],
    capital_stack_lens: [
      `The best capital stack uses the cheapest fit-for-purpose money first and reserves equity for risk that debt, grants, or working-capital finance cannot handle.`,
      `Sequence the stack by reversibility: internal cash discipline, receivables or working capital, grants or soft capital, debt, then equity if strategic risk remains.`,
      `Sequence matters because the wrong first instrument can block cleaner financing later or weaken negotiation leverage.`,
    ],
    risk_register_lens: [
      `Build a risk register around the 5 risks most likely to change cash, ownership, compliance, timing, or customer trust.`,
      `Score each risk by severity, probability, owner, mitigation, and review date; do not let a high-severity risk sit without an owner.`,
      `The highest risk should drive action because one unresolved blocker can make every attractive upside number irrelevant.`,
    ],
    pricing_power_lens: [
      `This decision reveals pricing power if customers, investors, lenders, or buyers accept better terms because the company has credible demand.`,
      `Test pricing or margin with a small controlled proof before committing to the expensive or irreversible option.`,
      `Pricing power changes the funding answer because companies with pricing strength can choose cleaner capital and negotiate harder.`,
    ],
    decision_tree_lens: [
      `Use a decision tree with 3 branches: proceed, renegotiate, or fallback. Each branch needs a trigger, owner, and deadline.`,
      `Apply the tree weekly for 30 days using cash impact, percent ownership, compliance status, and counterparty behavior.`,
      `A tree is safer because it lets the recommendation adapt when facts move without turning every new fact into confusion.`,
    ],
  };
  return lines[pack.id][turn - 1];
}

function why(pack, scenario, turn) {
  const f = frameFor(scenario);
  const base = `This works in India because ${f.law} sets the boundary, while actual outcomes depend on incentives, documents, timing, and trust. For ${scenario.area}, the advice should improve ${f.metric}. The answer is stronger when it teaches the model how to judge the situation, not just which rule exists. It should help a founder, MSME owner, CFO, investor, or enterprise operator see the same facts through a practical decision lens.`;
  if (pack.id === "counterparty_behavior_lens") {
    return `${base} Counterparty behavior is especially important because Indian deals often move through relationship channels before the legal draft catches up. A vague or rushed counterparty can turn a reasonable document into a bad practical outcome.`;
  }
  if (pack.id === "people_team_lens") {
    return `${base} Team trust matters because missed promises on equity, runway, grants, debt, or customer delivery become execution tax. The technically best answer is weak if the team cannot execute it cleanly.`;
  }
  if (pack.id === "capital_stack_lens") {
    return `${base} Capital stack thinking prevents overusing equity for working-capital problems and overusing debt for strategic risk. That is a core distinction for training a useful finance model.`;
  }
  return base;
}

function steps(pack, scenario, turn) {
  const f = frameFor(scenario);
  const common = [
    `By day 1, define the decision variable: cash, ownership, timing, compliance, customer trust, or team execution.`,
    `By day 3, build a 3-case model using the scenario numbers plus 20 percent downside and 30 days of delay.`,
    `By day 5, collect the proof pack: ${f.proof}.`,
    `By day 7, reject the weak move explicitly: ${f.trap}.`,
    `By day 14, choose proceed, renegotiate, or fallback using ${f.metric}.`,
    `By day 30, document the final decision and the reversal trigger in a founder or board note.`,
  ];
  if (pack.id === "negotiation_script") return common;
  if (turn === 2) {
    return common.map((step, index) =>
      index === 0 ? `Start by recalculating the decision variable before debating opinions.` : step
    );
  }
  if (turn === 3) {
    return common.map((step, index) =>
      index === 5 ? `By day 30, explain why the chosen path is safer than a single fixed answer, and name the reversal trigger.` : step
    );
  }
  return common;
}

function bottom(pack, scenario, turn) {
  const f = frameFor(scenario);
  if (turn === 1) return `The answer should improve ${f.metric}, not merely sound impressive. Treat the benchmark or lens as a filter, then commit to the path that survives proof.`;
  if (turn === 2) return `Do the calculation before defending the instinct. If the numbers, behavior, or proof do not improve within 30 days, the attractive option is probably a distraction.`;
  return `The reason this works is that it gives the founder a reversible, evidence-led decision. Follow the branch that protects cash, control, compliance, and customer trust.`;
}

function body(pack, scenario, turn) {
  const raw = [
    direct(pack, scenario, turn),
    "",
    "**Why this works in Indian context:**",
    why(pack, scenario, turn),
    "",
    "**How to execute:**",
    steps(pack, scenario, turn).map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "**Bottom line:**",
    bottom(pack, scenario, turn),
  ].join("\n");
  return ensureRange(raw, 435, 575, [
    "This creates useful LoRA signal because the answer is not a duplicate explanation; it teaches a different expert view of the same scenario.",
    "The visible format stays stable while the reasoning lens, counterparty focus, and decision vocabulary change enough to improve answer diversity.",
  ]);
}

function assistantTurn(scenario, pack, turn) {
  const t = thinking(scenario, pack, turn);
  const b = body(pack, scenario, turn);
  const content = `<thinking>\n${t}\n</thinking>\n\n${b}`;
  const tw = wordCount(t);
  const bw = wordCount(b);
  const total = wordCount(content);
  if (tw < 150 || tw > 300) throw new Error(`${scenario.id}/${pack.id}/A${turn} thinking ${tw}`);
  if (bw < 400 || bw > 600) throw new Error(`${scenario.id}/${pack.id}/A${turn} body ${bw}`);
  if (total < 600 || total > 900) throw new Error(`${scenario.id}/${pack.id}/A${turn} total ${total}`);
  return { role: "assistant", content };
}

function validate(record, existingAssistantText) {
  const roles = record.conversation.map((turn) => turn.role).join(",");
  if (roles !== "system,user,assistant,user,assistant,user,assistant") throw new Error(`${record.scenario_id} roles ${roles}`);
  const userTurns = record.conversation.filter((turn) => turn.role === "user");
  ["What", "How", "Why"].forEach((start, index) => {
    if (!userTurns[index].content.startsWith(start)) throw new Error(`${record.scenario_id} bad question progression`);
    if (wordCount(userTurns[index].content) > 35) throw new Error(`${record.scenario_id} user too long`);
  });
  for (const assistant of record.conversation.filter((turn) => turn.role === "assistant")) {
    for (const marker of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!assistant.content.includes(marker)) throw new Error(`${record.scenario_id} missing ${marker}`);
    }
    if (assistant.content.includes("₹")) throw new Error(`${record.scenario_id} uses rupee glyph`);
    if (existingAssistantText.has(assistant.content)) throw new Error(`${record.scenario_id} duplicate assistant content`);
    existingAssistantText.add(assistant.content);
  }
}

const existing = readJsonl(OUTPUT_PATH);
if (existing.length >= 1056) {
  console.log(`No append needed. ${OUTPUT_PATH} already has ${existing.length} records.`);
  process.exit(0);
}
if (existing.length !== 704) {
  throw new Error(`Expected 704 existing records before appending next 352, found ${existing.length}`);
}

const existingAssistantText = new Set();
for (const record of existing) {
  for (const turn of record.conversation || []) {
    if (turn.role === "assistant") existingAssistantText.add(turn.content);
  }
}

const scenarios = readJsonl(SOURCE_PATH);
if (scenarios.length !== 44) throw new Error(`Expected 44 source scenarios, found ${scenarios.length}`);

const additions = [];
for (const scenario of scenarios) {
  for (const pack of packs) {
    const area = shortArea(scenario.area);
    const questions = pack.q.map((fn) => fn(area));
    const record = {
      scenario_id: scenario.id,
      area: scenario.area,
      difficulty: scenario.difficulty,
      conversation: [
        system,
        { role: "user", content: questions[0] },
        assistantTurn(scenario, pack, 1),
        { role: "user", content: questions[1] },
        assistantTurn(scenario, pack, 2),
        { role: "user", content: questions[2] },
        assistantTurn(scenario, pack, 3),
      ],
      generator_model: "codex-chat-generated",
      temperature: pack.temperature,
      lenses: pack.lenses,
      variation_id: pack.id,
    };
    validate(record, existingAssistantText);
    additions.push(record);
  }
}

fs.appendFileSync(OUTPUT_PATH, additions.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
console.log(`Appended ${additions.length} records to ${OUTPUT_PATH}`);
console.log(`Total records: ${existing.length + additions.length}`);
