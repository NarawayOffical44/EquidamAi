"use strict";
/**
 * Multi-provider LLM client
 * Groq (Llama 3.3 70B) - Fast & Cheap
 * OpenRouter (Llama 3.3 70B) - Fallback
 * Anthropic - Premium (optional)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProvider = selectProvider;
exports.callLLM = callLLM;
exports.getProviderCost = getProviderCost;
const logger_1 = require("@/lib/utils/logger");
const PROVIDERS = {
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
function selectProvider(useCase) {
    const preferred = process.env.PREFERRED_LLM_PROVIDER;
    if (preferred && PROVIDERS[preferred]) {
        return PROVIDERS[preferred];
    }
    // Default: Groq for all (cheapest + fast)
    return PROVIDERS.groq;
}
/**
 * Call Groq API (Llama 3.3 70B)
 */
async function callGroq(messages, system, maxTokens, temperature = 0.3) {
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
            logger_1.logger.error('Groq API error', { status: response.status, error: errorText });
            throw new Error(`Groq API (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid Groq response structure');
        }
        return data.choices[0].message.content;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Groq API call failed', { error: errorMsg });
        throw error;
    }
}
/**
 * Call OpenRouter API (Llama 3.3 70B fallback)
 */
async function callOpenRouter(messages, system, maxTokens, temperature = 0.3) {
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
            logger_1.logger.error('OpenRouter API error', { status: response.status, error: errorText });
            throw new Error(`OpenRouter API (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid OpenRouter response structure');
        }
        return data.choices[0].message.content;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('OpenRouter API call failed', { error: errorMsg });
        throw error;
    }
}
/**
 * Main LLM call - tries Groq first, falls back to OpenRouter
 */
async function callLLM(messages, options = {}) {
    const provider = selectProvider(options.useCase || 'extraction');
    const maxTokens = options.maxTokens || 2000;
    const temperature = options.temperature ?? 0.3;
    const system = options.system || '';
    try {
        if (provider.provider === 'groq') {
            logger_1.logger.info('Calling Groq (Llama 3.3 70B)', { maxTokens, temperature });
            return await callGroq(messages, system, maxTokens, temperature);
        }
        else if (provider.provider === 'openrouter') {
            logger_1.logger.info('Calling OpenRouter (Llama 3.3 70B)', { maxTokens, temperature });
            return await callOpenRouter(messages, system, maxTokens, temperature);
        }
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger_1.logger.warn(`${provider.provider} failed, trying fallback`, { error: errorMsg });
        // Fallback to OpenRouter if Groq fails
        if (provider.provider === 'groq') {
            try {
                logger_1.logger.info('Falling back to OpenRouter');
                return await callOpenRouter(messages, system, maxTokens, temperature);
            }
            catch (fallbackError) {
                const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`All LLM providers failed. Groq: ${errorMsg}. OpenRouter: ${fallbackMsg}`);
            }
        }
    }
    throw new Error(`LLM provider ${provider.provider} not available`);
}
function getProviderCost(provider, tokens) {
    return (PROVIDERS[provider].costPer1kTokens * tokens) / 1000;
}
//# sourceMappingURL=providers.js.map