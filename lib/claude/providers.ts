/**
 * Multi-provider LLM client
 * Groq (Llama 3.3 70B) - Fast & Cheap
 * OpenRouter (Llama 3.3 70B) - Fallback
 * Anthropic - Premium (optional)
 */

import { logger } from '@/lib/utils/logger';

export type LLMProvider = 'evaldam' | 'groq' | 'openrouter' | 'anthropic';

interface ProviderConfig {
  provider: LLMProvider;
  model: string;
  costPer1kTokens: number;
  speed: 'fast' | 'medium' | 'slow';
}

const PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  evaldam: {
    provider: 'evaldam',
    model: process.env.EVALDAM_LLM_MODEL || 'evaldam-trained',
    costPer1kTokens: 0,
    speed: 'fast',
  },
  groq: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    costPer1kTokens: 0.00027,
    speed: 'fast',
  },
  openrouter: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    costPer1kTokens: 0.00032,
    speed: 'fast',
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    costPer1kTokens: 0.003,
    speed: 'medium',
  },
};

export function selectProvider(_useCase: 'extraction' | 'valuation' | 'report'): ProviderConfig {
  void _useCase;
  const preferred = process.env.PREFERRED_LLM_PROVIDER as LLMProvider;
  if (preferred && PROVIDERS[preferred]) {
    return PROVIDERS[preferred];
  }

  // Default: Groq for all (cheapest + fast)
  return PROVIDERS.groq;
}

interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildOpenAiMessages(messages: LLMMessage[], system: string) {
  return [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ];
}

