import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const CheckoutLeadSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  useCase: z.string().optional(),
  plan: z.string(),
  billingCycle: z.string(),
  currency: z.string(),
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
    } = validatedData;

    logger.info('Checkout lead submission', {
      email,
      companyName,
      plan,
      billingCycle,
    });

    const adminClient = createAdminClient();
    const ipAddress = request.headers.get('x-forwarded-for') || null;

    // Store checkout metadata in website_url field as JSON string
    const checkoutMetadata = {
      fullName,
      useCase,
      plan,
      billingCycle,
      currency,
      source: 'checkout',
    };

    // Save lead to database with only the columns that exist in the leads table
    const { error: dbError } = await adminClient.from('leads').insert({
      email,
      phone: phone || null,
      company_name: companyName,
      website_url: JSON.stringify(checkoutMetadata), // Store metadata here
      ip_address: ipAddress,
      country: null,
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
      return NextResponse.json(
        { error: 'Invalid form data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
