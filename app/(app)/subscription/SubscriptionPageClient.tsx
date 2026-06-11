"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  ReceiptText,
} from "lucide-react";
import { AppWorkspaceSidebar } from "@/components/AppWorkspaceSidebar";
import { createAppWorkspaceSidebarItems } from "@/components/app-workspace-nav";
import { CancelAtPeriodEndModal } from "@/components/CancelAtPeriodEndModal";
import { CancelSubscriptionConfirmModal } from "@/components/CancelSubscriptionConfirmModal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { SettingsModal } from "@/components/SettingsModal";
import { getPlanDisplayName, normalizePlanKey } from "@/lib/plans/plan-limits";
import { formatPrice, getPricing } from "@/lib/utils/currency";

type UsageMetric = {
  used: number;
  limit: number;
  label: string;
  resetAt?: string | null;
};

type SubscriptionUsage = {
  billing?: {
    plan?: string | null;
    planActive?: boolean | null;
    billingCycle?: string | null;
    subscriptionId?: string | null;
    subscriptionEndDate?: string | null;
    cancelAtPeriodEnd?: boolean | null;
    cancelledAt?: string | null;
    metadata?: Record<string, unknown>;
  };
  usage?: {
    startupProfiles?: UsageMetric;
    reportDownloads?: UsageMetric;
    aiQuestions?: UsageMetric;
    teamSeats?: UsageMetric;
  };
};

type UserInfo = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  plan?: string | null;
  plan_active?: boolean | null;
  billing_cycle?: string | null;
  subscription_id?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  subscription_cancelled_at?: string | null;
  tier?: string;
  startup_count?: number;
  max_startups?: number;
  workspace_id?: string;
  workspace_role?: "admin" | "member" | "startup_contributor";
  workspace_owner_name?: string | null;
  workspace_owner_email?: string | null;
  valuation_count?: number;
};

type InvoiceItem = {
  paymentId: string;
  invoiceNumber: string;
  status: string;
  sentAt: string | null;
  email: string;
};

const planActions = [
  {
    key: "startup",
    label: "Startup",
    monthlyHref: "/checkout?plan=startup&billingCycle=monthly",
    annualHref: "/checkout?plan=startup&billingCycle=annual",
  },
  {
    key: "agency",
    label: "Agency / Investor",
    monthlyHref: "/checkout?plan=agency&billingCycle=monthly",
    annualHref: "/checkout?plan=agency&billingCycle=annual",
  },
];

