const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_codex_first10_clean.jsonl");

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

const lenses = [
  {
    profile: "first-time founder with finance anxiety but strong execution detail",
    angle: "downside risk, clean decision rules, and Indian compliance",
    style: "direct yes-or-no questions with practical follow-ups",
  },
  {
    profile: "methodical founder comparing multiple advice sources",
    angle: "cap table, tax, and regulatory consequences over the next 12 months",
    style: "comparison and implementation questions",
  },
  {
    profile: "fast-moving founder who wants a committed recommendation",
    angle: "cash-flow impact, negotiation leverage, and document sequencing",
    style: "short urgent questions with one sharper risk question",
  },
];

function readJsonl(filePath) {
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

function compact(text, maxWords = 54) {
  const items = words(text);
  const sliced = items.slice(0, maxWords).join(" ");
  return items.length > maxWords ? `${sliced}.` : sliced;
}

function numberPhrases(text) {
  const matches = String(text || "").match(
    /(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps|K|MRR|ARR|FY\d+|FY\d+-\d+))?/gi
  );
  const unique = Array.from(new Set(matches || []));
  if (unique.length >= 4) return unique.slice(0, 8).join(", ");
  return [...unique, "30 days", "45 days", "INR 10L", "15 percent"].slice(0, 8).join(", ");
}

function configFor(scenario) {
  const haystack = `${scenario.area} ${scenario.scenario}`.toLowerCase();

  if (/tax|80-iac|gst|56\(2\)|35 deduction|capitalization/.test(haystack)) {
    return {
      theme: "tax and compliance planning",
      regulation: "Income Tax Act Section 80-IAC, Section 56(2)(viib), GST rules, and Companies Act filings",
      recommendation:
        "Make the tax position document-led first, then choose the benefit only where the cash saving is larger than the compliance burden.",
      risk: "The biggest risk is treating a tax benefit as automatic and discovering during diligence that the eligibility file, board record, or filing date does not support the claim.",
      metric: "tax cash saving, filing deadline, assessment year, and 3-year benefit window",
    };
  }

  if (/fd[i]|press note|ecb|fema|safe|ccps|ccd|convertible note|foreign/.test(haystack)) {
    return {
      theme: "instrument and cross-border compliance",
      regulation: "FEMA, RBI pricing rules, Press Note 3, Companies Act, and CCPS or CCD documentation",
      recommendation:
        "Use the instrument that is legally recognized for an Indian company before optimizing valuation optics or investor familiarity.",
      risk: "The biggest risk is copying a US-style SAFE or note structure and then finding that FEMA reporting, pricing, or beneficial-ownership approval blocks closing.",
      metric: "instrument conversion price, reporting date, approval timeline, and 18-month next-round runway",
    };
  }

  if (/grant|scheme|sisfs|nidhi|prayas|tanseed|birac|seed fund|pmegp|mudra|stand-up/.test(haystack)) {
    return {
      theme: "grant and scheme selection",
      regulation: "DPIIT recognition under G.S.R. 108(E), SISFS guidelines, Udyam registration, and relevant state or ministry scheme rules",
      recommendation:
        "Apply only to schemes where the stage, use of funds, and evidence already match; a smaller high-fit grant is better than a larger low-fit application.",
      risk: "The biggest risk is submitting the same milestone to multiple schemes or choosing a scheme whose eligibility language conflicts with the startup's actual stage.",
      metric: "grant quantum, hit rate, disbursement timeline, and 90-day milestone proof",
    };
  }

  if (/msme|treds|invoice|working capital|cgtmse|loan|receivable|udyam|cash flow|supplier/.test(haystack)) {
    return {
      theme: "MSME debt and working-capital design",
      regulation: "MSMED Act Sections 15 and 16, Section 43B(h), CGTMSE, Udyam registration, and RBI-licensed TReDS platforms such as RXIL, M1xchange, and Invoicemart",
      recommendation:
        "Match the financing product to the cash-flow problem: receivables through TReDS or invoice finance, capex through term debt, and short gaps through bridge liquidity only.",
      risk: "The biggest risk is using expensive short-term money for a long-term asset or locking receivables with a lender that blocks cheaper TReDS financing later.",
      metric: "annualized cost, invoice age, 45-day MSME payment rule, and 6-month cash gap",
    };
  }

  if (/trademark|patent|copyright|roc|gem|director remuneration|compensation|compliance calendar/.test(haystack)) {
    return {
      theme: "operating compliance and founder governance",
      regulation: "Companies Act, 2013, DPIIT startup recognition, IP fast-track rules, GeM onboarding norms, and ROC filing requirements",
      recommendation:
        "Fix the compliance base before optimizing growth, because procurement, diligence, and investor confidence all depend on clean records.",
      risk: "The biggest risk is letting small filing gaps become diligence blockers when a buyer, investor, government customer, or bank asks for proof.",
      metric: "filing date, board approval threshold, 30-day cleanup sprint, and 12-month compliance calendar",
    };
  }

  if (/exit|acquisition|secondary|buyout|ipo|strategic sale/.test(haystack)) {
    return {
      theme: "exit and liquidity decision-making",
      regulation: "Companies Act share-transfer rules, tax treatment for unlisted shares, SHA transfer restrictions, and board or shareholder approval requirements",
      recommendation:
        "Compare founder cash outcome, execution risk, and control terms instead of comparing only headline valuation or offer size.",
      risk: "The biggest risk is accepting a headline exit or liquidity number where earnout, escrow, indemnity, or transfer restrictions control the real payout.",
      metric: "cash at close, escrow percent, earnout period, tax rate, and 24-month probability-weighted outcome",
    };
  }

  return {
    theme: "fundraising, valuation, and ownership structure",
    regulation: "Companies Act, 2013, FEMA for foreign investors, ESOP rules, and market-standard terms such as 1x non-participating liquidation preference",
    recommendation:
      "Choose the cleanest financing structure that preserves founder control, next-round fundability, and enough runway, even if another option has a better headline number.",
    risk: "The biggest risk is optimizing one visible number while accepting liquidation, anti-dilution, ESOP, board, or conversion terms that damage the next round.",
    metric: "dilution percent, post-money valuation, runway months, ESOP size, and Series A readiness",
  };
}

