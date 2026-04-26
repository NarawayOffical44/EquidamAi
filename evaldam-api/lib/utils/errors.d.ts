/**
 * Centralized error handling
 * Consistent error types and responses across the app
 */
export declare class AppError extends Error {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any> | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, any> | undefined);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ExternalApiError extends AppError {
    constructor(service: string, message: string);
}
export declare function isAppError(error: unknown): error is AppError;
export declare function getErrorResponse(error: unknown): {
    details?: Record<string, any> | undefined;
    success: boolean;
    error: string;
    message: string;
    statusCode: number;
};
//# sourceMappingURL=errors.d.ts.map