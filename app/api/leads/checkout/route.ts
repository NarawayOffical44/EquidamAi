import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { withLeadAttribution } from '@/lib/leads/attribution';
import { insertLead } from '@/lib/leads/store';
import { trackServerEvent } from '@/lib/analytics/server-ga4';
import { normalizeBenchmarkCountry } from '@/lib/personalization/country-benchmarks';

const CheckoutLeadSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Invalid email'),
  phone: z.string().trim().min(3, 'Phone number is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  useCase: z.string().trim().min(1, 'Use case is required'),
  plan: z.string().trim().min(1, 'Plan is required'),
  billingCycle: z.string().trim().min(1, 'Billing cycle is required'),
  currency: z.string().trim().min(1, 'Currency is required'),
  country: z.string().trim().optional(),
  customerCategory: z.string().optional(),
  attribution: z.unknown().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CheckoutLeadSchema.parse(body);

    const {
      fullName,
      email,
      phone,
      companyName,
      useCase,
      plan,
      billingCycle,
      currency,
      country,
      customerCategory,
      attribution,
    } = validatedData;
    const benchmarkCountry = normalizeCheckoutCountry(country);

    logger.info('Checkout lead submission', {
      email,
      companyName,
      plan,
      billingCycle,
      country: benchmarkCountry,
    });

    const adminClient = createAdminClient();
    const ipAddress = request.headers.get('x-forwarded-for') || null;

    const checkoutMetadata = withLeadAttribution(request, {
      fullName,
      useCase,
      plan,
      billingCycle,
      currency,
      country: benchmarkCountry,
      customerCategory: customerCategory || inferCustomerCategory(plan),
      source: 'checkout',
    }, attribution);

    // Save lead to database with only the columns that exist in the leads table
    const { error: dbError } = await insertLead(adminClient, {
      email,
      phone: phone || null,
      company_name: companyName,
      website_url: null,
      metadata: checkoutMetadata,
      ip_address: ipAddress,
      country: benchmarkCountry,
      city: null,
      isp: null,
      valuation_low: null,
      valuation_mid: null,
      valuation_high: null,
    });

    if (dbError) {
      logger.error('Failed to save checkout lead', {
        error: dbError.message,
        email,
        companyName,
      });

      return NextResponse.json(
        { error: 'Failed to save lead. Please try again.' },
        { status: 500 }
      );
    }

    logger.info('Checkout lead saved successfully', {
      email,
      companyName,
      plan,
      fullName,
    });

    trackServerEvent('checkout_request', {
      plan,
      billing_cycle: billingCycle,
      currency,
      country: benchmarkCountry || '',
      customer_category: customerCategory || inferCustomerCategory(plan),
    }).catch((err) => {
      logger.warn('Failed to track checkout server event', { error: String(err) });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! We have received your subscription request.',
        email,
        company: companyName,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Checkout API error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]?.message;
      return NextResponse.json(
        { error: firstIssue || 'Please complete the checkout details.', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

function inferCustomerCategory(plan: string) {
  if (plan === 'agency' || plan === 'plus' || plan === 'advisor') return 'agency_or_advisor';
  if (plan === 'enterprise') return 'enterprise_or_portfolio';
  return 'founder_or_startup';
}

function normalizeCheckoutCountry(country?: string) {
  const normalized = normalizeBenchmarkCountry(country);
  return normalized === 'GLOBAL' ? null : normalized;
}