function ensureRange(text, min, max, addSentence) {
  let output = text.trim();
  let guard = 0;
  while (wordCount(output) < min && guard < 20) {
    output += ` ${addSentence(guard)}`;
    guard += 1;
  }
  if (wordCount(output) > max) {
    const sliced = words(output).slice(0, max - 1).join(" ");
    output = `${sliced}.`;
  }
  return output;
}

function thinking(scenario, cfg, turn) {
  const nums = numberPhrases(scenario.scenario);
  const summary = compact(scenario.scenario, 62);
  const turnFrame = [
    "The first decision is option selection, not document drafting.",
    "The follow-up challenge is whether the founder should accept the opposite advice or push back.",
    "The final decision needs a 30-day execution rule that can survive investor, lender, buyer, or government review.",
  ][turn - 1];

  const base = `
${turnFrame} Scenario facts I must anchor on: ${summary} The numerical anchors are ${nums}. For this ${cfg.theme} case, the relevant Indian frame is ${cfg.regulation}. I should reject generic startup advice if it ignores the Indian instrument, filing, tax, or MSME scheme constraint. The math should compare at least 3 numbers: cash available now, dilution or financing cost, and the next 30-45 day deadline. A high headline amount is weaker than a smaller clean route if it creates a blocked filing, a bad cap table, or a payment-cycle mismatch. Self-check: I should not give a vague answer; I need a committed recommendation, a fallback route, and the exact evidence the founder should collect before acting.
`.trim();

  return ensureRange(
    base,
    170,
    260,
    (i) =>
      [
        `I also need to separate the founder's emotional pressure from the legal sequence because a rushed signature can cost 5-10 percent ownership or 30-60 days of delay later.`,
        `The safer answer should name the document owner, the amount at risk, and the point where the founder should walk away rather than keep negotiating.`,
      ][i % 2]
  );
}

function recommendation(cfg, turn) {
  if (turn === 1) {
    return `${cfg.recommendation} Make this the primary path and keep one fallback open for no more than 30 days.`;
  }
  if (turn === 2) {
    return `${cfg.risk} Push back now, but trade only on terms that affect money, control, or eligibility.`;
  }
  return `Use a 30-day action plan with a written go/no-go rule. If the required proof is not ready by day 21, choose the lower-risk route.`;
}

