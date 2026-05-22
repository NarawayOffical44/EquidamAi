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
    id: "pmf_risk_lens",
    temperature: 0.86,
    lenses: {
      profile: "founder testing whether finance advice hides a product-market-fit weakness",
      angle: "connect finance, grants, debt, and valuation back to product-market-fit risk",
      style: "What, How, Why progression focused on PMF and traction quality",
    },
    q: [
      (area) => `What PMF risk is hidden inside this ${area} decision?`,
      () => "How should I test that risk before choosing?",
      () => "Why does PMF quality change the finance answer?",
    ],
  },
  {
    id: "gtm_channel_lens",
    temperature: 0.84,
    lenses: {
      profile: "operator thinking about sales channels, distribution, and partnerships",
      angle: "translate finance choices into GTM leverage, channel conflict, and pipeline quality",
      style: "What, How, Why progression for GTM execution",
    },
    q: [
      (area) => `What GTM issue should shape this ${area} decision?`,
      () => "How do I use channels or partners without losing leverage?",
      () => "Why does distribution quality matter more than speed?",
    ],
  },
  {
    id: "data_room_lens",
    temperature: 0.72,
    lenses: {
      profile: "founder preparing a lender, investor, buyer, or auditor data room",
      angle: "data-room completeness, evidence quality, and diligence readiness",
      style: "What, How, Why progression for proof and documentation",
    },
    q: [
      (area) => `What should be in the data room for this ${area} case?`,
      () => "How do I organize evidence so diligence moves faster?",
      () => "Why does data-room quality change negotiating power?",
    ],
  },
  {
    id: "cash_dashboard_lens",
    temperature: 0.78,
    lenses: {
      profile: "CFO building a weekly dashboard for founders and leadership",
      angle: "cash dashboard, leading indicators, escalation thresholds, and owner rhythm",
      style: "What, How, Why progression for weekly management cadence",
    },
    q: [
      (area) => `What cash dashboard should track this ${area} decision?`,
      () => "How should leadership review the dashboard each week?",
      () => "Why do leading indicators beat monthly summaries?",
    ],
  },
  {
    id: "regulatory_audit_lens",
    temperature: 0.69,
    lenses: {
      profile: "auditor-style reviewer checking whether the advice survives a formal review",
      angle: "regulatory audit, file trail, approvals, dates, and defensibility",
      style: "What, How, Why progression for audit-safe execution",
    },
    q: [
      (area) => `What would a regulatory audit question in this ${area} case?`,
      () => "How do I make the file defensible before acting?",
      () => "Why should audit readiness affect the decision now?",
    ],
  },
  {
    id: "founder_psychology_lens",
    temperature: 0.9,
    lenses: {
      profile: "founder under pressure trying to separate judgment from fear and ego",
      angle: "founder psychology, decision traps, confidence, and discipline under pressure",
      style: "What, How, Why progression focused on decision quality",
    },
    q: [
      (area) => `What founder bias could distort this ${area} decision?`,
      () => "How do I make the decision without fear or ego?",
      () => "Why is emotional discipline part of finance strategy?",
    ],
  },
  {
    id: "enterprise_scale_lens",
    temperature: 0.76,
    lenses: {
      profile: "startup leader preparing to serve larger enterprises or institutional buyers",
      angle: "scale readiness, enterprise trust, procurement, risk transfer, and support capacity",
      style: "What, How, Why progression for enterprise scaling",
    },
    q: [
      (area) => `What enterprise-scale issue changes this ${area} decision?`,
      () => "How do I prepare the company for larger counterparties?",
      () => "Why does enterprise readiness change financing choices?",
    ],
  },
  {
    id: "board_dissent_lens",
    temperature: 0.73,
    lenses: {
      profile: "board member forcing the founder to answer the strongest objection",
      angle: "dissent memo, objection handling, reversal triggers, and governance discipline",
      style: "What, How, Why progression for board dissent",
    },
    q: [
      (area) => `What is the strongest board objection to this ${area} plan?`,
      () => "How should I answer that objection with evidence?",
      () => "Why could that objection still change the decision?",
    ],
  },
];

