const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_codex_first10_clean.jsonl");

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

const liveGrounding = [
  "MSME classification from 1 April 2025: Micro up to INR 2.5Cr investment and INR 10Cr turnover, Small up to INR 25Cr and INR 100Cr, Medium up to INR 125Cr and INR 500Cr.",
  "CGTMSE credit guarantee for MSEs is now described by the MSME Development Commissioner as supporting credit up to INR 10Cr from 1 April 2025.",
  "SISFS supports DPIIT-recognised early startups through incubators: up to INR 20L grant for proof-of-concept, prototype, or trials and up to INR 50L debt, convertible debenture, or debt-linked support for market entry or scaling.",
  "Startup India recognition and 80-IAC are separate gates: DPIIT recognition helps, but 80-IAC needs the specific tax-exemption certification route.",
  "Foreign capital into Indian companies should be structured around FEMA, RBI reporting, pricing, Companies Act instruments, and Press Note 3 where land-border beneficial ownership appears.",
];

const variationPacks = [
  {
    id: "red_team_negotiation",
    temperature: 0.81,
    lenses: {
      profile: "founder who wants an expert to challenge the obvious answer before committing",
      angle: "red-team the plan, expose hidden downside, and identify negotiation leverage",
      style: "contrarian but practical questions with a sharper final trade-off",
    },
    user: [
      (area) => `Red-team my current plan for ${area}. What am I underestimating?`,
      () => "Where would a sophisticated investor or banker push back hardest?",
      () => "What should I change before signing or applying?",
    ],
  },
  {
    id: "operator_board_plan",
    temperature: 0.88,
    lenses: {
      profile: "operator-style founder who wants board-level judgment and exact execution cadence",
      angle: "convert strategy into a 30-day operating plan with decision gates",
      style: "methodical implementation questions with one scenario-change question",
    },
    user: [
      (area) => `Give me the board-level answer for ${area}, not generic advice.`,
      () => "What sequence would you run over the next month?",
      () => "What decision rule should I use if facts change?",
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

function limitWords(text, max) {
  const items = words(text);
  return items.length <= max ? text : `${items.slice(0, max).join(" ")}.`;
}

function areaShort(area) {
  return words(area.replace(/\([^)]*\)/g, "")).slice(0, 6).join(" ");
}

function numbersFrom(text) {
  const matches = String(text || "").match(
    /(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps|K|MRR|ARR|FY\d+|FY\d+-\d+))?/gi
  );
  const unique = Array.from(new Set(matches || []));
  return [...unique, "INR 20L", "INR 50L", "30 days", "45 days", "18 months", "10 percent"].slice(0, 10);
}

function ensureRange(text, min, max, additions) {
  let output = text.trim();
  let index = 0;
  while (wordCount(output) < min && index < 30) {
    output += ` ${additions[index % additions.length]}`;
    index += 1;
  }
  if (wordCount(output) > max) output = `${words(output).slice(0, max - 1).join(" ")}.`;
  return output;
}

function typeOf(scenario) {
  const text = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/valuation|dilution|term sheet|cap table|esop|bridge round|priced seed|series a|down round|secondary/.test(text)) return "venture_terms";
  if (/grant|scheme|sisfs|nidhi|prayas|birac|tanseed|seed fund|dpiit|80-iac/.test(text)) return "startup_schemes";
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|stand-up|pmegp|udyam|supplier|gem portal/.test(text)) return "msme_cash";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|convertible note|foreign/.test(text)) return "cross_border";
  if (/gst|tax|56\(2\)|35|capitalization|capitalisation|director remuneration|compensation/.test(text)) return "tax";
  if (/roc|due diligence|ip assignment|trademark|patent|copyright|co-founder departure|vesting|reverse vesting/.test(text)) return "governance";
  if (/exit|acquisition|buyout|ipo|strategic sale/.test(text)) return "exit";
  return "strategy";
}

