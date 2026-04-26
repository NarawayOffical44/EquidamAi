/**
 * Centralized logging utility
 * Structured logging for production observability
 */
declare class Logger {
    private isDev;
    private formatLog;
    private log;
    debug(message: string, metadata?: Record<string, any>): void;
    info(message: string, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    error(message: string, error?: Error | unknown, metadata?: Record<string, any>): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map