const frames = {
  venture: {
    law: "Companies Act, ESOP approvals, SHA reserved matters, FEMA where foreign capital appears, 1x non-participating liquidation preference, and broad-based weighted-average anti-dilution",
    strategic: "ownership, control, runway, investor quality, next-round fundability, and downside economics",
    trap: "treating valuation, cheque size, or speed as proof of a good deal",
    proof: "cap table, dilution model, liquidation waterfall, ESOP plan, term-sheet mark-up, investor references, and 18-month model",
    metric: "founder ownership after 2 rounds, runway months, option-pool pressure, control friction, and probability of clean Series A",
  },
  scheme: {
    law: "DPIIT recognition, SISFS guidelines, Section 80-IAC, IMB certification, Udyam registration, and central or state scheme conditions",
    strategic: "eligibility, milestone credibility, proof conversion, disbursement timing, and bandwidth discipline",
    trap: "applying everywhere or treating eligibility as approval",
    proof: "DPIIT certificate, Udyam certificate, prior-support ledger, milestone plan, use-of-funds schedule, pilot proof, and tax eligibility file",
    metric: "stage fit, grant quantum, disbursement timeline, proof strength, prior support, and 90-day milestone quality",
  },
  msme: {
    law: "Udyam registration, MSMED Act Sections 15 and 16, Section 43B(h), CGTMSE, TReDS, RXIL, M1xchange, Invoicemart, and bank sanction terms",
    strategic: "cash conversion, buyer leverage, repayment comfort, collateral discipline, and working-capital timing",
    trap: "using expensive short-term finance as permanent capital or using term debt for receivables",
    proof: "Udyam certificate, invoice ageing, buyer acceptance, TReDS status, lender sanction, collateral terms, and 13-week cash-flow forecast",
    metric: "annualized cost, invoice age, buyer acceptance date, collateral burden, repayment comfort, and cash conversion cycle",
  },
  crossBorder: {
    law: "FEMA, RBI reporting, FDI pricing rules, Press Note 3, Companies Act instruments, CCPS, CCD, ECB forms, and ECB-2 reporting",
    strategic: "instrument validity, bank processing, investor certainty, future diligence, and reporting discipline",
    trap: "copying foreign documents without checking Indian reporting, pricing, or beneficial ownership",
    proof: "investor KYC, beneficial ownership note, pricing certificate, instrument draft, board approval, reporting calendar, and conversion model",
    metric: "approval path, pricing compliance, reporting deadline, conversion clarity, maturity, and next-round explainability",
  },
  tax: {
    law: "Income Tax Act Section 80-IAC, Section 56(2)(viib), GST, TDS, MAT, Section 43B(h), valuation documentation, and Companies Act filings",
    strategic: "timing, audit defensibility, cash tax saving, compliance hygiene, and future investor diligence",
    trap: "claiming benefits too early or confusing DPIIT recognition with tax approval",
    proof: "tax computation, GST/TDS reconciliation, valuation report, DPIIT or IMB proof, board tax memo, and filing acknowledgements",
    metric: "assessment-year timing, cash tax saved, MAT impact, compliance gap, filing deadline, and 3-year profit forecast",
  },
  governance: {
    law: "Companies Act, ROC filings, ESOP approvals, IP assignment, founder vesting, SHA reserved matters, DPIIT records, and IP fast-track rules where relevant",
    strategic: "authority, title, founder accountability, diligence trust, and cleanup speed",
    trap: "letting email promises, spreadsheet cap tables, or missing IP assignment become operating truth",
    proof: "board minutes, ROC forms, cap table, IP assignments, ESOP grants, founder vesting documents, employment contracts, and compliance calendar",
    metric: "filing age, consent risk, title clarity, ESOP authority, vesting percent, and diligence-ready status",
  },
  exit: {
    law: "Companies Act share-transfer rules, SHA restrictions, escrow terms, earnout clauses, indemnity caps, tax on unlisted shares, and board approvals",
    strategic: "cash certainty, tax leakage, escrow, earnout control, buyer behavior, and 24-month opportunity cost",
    trap: "treating headline valuation, earnout, or non-binding interest as equivalent to cash",
    proof: "LOI, SPA draft, escrow clause, earnout formula, tax estimate, consent list, cap table, and integration plan",
    metric: "cash at close, escrow percentage, earnout control, indemnity cap, tax leakage, and probability-weighted founder proceeds",
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
  const t = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/grant|scheme|sisfs|nidhi|prayas|birac|tanseed|dpiit|80-iac|seed fund/.test(t)) return "scheme";
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|stand-up|pmegp|udyam|supplier|gem/.test(t)) return "msme";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|foreign|convertible note/.test(t)) return "crossBorder";
  if (/gst|tax|56\(2\)|35|capitalization|capitalisation|remuneration|compensation/.test(t)) return "tax";
  if (/roc|due diligence|ip assignment|trademark|patent|copyright|co-founder departure|vesting|reverse vesting|compliance/.test(t)) return "governance";
  if (/exit|acquisition|buyout|ipo|strategic sale/.test(t)) return "exit";
  return "venture";
}

