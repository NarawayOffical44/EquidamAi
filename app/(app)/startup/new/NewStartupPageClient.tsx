"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FormError } from "@/components/FormError";
import { UpgradeModal } from "@/components/UpgradeModal";
import { trackStartupCreated } from "@/lib/analytics/ga4";
import {
  clearStartupProfilePrefill,
  readStartupProfilePrefill,
  type StartupProfilePrefill,
} from "@/lib/startup-profile-prefill";

type WizardStep = "basics" | "traction" | "proof" | "done";

const proofOptions = [
  ["pitchDeck", "Pitch deck"],
  ["financials", "Financial model or revenue proof"],
  ["capTable", "Cap table"],
  ["customerTraction", "Customer traction or pipeline proof"],
] as const;

type StageField = {
  key: string;
  label: string;
  type: "text" | "number";
  placeholder: string;
};

const stageFields: Record<string, StageField[]> = {
  "pre-revenue": [
    { key: "product_milestone", label: "Next product milestone", type: "text", placeholder: "MVP launch, pilot release..." },
    { key: "planned_launch_timing", label: "Planned launch timing", type: "text", placeholder: "Q3 2026 or 4 months" },
    { key: "early_interest_count", label: "Interested users or pilots", type: "number", placeholder: "25" },
  ],
  seed: [
    { key: "active_customers", label: "Active customers", type: "number", placeholder: "30" },
    { key: "average_revenue_per_customer", label: "Average monthly revenue per customer", type: "number", placeholder: "500" },
    { key: "next_round_milestone", label: "Milestone before next raise", type: "text", placeholder: "Reach $50K MRR with 80 customers" },
  ],
  "series-a": [
    { key: "active_customers", label: "Active customers", type: "number", placeholder: "120" },
    { key: "average_contract_value", label: "Average yearly customer value", type: "number", placeholder: "12000" },
    { key: "sales_pipeline_value", label: "Expected sales pipeline", type: "number", placeholder: "750000" },
    { key: "customer_loss_rate", label: "Customers leaving each month (%)", type: "number", placeholder: "2" },
  ],
  "series-b+": [
    { key: "revenue_from_existing_customers", label: "Revenue from existing customers (%)", type: "number", placeholder: "35" },
    { key: "sales_pipeline_value", label: "Expected sales pipeline", type: "number", placeholder: "2500000" },
    { key: "profitability_timing", label: "Planned profitability timing", type: "text", placeholder: "Q4 2027" },
    { key: "next_growth_area", label: "Next growth area", type: "text", placeholder: "Enterprise, US expansion, second product" },
  ],
};

const initialStartupForm = {
  companyName: "",
  stage: "seed",
  websiteUrl: "",
  industry: "",
  description: "",
  arr: "",
  monthlyGrowthRate: "",
  teamSize: "",
  totalAddressableMarket: "",
  currentlyRaising: false,
  targetRaise: "",
  useOfFunds: "",
  competitors: "",
  stageDetails: {} as Record<string, string>,
  proof: {
    pitchDeck: false,
    financials: false,
    capTable: false,
    customerTraction: false,
  },
};

type StartupForm = typeof initialStartupForm;