function buildPrompt(messages: LLMMessage[], system: string) {
  return [
    ...(system ? [`SYSTEM: ${system}`] : []),
    ...messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`),
  ].join('\n\n');
}

function extractProviderText(value: unknown): string {
  if (typeof value === 'string') return value.trim();

  if (Array.isArray(value)) {
    return value.map(extractProviderText).filter(Boolean).join('\n').trim();
  }

  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  const direct = record.answer ?? record.response ?? record.text ?? record.content ?? record.generated_text ?? record.generatedText ?? record.completion;
  if (direct) {
    const directText = extractProviderText(direct);
    if (directText) return directText;
  }

  if (Array.isArray(record.choices)) {
    const choiceText = record.choices
      .map((choice: unknown) => {
        if (!choice || typeof choice !== 'object') return '';
        const choiceRecord = choice as Record<string, unknown>;
        const message = choiceRecord.message && typeof choiceRecord.message === 'object'
          ? choiceRecord.message as Record<string, unknown>
          : undefined;
        const delta = choiceRecord.delta && typeof choiceRecord.delta === 'object'
          ? choiceRecord.delta as Record<string, unknown>
          : undefined;
        return extractProviderText(message?.content ?? delta?.content ?? choiceRecord.text ?? choiceRecord.content);
      })
      .filter(Boolean)
      .join('\n')
      .trim();
    if (choiceText) return choiceText;
  }

  for (const key of ['output', 'data', 'outputs', 'result', 'results']) {
    const nestedText = extractProviderText(record[key]);
    if (nestedText) return nestedText;
  }

  return '';
}

/**
 * Call Evaldam's trained/deployed model endpoint.
 * Supports OpenAI-compatible chat/completions endpoints or RunPod-style input payloads.
 */
async function callEvaldam(
  messages: LLMMessage[],
  system: string,
  maxTokens: number,
  temperature: number = 0.3
): Promise<string> {
  const endpoint = process.env.EVALDAM_LLM_ENDPOINT_URL?.trim();
  if (!endpoint) {
    throw new Error('EVALDAM_LLM_ENDPOINT_URL not set');
  }

  const apiKey = process.env.EVALDAM_LLM_API_KEY?.trim() || process.env.RUNPOD_API_KEY?.trim();
  const model = process.env.EVALDAM_LLM_MODEL?.trim() || 'evaldam-trained';
  const timeoutMs = Number(process.env.EVALDAM_LLM_TIMEOUT_MS || 90000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const isOpenAiCompatible =
    process.env.EVALDAM_LLM_API_FORMAT?.trim().toLowerCase() === 'openai' ||
    endpoint.includes('/chat/completions');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(
        isOpenAiCompatible
          ? {
              model,
              messages: buildOpenAiMessages(messages, system),
              max_tokens: maxTokens,
              temperature,
            }
          : {
              input: {
                model,
                messages: buildOpenAiMessages(messages, system),
                prompt: buildPrompt(messages, system),
                max_tokens: maxTokens,
                temperature,
              },
            }
      ),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      logger.error('Evaldam trained LLM error', { status: response.status, data });
      throw new Error(`Evaldam trained LLM (${response.status})`);
    }

    const text = extractProviderText(data);
    if (!text) throw new Error('Evaldam trained LLM returned an empty response');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call Groq API (Llama 3.3 70B)
 */
async function callGroq(
  messages: LLMMessage[],
  system: string,
  maxTokens: number,
  temperature: number = 0.3
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: system ? `${system}\n\n${messages[0].content}` : messages[0].content },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Groq API error', { status: response.status, error: errorText });
      throw new Error(`Groq API (${response.status}): ${errorText}`);
    }

    const data = await response.json() as unknown;
    const text = extractProviderText(data);
    if (!text) {
      throw new Error('Invalid Groq response structure');
    }
    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Groq API call failed', { error: errorMsg });
    throw error;
  }
}

/**
 * Call OpenRouter API (Llama 3.3 70B fallback)
 */
async function callOpenRouter(
  messages: LLMMessage[],
  system: string,
  maxTokens: number,
  temperature: number = 0.3
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'user', content: system ? `${system}\n\n${messages[0].content}` : messages[0].content },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error', { status: response.status, error: errorText });
      throw new Error(`OpenRouter API (${response.status}): ${errorText}`);
    }

    const data = await response.json() as unknown;
    const text = extractProviderText(data);
    if (!text) {
      throw new Error('Invalid OpenRouter response structure');
    }
    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('OpenRouter API call failed', { error: errorMsg });
    throw error;
  }
}

/**
 * Main LLM call - tries Groq first, falls back to OpenRouter
 */
export async function callLLM(
  messages: LLMMessage[],
  options: {
    system?: string;
    useCase?: 'extraction' | 'valuation' | 'report';
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const provider = selectProvider(options.useCase || 'extraction');
  const maxTokens = options.maxTokens || 2000;
  const temperature = options.temperature ?? 0.3;
  const system = options.system || '';

  try {
    if (provider.provider === 'evaldam') {
      logger.info('Calling Evaldam trained LLM', { maxTokens, temperature });
      return await callEvaldam(messages, system, maxTokens, temperature);
    } else if (provider.provider === 'groq') {
      logger.info('Calling Groq (Llama 3.3 70B)', { maxTokens, temperature });
      return await callGroq(messages, system, maxTokens, temperature);
    } else if (provider.provider === 'openrouter') {
      logger.info('Calling OpenRouter (Llama 3.3 70B)', { maxTokens, temperature });
      return await callOpenRouter(messages, system, maxTokens, temperature);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.warn(`${provider.provider} failed, trying fallback`, { error: errorMsg });
    // Fallback to OpenRouter if Groq fails
    if (provider.provider === 'groq') {
      try {
        logger.info('Falling back to OpenRouter');
        return await callOpenRouter(messages, system, maxTokens, temperature);
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new Error(`All LLM providers failed. Groq: ${errorMsg}. OpenRouter: ${fallbackMsg}`);
      }
    }
  }

  throw new Error(`LLM provider ${provider.provider} not available`);
}

export function getProviderCost(provider: LLMProvider, tokens: number): number {
  return (PROVIDERS[provider].costPer1kTokens * tokens) / 1000;
}
