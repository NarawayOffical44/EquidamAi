import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deriveSalesQualification,
  normalizeAccountOnboardingPayload,
} from "@/lib/onboarding/account-onboarding";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: account, error } = await adminClient
      .from("users")
      .select("onboarding_completed, onboarding_role, onboarding_data")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      logger.error("Failed to load account onboarding", {
        userId: user.id,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: "Failed to load onboarding." }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json(
        { error: "Account profile was not found. Please sign out and sign in again." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      onboarding_completed: Boolean(account.onboarding_completed),
      onboarding_role: account.onboarding_role,
      onboarding_data: account.onboarding_data || {},
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load onboarding." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = normalizeAccountOnboardingPayload(await request.json());
    const salesQualification = deriveSalesQualification(payload);
    const adminClient = createAdminClient();

    const { data: updatedAccount, error } = await adminClient
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_role: payload.role,
        onboarding_data: payload.data,
        sales_qualification: salesQualification,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      logger.error("Failed to save account onboarding", {
        userId: user.id,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: "Failed to save onboarding." }, { status: 500 });
    }

    if (!updatedAccount) {
      logger.warn("Account onboarding profile row not found", { userId: user.id });
      return NextResponse.json(
        { error: "Account profile was not found. Please sign out and sign in again, then retry." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      next: "/dashboard",
      onboarding_role: payload.role,
      onboarding_data: payload.data,
      sales_qualification: salesQualification,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid onboarding answers." },
      { status: 400 }
    );
  }
}
