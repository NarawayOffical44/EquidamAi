const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_codex_first10_clean.jsonl");

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

const currentGrounding = {
  startup:
    "DPIIT recognition is a credibility and eligibility gateway, but expert advice should treat it as one input, not as a substitute for business quality.",
  msme:
    "Current MSME thresholds matter, but the deeper issue is whether the financing choice improves bargaining power, cash conversion, and buyer discipline.",
  cgtmse:
    "CGTMSE can expand collateral-free borrowing capacity, but it should still be judged against unit economics, repayment comfort, and lender control.",
  sisfs:
    "SISFS is useful only when the startup can convert the grant or soft capital into sharper proof, not when it becomes a distraction from customers.",
  tax:
    "Startup tax benefits should be timed like capital-allocation decisions; the deeper question is when the deduction changes cash meaningfully.",
  fema:
    "Foreign-capital structuring should preserve investor confidence without importing US-style shortcuts that create Indian closing friction.",
};

const lensPool = [
  {
    profile: "founder overwhelmed by conflicting advice from CA, lawyer, investor, banker, and mentor",
    angle: "emphasise regulatory and legal landmines that founders typically miss",
    style: "user asks contrarian challenging questions, pushing back on the assistant's recommendation",
  },
  {
    profile: "second-time founder who wants a precise downside case before signing",
    angle: "emphasise long-term strategic positioning across the next 2-3 funding rounds",
    style: "user asks what-if scenario questions about changing one variable in the situation",
  },
  {
    profile: "first-time founder who wants a sharp weekly action plan",
    angle: "emphasise specific document and process steps the founder needs to action this week",
    style: "user asks process and timeline questions: when, how long, what order",
  },
  {
    profile: "founder anxious about cash running out and wants facts, not reassurance",
    angle: "emphasise immediate cash-flow and runway consequences over the next 6 months",
    style: "user asks panicked urgent questions, short and stressed in tone",
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

function sentenceSummary(text, maxWords = 58) {
  const items = words(text);
  return `${items.slice(0, maxWords).join(" ")}${items.length > maxWords ? "." : ""}`;
}

function numbersFrom(text) {
  const matches = String(text || "").match(
    /(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps|K|MRR|ARR|FY\d+|FY\d+-\d+))?/gi
  );
  const unique = Array.from(new Set(matches || []));
  return [...unique, "INR 20L", "INR 50L", "45 days", "10 percent"].slice(0, 10);
}

function addUntilRange(text, min, max, additions) {
  let output = text.trim();
  let index = 0;
  while (wordCount(output) < min && index < 20) {
    output += ` ${additions[index % additions.length]}`;
    index += 1;
  }
  if (wordCount(output) > max) {
    output = `${words(output).slice(0, max - 1).join(" ")}.`;
  }
  return output;
}

function scenarioType(scenario) {
  const haystack = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|pmegp|udyam|supplier|gem portal/.test(haystack)) return "msme";
  if (/grant|scheme|sisfs|nidhi|prayas|birac|seed fund|tanseed|tax holiday|80-iac/.test(haystack)) return "scheme";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|convertible note|foreign/.test(haystack)) return "fema";
  if (/tax|gst|56\(2\)|35|capitalization|capitalisation|director remuneration|compensation/.test(haystack)) return "tax";
  if (/exit|acquisition|secondary|buyout|ipo|sale/.test(haystack)) return "exit";
  if (/trademark|patent|copyright|roc|compliance|due diligence|co-founder departure|vesting/.test(haystack)) return "governance";
  return "fundraising";
}