export default function NewStartupPage() {
  const [step, setStep] = useState<WizardStep>("basics");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const [paidAccess, setPaidAccess] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("Free accounts include limited startup access. Upgrade to Startup for Evaldam AI Score and paid-plan features.");
  const [createError, setCreateError] = useState("");
  const [createdStartupId, setCreatedStartupId] = useState("");
  const [form, setForm] = useState(initialStartupForm);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const localPrefill = readStartupProfilePrefill();
    if (localPrefill) {
      setForm((current) => mergeStartupPrefill(current, localPrefill));
    }
  }, []);

  useEffect(() => {
    if (step !== "done" || !createdStartupId) return;

    const timeout = window.setTimeout(() => {
      router.push(`/startup/${createdStartupId}`);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [createdStartupId, router, step]);

  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else {
        const { data: account } = await supabase
          .from("users")
          .select("plan_active, onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();
        if (!account?.onboarding_completed) {
          router.push("/onboarding");
          return;
        }
        if (!active) return;
        setPaidAccess(Boolean(account?.plan_active));
        setUser(user);

        fetch("/api/startup/prefill", { credentials: "include" })
          .then((response) => response.ok ? response.json() : null)
          .then((data) => {
            if (active && data?.prefill) {
              setForm((current) => mergeStartupPrefill(current, data.prefill));
            }
          })
          .catch(() => undefined);
      }
    };
    checkUser();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim()) {
      setCreateError("Enter company name");
      setStep("basics");
      return;
    }

    setLoading(true);
    setCreateError("");
    try {
      const response = await fetch("/api/startup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.companyName,
          stage: form.stage,
          description: form.description,
          website_url: form.websiteUrl,
          arr: Number(form.arr || 0),
          monthly_growth_rate: Number(form.monthlyGrowthRate || 0),
          industry: form.industry,
          team_size: Number(form.teamSize || 0),
          founding_year: new Date().getFullYear(),
          total_addressable_market: Number(form.totalAddressableMarket || 0),
          profile_data: {
            onboarding_completed: true,
            ...form.stageDetails,
            currently_raising: form.currentlyRaising,
            target_raise: Number(form.targetRaise || 0),
            use_of_funds: form.useOfFunds.trim(),
            competitor_names: form.competitors.trim(),
            proof_documents: form.proof,
          },
          problem: "",
          solution: "",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          setUpgradeReason(result.message || "Free accounts can keep 1 draft startup. Upgrade to Startup to continue.");
          setUpgradeModalOpen(true);
          return;
        }
        throw new Error(result.message || result.error || "Failed to create startup");
      }

      const startupId = result.data.id;
      trackStartupCreated({
        startupId,
        stage: form.stage,
        industry: form.industry,
        paidAccess,
        currentlyRaising: form.currentlyRaising,
        hasWebsite: Boolean(form.websiteUrl.trim()),
        hasProof: Object.values(form.proof).some(Boolean),
      });
      setCreatedStartupId(startupId);
      clearStartupProfilePrefill();
      setStep("done");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const stepNumber = step === "basics" ? 1 : step === "traction" ? 2 : step === "proof" ? 3 : 4;
  const setupProgress = Math.min(100, (stepNumber / 3) * 100);
  const setupSteps: { key: Exclude<WizardStep, "done">; label: string }[] = [
    { key: "basics", label: "Basics" },
    { key: "traction", label: "Traction" },
    { key: "proof", label: "Context" },
  ];
  const currentStageFields = stageFields[form.stage] || stageFields.seed;

  return (
    <div className="evaldam-workspace min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
            <Building2 className="h-4 w-4" />
            Startup profile setup
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Build your valuation profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            This is separate from account onboarding. Add company inputs here, then refine every number later in the full workspace.
          </p>
          {!paidAccess && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Free startup:</span> add startup details and run a preview valuation with limited free access. Evaldam AI Score, members, and additional startup workspaces unlock on Startup and higher plans.
            </div>
          )}
        </div>

        <div className="mb-5 border-y border-slate-200 bg-white py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Setup progress</p>
            <p className="font-mono text-xs font-bold tabular-nums text-gray-900">{Math.min(stepNumber, 3)}/3</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${setupProgress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {setupSteps.map((item, index) => {
              const active = step === item.key;
              const completed = stepNumber > index + 1;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStep(item.key)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-gray-500 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${active ? "bg-primary" : completed ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-y border-gray-200 bg-white py-6">
          {step === "basics" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Company basics</h2>
                <p className="mt-1 text-sm text-gray-500">Start with what investors would ask first.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-800">Company name</span>
                  <input
                    className={`input mt-1 ${createError && !form.companyName.trim() ? "input-error" : ""}`}
                    value={form.companyName}
                    onChange={(event) => {
                      setForm({ ...form, companyName: event.target.value });
                      if (createError) setCreateError("");
                    }}
                    aria-describedby={createError && !form.companyName.trim() ? "startup-company-name-error" : undefined}
                    autoFocus
                  />
                  <FormError id="startup-company-name-error" message={!form.companyName.trim() ? createError : ""} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-800">Stage</span>
                  <select className="input mt-1" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value, stageDetails: {} })}>
                    <option value="pre-revenue">Pre-revenue</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b+">Series B+</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-800">Website</span>
                  <input className="input mt-1" value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-800">Industry</span>
                  <input className="input mt-1" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} placeholder="SaaS, AI, fintech..." />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-bold text-gray-800">What does the company do?</span>
                <textarea className="input mt-1 min-h-24 resize-none" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe it in plain English." />
              </label>
              <button type="button" onClick={() => setStep("traction")} disabled={!form.companyName.trim()} className="btn btn-primary">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === "traction" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Traction signals</h2>
                <p className="mt-1 text-sm text-gray-500">Use estimates if needed. Better evidence can be added later.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block"><span className="text-sm font-bold text-gray-800">Annual recurring revenue</span><input className="input mt-1" type="number" value={form.arr} onChange={(event) => setForm({ ...form, arr: event.target.value })} placeholder="0" /></label>
                <label className="block"><span className="text-sm font-bold text-gray-800">Monthly growth %</span><input className="input mt-1" type="number" value={form.monthlyGrowthRate} onChange={(event) => setForm({ ...form, monthlyGrowthRate: event.target.value })} placeholder="10" /></label>
                <label className="block"><span className="text-sm font-bold text-gray-800">Team size</span><input className="input mt-1" type="number" value={form.teamSize} onChange={(event) => setForm({ ...form, teamSize: event.target.value })} placeholder="3" /></label>
                <label className="block"><span className="text-sm font-bold text-gray-800">Market size / TAM</span><input className="input mt-1" type="number" value={form.totalAddressableMarket} onChange={(event) => setForm({ ...form, totalAddressableMarket: event.target.value })} placeholder="500000000" /></label>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-bold text-gray-900">Details for this stage</p>
                <p className="mt-1 text-xs text-gray-500">These fields update automatically from the stage selected in Basics.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {currentStageFields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="text-sm font-bold text-gray-800">{field.label}</span>
                      <input
                        className="input mt-1"
                        type={field.type}
                        value={form.stageDetails[field.key] || ""}
                        onChange={(event) => setForm({ ...form, stageDetails: { ...form.stageDetails, [field.key]: event.target.value } })}
                        placeholder={field.placeholder}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("basics")} className="btn btn-secondary">Back</button>
                <button type="button" onClick={() => setStep("proof")} className="btn btn-primary">Continue <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {step === "proof" && (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Investor context</h2>
                <p className="mt-1 text-sm text-gray-500">Add what you already know now. Everything can be refined later.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={form.currentlyRaising}
                    onChange={(event) => setForm({ ...form, currentlyRaising: event.target.checked })}
                  />
                  Currently raising capital
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-800">Target raise</span>
                    <input
                      className="input mt-1"
                      type="number"
                      value={form.targetRaise}
                      onChange={(event) => setForm({ ...form, targetRaise: event.target.value })}
                      placeholder="1000000"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-bold text-gray-800">Use of funds</span>
                    <textarea
                      className="input mt-1 min-h-20 resize-none"
                      value={form.useOfFunds}
                      onChange={(event) => setForm({ ...form, useOfFunds: event.target.value })}
                      placeholder="Product, hiring, sales, compliance, market expansion"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-bold text-gray-800">Closest competitors or alternatives</span>
                    <textarea
                      className="input mt-1 min-h-20 resize-none"
                      value={form.competitors}
                      onChange={(event) => setForm({ ...form, competitors: event.target.value })}
                      placeholder="Company names, categories, or current alternatives customers use"
                    />
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Proof you have today</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {proofOptions.map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-800">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.proof[key]} onChange={(event) => setForm({ ...form, proof: { ...form.proof, [key]: event.target.checked } })} />
                    {label}
                  </label>
                ))}
              </div>
              <FormError message={createError} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("traction")} className="btn btn-secondary">Back</button>
                <button type="submit" disabled={loading || !form.companyName.trim()} className="btn btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Create startup
                </button>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Startup Created
              </div>
              <h2 className="mb-2 text-2xl font-bold">{form.companyName}</h2>
              <p className="mb-3 text-neutral-600">Your startup workspace is ready. Next, review inputs and generate a report when the readiness score is strong.</p>
              <p className="mb-8 text-sm font-semibold text-primary">Opening your workspace automatically...</p>
              <button onClick={() => router.push(`/startup/${createdStartupId}`)} className="btn btn-primary w-full">
                Go to Workspace
              </button>
            </div>
          )}
        </div>
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentPlan="free"
          limitType="startup"
          limitReason={upgradeReason}
        />
      </div>
    </div>
  );
}

function mergeStartupPrefill(current: StartupForm, prefill: StartupProfilePrefill): StartupForm {
  return {
    ...current,
    companyName: current.companyName || prefill.companyName || "",
    stage: prefill.stage || current.stage,
    websiteUrl: current.websiteUrl || prefill.websiteUrl || "",
    industry: current.industry || prefill.industry || "",
    description: current.description || prefill.description || "",
    arr: current.arr || String(prefill.arr || ""),
    monthlyGrowthRate: current.monthlyGrowthRate || String(prefill.monthlyGrowthRate || ""),
    teamSize: current.teamSize || String(prefill.teamSize || ""),
    totalAddressableMarket: current.totalAddressableMarket || String(prefill.totalAddressableMarket || ""),
  };
}
