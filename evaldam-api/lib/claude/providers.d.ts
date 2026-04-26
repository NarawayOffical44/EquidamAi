/**
 * Multi-provider LLM client
 * Groq (Llama 3.3 70B) - Fast & Cheap
 * OpenRouter (Llama 3.3 70B) - Fallback
 * Anthropic - Premium (optional)
 */
export type LLMProvider = 'groq' | 'openrouter' | 'anthropic';
interface ProviderConfig {
    provider: LLMProvider;
    model: string;
    costPer1kTokens: number;
    speed: 'fast' | 'medium' | 'slow';
}
export declare function selectProvider(useCase: 'extraction' | 'valuation' | 'report'): ProviderConfig;
interface LLMMessage {
    role: 'user' | 'assistant';
    content: string;
}
/**
 * Main LLM call - tries Groq first, falls back to OpenRouter
 */
export declare function callLLM(messages: LLMMessage[], options?: {
    system?: string;
    useCase?: 'extraction' | 'valuation' | 'report';
    maxTokens?: number;
    temperature?: number;
}): Promise<string>;
export declare function getProviderCost(provider: LLMProvider, tokens: number): number;
export {};
//# sourceMappingURL=providers.d.ts.map