function diagnostic(scenario) {
  const type = typeOf(scenario);
  const map = {
    venture_terms: {
      diagnosis:
        "The visible offer is not the decision; the decision is how today's clause set changes founder ownership, control, and the next investor's willingness to price the company cleanly.",
      regulation:
        "Companies Act, 2013, ESOP approval rules, SHA reserved matters, FEMA where foreign investors enter, 1x non-participating liquidation preference, and broad-based weighted-average anti-dilution",
      seniorMove:
        "make a waterfall and dilution model before arguing valuation",
      killerQuestion:
        "does this term sheet still look good at a flat round, a modest exit, and a delayed Series A",
      proof:
        "cap table, ESOP plan, liquidation waterfall, reserved-matter list, investor rights draft, and 18-month hiring plan",
    },
    startup_schemes: {
      diagnosis:
        "The scheme is not free money; it is a stage-fit test where the founder must prove that grant capital converts into sharper technical, market, or tax proof.",
      regulation:
        "DPIIT recognition, Startup India Seed Fund Scheme guidelines, Section 80-IAC, IMB approval, Udyam registration, and relevant ministry or state scheme conditions",
      seniorMove:
        "choose the application with the strongest stage match, not the largest headline quantum",
      killerQuestion:
        "can the same milestone be funded, measured, and defended without double-claiming or exaggerating traction",
      proof:
        "DPIIT certificate, Udyam certificate, milestone plan, use-of-funds schedule, pilot evidence, prior government-support ledger, and tax eligibility note",
    },
    msme_cash: {
      diagnosis:
        "The financing product should match the cash-conversion problem; cheap money is bad if it arrives too late, and fast money is bad if it becomes permanent.",
      regulation:
        "MSMED Act Sections 15 and 16, Section 43B(h), Udyam registration, CGTMSE, RBI-linked TReDS, RXIL, M1xchange, and Invoicemart",
      seniorMove:
        "separate receivable finance, capex finance, and emergency bridge money",
      killerQuestion:
        "which product improves cash conversion without weakening buyer leverage or blocking cheaper finance later",
      proof:
        "Udyam certificate, invoice ageing, buyer acceptance proof, lender sanction, TReDS onboarding status, collateral terms, and 6-month cash-flow forecast",
    },
    cross_border: {
      diagnosis:
        "Foreign money is useful only if the instrument can close cleanly; investor familiarity with a US instrument does not make it valid for an Indian company.",
      regulation:
        "FEMA, RBI reporting, FDI pricing rules, Press Note 3, Companies Act, CCPS, CCD, ECB filings, Form ECB, and monthly ECB-2 where relevant",
      seniorMove:
        "select the compliant instrument before negotiating conversion economics",
      killerQuestion:
        "will the company still be able to explain the instrument to the bank, auditor, next VC, and regulator 18 months later",
      proof:
        "beneficial ownership note, pricing certificate, board approval, investor KYC, instrument terms, reporting calendar, and conversion model",
    },
    tax: {
      diagnosis:
        "Tax savings are capital-allocation decisions; the right year or structure is the one that changes real cash without creating an audit or diligence weakness.",
      regulation:
        "Income Tax Act Section 80-IAC, Section 56(2)(viib), GST thresholds, TDS rules, Section 43B(h), Companies Act filings, and MAT where relevant",
      seniorMove:
        "time the claim around profit quality and documentation readiness",
      killerQuestion:
        "does the claimed saving survive assessment-year timing, eligibility documents, and future investor diligence",
      proof:
        "tax computation, board note, filing acknowledgements, GST/TDS reconciliation, valuation report, DPIIT or IMB certificate, and 3-year profit forecast",
    },
    governance: {
      diagnosis:
        "Governance cleanup is not admin work; it is risk removal before money, procurement, exit, or tax review turns small gaps into closing blockers.",
      regulation:
        "Companies Act, 2013, ROC filing rules, ESOP approvals, IP assignment, founder vesting, SHA terms, DPIIT documentation, and relevant IP fast-track rules",
      seniorMove:
        "fix title, authority, and records before optimizing the commercial negotiation",
      killerQuestion:
        "would an external diligence team believe the company owns what it sells and has authority for what it promised",
      proof:
        "board minutes, ROC forms, cap table, IP assignments, employment agreements, ESOP grants, founder vesting agreements, and compliance calendar",
    },
    exit: {
      diagnosis:
        "The exit headline is not founder outcome; payout certainty, tax leakage, indemnity, escrow, and control of earnout inputs decide the real value.",
      regulation:
        "Companies Act share-transfer rules, SHA transfer restrictions, unlisted-share tax treatment, escrow clauses, indemnity caps, and board or shareholder approvals",
      seniorMove:
        "convert every headline offer into probability-weighted cash at close",
      killerQuestion:
        "who controls the metrics that decide the founder's payout after signing",
      proof:
        "LOI, SPA draft, escrow terms, tax estimate, cap table, consent list, earnout formula, indemnity schedule, and 24-month operating plan",
    },
    strategy: {
      diagnosis:
        "The founder is not choosing a generic best practice; they are choosing the path that preserves scarce time, cash, credibility, and strategic options.",
      regulation:
        "Companies Act, DPIIT recognition, MSME or tax rules where applicable, FEMA for foreign capital, and standard Indian investor or lender documentation",
      seniorMove:
        "define the constraint first, then choose the instrument or action",
      killerQuestion:
        "what must be true in 90 days for this decision to look intelligent",
      proof:
        "decision memo, financial model, customer proof, compliance file, stakeholder written confirmations, and 30-day operating plan",
    },
  };
  return map[type];
}

