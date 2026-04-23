/**
 * Centralized logging utility
 * Structured logging for production observability
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDev = process.env.NODE_ENV !== 'production';

  private formatLog(context: LogContext): string {
    return JSON.stringify(context);
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    const formatted = this.formatLog(context);

    if (this.isDev) {
      // Pretty print in development
      console.log(`[${level.toUpperCase()}] ${message}`, metadata || '');
    } else {
      // Structured JSON in production
      console[level === 'error' ? 'error' : 'log'](formatted);
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
    const context: LogContext = {
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
    } else {
      console.error(formatted);
    }
  }
}

export const logger = new Logger();
