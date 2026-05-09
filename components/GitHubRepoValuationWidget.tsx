"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle, Code2, GitBranch, Loader2, Star } from "lucide-react";
import { GitHubIdeaStageValuation } from "@/types/github-valuation";
import { trackGitHubValuationSubmitted } from "@/lib/analytics/ga4";

type Step = "form" | "loading" | "results";

export function GitHubRepoValuationWidget({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState<Step>("form");
  const [repoUrl, setRepoUrl] = useState("");
  const [intendedCustomer, setIntendedCustomer] = useState("");
  const [monetizationPlan, setMonetizationPlan] = useState("");
  const [market, setMarket] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [geography, setGeography] = useState<"global" | "india" | "us" | "eu">("global");
  const [founderCommitment, setFounderCommitment] = useState<"unknown" | "part-time" | "full-time">("unknown");
  const [result, setResult] = useState<GitHubIdeaStageValuation | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }
    if (!compact && !email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!compact && !phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!compact && !consent) {
      setError("Please agree to receive your repo valuation and follow-up.");
      return;
    }

    try {
      const trimmedUrl = repoUrl.trim();
      const url = new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`);
      if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
        setError("Please enter a valid github.com repository URL.");
        return;
      }
    } catch {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setStep("loading");
    try {
      const sessionToken = (() => {
        if (typeof window === "undefined") return undefined;
        const key = "evaldam_github_session_token";
        const existing = window.localStorage.getItem(key);
        if (existing) return existing;
        const created = crypto.randomUUID();
        window.localStorage.setItem(key, created);
        return created;
      })();

      const response = await fetch("/api/github-valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          sessionToken,
          intendedCustomer: intendedCustomer || undefined,
          monetizationPlan: monetizationPlan || undefined,
          market: market || undefined,
          geography,
          founderCommitment,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Repo valuation failed.");
      }

      if (!compact) {
        fetch("/api/leads/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: email.split("@")[0],
            email,
            phone,
            companyName: repoUrl,
            useCase: `GitHub repo valuation: ${repoUrl}`,
            type: "github_repo_valuation",
          }),
        }).catch(() => {});
      }

      setResult(data.data.valuation);
      trackGitHubValuationSubmitted({
        repoFullName: data.data.valuation.repo.fullName,
        category: data.data.valuation.category,
        score: data.data.valuation.score.total,
        valuationMid: data.data.valuation.valuation.mid,
      });
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Repo valuation failed.");
      setStep("form");
    }
  };

  useEffect(() => {
    if (step !== "results" || showUpgradePopup || compact) return;
    const timer = setTimeout(() => setShowUpgradePopup(true), 5000);
    return () => clearTimeout(timer);
  }, [step, showUpgradePopup, compact]);

  const formatValuation = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    return `$${Math.round(num / 1000)}K`;
  };

  if (step === "loading") {
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-gray-900">Analyzing repo as a startup idea...</p>
        <p className="mt-1 text-sm text-gray-500">Fetching GitHub signals and mapping them to idea-stage valuation factors.</p>
      </div>
    );
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-green-700">
          <CheckCircle className="h-5 w-5" />
          Repo valuation complete
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Code2 className="h-4 w-4" />
            <a href={result.repo.htmlUrl} target="_blank" rel="noreferrer" className="font-semibold text-gray-700 hover:text-primary">
              {result.repo.fullName}
            </a>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold capitalize text-gray-600">
              {result.category.replace(/-/g, " ")}
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-gray-900">
            {formatValuation(result.valuation.low)} - {formatValuation(result.valuation.high)}
          </div>
          <p className="mt-1 text-sm font-semibold text-primary">
            Mid-point: {formatValuation(result.valuation.mid)} pre-money
          </p>
          <p className="mt-2 text-sm text-gray-600">{result.thesis}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="Score" value={`${result.score.total}/100`} />
          <Metric label="Stars" value={result.repo.stars.toLocaleString()} />
          <Metric label="Forks" value={result.repo.forks.toLocaleString()} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Evaldam Review</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
              result.analystReview.fundability === "high"
                ? "bg-green-100 text-green-700"
                : result.analystReview.fundability === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}>
              {result.analystReview.fundability} fundability
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900">{result.analystReview.verdict}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{result.analystReview.summary}</p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-primary">Why This Valuation?</p>
          <ul className="space-y-2">
            {result.valuationFeedback.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Score Breakdown</p>
          <div className="space-y-3">
            <ScoreRow label="Idea clarity" value={result.score.ideaClarity} max={15} />
            <ScoreRow label="Technical execution" value={result.score.technicalExecution} max={20} />
            <ScoreRow label="Market potential" value={result.score.marketPotential} max={20} />
            <ScoreRow label="Traction signal" value={result.score.tractionSignal} max={15} />
            <ScoreRow label="Monetization potential" value={result.score.monetizationPotential} max={15} />
            <ScoreRow label="Defensibility" value={result.score.defensibility} max={10} />
            <ScoreRow label="Founder signal" value={result.score.founderSignal} max={5} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InsightList title="Value Drivers" items={result.valueDrivers} />
          <InsightList title="Investor Risks" items={result.investorRisks} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Comparable Startup Patterns</p>
          <div className="space-y-3">
            {result.comparablePatterns.map((pattern) => (
              <div key={pattern.name}>
                <p className="text-sm font-bold text-gray-900">{pattern.name}</p>
                <p className="text-xs leading-relaxed text-gray-600">{pattern.whyRelevant}</p>
              </div>
            ))}
          </div>
        </div>

        {!compact && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <p className="mb-1 font-bold">Important</p>
            <p>{result.methodology}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setStep("form")}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50"
          >
            Try Another Repo
          </button>
          <Link href="/signup" className="flex-1">
            <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
              Build Full Startup Report
            </button>
          </Link>
        </div>

        {showUpgradePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-primary">Build the full company case</p>
                  <h3 className="mt-2 text-2xl font-black text-gray-900">Repo signal is only the start</h3>
                </div>
                <button onClick={() => setShowUpgradePopup(false)} className="rounded-md px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  x
                </button>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                Upgrade to turn this repo into a full startup valuation with customer assumptions, monetization plan, six-method report, scenarios, and investor-ready PDF.
              </p>
              <div className="mt-5 grid gap-2">
                <Link href="/signup">
                  <button className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90">
                    Build Full Startup Report
                  </button>
                </Link>
                <button onClick={() => setShowUpgradePopup(false)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  Continue Reviewing Repo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-900">GitHub Repository URL</label>
        <div className="relative">
          <Code2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email for results"
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
          />
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
          />
          <input
            value={intendedCustomer}
            onChange={(event) => setIntendedCustomer(event.target.value)}
            placeholder="Target customer, e.g. AI engineering teams"
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
          />
          <input
            value={monetizationPlan}
            onChange={(event) => setMonetizationPlan(event.target.value)}
            placeholder="Monetization plan, e.g. hosted API"
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
          />
          <input
            value={market}
            onChange={(event) => setMarket(event.target.value)}
            placeholder="Market/category, e.g. devtools"
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={geography}
              onChange={(event) => setGeography(event.target.value as "global" | "india" | "us" | "eu")}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
            >
              <option value="global">Global</option>
              <option value="india">India</option>
              <option value="us">US</option>
              <option value="eu">EU</option>
            </select>
            <select
              value={founderCommitment}
              onChange={(event) => setFounderCommitment(event.target.value as "unknown" | "part-time" | "full-time")}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
            >
              <option value="unknown">Commitment?</option>
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
            </select>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              <span className="font-semibold text-gray-900">Send me the repo valuation and relevant follow-up.</span>
              <span className="block text-xs text-gray-500">You can unsubscribe anytime.</span>
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
      >
        Value This Repo
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Adoption signals</span>
        <span className="inline-flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> Execution quality</span>
        <span>Idea-stage pre-money range</span>
      </div>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">{title}</p>
      <ul className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