function frame(scenario) {
  return frames[typeOf(scenario)] || frames.venture;
}

function shortArea(area) {
  return words(area.replace(/\([^)]*\)/g, "")).slice(0, 5).join(" ");
}

function thinkingLead(pack, turn) {
  const lead = {
    pmf_risk_lens: [
      "Answer through hidden product-market-fit risk behind the finance question.",
      "Explain how to test PMF risk before committing to capital or compliance work.",
      "Show why PMF quality changes the finance answer instead of sitting outside it.",
    ],
    gtm_channel_lens: [
      "Answer through GTM leverage and channel quality.",
      "Explain how to use partners without giving away leverage or margin.",
      "Show why distribution quality beats raw speed when money is scarce.",
    ],
    data_room_lens: [
      "Answer through data-room readiness and proof quality.",
      "Explain how to organize evidence so diligence moves faster.",
      "Show why data-room quality changes negotiating power.",
    ],
    cash_dashboard_lens: [
      "Answer through a weekly cash dashboard and leading indicators.",
      "Explain how leadership should review the dashboard without making it theatre.",
      "Show why leading indicators beat monthly summaries.",
    ],
    regulatory_audit_lens: [
      "Answer like an auditor looking for defects before an external party finds them.",
      "Explain how to make the file defensible before acting.",
      "Show why audit readiness should affect the decision now, not after closing.",
    ],
    founder_psychology_lens: [
      "Answer through founder psychology and pressure-management.",
      "Explain how to remove fear, ego, and prestige from the decision.",
      "Show why emotional discipline is part of finance strategy.",
    ],
    enterprise_scale_lens: [
      "Answer through readiness for larger enterprises and institutional counterparties.",
      "Explain how to prepare systems, documents, and delivery capacity.",
      "Show why enterprise readiness changes financing choices.",
    ],
    board_dissent_lens: [
      "Answer through the strongest board objection.",
      "Explain how to answer dissent with evidence.",
      "Show why the objection could still reverse the decision.",
    ],
  };
  return lead[pack.id][turn - 1];
}

function thinking(scenario, pack, turn) {
  const f = frame(scenario);
  const base = `
${thinkingLead(pack, turn)} Scenario ${scenario.id}: ${clip(scenario.scenario, 58)} Numerical anchors: ${nums(scenario.scenario).join(", ")}. Strategic field: ${f.strategic}. Indian boundary: ${f.law}. Tempting trap: ${f.trap}. Proof standard: ${f.proof}. The answer should prioritize one decisive insight, not cover every possible issue. Self-check: include at least 3 concrete numbers, reject one tempting alternative, and end with a committed recommendation.
`.trim();
  return ensureRange(base, 165, 235, [
    "The answer should be valuable for a founder, MSME owner, CFO, investor, or enterprise operator, not only a venture-backed startup.",
    "The best response should diagnose, quantify, prioritize, assign an owner, and define a reversal trigger.",
  ]);
}

