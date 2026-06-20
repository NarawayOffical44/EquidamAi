import { SupabaseClient } from "@supabase/supabase-js";

type RawRecord = Record<string, unknown>;

export type AdminLead = {
  id: string;
  source: string;
  sourceLabel: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  companyName: string | null;
  websiteUrl: string | null;
  useCase: string | null;
  plan: string | null;
  billingCycle: string | null;
  currency: string | null;
  country: string | null;
  city: string | null;
  ipAddress: string | null;
  valuationLow: number | null;
  valuationMid: number | null;
  valuationHigh: number | null;
  status: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  raw: RawRecord;
};

export type AdminSourceStatus = {
  key: string;
  label: string;
  count: number;
  error: string | null;
};

export type AdminLeadData = {
  leads: AdminLead[];
  sourceStatus: AdminSourceStatus[];
};

const ADMIN_ROLE = "admin";

// Built-in admin emails - always allowed regardless of env var
const BUILT_IN_ADMIN_EMAILS = ["admin@equidam.com"];

export function getConfiguredAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
}

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (BUILT_IN_ADMIN_EMAILS.includes(normalized)) return true;
  const configuredEmail = getConfiguredAdminEmail();
  return Boolean(configuredEmail && normalized === configuredEmail);
}

export function isAllowedAdminRole(role?: string | null) {
  return role === ADMIN_ROLE;
}

export async function getAdminAccessForUser(
  adminClient: SupabaseClient,
  user: { id: string; email?: string | null }
) {
  if (isAllowedAdminEmail(user.email)) {
    return { allowed: true, method: "email" as const, role: null };
  }

  const { data, error } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = stringValue(asRecord(data), "role");
  return {
    allowed: !error && isAllowedAdminRole(role),
    method: "role" as const,
    role,
  };
}

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : {};
}

