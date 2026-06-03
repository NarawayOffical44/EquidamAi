"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CancelAtPeriodEndModal } from "@/components/CancelAtPeriodEndModal";
import { CancelSubscriptionConfirmModal } from "@/components/CancelSubscriptionConfirmModal";
import { getPlanDisplayName, normalizePlanKey } from "@/lib/plans/plan-limits";

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
  };
  usage?: {
    startupProfiles?: UsageMetric;
    reportDownloads?: UsageMetric;
    aiQuestions?: UsageMetric;
    teamSeats?: UsageMetric;
  };
};

type UserInfo = {
  plan?: string | null;
  plan_active?: boolean | null;
  billing_cycle?: string | null;
  subscription_id?: string | null;
  subscription_end_date?: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  workspace_role?: "admin" | "member" | "startup_contributor";
};

const planActions = [
  {
    key: "startup",
    label: "Startup",
    detail: "Single startup workspace",
    monthlyHref: "/checkout?plan=startup&billingCycle=monthly",
    annualHref: "/checkout?plan=startup&billingCycle=annual",
  },
  {
    key: "agency",
    label: "Agency / Investor",
    detail: "Portfolio and team workspace",
    monthlyHref: "/checkout?plan=agency&billingCycle=monthly",
    annualHref: "/checkout?plan=agency&billingCycle=annual",
  },
  {
    key: "enterprise",
    label: "Enterprise",
    detail: "Custom workflows and limits",
    monthlyHref: "/contact?intent=enterprise",
    annualHref: "/contact?intent=enterprise",
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
          setUserInfo(workspacePayload.userInfo || null);
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
  const dateLabel = formatDateLabel(endDate);
  const usageMetrics = useMemo(() => buildUsageMetrics(usage), [usage]);
  const subscriptionStatus = cancelAtPeriodEnd ? "Cancels at period end" : activePlanIsActive ? "Active" : "Free";
  const billingType = activePlanIsActive
    ? isRazorpaySubscription
      ? "Razorpay subscription"
      : activeBillingCycle === "annual"
        ? "Annual access"
        : "Paid access"
    : "Free plan";

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
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-gray-950">Subscription</h1>
            <p className="mt-1 text-sm text-gray-500">Plan, usage, billing dates, and subscription actions for this workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/checkout?plan=startup&billingCycle=monthly" className="btn btn-primary inline-flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Upgrade
            </Link>
            <button type="button" onClick={() => void handleExportData()} disabled={exportLoading} className="btn btn-secondary inline-flex items-center gap-2">
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export data
            </button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>}
        {success && <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{success}</div>}
        {!isWorkspaceAdmin && (
          <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            Billing changes are available to the workspace Admin.
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="rounded-md border border-slate-300 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-primary">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-gray-950">Current plan</h2>
                  <p className="text-sm text-gray-500">{billingType}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Plan" value={planLabel} />
                <DetailRow label="Status" value={subscriptionStatus} />
                <DetailRow label={cancelAtPeriodEnd ? "Access ends" : isRazorpaySubscription ? "Next billing date" : "Access ends"} value={dateLabel || "-"} />
                <DetailRow label="Payment method" value={activePlanIsActive ? (isRazorpaySubscription ? "Razorpay" : "Checkout") : "-"} />
              </div>
            </div>

            <div className="rounded-md border border-slate-300 bg-white p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-primary">
                    <Activity className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-gray-950">Usage</h2>
                    <p className="text-sm text-gray-500">Current usage against plan limits.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {usageMetrics.map((metric) => (
                  <UsageRow key={metric.label} metric={metric} />
                ))}
              </div>
            </div>

            {activePlanIsActive && normalizedPlan !== "free" && (
              <div className="rounded-md border border-slate-300 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-amber-700">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-gray-950">Subscription actions</h2>
                    <p className="text-sm text-gray-500">Cancel renewal or export before destructive account removal.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelAtPeriodEnd(true)}
                    disabled={!isWorkspaceAdmin || cancelAtPeriodEnd || actionLoading}
                    className="btn btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Cancel at period end
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelAndDelete(true)}
                    disabled={!isWorkspaceAdmin || actionLoading}
                    className="rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel and delete data
                  </button>
                </div>
                {cancelAtPeriodEnd && dateLabel ? (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Auto-renewal is already cancelled. Access remains active until {dateLabel}.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-md border border-slate-300 bg-white p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-gray-950">Plans</h2>
                <p className="text-sm text-gray-500">Checkout stays inside the logged-in flow.</p>
              </div>
            </div>
            <div className="space-y-3">
              {planActions.map((plan) => {
                const isCurrent = normalizedPlan === plan.key;
                const isRequested = requestedPlan === plan.key;
                return (
                  <div key={plan.key} className={`rounded-md border p-4 ${isRequested ? "border-primary bg-primary/5" : "border-slate-300 bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-950">{plan.label}</p>
                        <p className="mt-1 text-sm text-gray-500">{plan.detail}</p>
                      </div>
                      {isCurrent && <span className="rounded border border-primary/20 bg-white px-2 py-1 text-[10px] font-black uppercase text-primary">Current</span>}
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <Link href={plan.monthlyHref} className="btn btn-secondary btn-sm justify-center">
                        Monthly
                      </Link>
                      <Link href={plan.annualHref} className="btn btn-primary btn-sm justify-center">
                        Annual
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </div>

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-300 bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-950">{value}</p>
    </div>
  );
}

function UsageRow({ metric }: { metric: UsageMetric }) {
  const percentage = usagePercentage(metric.used, metric.limit);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-gray-600">{metric.label}</span>
        <span className="font-bold text-gray-900">
          {metric.used.toLocaleString()} / {formatUsageLimit(metric.limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
      {metric.resetAt ? <p className="mt-1 text-[11px] text-gray-400">Resets {formatDateLabel(metric.resetAt)}</p> : null}
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