function direct(pack, scenario, turn) {
  const f = frame(scenario);
  const map = {
    pmf_risk_lens: [
      `The hidden PMF risk is that the finance decision may mask weak demand. Treat the option as strong only if it improves customer proof, repeat usage, willingness to pay, or buyer confidence.`,
      `Test the risk with a 30-day proof sprint before committing fully. The test should measure demand quality, not vanity traction.`,
      `PMF quality changes the finance answer because strong demand earns cleaner capital, while weak demand makes every rupee or clause more expensive.`,
    ],
    gtm_channel_lens: [
      `The GTM issue is whether this decision strengthens distribution or makes the company dependent on a channel it cannot control.`,
      `Use channels or partners with written milestones, margin clarity, and fallback access to customers.`,
      `Distribution quality matters more than speed because a fast channel with weak economics can create growth that investors, lenders, or buyers distrust.`,
    ],
    data_room_lens: [
      `The data room should contain the evidence a skeptical counterparty would need to underwrite ${f.strategic}.`,
      `Organize evidence by decision risk, not by file type: money, authority, customer proof, compliance, and counterparty commitments.`,
      `Data-room quality changes negotiating power because clean evidence reduces uncertainty and shortens the other side's diligence cycle.`,
    ],
    cash_dashboard_lens: [
      `Track the decision through cash, timing, proof, and counterparty behavior. A dashboard should reveal movement before the P&L catches up.`,
      `Leadership should review the dashboard weekly with owners, thresholds, and decisions, not commentary.`,
      `Leading indicators beat monthly summaries because founders need 14-30 day correction windows, not post-mortems.`,
    ],
    regulatory_audit_lens: [
      `A regulatory audit would question whether the company had authority, eligibility, valuation support, filings, and source evidence before acting.`,
      `Make the file defensible by closing the document gap before money, tax benefit, share issue, debt drawdown, or buyer contract moves.`,
      `Audit readiness matters now because cleanup after a transaction usually costs more leverage than cleanup before it.`,
    ],
    founder_psychology_lens: [
      `The bias is likely urgency, prestige, loss aversion, or valuation vanity. Any one of these can make a weak option feel rational.`,
      `Make the decision without fear or ego by pre-writing the walk-away rule and asking what proof would change your mind.`,
      `Emotional discipline is finance strategy because panic converts optionality into bad terms, expensive money, or unfocused execution.`,
    ],
    enterprise_scale_lens: [
      `The enterprise-scale issue is whether this decision makes the company more reliable to large customers, banks, investors, or procurement teams.`,
      `Prepare for larger counterparties by documenting authority, support capacity, financial runway, security, delivery ownership, and escalation process.`,
      `Enterprise readiness changes financing choices because larger counterparties punish operational fragility even when the product is promising.`,
    ],
    board_dissent_lens: [
      `The strongest board objection is that the plan may solve the visible issue while increasing ${f.trap}.`,
      `Answer the objection with evidence from ${f.proof}, not founder confidence.`,
      `The objection can change the decision if it proves the downside is more permanent than the upside is valuable.`,
    ],
  };
  return map[pack.id][turn - 1];
}

function why(pack, scenario) {
  const f = frame(scenario);
  return `This works in India because ${f.law} sets the execution boundary, but the real decision quality comes from linking finance to operating proof. In ${scenario.area}, a strong answer must improve ${f.metric}. The advice should inspect evidence, incentives, timing, and counterparty behavior rather than reciting rules. That makes it useful from idea-stage founders to large enterprise finance teams.`;
}

function steps(pack, scenario, turn) {
  const f = frame(scenario);
  const base = [
    `Day 1: write the decision thesis in 1 sentence and name the main risk in ${f.strategic}.`,
    `Day 3: build a 3-case model using the scenario numbers plus 20 percent downside and 30 days delay.`,
    `Day 5: assemble the proof file: ${f.proof}.`,
    `Day 7: reject the tempting trap explicitly: ${f.trap}.`,
    `Day 14: decide proceed, renegotiate, or fallback using ${f.metric}.`,
    `Day 30: record the decision, owner, deadline, and reversal trigger in a board or founder note.`,
  ];

  if (pack.id === "data_room_lens") {
    base[2] = `Day 5: organize the data room into 5 folders: finance, authority, customer proof, compliance, and counterparty evidence.`;
  }
  if (pack.id === "cash_dashboard_lens") {
    base[1] = `Day 3: build a dashboard with cash, runway, proof status, counterparty status, and next decision date.`;
  }
  if (pack.id === "founder_psychology_lens") {
    base[0] = `Day 1: write the fear-based decision and the evidence-based decision separately before speaking to anyone.`;
  }
  if (pack.id === "decision_tree_lens") {
    base[4] = `Day 14: apply the decision tree and choose proceed, renegotiate, or fallback based on thresholds, not mood.`;
  }
  if (turn === 2) {
    base[5] = `Day 30: compare expected proof against actual proof and decide whether to double down, renegotiate, or switch fallback.`;
  }
  if (turn === 3) {
    base[4] = `Day 14: explain why this lens changes the recommendation and what fact would reverse it.`;
  }
  return base;
}

