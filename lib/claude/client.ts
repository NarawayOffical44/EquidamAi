/**
 * Centralized Claude API client
 * Handles all Claude interactions with retry logic and error handling
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/config';
import { logger } from '@/lib/utils/logger';
import { ExternalApiError } from '@/lib/utils/errors';

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return clientInstance;
}

interface ClaudeCallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
}

/**
 * Call Claude API with automatic retry logic
 */
export async function callClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ClaudeCallOptions = {}
): Promise<string> {
  const {
    system,
    maxTokens = config.anthropic.maxTokens,
    temperature = 0.7,
    retries = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const client = getClient();

      const response = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      logger.info('Claude API call successful', {
        model: config.anthropic.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      return content.text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Claude API call failed (attempt ${attempt + 1}/${retries + 1})`, {
        error: lastError.message,
      });

      if (attempt < retries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new ExternalApiError(
    'Claude',
    lastError?.message || 'Failed after multiple retries'
  );
}

/**
 * Extract JSON from LLM response - robust parsing with cleanup
 */
export function extractJSON(text: string): Record<string, any> {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from LLM');
  }

  // Try to find JSON object - look from END first (most likely location)
  // This avoids getting confused by LaTeX or markdown formatting at the start
  let jsonMatch: RegExpMatchArray | null = null;

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
  } catch (parseError) {
    // Log first 500 chars of response for debugging
    logger.error('JSON parse failed', {
      responsePreview: jsonStr.substring(0, 500),
      error: parseError instanceof Error ? parseError.message : String(parseError),
    });

    throw new Error('Invalid JSON in LLM response: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
  }
}
