const fs = require("fs");
const path = require("path");

const DEFAULT_INPUT = path.join(__dirname, "..", "data", "synthetic", "evaldam_training_llm_generated_curated.jsonl");
const MIN_ANSWER_LENGTH = 250;

const REGULATION_OR_SCHEME_PATTERN =
  /(Section\s+\d|Companies Act|MSMED Act|MSME|Udyam|DPIIT|SISFS|Startup India Seed Fund|TANSEED|NIDHI|PRAYAS|CGTMSE|TReDS|RXIL|M1xchange|Invoicemart|FEMA|Press Note 3|RBI|ECB|80-IAC|56\(2\)\(viib\)|43B\(h\)|Income Tax Act)/i;

const FILLER_PHRASES = [
  "consult a CA",
  "depends on your situation",
  "do your research",
  "it varies",
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

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function countNumbers(text) {
  const matches = String(text || "").match(/(?:INR\s*)?\d+(?:\.\d+)?(?:\s*(?:percent|days?|months?|years?|Cr|L|lakh|crore|x|bps))?/gi);
  return matches ? matches.length : 0;
}

function extractThinking(content) {
  const match = String(content || "").match(/<thinking>\s*([\s\S]*?)\s*<\/thinking>/);
  return match ? match[1] : "";
}

function afterThinking(content) {
  return String(content || "").replace(/^[\s\S]*?<\/thinking>\s*/, "");
}

function colabGate(record) {
  const failures = [];

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return ["not a dict"];
  }

  const convo = Array.isArray(record.conversation) ? record.conversation : [];
  if (convo.length !== 7) failures.push(`expected 7 turns, got ${convo.length}`);

  const assistantTurns = convo.filter((turn) => turn && turn.role === "assistant");
  if (assistantTurns.length !== 3) failures.push(`expected 3 assistant turns, got ${assistantTurns.length}`);

  assistantTurns.forEach((turn, index) => {
    const content = String(turn.content || "");
    if (content.length < MIN_ANSWER_LENGTH) failures.push(`assistant turn ${index + 1} too short (${content.length} chars)`);
    if (!content.includes("<thinking>") || !content.includes("</thinking>")) {
      failures.push(`assistant turn ${index + 1} missing thinking block`);
    }
    if (!content.includes("**Why this works") && !content.includes("**Why")) {
      failures.push(`assistant turn ${index + 1} missing Why section`);
    }
    if (!content.includes("**How to execute") && !content.includes("**How")) {
      failures.push(`assistant turn ${index + 1} missing How section`);
    }
    if (!content.includes("**Bottom line")) failures.push(`assistant turn ${index + 1} missing Bottom line`);
  });

  return failures;
}

function strictGate(record) {
  const failures = [];
  const roles = (record.conversation || []).map((turn) => turn.role).join(",");
  const expectedRoles = "system,user,assistant,user,assistant,user,assistant";
  if (roles !== expectedRoles) failures.push(`role order mismatch: ${roles}`);

  const userTurns = (record.conversation || []).filter((turn) => turn.role === "user");
  userTurns.forEach((turn, index) => {
    const words = countWords(turn.content);
    if (words > 35) failures.push(`user turn ${index + 1} has ${words} words`);
  });

  const assistantTurns = (record.conversation || []).filter((turn) => turn.role === "assistant");
  assistantTurns.forEach((turn, index) => {
    const content = String(turn.content || "");
    const thinkingWords = countWords(extractThinking(content));
    const bodyWords = countWords(afterThinking(content));
    const totalWords = countWords(content);
    const numbers = countNumbers(content);

    if (thinkingWords < 150 || thinkingWords > 300) {
      failures.push(`assistant turn ${index + 1} thinking words ${thinkingWords}, expected 150-300`);
    }
    if (bodyWords < 400 || bodyWords > 600) {
      failures.push(`assistant turn ${index + 1} body words ${bodyWords}, expected 400-600`);
    }
    if (totalWords < 600 || totalWords > 900) {
      failures.push(`assistant turn ${index + 1} total words ${totalWords}, expected 600-900`);
    }
    if (numbers < 3) failures.push(`assistant turn ${index + 1} has only ${numbers} numeric references`);
    if (!REGULATION_OR_SCHEME_PATTERN.test(content)) {
      failures.push(`assistant turn ${index + 1} missing Indian regulation/scheme/platform`);
    }
    if (content.includes("₹")) failures.push(`assistant turn ${index + 1} uses rupee glyph`);
    for (const phrase of FILLER_PHRASES) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        failures.push(`assistant turn ${index + 1} uses banned filler phrase: ${phrase}`);
      }
    }
  });

  return failures;
}

function main() {
  const input = process.argv[2] || DEFAULT_INPUT;
  const strict = process.argv.includes("--strict");
  const records = readJsonl(input);
  const allFailures = [];

  records.forEach((record, index) => {
    const failures = [...colabGate(record), ...(strict ? strictGate(record) : [])];
    if (failures.length) {
      allFailures.push({ line: index + 1, scenario_id: record.scenario_id, failures });
    }
  });

  if (allFailures.length) {
    console.error(`FAILED ${allFailures.length}/${records.length} records`);
    for (const failure of allFailures) {
      console.error(`line ${failure.line} ${failure.scenario_id || "UNKNOWN"}:`);
      failure.failures.forEach((item) => console.error(`  - ${item}`));
    }
    process.exit(1);
  }

  console.log(`PASS ${records.length} records (${strict ? "strict" : "colab"} gate)`);
}

main();