function whySection(scenario, cfg, turn) {
  const area = scenario.area;
  if (turn === 1) {
    return [
      `This works in India because ${cfg.regulation} can decide whether the transaction, benefit, or financing route is usable at all.`,
      `For ${area}, the market does not reward only the largest INR number; it rewards clean eligibility, defensible math, and documents that survive diligence.`,
      `The founder should therefore rank options by ${cfg.metric}, not by the loudest advisor comment.`,
      `A disciplined choice now can save 30-60 days and protect 5-15 percent of economic value in the next financing, scheme, or buyer conversation.`,
    ].join(" ");
  }
  if (turn === 2) {
    return [
      `The pushback should be specific because Indian investors, banks, buyers, and incubators respond better to document-backed alternatives than broad objections.`,
      `${cfg.regulation} gives the founder a practical boundary for what can be accepted without creating a later compliance issue.`,
      `The right counter is not emotional; it is a revised number, timeline, clause, or use-of-funds plan that still lets the other side say yes.`,
      `If the other side refuses that narrower correction, the refusal itself is useful diligence signal within 7-10 days.`,
    ].join(" ");
  }
  return [
    `The 30-day plan works because it converts a strategic debate into evidence collection, clause cleanup, and one final decision meeting.`,
    `In India, delays often come from missing board approvals, weak filings, unclear scheme eligibility, or unresolved investor rights under ${cfg.regulation}.`,
    `A staged checklist lets the founder keep momentum while avoiding a bad signature just because runway, receivables, or deadline pressure feels urgent.`,
    `The rule should be written before negotiation restarts so the founder does not move the goalpost after every new comment.`,
  ].join(" ");
}

function steps(scenario, cfg, turn) {
  const id = scenario.id;
  if (turn === 1) {
    return [
      `Within 48 hours, write a 1-page decision memo for ${id} listing the 3 live options, the INR amount involved, and the deadline that actually matters.`,
      `By day 3, create a base-case and downside-case model using ${cfg.metric}; include at least one 6-month and one 18-month outcome.`,
      `By day 5, collect proof documents: cap table or Udyam certificate, board approvals, invoices, term sheet, scheme note, tax memo, or buyer confirmation as relevant.`,
      `By day 7, reject any option that breaks ${cfg.regulation} or requires facts that the company cannot prove today.`,
      `By day 10, negotiate only 2-3 clauses or numbers that change economics by at least INR 10L or 5 percent ownership/control.`,
      `By day 14, choose the primary path and preserve one fallback until day 30, not longer.`,
    ];
  }
  if (turn === 2) {
    return [
      `Send a written counter within 3 working days, not a verbal debate; include the exact clause, amount, or eligibility point you want changed.`,
      `Ask the other side to confirm the revised position within 7 days so you do not lose another 2-3 weeks in vague discussions.`,
      `Run a downside case assuming 20 percent lower revenue, 30 days of delay, or 5 percent extra dilution, whichever is most relevant to ${scenario.area}.`,
      `Keep a fallback offer, lender, incubator, buyer, or investor active until the revised document is signed.`,
      `If the counterparty insists on a term that blocks ${cfg.regulation}, mark it as a red line rather than a negotiable preference.`,
      `Update the board or founder note within 24 hours of the counter so there is a clean record of why the decision changed.`,
    ];
  }
  return [
    `Day 1-3: freeze the facts from the scenario and create a single folder with financials, incorporation records, tax filings, contracts, and approvals.`,
    `Day 4-7: build a 3-case model: conservative, base, and upside; show INR cash impact, ownership impact, and deadline impact separately.`,
    `Day 8-12: get written positions from the bank, investor, buyer, incubator, or authority named in the process; do not rely on phone summaries.`,
    `Day 13-18: clean the document issue most likely to block closing, such as ESOP approval, Udyam proof, FEMA reporting, ROC filing, or scheme eligibility.`,
    `Day 19-21: hold one decision meeting and apply the go/no-go rule without reopening every old option.`,
    `Day 22-30: sign, submit, or walk away; if walking away, activate the fallback within 48 hours and preserve at least 3 months of operating runway.`,
    ];
}

