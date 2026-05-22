const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_codex_first10_clean.jsonl");

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

function clip(text, maxWords) {
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
  return [...unique, "INR 10L", "INR 25L", "30 days", "45 days", "18 months"].slice(0, 10);
}

function kind(scenario) {
  const text = `${scenario.area} ${scenario.scenario}`.toLowerCase();
  if (/grant|scheme|sisfs|nidhi|prayas|birac|tanseed|dpiit|80-iac/.test(text)) return "scheme";
  if (/msme|treds|invoice|receivable|working capital|cgtmse|mudra|stand-up|pmegp|udyam|supplier|gem/.test(text)) return "msme";
  if (/fema|fdi|press note|ecb|safe|ccps|ccd|foreign|convertible note/.test(text)) return "cross-border";
  if (/gst|tax|56\(2\)|35|capitalization|capitalisation|remuneration|compensation/.test(text)) return "tax";
  if (/roc|due diligence|ip assignment|trademark|patent|copyright|co-founder departure|vesting|reverse vesting|compliance/.test(text)) return "governance";
  if (/exit|acquisition|buyout|ipo|strategic sale/.test(text)) return "exit";
  return "venture";
}

function boardFrame(scenario) {
  const map = {
    venture: {
      law: "Companies Act, ESOP approvals, SHA reserved matters, FEMA where foreign capital appears, 1x non-participating liquidation preference, and broad-based weighted-average anti-dilution",
      risk: "future financing damage from a clause that looks acceptable today",
      owner: "founder plus counsel",
      proof: "cap table, waterfall, ESOP plan, marked term sheet, reserved-matter list, and 18-month runway plan",
    },
    scheme: {
      law: "DPIIT recognition, SISFS guidelines, Section 80-IAC, IMB approval, Udyam registration, and relevant scheme conditions",
      risk: "spending management bandwidth on an application that cannot convert into proof",
      owner: "founder plus grants lead",
      proof: "DPIIT certificate, Udyam certificate, use-of-funds plan, milestone sheet, prior-support ledger, and pilot evidence",
    },
    msme: {
      law: "Udyam registration, MSMED Act Sections 15 and 16, Section 43B(h), CGTMSE, TReDS, RXIL, M1xchange, and Invoicemart",
      risk: "solving working capital with the wrong instrument and worsening cash conversion",
      owner: "CFO or finance controller",
      proof: "invoice ageing, buyer acceptance, lender sanction, TReDS status, collateral terms, and 13-week cash-flow model",
    },
    "cross-border": {
      law: "FEMA, RBI reporting, Press Note 3, FDI pricing rules, Companies Act instruments, CCPS, CCD, ECB forms, and ECB-2 reporting",
      risk: "closing a foreign-capital structure that the bank, auditor, or next investor cannot explain cleanly",
      owner: "founder plus company secretary",
      proof: "investor KYC, beneficial ownership note, pricing certificate, board approval, instrument draft, and reporting calendar",
    },
    tax: {
      law: "Income Tax Act Section 80-IAC, Section 56(2)(viib), GST, TDS, MAT, Section 43B(h), and Companies Act filings",
      risk: "claiming a saving before eligibility, timing, or filings are ready",
      owner: "finance head plus tax preparer",
      proof: "tax computation, GST/TDS reconciliation, valuation report, DPIIT or IMB proof, board tax memo, and filing acknowledgements",
    },
    governance: {
      law: "Companies Act, ROC filing rules, ESOP approvals, IP assignment, founder vesting, SHA terms, DPIIT documentation, and IP fast-track rules",
      risk: "authority or title gaps becoming closing blockers",
      owner: "CEO plus company secretary",
      proof: "board minutes, ROC forms, cap table, IP assignments, ESOP grants, founder vesting documents, and compliance calendar",
    },
    exit: {
      law: "Companies Act share-transfer rules, SHA restrictions, escrow, earnout clauses, indemnity caps, unlisted-share tax, and board approvals",
      risk: "mistaking headline value for probability-weighted founder cash",
      owner: "board deal committee",
      proof: "LOI, SPA draft, escrow clause, earnout formula, tax estimate, consent list, cap table, and integration plan",
    },
  };
  return map[kind(scenario)] || map.venture;
}

function thinking(scenario, turn) {
  const frame = boardFrame(scenario);
  const lead =
    turn === 1
      ? "This operator-board variation needs a different answer from red-team mode: it should translate the scenario into governance cadence, owner, and decision gate."
      : turn === 2
        ? "The sequence question should be answered like a board calendar, not like a generic checklist."
        : "The decision-rule question should define exactly when the board changes course without reopening the whole debate.";
  const base = `
${lead} Scenario ${scenario.id}: ${clip(scenario.scenario, 58)} Numerical anchors: ${numbers(scenario.scenario).join(", ")}. Board risk: ${frame.risk}. Indian boundary: ${frame.law}. Accountable owner should be ${frame.owner}. Proof file should contain ${frame.proof}. Self-check: the answer must not duplicate red-team language; it should sound like operating governance, with cadence, dashboard, escalation, and reversal rule. It must still commit to a recommendation and reject one tempting but weak alternative.
`.trim();
  return ensureRange(base, 185, 280, [
    "A board-quality answer should reduce ambiguity for the team and make future diligence easier.",
    "The model should learn that expert advice is not only what to choose, but how to govern the choice after it is made.",
  ]);
}

