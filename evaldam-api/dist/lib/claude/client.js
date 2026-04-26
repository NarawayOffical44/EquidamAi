"use strict";
/**
 * Centralized Claude API client
 * Handles all Claude interactions with retry logic and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callClaude = callClaude;
exports.extractJSON = extractJSON;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const config_1 = require("@/lib/config");
const logger_1 = require("@/lib/utils/logger");
const errors_1 = require("@/lib/utils/errors");
let clientInstance = null;
function getClient() {
    if (!clientInstance) {
        clientInstance = new sdk_1.default({
            apiKey: config_1.config.anthropic.apiKey,
        });
    }
    return clientInstance;
}
/**
 * Call Claude API with automatic retry logic
 */
async function callClaude(messages, options = {}) {
    const { system, maxTokens = config_1.config.anthropic.maxTokens, temperature = 0.7, retries = 2, } = options;
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const client = getClient();
            const response = await client.messages.create({
                model: config_1.config.anthropic.model,
                max_tokens: maxTokens,
                temperature,
                system,
                messages,
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type from Claude');
            }
            logger_1.logger.info('Claude API call successful', {
                model: config_1.config.anthropic.model,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            });
            return content.text;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.warn(`Claude API call failed (attempt ${attempt + 1}/${retries + 1})`, {
                error: lastError.message,
            });
            if (attempt < retries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new errors_1.ExternalApiError('Claude', lastError?.message || 'Failed after multiple retries');
}
/**
 * Extract JSON from LLM response - robust parsing with cleanup
 */
function extractJSON(text) {
    if (!text || text.trim().length === 0) {
        throw new Error('Empty response from LLM');
    }
    // Try to find JSON object - look from END first (most likely location)
    // This avoids getting confused by LaTeX or markdown formatting at the start
    let jsonMatch = null;
    // First try to find JSON that looks complete (has proper closing)
    const matches = Array.from(text.matchAll(/\{[\s\S]*\}/g));
    if (matches.length > 0) {
        // Use the last complete-looking JSON object (most likely the actual JSON)
        jsonMatch = matches[matches.length - 1];
    }
    if (!jsonMatch) {
        throw new Error('No JSON object found in response');
    }
    let jsonStr = jsonMatch[0];
    // Clean up common issues
    // Fix unquoted keys (common in LLM responses)
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    // Fix single quotes to double quotes
    jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');
    // Fix trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    try {
        return JSON.parse(jsonStr);
    }
    catch (parseError) {
        // Log first 500 chars of response for debugging
        logger_1.logger.error('JSON parse failed', {
            responsePreview: jsonStr.substring(0, 500),
            error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        throw new Error('Invalid JSON in LLM response: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
    }
}
//# sourceMappingURL=client.js.map