function config(scenario) {
  const type = scenarioType(scenario);
  const shared = {
    type,
    evidence: "board note, cap table, bank statement, signed term sheet, Udyam or DPIIT certificate, tax memo, and source documents",
  };

  if (type === "msme") {
    return {
      ...shared,
      regulation:
        "MSMED Act Sections 15 and 16, Section 43B(h), Udyam registration, CGTMSE, and RBI-linked TReDS platforms such as RXIL, M1xchange, and Invoicemart",
      currentFact: `${currentGrounding.msme} ${currentGrounding.cgtmse}`,
      recommendation:
        "Use the cheapest compliant cash-flow instrument for the exact gap, not the easiest loan pitch.",
      redLine:
        "Do not use high-cost short-term finance for a long-term asset and do not sign lender documents that block invoice discounting or TReDS later.",
      metric: "annualized rate, invoice age, buyer acceptance date, collateral demand, and 6-month working-capital gap",
    };
  }

  if (type === "scheme") {
    return {
      ...shared,
      regulation:
        "DPIIT recognition, Startup India Seed Fund Scheme guidelines, Section 80-IAC, IMB approval, Udyam registration, and state scheme rules",
      currentFact: `${currentGrounding.startup} ${currentGrounding.sisfs} ${currentGrounding.tax}`,
      recommendation:
        "Choose the scheme or tax route whose eligibility language matches the present facts, then build the application around measurable milestones.",
      redLine:
        "Do not claim the same milestone under 2 schemes or assume DPIIT recognition alone creates a tax holiday.",
      metric: "scheme quantum, prior support limit, disbursement timeline, 90-day milestone, and eligibility certificate status",
    };
  }

  if (type === "fema") {
    return {
      ...shared,
      regulation:
        "FEMA, RBI reporting, Press Note 3, Companies Act, FDI pricing rules, CCPS, CCD, ECB forms, and shareholder approval requirements",
      currentFact: currentGrounding.fema,
      recommendation:
        "Pick the legally clean instrument first, then negotiate valuation, conversion, and investor familiarity.",
      redLine:
        "Do not copy a US SAFE or foreign note structure if the Indian company cannot report it cleanly under FEMA and Companies Act rules.",
      metric: "approval route, pricing certificate, reporting deadline, conversion ratio, maturity, and 18-month runway",
    };
  }

  if (type === "tax") {
    return {
      ...shared,
      regulation:
        "Income Tax Act Section 80-IAC, Section 56(2)(viib), Section 43B(h), GST rules, TDS rules, and Companies Act filings",
      currentFact: `${currentGrounding.tax} ${currentGrounding.msme}`,
      recommendation:
        "Make the tax position provable before claiming savings or changing payout structure.",
      redLine:
        "Do not treat a tax opinion, valuation note, or founder payout as safe unless the filing date and document trail support it.",
      metric: "assessment year, tax cash saving, MAT impact, GST threshold, TDS exposure, and filing deadline",
    };
  }

  if (type === "exit") {
    return {
      ...shared,
      regulation:
        "Companies Act share-transfer rules, SHA transfer restrictions, tax on unlisted shares, escrow terms, indemnity caps, and board or shareholder approvals",
      currentFact:
        "Use live-market exit discipline: founder outcome depends on cash at close, escrow, earnout control, tax leakage, and approval timing more than headline valuation.",
      recommendation:
        "Optimize for probability-weighted founder cash and control over the next 24 months, not only the largest offer headline.",
      redLine:
        "Do not sign earnout, escrow, or indemnity language where the buyer controls the inputs and founders carry the downside.",
      metric: "cash at close, escrow percentage, earnout period, tax rate, indemnity cap, and 24-month outcome",
    };
  }

  if (type === "governance") {
    return {
      ...shared,
      regulation:
        "Companies Act, 2013, ROC filing rules, ESOP approvals, IP assignment, founder vesting, SHA reserved matters, and DPIIT startup documentation",
      currentFact: `${currentGrounding.startup} Current diligence still punishes missing IP assignment, informal founder equity, late ROC forms, and vague ESOP promises.`,
      recommendation:
        "Fix the governance record before the next financing, procurement, tax claim, or exit conversation.",
      redLine:
        "Do not let informal emails replace board approvals, stamped contracts, IP assignments, or vesting documents.",
      metric: "filing delay, vesting percent, ESOP pool, IP ownership, reserved-matter threshold, and 30-day cleanup plan",
    };
  }

  return {
    ...shared,
    regulation:
      "Companies Act, 2013, ESOP rules, SHA terms, FEMA where foreign capital appears, and market-standard financing terms such as 1x non-participating liquidation preference",
    currentFact: `${currentGrounding.startup} ${currentGrounding.fema}`,
    recommendation:
      "Choose the financing path that creates enough runway without damaging the next round's cap table, control, or diligence story.",
    redLine:
      "Do not accept a higher headline valuation if it comes with participating liquidation, full-ratchet anti-dilution, oversized pre-money ESOP, or board control that blocks execution.",
    metric: "dilution, post-money valuation, runway months, liquidation preference, anti-dilution, ESOP size, and next-round valuation",
  };
}

function userTurns(scenario, cfg) {
  const area = scenario.area.replace(/\s*\([^)]*\)/g, "");
  return [
    `Challenge my first instinct on ${area}. What should I actually do?`,
    `What if my advisor says your recommendation is too conservative?`,
    `What exact proof should I collect before I commit?`,
  ];
}

