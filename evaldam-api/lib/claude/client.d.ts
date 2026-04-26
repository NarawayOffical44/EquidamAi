/**
 * Centralized Claude API client
 * Handles all Claude interactions with retry logic and error handling
 */
interface ClaudeCallOptions {
    system?: string;
    maxTokens?: number;
    temperature?: number;
    retries?: number;
}
/**
 * Call Claude API with automatic retry logic
 */
export declare function callClaude(messages: Array<{
    role: 'user' | 'assistant';
    content: string;
}>, options?: ClaudeCallOptions): Promise<string>;
/**
 * Extract JSON from LLM response - robust parsing with cleanup
 */
export declare function extractJSON(text: string): Record<string, any>;
export {};
//# sourceMappingURL=client.d.ts.map