import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const ContactLeadSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email'),
  companyName: z.string().min(1, 'Company name is required'),
  useCase: z.string().optional(),
  type: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ContactLeadSchema.parse(body);

    const {
      fullName,
      email,
      companyName,
      useCase,
      type,
    } = validatedData;

    logger.info('Contact form submission', {
      email,
      companyName,
      type,
    });

    const adminClient = createAdminClient();
    const ipAddress = request.headers.get('x-forwarded-for') || null;

    // Store contact metadata in website_url field as JSON string
    const contactMetadata = {
      fullName,
      useCase,
      type: type || 'contact',
      source: 'contact_form',
    };

    // Save lead to database with only the columns that exist in the leads table
    const { error: dbError } = await adminClient.from('leads').insert({
      email,
      phone: null,
      company_name: companyName,
      website_url: JSON.stringify(contactMetadata),
      ip_address: ipAddress,
      country: null,
      city: null,
      isp: null,
      valuation_low: null,
      valuation_mid: null,
      valuation_high: null,
    });

    if (dbError) {
      logger.error('Failed to save contact lead', {
        error: dbError.message,
        email,
        companyName,
      });

      return NextResponse.json(
        { error: 'Failed to save inquiry. Please try again.' },
        { status: 500 }
      );
    }

    logger.info('Contact lead saved successfully', {
      email,
      companyName,
      fullName,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! We have received your inquiry.',
        email,
        company: companyName,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Contact API error', {
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