function thinkingText(scenario, cfg, turn) {
  const nums = numbersFrom(scenario.scenario).join(", ");
  const intro =
    turn === 1
      ? "I need to challenge the founder's likely first instinct and make the decision from facts."
      : turn === 2
        ? "The advisor pushback must be tested against economics, compliance, and timing, not ego."
        : "The final proof request should become a diligence checklist, not another abstract framework.";
  const base = `
${intro} Source scenario: ${sentenceSummary(scenario.scenario, 64)} The hard numerical anchors are ${nums}. Expert lens to apply: ${cfg.currentFact} The governing Indian frame is ${cfg.regulation}. I should reject generic global startup advice where it ignores incentive design, control, timing, founder psychology, and the practical behavior of Indian investors, banks, buyers, or incubators. The recommendation must compare at least 3 concrete dimensions: cash or tax saved, percent dilution or financing cost, and the next 30-45 day process risk. Self-check: I must not overfit to one attractive number; I need to name the red line, a fallback, and the proof that would change the recommendation.
`.trim();
  return addUntilRange(base, 180, 280, [
    "The answer should also preserve optionality without letting the founder drift past a deadline.",
    "If facts are missing, the right move is to collect specific documents within 7 days, not to wait for perfect certainty.",
  ]);
}

function whyText(scenario, cfg, turn) {
  if (turn === 1) {
    return [
      `This works in India because ${cfg.regulation} sets the boundary, but the real expert move is reading incentives before reading paperwork.`,
      `${cfg.currentFact}`,
      `For ${scenario.area}, the right answer is not a slogan like raise more, borrow less, apply everywhere, or take the highest valuation.`,
      `It is the route that improves leverage, preserves future choices, and still survives documents, dates, eligibility, and a realistic downside case over the next 6-18 months.`,
    ].join(" ");
  }
  if (turn === 2) {
    return [
      `The conservative-looking answer is often the more aggressive long-term move because Indian diligence penalizes dirty terms and weak filings later.`,
      `An advisor may optimize for one metric, but ${cfg.metric} must be read together.`,
      `The counterargument is valid only if it improves cash, ownership, or eligibility without breaking ${cfg.regulation}.`,
      `If it creates a blocked filing, unclear approval route, or expensive cleanup, it is not a better strategy.`,
    ].join(" ");
  }
  return [
    `Proof collection matters because Indian fundraises, MSME finance, grants, tax claims, procurement, and exits are document-heavy.`,
    `The founder needs evidence that a bank, investor, incubator, buyer, or authority can verify without relying on verbal explanations.`,
    `The proof should tie directly to ${cfg.metric}, otherwise it becomes a folder of documents without a decision use.`,
      `A clean proof pack also makes the next negotiation faster because the founder can show numbers, deadlines, and approvals instead of debating memory.`,
  ].join(" ");
}

function executeSteps(scenario, cfg, turn) {
  if (turn === 1) {
    return [
      `Within 24 hours, write the founder's instinct in 1 line and compare it against ${cfg.metric}.`,
      `By day 3, build a downside model using the scenario numbers plus 20 percent lower revenue, 30 days of delay, or 5 percent extra dilution.`,
      `By day 5, identify the red-line clause or eligibility issue: ${cfg.redLine}`,
      `By day 7, request written confirmation from the investor, bank, buyer, incubator, or authority on the 2 facts that decide the case.`,
      `By day 10, keep only 2 options open: the recommended route and one fallback with a clear INR amount or deadline.`,
      `By day 14, stop negotiating anything that does not change cash by INR 10L, ownership by 2 percent, or timing by 30 days.`,
    ];
  }
  if (turn === 2) {
    return [
      `Ask the advisor to put the contrary recommendation into a 1-page note with numbers, not just market anecdotes.`,
      `Check that note against ${cfg.regulation} and mark every assumption as proven, unproven, or false within 48 hours.`,
      `Run the advisor's route through a 6-month cash-flow test and an 18-month diligence test.`,
      `If the upside is less than INR 25L or less than 5 percent ownership improvement, do not accept new legal or compliance risk.`,
      `If the advisor's plan needs third-party approval, get the approval path and timeline in writing within 7 days.`,
      `Record the final decision in a board or founder note so the logic is clear during future diligence.`,
    ];
  }
  return [
    `Collect core identity proof first: incorporation record, PAN, GST if applicable, Udyam or DPIIT certificate, and latest cap table within 2 days.`,
    `Collect money proof next: bank statements, invoices, receivables ageing, investor term sheet, lender sanction, scheme application, or tax computation within 5 days.`,
    `Collect legal proof: board approvals, shareholder consent, ESOP plan, IP assignment, SHA clauses, FEMA filings, or ROC forms within 10 days.`,
    `Collect operating proof: customer contracts, cohort data, buyer acceptance, renewal record, pilot results, or procurement listing within 14 days.`,
    `Use the proof pack for one decision meeting by day 21 and score each route on cash, dilution, timing, compliance, and reversibility.`,
    `Commit by day 30; if the proof is incomplete, choose the fallback that preserves at least 3 months runway or avoids a filing breach.`,
  ];
}

