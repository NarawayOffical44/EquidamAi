"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type WizardStep = "basics" | "traction" | "proof" | "done";

const proofOptions = [
  ["pitchDeck", "Pitch deck"],
  ["financials", "Financial model or revenue proof"],
  ["capTable", "Cap table"],
  ["customerTraction", "Customer traction or pipeline proof"],
] as const;

export default function NewStartupPage() {
  const [step, setStep] = useState<WizardStep>("basics");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const [createdStartupId, setCreatedStartupId] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    stage: "seed",
    websiteUrl: "",
    industry: "",
    description: "",
    arr: "",
    monthlyGrowthRate: "",
    teamSize: "",
    totalAddressableMarket: "",
    proof: {
      pitchDeck: false,
      financials: false,
      capTable: false,
      customerTraction: false,
    },
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else setUser(user);
    };
    checkUser();
  }, [router, supabase]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim()) return alert("Enter company name");

    setLoading(true);
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
            proof_documents: form.proof,
          },
          problem: "",
          solution: "",
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create startup");

      setCreatedStartupId(result.data.id);
      setStep("done");
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const stepNumber = step === "basics" ? 1 : step === "traction" ? 2 : step === "proof" ? 3 : 4;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
            <Building2 className="h-4 w-4" />
            Startup setup
          </div>
          <h1 className="text-3xl font-black text-gray-900">Build your valuation profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            Answer a few founder-friendly questions first. You can refine every number later in the full workspace.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {["Basics", "Traction", "Proof"].map((label, index) => (
            <div key={label} className={`rounded-md border p-3 text-xs font-bold ${stepNumber > index ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-400"}`}>
              Step {index + 1}: {label}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {step === "basics" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Company basics</h2>
                <p className="mt-1 text-sm text-gray-500">Start with what investors would ask first.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-800">Company name</span>
                  <input className="input mt-1" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} autoFocus />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-800">Stage</span>
                  <select className="input mt-1" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>
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
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("basics")} className="btn btn-secondary">Back</button>
                <button type="button" onClick={() => setStep("proof")} className="btn btn-primary">Continue <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {step === "proof" && (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Proof you have today</h2>
                <p className="mt-1 text-sm text-gray-500">This helps Evaldam show what is supported and what still needs verification.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {proofOptions.map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-800">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.proof[key]} onChange={(event) => setForm({ ...form, proof: { ...form.proof, [key]: event.target.checked } })} />
                    {label}
                  </label>
                ))}
              </div>
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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Startup Created
              </div>
              <h2 className="mb-2 text-2xl font-bold">{form.companyName}</h2>
              <p className="mb-8 text-neutral-600">Your startup workspace is ready. Next, review inputs and generate a report when the readiness score is strong.</p>
              <button onClick={() => router.push(`/startup/${createdStartupId}`)} className="btn btn-primary w-full">
                Go to Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