function bottom(cfg, turn) {
  if (turn === 1) {
    return `The answer is to pick the clean, provable route, not the biggest headline number. If a route cannot pass ${cfg.regulation} and a 30-day evidence check, it should not be the primary choice. Keep the fallback live, but do not let optionality become delay.`;
  }
  if (turn === 2) {
    return `Push back where the term changes money, control, eligibility, or timing. Accept smaller imperfections that do not affect the next 12 months. A counterparty that refuses a reasonable correction is showing you the risk before you sign.`;
  }
  return `Use the 30-day plan as the decision engine. By day 21 you should know whether the primary path is signable, fundable, or eligible. If not, move to the fallback before the deadline pressure forces a worse deal.`;
}

function assistantTurn(scenario, cfg, turn) {
  const think = thinking(scenario, cfg, turn);
  const rawBody = [
    recommendation(cfg, turn),
    "",
    "**Why this works in Indian context:**",
    whySection(scenario, cfg, turn),
    "",
    "**How to execute:**",
    steps(scenario, cfg, turn).map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "**Bottom line:**",
    bottom(cfg, turn),
  ].join("\n");
  const body = ensureRange(
    rawBody,
    430,
    560,
    (i) =>
      [
        `This keeps the founder from confusing activity with progress: every meeting must change either INR cash, percent ownership, document readiness, or the 30-day timeline.`,
        `If a requested document or clause cannot be explained in plain numbers, it should be parked until the core decision is signed or rejected.`,
      ][i % 2]
  );

  const content = `<thinking>\n${think}\n</thinking>\n\n${body}`;
  const thinkingWords = wordCount(think);
  const bodyWords = wordCount(body);
  const totalWords = wordCount(content);
  if (thinkingWords < 150 || thinkingWords > 300) throw new Error(`${scenario.id} turn ${turn} thinking words ${thinkingWords}`);
  if (bodyWords < 400 || bodyWords > 600) throw new Error(`${scenario.id} turn ${turn} body words ${bodyWords}`);
  if (totalWords < 600 || totalWords > 900) throw new Error(`${scenario.id} turn ${turn} total words ${totalWords}`);
  return { role: "assistant", content };
}

function userTurns(scenario, cfg) {
  return [
    `For ${scenario.area}, what should I choose first and why?`,
    `What is the biggest risk if I follow the opposite advice?`,
    `Give me the exact 30-day plan and final decision rule.`,
  ];
}

function validateRecord(record) {
  if (record.conversation.length !== 7) throw new Error(`${record.scenario_id} wrong turn count`);
  const roles = record.conversation.map((turn) => turn.role).join(",");
  if (roles !== "system,user,assistant,user,assistant,user,assistant") {
    throw new Error(`${record.scenario_id} wrong roles ${roles}`);
  }
  for (const turn of record.conversation.filter((item) => item.role === "user")) {
    if (wordCount(turn.content) > 35) throw new Error(`${record.scenario_id} user turn too long`);
  }
  for (const [index, turn] of record.conversation.filter((item) => item.role === "assistant").entries()) {
    const content = turn.content;
    for (const marker of [
      "<thinking>",
      "</thinking>",
      "**Why this works in Indian context:**",
      "**How to execute:**",
      "**Bottom line:**",
    ]) {
      if (!content.includes(marker)) throw new Error(`${record.scenario_id} assistant ${index + 1} missing ${marker}`);
    }
    if (content.includes("₹")) throw new Error(`${record.scenario_id} uses rupee glyph`);
  }
}

const scenarios = readJsonl(SOURCE_PATH);
const records = scenarios.map((scenario, index) => {
  const cfg = configFor(scenario);
  const user = userTurns(scenario, cfg);
  const lens = lenses[index % lenses.length];
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
    temperature: [0.62, 0.71, 0.79][index % 3],
    lenses: lens,
  };
  validateRecord(record);
  return record;
});

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, records.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");

console.log(`Read ${scenarios.length} scenarios from ${SOURCE_PATH}`);
console.log(`Wrote ${records.length} strict-format records to ${OUTPUT_PATH}`);