function stringValue(record: RawRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function booleanValue(record: RawRecord, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function numberValue(record: RawRecord, key: string): number | null {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function parseMetadata(value: string | null): RawRecord {
  if (!value) return {};
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return {};
  }
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    free_valuation: "Free valuation",
    checkout: "Checkout request",
    contact_form: "Contact form",
    github_repo_valuation: "GitHub valuation",
    sample_report_download: "Sample report download",
    enterprise_inquiry: "Enterprise inquiry",
    email_sequence: "Nurture sequence",
    account_signup: "Account signup",
    unknown: "Unknown",
  };
  return labels[source] || source.replace(/_/g, " ");
}

function isUrl(value: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function normalizeLeadRow(row: RawRecord): AdminLead {
  const metadataFromColumn = asRecord(row.metadata);
  const metadata = Object.keys(metadataFromColumn).length
    ? metadataFromColumn
    : parseMetadata(stringValue(row, "website_url"));
  const metadataSource = stringValue(metadata, "source") || stringValue(metadata, "type");
  const hasValuation =
    numberValue(row, "valuation_low") !== null ||
    numberValue(row, "valuation_mid") !== null ||
    numberValue(row, "valuation_high") !== null;
  const source = metadataSource || (hasValuation ? "free_valuation" : "unknown");
  const websiteFromRow = stringValue(row, "website_url");
  const websiteFromMetadata = stringValue(metadata, "websiteUrl");

  return {
    id: `leads:${stringValue(row, "id") || crypto.randomUUID()}`,
    source,
    sourceLabel: sourceLabel(source),
    email: stringValue(row, "email") || "",
    fullName: stringValue(metadata, "fullName"),
    phone: stringValue(row, "phone"),
    companyName: stringValue(row, "company_name"),
    websiteUrl: isUrl(websiteFromRow) ? websiteFromRow : websiteFromMetadata,
    useCase: stringValue(metadata, "useCase"),
    plan: stringValue(metadata, "plan"),
    billingCycle: stringValue(metadata, "billingCycle"),
    currency: stringValue(metadata, "currency"),
    country: stringValue(row, "country"),
    city: stringValue(row, "city"),
    ipAddress: stringValue(row, "ip_address"),
    valuationLow: numberValue(row, "valuation_low"),
    valuationMid: numberValue(row, "valuation_mid"),
    valuationHigh: numberValue(row, "valuation_high"),
    status: null,
    createdAt: stringValue(row, "created_at") || new Date(0).toISOString(),
    lastSignInAt: null,
    raw: { ...row, parsed_metadata: metadata },
  };
}

function normalizeSequenceLead(row: RawRecord): AdminLead {
  return {
    id: `email_sequence_leads:${stringValue(row, "id") || crypto.randomUUID()}`,
    source: "email_sequence",
    sourceLabel: sourceLabel("email_sequence"),
    email: stringValue(row, "email") || "",
    fullName: null,
    phone: null,
    companyName: stringValue(row, "company_name"),
    websiteUrl: null,
    useCase: "Free valuation nurture email sequence",
    plan: null,
    billingCycle: null,
    currency: null,
    country: null,
    city: null,
    ipAddress: null,
    valuationLow: null,
    valuationMid: numberValue(row, "valuation_mid"),
    valuationHigh: null,
    status: booleanValue(row, "converted_to_paid_user") ? "converted" : "nurturing",
    createdAt: stringValue(row, "created_at") || new Date(0).toISOString(),
    lastSignInAt: null,
    raw: row,
  };
}

function normalizeEnterpriseInquiry(row: RawRecord): AdminLead {
  return {
    id: `enterprise_inquiries:${stringValue(row, "id") || crypto.randomUUID()}`,
    source: "enterprise_inquiry",
    sourceLabel: sourceLabel("enterprise_inquiry"),
    email: stringValue(row, "email") || "",
    fullName: stringValue(row, "name"),
    phone: null,
    companyName: stringValue(row, "company"),
    websiteUrl: null,
    useCase: stringValue(row, "message"),
    plan: "enterprise",
    billingCycle: null,
    currency: null,
    country: null,
    city: null,
    ipAddress: null,
    valuationLow: null,
    valuationMid: null,
    valuationHigh: null,
    status: stringValue(row, "status"),
    createdAt: stringValue(row, "created_at") || new Date(0).toISOString(),
    lastSignInAt: null,
    raw: row,
  };
}

function normalizeAccountSignup(authUser: RawRecord, publicUser: RawRecord): AdminLead {
  const metadata = asRecord(authUser.user_metadata);
  const id = stringValue(authUser, "id") || stringValue(publicUser, "id") || crypto.randomUUID();
  const email = stringValue(authUser, "email") || stringValue(publicUser, "email") || "";
  const plan = stringValue(publicUser, "plan");
  const planActive = booleanValue(publicUser, "plan_active");

  return {
    id: `account_signup:${id}`,
    source: "account_signup",
    sourceLabel: sourceLabel("account_signup"),
    email,
    fullName: stringValue(publicUser, "full_name") || stringValue(metadata, "full_name"),
    phone: stringValue(publicUser, "phone"),
    companyName: stringValue(publicUser, "company_name"),
    websiteUrl: stringValue(publicUser, "website"),
    useCase: "Account created",
    plan,
    billingCycle: stringValue(publicUser, "billing_cycle"),
    currency: null,
    country: stringValue(publicUser, "country"),
    city: null,
    ipAddress: null,
    valuationLow: null,
    valuationMid: null,
    valuationHigh: null,
    status: planActive === null ? "auth_only" : planActive ? "paid_active" : "inactive",
    createdAt:
      stringValue(authUser, "created_at") ||
      stringValue(publicUser, "created_at") ||
      new Date(0).toISOString(),
    lastSignInAt: stringValue(authUser, "last_sign_in_at"),
    raw: {
      auth_user: authUser,
      public_user: publicUser,
    },
  };
}

async function loadTable(
  adminClient: SupabaseClient,
  table: string,
  label: string
): Promise<{ rows: RawRecord[]; status: AdminSourceStatus }> {
  const { data, error } = await adminClient
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data || []).map(asRecord);
  return {
    rows,
    status: {
      key: table,
      label,
      count: rows.length,
      error: error?.message || null,
    },
  };
}

export async function fetchAdminLeadData(adminClient: SupabaseClient): Promise<AdminLeadData> {
  const [leadsResult, sequenceResult, enterpriseResult, publicUsersResult] = await Promise.all([
    loadTable(adminClient, "leads", "Leads table"),
    loadTable(adminClient, "email_sequence_leads", "Email sequence leads"),
    loadTable(adminClient, "enterprise_inquiries", "Enterprise inquiries"),
    loadTable(adminClient, "users", "User accounts"),
  ]);

  const publicUsersById = new Map(
    publicUsersResult.rows
      .map((row) => [stringValue(row, "id"), row] as const)
      .filter(([id]) => Boolean(id))
  );

  const authUsersResult = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authUsers = (authUsersResult.data?.users || []).map((user) => asRecord(user));
  const authUserIds = new Set(authUsers.map((user) => stringValue(user, "id")).filter(Boolean));
  const authStatus: AdminSourceStatus = {
    key: "auth_users",
    label: "Auth signups",
    count: authUsers.length,
    error: authUsersResult.error?.message || null,
  };

  const accountLeads = [
    ...authUsers.map((authUser) => {
      const publicUser = publicUsersById.get(stringValue(authUser, "id")) || {};
      return normalizeAccountSignup(authUser, publicUser);
    }),
    ...publicUsersResult.rows
      .filter((publicUser) => !authUserIds.has(stringValue(publicUser, "id")))
      .map((publicUser) => normalizeAccountSignup({}, publicUser)),
  ];

  const leads = [
    ...leadsResult.rows.map(normalizeLeadRow),
    ...sequenceResult.rows.map(normalizeSequenceLead),
    ...enterpriseResult.rows.map(normalizeEnterpriseInquiry),
    ...accountLeads,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    leads,
    sourceStatus: [
      leadsResult.status,
      sequenceResult.status,
      enterpriseResult.status,
      publicUsersResult.status,
      authStatus,
    ],
  };
}