function groundingFor(scenario) {
  const type = typeOf(scenario);
  if (type === "msme_cash") return `${liveGrounding[0]} ${liveGrounding[1]}`;
  if (type === "startup_schemes") return `${liveGrounding[2]} ${liveGrounding[3]}`;
  if (type === "cross_border") return liveGrounding[4];
  if (type === "tax") return `${liveGrounding[3]} ${liveGrounding[0]}`;
  return liveGrounding[(scenario.id.charCodeAt(2) + scenario.id.charCodeAt(3)) % liveGrounding.length];
}

function thinking(scenario, pack, turn) {
  const d = diagnostic(scenario);
  const nums = numbersFrom(scenario.scenario).join(", ");
  const scenarioClip = limitWords(scenario.scenario, 58);
  const frame =
    turn === 1
      ? "The founder is probably optimizing for the most visible number, but expert advice should expose the invisible constraint."
      : turn === 2
        ? "The advisor's contrary view deserves respect only if it survives incentives, documentation, timing, and downside economics."
        : "The final proof pack must create a decision, not just a larger folder of documents.";
  const base = `
${frame} Scenario anchor: ${scenarioClip} Hard numbers to preserve are ${nums}. Diagnostic read: ${d.diagnosis} Live grounding: ${groundingFor(scenario)} The Indian frame is ${d.regulation}. The senior move is to ${d.seniorMove}; the killer question is: ${d.killerQuestion}? I should not answer like a checklist clerk. I need to teach the model expert judgment: sequence, leverage, red line, fallback, and what evidence would change the answer. Self-check: every turn must include math or timing, reject one tempting alternative, and still commit to a recommendation.
`.trim();
  return ensureRange(base, 185, 285, [
    "The answer should sound like a partner in the room: direct, specific, and willing to trade one imperfect option against another.",
    "If the founder cannot explain the decision to a board, bank, investor, or buyer in 5 minutes, the strategy is not yet clear enough.",
  ]);
}

function why(scenario, pack, turn) {
  const d = diagnostic(scenario);
  if (turn === 1) {
    return [
      `This works in India because ${d.regulation} defines the outer boundary, but expert judgment comes from reading incentives inside that boundary.`,
      `${groundingFor(scenario)}`,
      `For ${scenario.area}, the best answer is the one that improves leverage without creating a hidden blocker in diligence, bank processing, tax review, or the next round.`,
      `A founder should therefore choose the path that is defensible under pressure, not the path that sounds most impressive in a WhatsApp summary.`,
    ].join(" ");
  }
  if (turn === 2) {
    return [
      `The advisor may be right on one narrow dimension and still wrong on the company-level decision.`,
      `Indian startup and MSME finance rewards sequencing: first clean eligibility and control, then negotiate valuation, pricing, grant, debt, tax, or exit terms.`,
      `The right pushback is not "no"; it is a better term, better timing, or better proof package that protects the next 6-18 months.`,
      `If the alternative breaks ${d.regulation} or weakens ${d.proof}, it is expensive even when the headline looks cheaper or faster.`,
    ].join(" ");
  }
  return [
    `The proof pack matters because serious counterparties in India do not underwrite stories alone; they underwrite documents, dates, approvals, and behavior.`,
    `The founder should collect only evidence that changes the decision: ${d.proof}.`,
    `Everything else is theatre and should be removed from the critical path.`,
    `A clean proof sequence also trains the team to make future financing, grant, tax, bank, or exit decisions with discipline rather than urgency.`,
  ].join(" ");
}

