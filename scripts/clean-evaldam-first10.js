const fs = require("fs");
const path = require("path");

const SOURCE_PATH = "D:\\Apps\\Evaldam\\Senerio.Jsonl";
const GENERATED_PATH = path.join(__dirname, "..", "data", "synthetic", "evaldam_chat_generated_first10.jsonl");
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

function assertConversation(record) {
  if (!Array.isArray(record.conversation) || record.conversation.length !== 7) {
    throw new Error(`${record.scenario_id} must have exactly 7 conversation turns`);
  }

  const expectedRoles = ["system", "user", "assistant", "user", "assistant", "user", "assistant"];
  record.conversation.forEach((turn, index) => {
    if (turn.role !== expectedRoles[index]) {
      throw new Error(`${record.scenario_id} turn ${index + 1} expected ${expectedRoles[index]}, got ${turn.role}`);
    }
    if (typeof turn.content !== "string" || !turn.content.trim()) {
      throw new Error(`${record.scenario_id} turn ${index + 1} has empty content`);
    }
  });

  record.conversation
    .filter((turn) => turn.role === "assistant")
    .forEach((turn, index) => {
      const content = turn.content;
      for (const marker of [
        "<thinking>",
        "</thinking>",
        "**Why this works in Indian context:**",
        "**How to execute:**",
        "**Bottom line:**",
      ]) {
        if (!content.includes(marker)) {
          throw new Error(`${record.scenario_id} assistant turn ${index + 1} missing ${marker}`);
        }
      }
    });
}

const sourceRecords = readJsonl(SOURCE_PATH);
const sourceById = new Map(sourceRecords.map((record) => [record.id, record]));
const generatedRecords = readJsonl(GENERATED_PATH);

const cleaned = generatedRecords.map((record) => {
  const source = sourceById.get(record.scenario_id);
  if (!source) throw new Error(`No source scenario found for ${record.scenario_id}`);
  assertConversation(record);

  return {
    scenario_id: source.id,
    area: source.area,
    difficulty: source.difficulty,
    conversation: record.conversation,
    generator_model: record.generator_model || "codex-chat-generated",
    temperature: record.temperature ?? null,
    lenses: record.lenses || null,
  };
});

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, cleaned.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");

console.log(`Read ${sourceRecords.length} source scenarios from ${SOURCE_PATH}`);
console.log(`Wrote ${cleaned.length} cleaned records to ${OUTPUT_PATH}`);
