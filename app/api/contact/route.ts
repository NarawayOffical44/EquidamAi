import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, team_size, message } = await req.json();

    if (!name || !email || !company || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from('enterprise_inquiries').insert({
      name,
      email,
      company,
      team_size: team_size || null,
      message,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
  }
}
