"use strict";
/**
 * Standardized API response formatting
 * Consistent response structure across all endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.createApiHandler = createApiHandler;
const server_1 = require("next/server");
const errors_1 = require("./errors");
/**
 * Return success response
 */
function successResponse(data, statusCode = 200, processingTime) {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...(processingTime && { processingTime }),
        },
    };
    return server_1.NextResponse.json(response, { status: statusCode });
}
/**
 * Return error response
 */
function errorResponse(error, statusCode) {
    const errorData = (0, errors_1.getErrorResponse)(error);
    return server_1.NextResponse.json({
        success: false,
        error: {
            code: errorData.error,
            message: errorData.message,
            ...(errorData.details && { details: errorData.details }),
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    }, { status: statusCode || errorData.statusCode });
}
/**
 * Wrapper for API route handlers with error handling
 */
function createApiHandler(handler) {
    return async (req) => {
        const startTime = Date.now();
        try {
            const result = await handler(req);
            const processingTime = Date.now() - startTime;
            return successResponse(result, 200, processingTime);
        }
        catch (error) {
            return errorResponse(error);
        }
    };
}
//# sourceMappingURL=response.js.map