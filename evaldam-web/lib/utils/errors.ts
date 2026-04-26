/**
 * Centralized error handling
 * Consistent error types and responses across the app
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, message: string) {
    super(
      'EXTERNAL_API_ERROR',
      `${service} API error: ${message}`,
      502,
      { service }
    );
    this.name = 'ExternalApiError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    success: false,
    error: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}
