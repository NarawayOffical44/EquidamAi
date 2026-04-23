/**
 * Standardized API response formatting
 * Consistent response structure across all endpoints
 */

import { NextResponse } from 'next/server';
import { getErrorResponse } from './errors';

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
export function successResponse<T>(
  data: T,
  statusCode = 200,
  processingTime?: number
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(processingTime && { processingTime }),
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Return error response
 */
export function errorResponse(
  error: unknown,
  statusCode?: number
): NextResponse<ApiResponse> {
  const errorData = getErrorResponse(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: errorData.error,
        message: errorData.message,
        ...(errorData.details && { details: errorData.details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode || errorData.statusCode }
  );
}

/**
 * Wrapper for API route handlers with error handling
 */
export function createApiHandler<T = any>(
  handler: (req: Request) => Promise<T>
) {
  return async (req: Request) => {
    const startTime = Date.now();

    try {
      const result = await handler(req);
      const processingTime = Date.now() - startTime;
      return successResponse(result, 200, processingTime);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
