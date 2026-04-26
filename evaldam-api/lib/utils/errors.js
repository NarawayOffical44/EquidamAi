"use strict";
/**
 * Centralized error handling
 * Consistent error types and responses across the app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
exports.isAppError = isAppError;
exports.getErrorResponse = getErrorResponse;
class AppError extends Error {
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super('VALIDATION_ERROR', message, 400, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource) {
        super('NOT_FOUND', `${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super('UNAUTHORIZED', message, 401);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ExternalApiError extends AppError {
    constructor(service, message) {
        super('EXTERNAL_API_ERROR', `${service} API error: ${message}`, 502, { service });
        this.name = 'ExternalApiError';
    }
}
exports.ExternalApiError = ExternalApiError;
function isAppError(error) {
    return error instanceof AppError;
}
function getErrorResponse(error) {
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
//# sourceMappingURL=errors.js.map