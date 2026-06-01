import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { claimPendingPaidCheckout } from "@/lib/payments/pending-paid-checkout";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const result = await claimPendingPaidCheckout(createAdminClient(), user.email, user.id);
  return NextResponse.json({ success: result.ok, claimed: result.claimed });
}
