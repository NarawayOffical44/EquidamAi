import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportSection<T = unknown> = {
  data: T[];
  error?: string;
};

type QueryResult<T = unknown> = {
  data: T[] | null;
  error: { message?: string } | null;
};

type ExportQuery = PromiseLike<QueryResult<unknown>> & {
  eq: (column: string, value: string) => ExportQuery;
  in: (column: string, values: string[]) => PromiseLike<QueryResult<unknown>>;
};

type ExportDb = {
  from: (table: string) => {
    select: (columns: string) => ExportQuery;
  };
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return NextResponse.json({ error: "Sign in to export your account data." }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const db = adminClient as unknown as ExportDb;
  const [account, profile, startups, valuations] = await Promise.all([
    safeQuery("users", db.from("users").select("*").eq("id", user.id)),
    safeQuery("user_profiles", db.from("user_profiles").select("*").eq("id", user.id)),
    safeQuery("startups", db.from("startups").select("*").eq("user_id", user.id)),
    safeQuery("valuations", db.from("valuations").select("*").eq("user_id", user.id)),
  ]);

  const startupIds = idsFrom(startups.data);
  const valuationIds = idsFrom(valuations.data);

  const [
    valuationMethods,
    valuationEvidence,
    valuationVersions,
    valuationHistory,
    reports,
    reportData,
    ownedTeamMembers,
    acceptedTeamMemberships,
    teamInvitations,
    apiKeys,
    apiWallets,
    apiCreditTransactions,
    apiUsageEvents,
    aiUsageCounters,
    startupAiThreads,
    startupCardAccess,
    comparableSelections,
  ] = await Promise.all([
    safeInQuery("valuation_methods", db.from("valuation_methods").select("*"), "valuation_id", valuationIds),
    safeInQuery("valuation_evidence", db.from("valuation_evidence").select("*"), "valuation_id", valuationIds),
    safeInQuery("valuation_versions", db.from("valuation_versions").select("*"), "valuation_id", valuationIds),
    safeQuery("valuation_history", db.from("valuation_history").select("*").eq("user_id", user.id)),
    safeQuery("reports", db.from("reports").select("*").eq("user_id", user.id)),
    safeInQuery("report_data", db.from("report_data").select("*"), "valuation_id", valuationIds),
    safeQuery("team_members_owned_workspace", db.from("team_members").select("*").eq("workspace_id", user.id)),
    safeQuery("team_members_accepted", db.from("team_members").select("*").eq("user_id", user.id)),
    safeQuery("team_invitations", db.from("team_invitations").select("*").eq("workspace_id", user.id)),
    safeQuery("api_keys", db.from("api_keys").select("id, user_id, name, key_prefix, status, last_used_at, revoked_at, created_at").eq("user_id", user.id)),
    safeQuery("api_wallets", db.from("api_wallets").select("*").eq("user_id", user.id)),
    safeQuery("api_credit_transactions", db.from("api_credit_transactions").select("*").eq("user_id", user.id)),
    safeQuery("api_usage_events", db.from("api_usage_events").select("*").eq("user_id", user.id)),
    safeQuery("ai_usage_counters", db.from("ai_usage_counters").select("*").eq("user_id", user.id)),
    safeQuery("startup_ai_chat_threads", db.from("startup_ai_chat_threads").select("*").eq("user_id", user.id)),
    safeInQuery("startup_card_access", db.from("startup_card_access").select("*"), "startup_id", startupIds),
    safeInQuery("comparable_selections", db.from("comparable_selections").select("*"), "startup_id", startupIds),
  ]);

  const exportedAt = new Date().toISOString();
  const payload = {
    exportedAt,
    accountEmail: user.email || null,
    account,
    profile,
    startups,
    valuations,
    valuationMethods,
    valuationEvidence,
    valuationVersions,
    valuationHistory,
    reports,
    reportData,
    team: {
      ownedWorkspaceMembers: ownedTeamMembers,
      acceptedMemberships: acceptedTeamMemberships,
      invitations: teamInvitations,
    },
    api: {
      keys: apiKeys,
      wallet: apiWallets,
      creditTransactions: apiCreditTransactions,
      usageEvents: apiUsageEvents,
    },
    ai: {
      usageCounters: aiUsageCounters,
      startupAiThreads,
    },
    startupCardAccess,
    comparableSelections,
  };

  const fileDate = exportedAt.slice(0, 10);
  const body = JSON.stringify(payload, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="evaldam-account-export-${fileDate}.json"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function safeQuery<T = unknown>(
  label: string,
  query: PromiseLike<QueryResult<T>>
): Promise<ExportSection<T>> {
  try {
    const result = await query;
    if (result.error) {
      return { data: [], error: `${label}: ${result.error.message || "unavailable"}` };
    }
    return { data: result.data || [] };
  } catch (error) {
    return { data: [], error: `${label}: ${error instanceof Error ? error.message : "unavailable"}` };
  }
}

async function safeInQuery<T = unknown>(
  label: string,
  query: { in: (column: string, values: string[]) => PromiseLike<QueryResult<T>> },
  column: string,
  ids: string[]
): Promise<ExportSection<T>> {
  if (ids.length === 0) return { data: [] };
  return safeQuery(label, query.in(column, ids));
}

function idsFrom(rows: unknown[]) {
  return rows
    .map((row) => (isRecord(row) && typeof row.id === "string" ? row.id : null))
    .filter((id): id is string => Boolean(id));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