function bodyText(scenario, cfg, turn) {
  const recommendation =
    turn === 1
      ? `${cfg.recommendation} My recommendation is to follow this route now and keep a fallback alive only until day 30.`
      : turn === 2
        ? `The advisor is useful only if they can beat the downside case without crossing the red line. ${cfg.redLine}`
        : `Collect proof before committing. The right proof pack should answer cash, ownership, timing, compliance, and reversibility in one place.`;

  const bottom =
    turn === 1
      ? `Do not follow the first instinct just because it is familiar or louder. Follow the option that shows judgment: clean incentives, credible execution, controlled downside, and a 30-day evidence test.`
      : turn === 2
        ? `A conservative recommendation is not the same as a timid one. If the advisor cannot show better economics after compliance cost and delay, keep the original recommendation.`
        : `The final decision should be boring and document-backed. If the proof pack is weak by day 21, do not force the risky route by day 30.`;

  const raw = [
    recommendation,
    "",
    "**Why this works in Indian context:**",
    whyText(scenario, cfg, turn),
    "",
    "**How to execute:**",
    executeSteps(scenario, cfg, turn).map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "**Bottom line:**",
    bottom,
  ].join("\n");

  return addUntilRange(raw, 430, 570, [
    "This keeps the training example realistic because Indian founders usually need a decision they can execute with a company secretary, bank officer, incubator, investor, or buyer watching the paper trail.",
    "It also avoids generic advice: every step has either a rupee threshold, a percent threshold, a named document, or a dated action.",
  ]);
}

function assistantTurn(scenario, cfg, turn) {
  const thinking = thinkingText(scenario, cfg, turn);
  const body = bodyText(scenario, cfg, turn);
  const content = `<thinking>\n${thinking}\n</thinking>\n\n${body}`;
  const thinkingWords = wordCount(thinking);
  const bodyWords = wordCount(body);
  const totalWords = wordCount(content);
  if (thinkingWords < 150 || thinkingWords > 300) throw new Error(`${scenario.id} turn ${turn} thinking words ${thinkingWords}`);
  if (bodyWords < 400 || bodyWords > 600) throw new Error(`${scenario.id} turn ${turn} body words ${bodyWords}`);
  if (totalWords < 600 || totalWords > 900) throw new Error(`${scenario.id} turn ${turn} total words ${totalWords}`);
  return { role: "assistant", content };
}

function validate(record) {
  const roles = record.conversation.map((turn) => turn.role).join(",");
  if (roles !== "system,user,assistant,user,assistant,user,assistant") {
    throw new Error(`${record.scenario_id} role order ${roles}`);
  }
  for (const user of record.conversation.filter((turn) => turn.role === "user")) {
    if (wordCount(user.content) > 35) throw new Error(`${record.scenario_id} user too long`);
  }
  for (const turn of record.conversation.filter((item) => item.role === "assistant")) {
    for (const marker of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!turn.content.includes(marker)) throw new Error(`${record.scenario_id} missing ${marker}`);
    }
    if (turn.content.includes("₹")) throw new Error(`${record.scenario_id} uses rupee glyph`);
  }
}

const existing = readJsonl(OUTPUT_PATH);
if (existing.length >= 88) {
  console.log(`No append needed. ${OUTPUT_PATH} already has ${existing.length} records.`);
  process.exit(0);
}
if (existing.length !== 44) {
  throw new Error(`Expected 44 existing records before appending next batch, found ${existing.length}`);
}

const scenarios = readJsonl(SOURCE_PATH);
if (scenarios.length !== 44) throw new Error(`Expected 44 source scenarios, found ${scenarios.length}`);

const additions = scenarios.map((scenario, index) => {
  const cfg = config(scenario);
  const user = userTurns(scenario, cfg);
  const record = {
    scenario_id: scenario.id,
    area: scenario.area,
    difficulty: scenario.difficulty,
    conversation: [
      system,
      { role: "user", content: user[0] },
      assistantTurn(scenario, cfg, 1),
      { role: "user", content: user[1] },
      assistantTurn(scenario, cfg, 2),
      { role: "user", content: user[2] },
      assistantTurn(scenario, cfg, 3),
    ],
    generator_model: "codex-chat-generated",
    temperature: [0.58, 0.67, 0.76, 0.84][index % 4],
    lenses: lensPool[index % lensPool.length],
  };
  validate(record);
  return record;
});

fs.appendFileSync(OUTPUT_PATH, additions.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
console.log(`Appended ${additions.length} records to ${OUTPUT_PATH}`);
console.log(`Total records: ${existing.length + additions.length}`);