export function SubscriptionPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCancelAtPeriodEnd, setShowCancelAtPeriodEnd] = useState(false);
  const [showCancelAndDelete, setShowCancelAndDelete] = useState(false);
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscription() {
      setLoading(true);
      setError("");

      try {
        const workspaceResponse = await fetch("/api/workspace/context", { credentials: "include" });
        const workspacePayload = await workspaceResponse.json().catch(() => ({}));
        if (workspaceResponse.status === 401) {
          router.push("/login?next=/subscription");
          return;
        }
        if (!workspaceResponse.ok || !workspacePayload.success) {
          throw new Error(workspacePayload.error || "Could not load workspace billing context.");
        }

        const workspaceId = workspacePayload.userInfo?.workspace_id;
        const usageResponse = await fetch(`/api/subscription/usage${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`);
        const usagePayload = await usageResponse.json().catch(() => ({}));
        if (!usageResponse.ok) throw new Error(usagePayload.error || "Could not load subscription details.");

        if (!cancelled) {
          const loadedUser = workspacePayload.userInfo;
          setUserInfo(loadedUser ? {
            ...loadedUser,
            full_name: loadedUser.full_name || loadedUser.email?.split("@")[0] || "Account",
            plan: loadedUser.plan || "free",
            plan_active: Boolean(loadedUser.plan_active),
          } : null);
          setUsage(usagePayload);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load subscription details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const billing = usage?.billing;
  const activePlan = billing?.plan || userInfo?.plan || "free";
  const activePlanIsActive = billing?.planActive ?? userInfo?.plan_active ?? false;
  const normalizedPlan = normalizePlanKey(activePlan, activePlanIsActive);
  const activeBillingCycle = billing?.billingCycle || userInfo?.billing_cycle || "";
  const subscriptionId = billing?.subscriptionId || userInfo?.subscription_id || "";
  const endDate = billing?.subscriptionEndDate || userInfo?.subscription_end_date || null;
  const cancelAtPeriodEnd = Boolean(billing?.cancelAtPeriodEnd ?? userInfo?.subscription_cancel_at_period_end);
  const isWorkspaceAdmin = (userInfo?.workspace_role || "admin") === "admin";
  const isRazorpaySubscription = subscriptionId.startsWith("razorpay_subscription:");
  const planLabel = getPlanDisplayName(activePlan, activePlanIsActive);
  const userName = userInfo?.full_name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "Account";
  const userInitial = (userInfo?.full_name || userInfo?.email || "A")[0].toUpperCase();
  const appNavItems = createAppWorkspaceSidebarItems("subscription", () => setSettingsOpen(true));
  const dateLabel = formatDateLabel(endDate);
  const usageMetrics = useMemo(() => buildUsageMetrics(usage), [usage]);
  const invoiceItems = useMemo(() => getInvoiceItems(billing?.metadata), [billing?.metadata]);
  const subscriptionStatus = cancelAtPeriodEnd ? "Cancels at period end" : activePlanIsActive ? "Active" : "Free";
  const priceLabel = getPlanPriceLabel(normalizedPlan, activeBillingCycle);
  const renewalLabel = cancelAtPeriodEnd
    ? dateLabel
      ? `Your plan remains active until ${dateLabel}.`
      : "Your plan remains active until the current period ends."
    : isRazorpaySubscription
      ? dateLabel
        ? `Your plan renews on ${dateLabel}.`
        : "Your plan renews automatically."
      : activePlanIsActive && dateLabel
        ? `Your access ends on ${dateLabel}.`
        : "No paid billing is active.";
  const paymentMethodLabel = isRazorpaySubscription
    ? "Razorpay autopay authorized"
    : activePlanIsActive
      ? "One-time Razorpay checkout"
      : "No saved payment method";
  const paymentMethodDetail = isRazorpaySubscription
    ? "Future renewals are handled by Razorpay. Evaldam AI does not store card, UPI, or bank details."
    : activePlanIsActive
      ? "This plan does not auto-renew. Add monthly checkout if you want automatic future billing."
      : "Add a monthly plan to authorize recurring billing through Razorpay.";

  const handleCancelAtPeriodEnd = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_at_period_end" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update subscription.");

      setUsage((current) => ({
        ...(current || {}),
        billing: {
          ...(current?.billing || {}),
          cancelAtPeriodEnd: true,
          subscriptionEndDate: data.subscriptionEndDate || endDate || null,
          cancelledAt: data.cancelledAt || new Date().toISOString(),
        },
      }));
      setSuccess(data.message || "Auto-renewal cancelled. Your plan stays active until the current period ends.");
      setShowCancelAtPeriodEnd(false);
      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Could not update subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAndDelete = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_and_delete",
          confirmation: "I want to delete my subscription and data",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update subscription.");

      setSuccess("Subscription cancelled and workspace data deleted.");
      setShowCancelAndDelete(false);
      setUserInfo((current) => current ? { ...current, plan: "free", plan_active: false, subscription_id: null, subscription_end_date: new Date().toISOString() } : current);
      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Could not update subscription.");
      throw cancelError;
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not export account data.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getExportFilename(response.headers.get("Content-Disposition"));
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setSuccess("Account export downloaded.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Could not export account data.");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex min-h-[420px] max-w-5xl items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <AppWorkspaceSidebar
        items={appNavItems}
        isOpen={workspaceSidebarOpen}
        onOpenChange={setWorkspaceSidebarOpen}
      />

      <div className="lg:pl-20">
        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mb-8">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Billing</h1>
          </div>

          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>}
          {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{success}</div>}
          {!isWorkspaceAdmin && (
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              Billing changes are available to the workspace Admin.
            </div>
          )}

          <BillingSection label="Current plan">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{planLabel}</h2>
                <p className="mt-2 text-2xl font-medium text-slate-900">{priceLabel}</p>
                <p className="mt-4 text-sm text-slate-500">{renewalLabel}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{subscriptionStatus}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={getPrimaryUpgradeHref(normalizedPlan)} className="btn btn-primary justify-center">
                  Update plan
                </Link>
                {activePlanIsActive && normalizedPlan !== "free" ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelAtPeriodEnd(true)}
                    disabled={!isWorkspaceAdmin || cancelAtPeriodEnd || actionLoading || !isRazorpaySubscription}
                    className="btn btn-secondary justify-center disabled:opacity-50"
                  >
                    Cancel plan
                  </button>
                ) : null}
              </div>
            </div>
          </BillingSection>

          <BillingSection label="Payment method">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-lg bg-blue-700 px-2 py-1 text-xs font-bold text-white">
                    RZP
                  </span>
                  <span className="text-lg font-medium text-slate-900">{paymentMethodLabel}</span>
                  {isRazorpaySubscription ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Default</span>
                  ) : null}
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{paymentMethodDetail}</p>
              </div>
              {dateLabel && isRazorpaySubscription ? <p className="text-sm font-semibold text-slate-700">Next {dateLabel}</p> : null}
            </div>
            <Link href="/checkout?plan=startup&billingCycle=monthly" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary">
              <Plus className="h-4 w-4" />
              Add payment method
            </Link>
          </BillingSection>

          <BillingSection label="Usage">
            <div className="space-y-5">
              {usageMetrics.map((metric) => (
                <UsageRow key={metric.label} metric={metric} />
              ))}
            </div>
          </BillingSection>

          <BillingSection label="Billing history">
            {invoiceItems.length ? (
              <div className="space-y-4">
                {invoiceItems.slice(0, 6).map((invoice) => (
                  <div key={invoice.paymentId} className="grid gap-2 text-sm sm:grid-cols-[150px_1fr_180px] sm:items-center">
                    <span className="font-medium text-slate-900">{formatDateLabel(invoice.sentAt) || "-"}</span>
                    <span className="font-semibold text-slate-900">{invoice.invoiceNumber}</span>
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <ReceiptText className="h-4 w-4" />
                      {invoice.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No invoices yet.</p>
            )}
          </BillingSection>

          <BillingSection label="Workspace data">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void handleExportData()} disabled={exportLoading} className="btn btn-secondary inline-flex items-center justify-center gap-2">
                {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export data
              </button>
              {activePlanIsActive && normalizedPlan !== "free" ? (
                <button
                  type="button"
                  onClick={() => setShowCancelAndDelete(true)}
                  disabled={!isWorkspaceAdmin || actionLoading}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel and delete data
                </button>
              ) : null}
            </div>
          </BillingSection>

          <BillingSection label="Plan options">
            <div className="grid gap-4 sm:grid-cols-2">
              {planActions.map((plan) => {
                const isCurrent = normalizedPlan === plan.key;
                const isRequested = requestedPlan === plan.key;
                return (
                  <div key={plan.key} className={`rounded-xl border px-4 py-4 ${isRequested ? "border-primary" : "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-900">{plan.label}</h3>
                      {isCurrent ? <span className="text-xs font-bold uppercase text-primary">Current</span> : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={plan.monthlyHref} className="btn btn-secondary btn-sm">
                        Monthly
                      </Link>
                      <Link href={plan.annualHref} className="btn btn-primary btn-sm">
                        Annual
                      </Link>
                    </div>
                  </div>
                );
              })}
              <Link href="/contact?intent=enterprise" className="rounded-xl border border-slate-200 px-4 py-4 text-sm font-bold text-slate-900 hover:border-primary">
                Enterprise
                <p className="mt-1 text-xs font-normal text-slate-500">Custom limits, SSO, dedicated support, and SLA.</p>
                <span className="mt-4 flex items-center gap-2 text-slate-500">
                  Contact team <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </BillingSection>
        </section>
      </div>

      <ProfileMenu
        userInfo={userInfo || undefined}
        userName={userName}
        userInitial={userInitial}
        onSettingsOpen={() => setSettingsOpen(true)}
        position="left-6"
        planLabel={planLabel}
        planDetail={activePlanIsActive ? subscriptionStatus : "Free workspace"}
        compactButton={!workspaceSidebarOpen}
      />

      {settingsOpen && userInfo && (
        <SettingsModal
          user={{
            ...userInfo,
            plan: userInfo.plan || "free",
            plan_active: Boolean(userInfo.plan_active),
            billing_cycle: userInfo.billing_cycle || undefined,
          }}
          onClose={() => setSettingsOpen(false)}
          onUserUpdate={(updates) => setUserInfo((current) => current ? { ...current, ...updates } : current)}
        />
      )}

      <CancelAtPeriodEndModal
        isOpen={showCancelAtPeriodEnd}
        onClose={() => setShowCancelAtPeriodEnd(false)}
        onConfirm={handleCancelAtPeriodEnd}
        currentPlan={planLabel}
        endDateLabel={dateLabel}
        isLoading={actionLoading}
      />
      <CancelSubscriptionConfirmModal
        isOpen={showCancelAndDelete}
        onClose={() => setShowCancelAndDelete(false)}
        onConfirm={handleCancelAndDelete}
        onExportData={handleExportData}
        currentPlan={planLabel}
        isLoading={actionLoading}
        isExporting={exportLoading}
      />
    </main>
  );
}

function BillingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-8">
      <p className="mb-5 text-sm font-semibold text-slate-700">{label}</p>
      {children}
    </section>
  );
}

function UsageRow({ metric }: { metric: UsageMetric }) {
  const percentage = usagePercentage(metric.used, metric.limit);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-600">{metric.label}</span>
        <span className="font-bold text-slate-900">
          {metric.used.toLocaleString()} / {formatUsageLimit(metric.limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden bg-slate-100">
        <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
      {metric.resetAt ? <p className="mt-1 text-xs text-slate-400">Resets {formatDateLabel(metric.resetAt)}</p> : null}
    </div>
  );
}

function buildUsageMetrics(usage: SubscriptionUsage | null) {
  return [
    usage?.usage?.startupProfiles || { used: 0, limit: 1, label: "Startup profiles" },
    usage?.usage?.reportDownloads || { used: 0, limit: 0, label: "PDF reports this month" },
    usage?.usage?.aiQuestions || { used: 0, limit: 0, label: "Startup AI questions" },
    usage?.usage?.teamSeats || { used: 0, limit: 0, label: "Team seats" },
  ].filter((metric) => metric.limit > 0 || metric.used > 0);
}

function getInvoiceItems(metadata?: Record<string, unknown>): InvoiceItem[] {
  const invoiceEmails = asRecord(metadata?.invoiceEmails);
  return Object.entries(invoiceEmails)
    .map(([paymentId, raw]) => {
      const invoice = asRecord(raw);
      return {
        paymentId,
        invoiceNumber: stringValue(invoice.invoiceNumber) || paymentId,
        status: stringValue(invoice.status) || "sent",
        sentAt: stringValue(invoice.sentAt),
        email: stringValue(invoice.email) || "",
      };
    })
    .sort((first, second) => new Date(second.sentAt || 0).getTime() - new Date(first.sentAt || 0).getTime());
}

function usagePercentage(used: number, limit: number) {
  if (limit <= 0) return 0;
  if (limit >= 999999) return Math.min(100, used > 0 ? 8 : 0);
  return Math.min(100, Math.round((used / limit) * 100));
}

function formatUsageLimit(limit: number) {
  return limit >= 999999 ? "Unlimited" : limit.toLocaleString();
}

function formatDateLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getExportFilename(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="([^"]+)"/i);
  return match?.[1] || `evaldam-account-export-${new Date().toISOString().slice(0, 10)}.json`;
}

function getPlanPriceLabel(plan: string, billingCycle: string | null | undefined) {
  if (plan === "free") return "Free";
  const pricing = getPricing("USD");
  const isAnnual = billingCycle === "annual";
  if (plan === "agency") return `${formatPrice(isAnnual ? pricing.plus_annual : pricing.plus_price, "USD")} ${isAnnual ? "per year" : "per month"}`;
  return `${formatPrice(isAnnual ? pricing.pro_annual : pricing.pro_price, "USD")} ${isAnnual ? "per year" : "per month"}`;
}

function getPrimaryUpgradeHref(plan: string) {
  if (plan === "agency") return "/checkout?plan=agency&billingCycle=annual";
  return "/checkout?plan=startup&billingCycle=monthly";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
