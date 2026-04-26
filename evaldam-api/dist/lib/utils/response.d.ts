/**
 * Standardized API response formatting
 * Consistent response structure across all endpoints
 */
import { NextResponse } from 'next/server';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    meta?: {
        timestamp: string;
        processingTime?: number;
    };
}
/**
 * Return success response
 */
export declare function successResponse<T>(data: T, statusCode?: number, processingTime?: number): NextResponse<ApiResponse<T>>;
/**
 * Return error response
 */
export declare function errorResponse(error: unknown, statusCode?: number): NextResponse<ApiResponse>;
/**
 * Wrapper for API route handlers with error handling
 */
export declare function createApiHandler<T = any>(handler: (req: Request) => Promise<T>): (req: Request) => Promise<any>;
//# sourceMappingURL=response.d.ts.map