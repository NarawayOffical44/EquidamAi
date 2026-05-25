import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { startupContributorAccountEmailTemplate } from "@/lib/email/templates";
import { logger } from "@/lib/utils/logger";
import {
  adminOnlyResponse,
  getAuthenticatedUser,
  getStartupWorkspaceAccess,
  unauthorizedResponse,
} from "@/lib/team/access";
import { normalizePlanKey } from "@/lib/plans/plan-limits";

type ExistingAccess = {
  id: string;
  startup_id: string;
  user_id: string;
  email: string;
  status: "accepted" | "revoked";
};

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "Startup contributor";
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

async function requireEnterpriseStartupAdmin(userId: string, startupId: string) {
  const adminClient = createAdminClient();
  const startupAccess = await getStartupWorkspaceAccess(adminClient, userId, startupId);

  if (!startupAccess) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Startup not found" }, { status: 404 }),
    };
  }

  if (startupAccess.access.role !== "admin") {
    return {
      ok: false as const,
      response: adminOnlyResponse("Only the workspace Admin can manage startup sharing"),
    };
  }

  if (
    !startupAccess.access.planActive ||
    normalizePlanKey(startupAccess.access.plan, startupAccess.access.planActive) !== "enterprise"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Startup update sharing is available on Enterprise plans" },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, adminClient, startupAccess };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const gate = await requireEnterpriseStartupAdmin(user.id, id);
    if (!gate.ok) return gate.response;

    const { data, error } = await gate.adminClient
      .from("startup_card_access")
      .select("id, email, status, accepted_at, revoked_at, created_at, updated_at")
      .eq("startup_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to load startup access", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, access: data || [] });
  } catch (error) {
    console.error("Startup access list error:", error);
    return NextResponse.json({ error: "Failed to load startup access" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const gate = await requireEnterpriseStartupAdmin(user.id, id);
    if (!gate.ok) return gate.response;

    const { invitedEmail, password } = await request
      .json()
      .catch(() => ({ invitedEmail: "", password: "" }));
    const email = String(invitedEmail || "").trim().toLowerCase();
    const initialPassword = String(password || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (email === (user.email || "").toLowerCase()) {
      return NextResponse.json(
        { error: "You already own this workspace" },
        { status: 400 }
      );
    }

    const { data: existingByEmail } = await gate.adminClient
      .from("startup_card_access")
      .select("id, startup_id, user_id, email, status")
      .eq("email", email)
      .maybeSingle<ExistingAccess>();

    if (existingByEmail && existingByEmail.startup_id !== id) {
      return NextResponse.json(
        { error: "This email is already linked to another startup card" },
        { status: 400 }
      );
    }

    const { data: existingAccount } = await gate.adminClient
      .from("users")
      .select("id, email, full_name, plan, plan_active")
      .eq("email", email)
      .maybeSingle();

    if (existingAccount?.plan_active) {
      return NextResponse.json(
        { error: "This email belongs to an active paid Evaldam account. Use a dedicated startup contact email." },
        { status: 400 }
      );
    }

    if (existingAccount) {
      const { count: ownedStartupCount } = await gate.adminClient
        .from("startups")
        .select("id", { count: "exact", head: true })
        .eq("user_id", existingAccount.id);

      if ((ownedStartupCount || 0) > 0) {
        return NextResponse.json(
          { error: "This email already owns a startup workspace. Use a dedicated startup contact email." },
          { status: 400 }
        );
      }
    }

    let contributorUser = existingAccount
      ? {
          id: existingAccount.id,
          email,
          fullName: existingAccount.full_name || displayNameFromEmail(email),
        }
      : null;
    const createdNewAccount = !contributorUser;

    if (!contributorUser) {
      if (initialPassword.length < 8) {
        return NextResponse.json(
          { error: "Initial password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const fullName = displayNameFromEmail(email);
      const { data: createdUser, error: createError } = await gate.adminClient.auth.admin.createUser({
        email,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, source: "startup_card_access" },
      });

      if (createError || !createdUser.user) {
        return NextResponse.json(
          { error: createError?.message || "Failed to create startup login" },
          { status: 400 }
        );
      }

      contributorUser = {
        id: createdUser.user.id,
        email,
        fullName,
      };

      await gate.adminClient.from("user_profiles").upsert({
        id: contributorUser.id,
        tier: "free",
        startup_count: 0,
        max_startups: 0,
        updated_at: new Date().toISOString(),
      });
    }

    await completeStartupContributorOnboarding(gate.adminClient, {
      id: contributorUser.id,
      email,
      fullName: contributorUser.fullName,
    });

    const { data: existingByUser } = await gate.adminClient
      .from("startup_card_access")
      .select("id, startup_id, user_id, email, status")
      .eq("user_id", contributorUser.id)
      .maybeSingle<ExistingAccess>();

    if (existingByUser && existingByUser.startup_id !== id) {
      return NextResponse.json(
        { error: "This login is already linked to another startup card" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const accessPayload = {
      workspace_id: gate.startupAccess.access.workspaceId,
      startup_id: id,
      user_id: contributorUser.id,
      email,
      role: "startup_contributor",
      status: "accepted",
      invited_by: user.id,
      accepted_at: now,
      revoked_at: null,
      updated_at: now,
    };

    const accessWrite = existingByEmail || existingByUser
      ? await gate.adminClient
          .from("startup_card_access")
          .update(accessPayload)
          .eq("id", (existingByEmail || existingByUser)?.id)
          .select("id, email, status, accepted_at, revoked_at, created_at, updated_at")
          .single()
      : await gate.adminClient
          .from("startup_card_access")
          .insert(accessPayload)
          .select("id, email, status, accepted_at, revoked_at, created_at, updated_at")
          .single();

    if (accessWrite.error) {
      return NextResponse.json(
        { error: "Failed to invite startup", details: accessWrite.error.message },
        { status: 500 }
      );
    }

    const inviterProfile = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile.data?.full_name || user.email || "A portfolio Admin";
    const template = startupContributorAccountEmailTemplate({
      inviterName,
      invitedEmail: email,
      startupName: String(gate.startupAccess.startup.company_name || "the startup"),
      startupId: id,
      isNewAccount: createdNewAccount,
    });

    sendEmail({
      recipients: { to: [email] },
      content: {
        subject: `${inviterName} shared ${gate.startupAccess.startup.company_name || "a startup"} on Evaldam`,
        htmlBody: template.html,
        textBody: template.text,
      },
    }).then((result) => {
      if (!result.success) {
        logger.warn("Failed to send startup contributor email", { invitedEmail: email, error: result.error });
      }
    }).catch((err) => {
      logger.warn("Failed to send startup contributor email", { invitedEmail: email, error: String(err) });
    });

    return NextResponse.json({
      success: true,
      message: createdNewAccount
        ? "Startup access added. They can sign in with the password you set."
        : "Startup access added. They can sign in with their existing password.",
      access: accessWrite.data,
      createdNewAccount,
    });
  } catch (error) {
    console.error("Startup access invite error:", error);
    return NextResponse.json({ error: "Failed to invite startup" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const gate = await requireEnterpriseStartupAdmin(user.id, id);
    if (!gate.ok) return gate.response;

    const { accessId } = await request.json().catch(() => ({ accessId: "" }));
    if (!accessId) {
      return NextResponse.json({ error: "Access ID required" }, { status: 400 });
    }

    const { error } = await gate.adminClient
      .from("startup_card_access")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", String(accessId))
      .eq("startup_id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to revoke startup access", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Startup access revoked" });
  } catch (error) {
    console.error("Startup access revoke error:", error);
    return NextResponse.json({ error: "Failed to revoke startup access" }, { status: 500 });
  }
}

async function completeStartupContributorOnboarding(
  adminClient: ReturnType<typeof createAdminClient>,
  user: { id: string; email: string; fullName: string }
) {
  const now = new Date().toISOString();
  const { data: account } = await adminClient
    .from("users")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingPatch = {
    onboarding_completed: true,
    onboarding_completed_at: now,
    onboarding_data: { source: "startup_card_access" },
    sales_qualification: { source: "startup_card_access", role: "startup_contributor" },
  };

  if (account) {
    if (!account.onboarding_completed) {
      await adminClient
        .from("users")
        .update(onboardingPatch)
        .eq("id", user.id);
    }
    return;
  }

  await adminClient
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      plan: "free",
      plan_active: false,
      billing_cycle: "annual",
      ...onboardingPatch,
    });
}