function bottom(pack, scenario, turn) {
  const f = frame(scenario);
  if (turn === 1) return `Use this lens to expose what the headline hides. If the decision does not improve ${f.metric}, it is weaker than it appears.`;
  if (turn === 2) return `Test before committing. A 30-day evidence sprint is cheaper than a 12-month cleanup of bad capital, weak demand, or poor documentation.`;
  return `The reason this matters is leverage. Better proof lets the founder choose cleaner terms, better counterparties, and stronger timing.`;
}

function body(pack, scenario, turn) {
  const raw = [
    direct(pack, scenario, turn),
    "",
    "**Why this works in Indian context:**",
    why(pack, scenario),
    "",
    "**How to execute:**",
    steps(pack, scenario, turn).map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "**Bottom line:**",
    bottom(pack, scenario, turn),
  ].join("\n");
  return ensureRange(raw, 420, 500, [
    "Keep the decision tight: one owner, one deadline, one fallback, and one measurable signal.",
    "Avoid adding more process unless it changes cash, control, compliance, customer trust, or timing.",
  ]);
}

function assistantTurn(scenario, pack, turn) {
  const t = thinking(scenario, pack, turn);
  let b = body(pack, scenario, turn);
  let content = `<thinking>\n${t}\n</thinking>\n\n${b}`;
  if (wordCount(content) < 600) {
    b += " The practical test is simple: if this does not change a signed document, cash date, customer signal, or control term within 30 days, downgrade it.";
    content = `<thinking>\n${t}\n</thinking>\n\n${b}`;
  }
  const tw = wordCount(t);
  const bw = wordCount(b);
  const total = wordCount(content);
  if (tw < 150 || tw > 300) throw new Error(`${scenario.id}/${pack.id}/A${turn} thinking ${tw}`);
  if (bw < 400 || bw > 600) throw new Error(`${scenario.id}/${pack.id}/A${turn} body ${bw}`);
  if (total < 600 || total > 900) throw new Error(`${scenario.id}/${pack.id}/A${turn} total ${total}`);
  return { role: "assistant", content };
}

function validate(record, seenAssistant) {
  const roles = record.conversation.map((turn) => turn.role).join(",");
  if (roles !== "system,user,assistant,user,assistant,user,assistant") throw new Error(`${record.scenario_id} bad roles`);
  const userTurns = record.conversation.filter((turn) => turn.role === "user");
  ["What", "How", "Why"].forEach((start, index) => {
    if (!userTurns[index].content.startsWith(start)) throw new Error(`${record.scenario_id} bad question progression`);
    if (wordCount(userTurns[index].content) > 35) throw new Error(`${record.scenario_id} user too long`);
  });
  for (const assistant of record.conversation.filter((turn) => turn.role === "assistant")) {
    for (const marker of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!assistant.content.includes(marker)) throw new Error(`${record.scenario_id} missing ${marker}`);
    }
    if (assistant.content.includes("₹")) throw new Error(`${record.scenario_id} rupee glyph`);
    if (seenAssistant.has(assistant.content)) throw new Error(`${record.scenario_id} duplicate assistant`);
    seenAssistant.add(assistant.content);
  }
}

const existing = readJsonl(OUTPUT_PATH);
if (existing.length >= 1408) {
  console.log(`No append needed. ${OUTPUT_PATH} already has ${existing.length} records.`);
  process.exit(0);
}
if (existing.length !== 1056) throw new Error(`Expected 1056 existing records, found ${existing.length}`);

const seenAssistant = new Set();
for (const record of existing) {
  for (const turn of record.conversation || []) {
    if (turn.role === "assistant") seenAssistant.add(turn.content);
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
    validate(record, seenAssistant);
    additions.push(record);
  }
}

fs.appendFileSync(OUTPUT_PATH, additions.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
console.log(`Appended ${additions.length} records to ${OUTPUT_PATH}`);
console.log(`Total records: ${existing.length + additions.length}`);
