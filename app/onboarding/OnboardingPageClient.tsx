"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";
import type {
  FounderStage,
  FundraisingTimeline,
  OnboardingRole,
  OrganizationType,
  PortfolioAiInterest,
  StageFocus,
} from "@/lib/onboarding/account-onboarding";

type Step = "role" | "questions" | "welcome";
type OnboardingInitialStatus = {
  onboarding_completed: boolean;
  onboarding_role: OnboardingRole | null;
  onboarding_data: Record<string, unknown>;
  error?: string;
};

interface OnboardingPageClientProps {
  initialStatus?: OnboardingInitialStatus;
}

const founderStageOptions: { value: FounderStage; label: string }[] = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b+", label: "Series B+" },
];

const organizationOptions: { value: OrganizationType; label: string }[] = [
  { value: "investor", label: "Investor / VC Fund" },
  { value: "angel_network", label: "Angel Network" },
  { value: "incubator", label: "Incubator / Accelerator" },
  { value: "agency", label: "Advisory / Valuation Agency" },
  { value: "other", label: "Other" },
];

const stageFocusOptions: { value: StageFocus; label: string }[] = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b+", label: "Series B+" },
  { value: "growth", label: "Growth" },
];

const fundraisingTimelineOptions: FundraisingTimeline[] = ["yes", "planning", "no"];
const portfolioAiInterestOptions: PortfolioAiInterest[] = ["yes", "maybe", "no"];

function pickOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.includes(value as T) ? value as T : fallback;
}

function pickNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function pickStageFocus(value: unknown): StageFocus[] {
  if (!Array.isArray(value)) return ["seed"];
  const allowed = new Set(stageFocusOptions.map((option) => option.value));
  const stages = value.filter((item): item is StageFocus => typeof item === "string" && allowed.has(item as StageFocus));
  return stages.length > 0 ? stages : ["seed"];
}