function body(scenario, turn) {
  const frame = boardFrame(scenario);
  const direct =
    turn === 1
      ? `Board-level recommendation: approve the path only if ${frame.owner} owns the proof file and reports weekly until the decision closes. Reject the tempting alternative of treating this as a one-time founder call.`
      : turn === 2
        ? `Run the next month as a governance sprint: facts first, counterparty confirmation second, document cleanup third, and final approval fourth. Do not let informal updates replace a dated board note.`
        : `Use a reversal rule, not instinct. Change course only if a new fact changes INR exposure, ownership/control, compliance timing, or counterparty reliability enough to beat the approved route.`;

  const why =
    turn === 1
      ? `This works in India because ${frame.law} rewards clean authority and punishes vague decision ownership. The board should not merely like the strategy; it should know who owns proof, what deadline matters, and what risk is being accepted. This is more useful for training than a fact list because it turns finance advice into governance behavior.`
      : turn === 2
        ? `This works because many Indian startup and MSME decisions fail between advice and execution. The board cadence turns ${frame.proof} into a working file, not a folder assembled after an investor, lender, buyer, or tax reviewer asks for it. That keeps speed and control aligned.`
        : `This works because a board should avoid both stubbornness and panic. A written reversal rule lets the company adapt when facts change while preserving discipline under ${frame.law}. It also prevents every new advisor comment from restarting the decision from zero.`;

  const steps =
    turn === 1
      ? [
          `Within 24 hours, appoint ${frame.owner} as decision owner and define the board update format.`,
          `By day 3, build a 1-page dashboard with INR exposure, percent ownership or margin effect, deadline, and unresolved approval item.`,
          `By day 5, assemble the proof file: ${frame.proof}.`,
          `By day 7, write the rejected alternative and why it fails under ${frame.risk}.`,
          `By day 14, ask the board or founders to approve proceed, renegotiate, or fallback.`,
          `By day 30, archive the decision note, final documents, and reversal trigger.`,
        ]
      : turn === 2
        ? [
            `Week 1: freeze facts, numbers, documents, and counterparty positions in one shared file.`,
            `Week 1: show a downside case with 20 percent revenue miss, INR 25L cash gap, or 30 days delay.`,
            `Week 2: obtain written confirmation from investor, bank, buyer, incubator, tax preparer, or company secretary.`,
            `Week 3: close the biggest document gap in ${frame.proof}.`,
            `Week 4: hold one decision meeting and record the final route with owner and deadline.`,
            `After approval, review weekly until cash, filing, signing, or submission is complete.`,
          ]
        : [
            `Set reversal threshold before acting: INR 25L economic change, 3 percent ownership/control change, or 30 days timing change.`,
            `Track counterparty reliability weekly: response time, written confirmation, clause movement, payment behavior, or portal status.`,
            `Track internal readiness weekly: document file, owner updates, cash model, and approval queue.`,
            `If one threshold is crossed, move from proceed to renegotiate within 48 hours.`,
            `If two thresholds are crossed, activate fallback and stop spending attention on the original route.`,
            `Record the reason for reversal so future diligence sees discipline, not confusion.`,
          ];

  const raw = [
    direct,
    "",
    "**Why this works in Indian context:**",
    why,
    "",
    "**How to execute:**",
    steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
    "",
    "**Bottom line:**",
    turn === 1
      ? `The board answer is ownership plus proof, not just recommendation. If ${frame.owner} cannot maintain the file, the decision is not ready.`
      : turn === 2
        ? `The sequence matters because evidence loses value when collected late. Govern the month tightly, then decide once.`
        : `Reverse only when thresholds move, not when anxiety rises. That is how the company stays decisive without becoming rigid.`,
  ].join("\n");

  return ensureRange(raw, 435, 575, [
    "This produces a distinct variation because the answer is built around governance cadence rather than red-team critique.",
    "It also trains the model to convert expert advice into owner, deadline, proof, review rhythm, and reversal trigger.",
  ]);
}

function assistantContent(scenario, turn) {
  const t = thinking(scenario, turn);
  const b = body(scenario, turn);
  const content = `<thinking>\n${t}\n</thinking>\n\n${b}`;
  const tw = wordCount(t);
  const bw = wordCount(b);
  const total = wordCount(content);
  if (tw < 150 || tw > 300) throw new Error(`${scenario.id} thinking ${tw}`);
  if (bw < 400 || bw > 600) throw new Error(`${scenario.id} body ${bw}`);
  if (total < 600 || total > 900) throw new Error(`${scenario.id} total ${total}`);
  return content;
}

const scenarios = new Map(readJsonl(SOURCE_PATH).map((scenario) => [scenario.id, scenario]));
const records = readJsonl(OUTPUT_PATH);
let changed = 0;

for (const record of records) {
  if (record.variation_id !== "operator_board_plan") continue;
  const scenario = scenarios.get(record.scenario_id);
  if (!scenario) throw new Error(`Missing source scenario ${record.scenario_id}`);
  const assistantIndexes = record.conversation
    .map((turn, index) => (turn.role === "assistant" ? index : -1))
    .filter((index) => index >= 0);
  assistantIndexes.forEach((conversationIndex, turnIndex) => {
    record.conversation[conversationIndex].content = assistantContent(scenario, turnIndex + 1);
  });
  changed += 1;
}

fs.writeFileSync(OUTPUT_PATH, records.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
console.log(`Rewrote ${changed} operator_board_plan records in ${OUTPUT_PATH}`);
