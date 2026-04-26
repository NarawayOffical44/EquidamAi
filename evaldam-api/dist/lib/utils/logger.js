"use strict";
/**
 * Centralized logging utility
 * Structured logging for production observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.isDev = process.env.NODE_ENV !== 'production';
    }
    formatLog(context) {
        return JSON.stringify(context);
    }
    log(level, message, metadata) {
        const context = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata,
        };
        const formatted = this.formatLog(context);
        if (this.isDev) {
            // Pretty print in development
            console.log(`[${level.toUpperCase()}] ${message}`, metadata || '');
        }
        else {
            // Structured JSON in production
            console[level === 'error' ? 'error' : 'log'](formatted);
        }
    }
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }
    info(message, metadata) {
        this.log('info', message, metadata);
    }
    warn(message, metadata) {
        this.log('warn', message, metadata);
    }
    error(message, error, metadata) {
        const context = {
            timestamp: new Date().toISOString(),
            level: 'error',
            message,
            metadata,
        };
        if (error instanceof Error) {
            context.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }
        const formatted = this.formatLog(context);
        if (this.isDev) {
            console.error(`[ERROR] ${message}`, error, metadata || '');
        }
        else {
            console.error(formatted);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map