export default function OnboardingPageClient({ initialStatus }: OnboardingPageClientProps) {
  const router = useRouter();
  const initialData = initialStatus?.onboarding_data || {};
  const [loading, setLoading] = useState(!initialStatus);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>(
    initialStatus?.onboarding_completed ? "welcome" : initialStatus?.onboarding_role ? "questions" : "role"
  );
  const [role, setRole] = useState<OnboardingRole | "">(initialStatus?.onboarding_role || "");
  const [error, setError] = useState(initialStatus?.error || "");
  const [nextPath, setNextPath] = useState("/dashboard");
  const [founderData, setFounderData] = useState({
    current_stage: pickOption(initialData.current_stage, founderStageOptions.map((option) => option.value), "seed" as FounderStage),
    fundraising_timeline: pickOption(initialData.fundraising_timeline, fundraisingTimelineOptions, "planning"),
    team_size_estimate: pickNumber(initialData.team_size_estimate, 3),
  });
  const [investorData, setInvestorData] = useState({
    organization_type: pickOption(initialData.organization_type, organizationOptions.map((option) => option.value), "investor" as OrganizationType),
    portfolio_size: pickNumber(initialData.portfolio_size, 10),
    stage_focus: pickStageFocus(initialData.stage_focus),
    portfolio_ai_interest: pickOption(initialData.portfolio_ai_interest, portfolioAiInterestOptions, "maybe"),
  });

  useEffect(() => {
    if (initialStatus) return;

    const checkOnboarding = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch("/api/account/onboarding", {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load onboarding status.");

        if (data?.onboarding_completed) {
          setNextPath("/dashboard");
          setStep("welcome");
          return;
        }

        if (data?.onboarding_role === "founder" || data?.onboarding_role === "investor_agency") {
          setRole(data.onboarding_role);
          setStep("questions");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Onboarding status is taking too long to load. Refresh or sign in again.");
        } else {
          setError(err instanceof Error ? err.message : "Could not load onboarding status.");
        }
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    };

    void checkOnboarding();
  }, [initialStatus, router]);

  const progress = useMemo(() => {
    if (step === "role") return 33;
    if (step === "questions") return 66;
    return 100;
  }, [step]);

  const canContinue = role !== "";

  const saveOnboarding = async () => {
    setError("");
    if (!role) {
      setError("Choose Startup / Founder or Investor / Agency.");
      return;
    }

    const data = role === "founder" ? founderData : investorData;
    if (role === "investor_agency" && investorData.stage_focus.length === 0) {
      setError("Choose at least one startup stage.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, data }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save onboarding.");
      setNextPath(typeof result.next === "string" && result.next.startsWith("/") ? result.next : "/dashboard");
      setStep("welcome");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStageFocus = (value: StageFocus) => {
    setInvestorData((current) => {
      const exists = current.stage_focus.includes(value);
      return {
        ...current,
        stage_focus: exists
          ? current.stage_focus.filter((item) => item !== value)
          : [...current.stage_focus, value],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Evaldam AI" width={36} height={36} className="rounded-lg" />
            <span className="text-sm font-black text-gray-900">Evaldam</span>
          </Link>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-500 shadow-sm">
            2 minute setup
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-primary">Account onboarding</p>
            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
              {step === "role" && "Set up your account"}
              {step === "questions" && (role === "founder" ? "Tell us where you are today" : "Tell us what you manage")}
              {step === "welcome" && "Your dashboard is ready"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {step === "role" && "Choose the path that best matches your work. Startup profile setup happens later from Dashboard."}
              {step === "questions" && "Answer only the high-signal account questions. Company details are added in startup profile setup."}
              {step === "welcome" && "Your dashboard will open next. Startup profiles are created from Dashboard when you are ready."}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {step === "role" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRole("founder")}
                  className={`rounded-lg border p-5 text-left transition-all ${
                    role === "founder"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="mb-4 h-7 w-7 text-primary" />
                  <h2 className="text-lg font-black text-gray-900">Startup / Founder</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Build a valuation preview and prepare inputs for a startup report.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("investor_agency")}
                  className={`rounded-lg border p-5 text-left transition-all ${
                    role === "investor_agency"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50"
                  }`}
                >
                  <Users className="mb-4 h-7 w-7 text-primary" />
                  <h2 className="text-lg font-black text-gray-900">Investor / Agency</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Review startups, client companies, cohorts, or portfolio valuation needs.
                  </p>
                </button>
              </div>
            )}

            {step === "questions" && role === "founder" && (
              <div className="space-y-5">
                <div>
                  <label className="form-label">What is your current stage?</label>
                  <select
                    className="input"
                    value={founderData.current_stage}
                    onChange={(event) => setFounderData({ ...founderData, current_stage: event.target.value as FounderStage })}
                  >
                    {founderStageOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Are you raising or planning to raise in the next 6 months?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["yes", "Yes"],
                      ["planning", "Planning"],
                      ["no", "No"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFounderData({ ...founderData, fundraising_timeline: value as FundraisingTimeline })}
                        className={`rounded-md border px-3 py-2 text-sm font-bold ${
                          founderData.fundraising_timeline === value
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">How many people are in your team?</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={founderData.team_size_estimate}
                    onChange={(event) => setFounderData({ ...founderData, team_size_estimate: Number(event.target.value) })}
                  />
                </div>
              </div>
            )}

            {step === "questions" && role === "investor_agency" && (
              <div className="space-y-5">
                <div>
                  <label className="form-label">What type of organization are you?</label>
                  <select
                    className="input"
                    value={investorData.organization_type}
                    onChange={(event) => setInvestorData({ ...investorData, organization_type: event.target.value as OrganizationType })}
                  >
                    {organizationOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">How many startups do you currently manage or review?</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={investorData.portfolio_size}
                    onChange={(event) => setInvestorData({ ...investorData, portfolio_size: Number(event.target.value) })}
                  />
                </div>

                <div>
                  <label className="form-label">What stages do you usually work with?</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {stageFocusOptions.map((option) => {
                      const selected = investorData.stage_focus.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleStageFocus(option.value)}
                          className={`rounded-md border px-3 py-2 text-sm font-bold ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="form-label">Interested in tracking valuations and AI insights for your portfolio or clients?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["yes", "Yes"],
                      ["maybe", "Maybe"],
                      ["no", "No"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setInvestorData({ ...investorData, portfolio_ai_interest: value as PortfolioAiInterest })}
                        className={`rounded-md border px-3 py-2 text-sm font-bold ${
                          investorData.portfolio_ai_interest === value
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "welcome" && (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-700" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Welcome to Evaldam</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  Your account setup is complete. Start with a free valuation preview or create a startup profile from Dashboard.
                </p>
                <Link
                  href={nextPath}
                  className="btn btn-primary btn-lg mx-auto mt-8 flex items-center gap-2"
                >
                  Continue to dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {error && (
              <div className="alert alert-error mt-5">
                <span>{error}</span>
              </div>
            )}

            {step !== "welcome" && (
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    if (step === "questions") setStep("role");
                  }}
                  disabled={step === "role" || saving}
                  className="btn btn-secondary disabled:opacity-40"
                >
                  Back
                </button>
                {step === "role" ? (
                  <button
                    type="button"
                    disabled={!canContinue}
                    onClick={() => setStep("questions")}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveOnboarding}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                    {saving ? "Saving..." : "Finish setup"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