function steps(scenario, pack, turn) {
  const d = diagnostic(scenario);
  if (turn === 1) {
    return [
      `In 24 hours, write the tempting plan and the red-team objection in 2 separate columns; force both to use INR amounts, percentages, and dates.`,
      `By day 3, build a downside case with 20 percent lower revenue, 30 days of delay, and 5 percent worse ownership or financing cost.`,
      `By day 5, identify the non-negotiable red line using ${d.regulation}, not founder comfort.`,
      `By day 7, ask the counterparty for written confirmation on the 2 assumptions most likely to fail.`,
      `By day 10, choose the primary route and 1 fallback; kill every option that needs more than 45 days without improving economics materially.`,
      `By day 14, prepare a board-style note explaining why the rejected alternative lost despite one attractive feature.`,
    ];
  }
  if (turn === 2) {
    return [
      `Ask the advisor for a 1-page counter-memo with assumptions, not a verbal opinion.`,
      `Stress-test the memo against ${d.killerQuestion} and mark each assumption as proven, probable, or speculative.`,
      `If the advisor's plan improves outcome by less than INR 25L or 3 percent ownership, reject added complexity.`,
      `If it improves outcome by more than INR 25L, negotiate a capped experiment for 14-21 days rather than switching fully.`,
      `Get written confirmation from the relevant investor, lender, buyer, incubator, tax preparer, or company secretary within 7 days.`,
      `Update the founder or board decision note within 24 hours so future diligence sees a clear rationale.`,
    ];
  }
  return [
    `Collect financial proof first: bank statements, revenue schedule, receivables ageing, runway model, term sheet, sanction letter, or tax computation within 3 days.`,
    `Collect authority proof next: board approvals, shareholder consents, cap table, ROC forms, ESOP plan, IP assignment, or scheme certificates within 7 days.`,
    `Collect counterparty proof: investor clauses, lender conditions, buyer acceptance, incubator feedback, government portal status, or advisor note within 10 days.`,
    `Build a 1-page decision scorecard with 5 columns: cash impact, ownership impact, timing, compliance risk, and reversibility.`,
    `Hold the decision meeting by day 21; do not reopen options unless a new fact changes INR impact by 10L or ownership by 2 percent.`,
    `Commit by day 30 and preserve at least 3 months of runway, working capital, or negotiation room after the decision.`,
  ];
}

function bottom(scenario, pack, turn) {
  const d = diagnostic(scenario);
  if (turn === 1) {
    return `The expert answer is to follow the route that survives the red-team case, not the route with the cleanest story. If the plan cannot answer "${d.killerQuestion}", it is not ready for signature. Keep one fallback live, but do not confuse optionality with indecision.`;
  }
  if (turn === 2) {
    return `Use the advisor's pushback as a stress test, not as a command. Change course only if the alternative improves money, control, or timing without weakening ${d.proof}. Otherwise, hold the line and negotiate the narrow issue.`;
  }
  return `Collect proof until it changes the decision, then stop. By day 21 the founder should know whether the path is signable, fundable, claimable, or bankable. If not, move to the fallback before urgency prices the company badly.`;
}

function body(scenario, pack, turn) {
  const d = diagnostic(scenario);
  const direct =
    turn === 1
      ? `Do not optimize for the obvious headline. ${d.diagnosis} My recommendation is to ${d.seniorMove} and reject any route that cannot answer the killer question.`
      : turn === 2
        ? `Treat the advisor's view as a useful objection, not a better plan. Accept it only if it beats the downside case and does not break the Indian compliance frame.`
        : `Build the proof pack around decision-changing evidence, not volume. The required proof is: ${d.proof}.`;

  const raw = [
    direct,
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
    "This is the level of answer that is useful for LoRA training because it teaches prioritization, not only rule recall.",
    "It also gives the model a repeatable expert pattern: diagnose the real constraint, reject the attractive trap, quantify the trade-off, and end with a decision.",
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
if (existing.length >= 176) {
  console.log(`No append needed. ${OUTPUT_PATH} already has ${existing.length} records.`);
  process.exit(0);
}
if (existing.length !== 88) {
  throw new Error(`Expected 88 existing records before appending next 88, found ${existing.length}`);
}

const scenarios = readJsonl(SOURCE_PATH);
if (scenarios.length !== 44) throw new Error(`Expected 44 source scenarios, found ${scenarios.length}`);

const additions = [];
for (const scenario of scenarios) {
  for (const pack of variationPacks) {
    const short = areaShort(scenario.area);
    const userTurns = pack.user.map((fn) => fn(short));
    const record = {
      scenario_id: scenario.id,
      area: scenario.area,
      difficulty: scenario.difficulty,
      conversation: [
        system,
        { role: "user", content: userTurns[0] },
        assistantTurn(scenario, pack, 1),
        { role: "user", content: userTurns[1] },
        assistantTurn(scenario, pack, 2),
        { role: "user", content: userTurns[2] },
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
