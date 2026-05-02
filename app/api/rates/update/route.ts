/**
 * API Route: Auto-update exchange rates and pricing
 * Called hourly via scheduled tasks (or can be triggered manually)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  refreshExchangeRates,
  autoCalculatePricing
} from '@/lib/utils/automated-rates';

export const runtime = 'nodejs';

// Verify request is from trusted source (scheduler or internal)
function verifyAuthorization(req: NextRequest): boolean {
  const token = req.headers.get('x-rate-update-token');
  const internalKey = process.env.INTERNAL_RATE_UPDATE_KEY;

  // Allow from same origin or with valid token
  if (token && token === internalKey) return true;
  if (req.headers.get('referer')?.includes(req.headers.get('host') || '')) return true;

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    if (process.env.NODE_ENV === 'production' && !verifyAuthorization(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Refresh rates
    const freshRates = await refreshExchangeRates();
    console.log('✓ Rates refreshed:', freshRates);

    // Auto-calculate pricing
    const pricing = await autoCalculatePricing();

    return NextResponse.json({
      success: true,
      message: 'Rates and pricing updated automatically',
      timestamp: new Date().toISOString(),
      rates: freshRates,
      pricing,
    });
  } catch (error) {
    console.error('Rate update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update rates' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    if (process.env.NODE_ENV === 'production' && !verifyAuthorization(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get fresh rates
    const rates = await refreshExchangeRates();

    return NextResponse.json({
      success: true,
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rate fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}
