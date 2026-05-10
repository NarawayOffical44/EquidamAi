"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, Code2, FileText, GitBranch, Lightbulb, Repeat2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GitHubRepoValuationWidget } from "@/components/GitHubRepoValuationWidget";

export default function GitHubValuationPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link href="/free-valuation" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to free tools
        </Link>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-start">
          <div className="pt-4 lg:pt-10">
            <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">
              Free · No Signup Required
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 mb-5 leading-tight tracking-tight">
              GitHub Repo Startup Valuation
            </h1>
            <p className="max-w-xl text-lg text-gray-600 mb-8">
              Paste a public GitHub repo and estimate what the project could be worth as an idea-stage startup. The free result explains the valuation logic, not just stars and forks.
            </p>

            <div className="grid gap-3 mb-8 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex items-start gap-3">
                <Code2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Execution Signal</p>
                  <p className="text-sm text-gray-500">Code maturity, docs, tests, releases, and development activity</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GitBranch className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Market Pull</p>
                  <p className="text-sm text-gray-500">Stars, forks, contributors, usage clues, and buyer clarity</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Idea-Stage Valuation</p>
                  <p className="text-sm text-gray-500">Berkus and Scorecard-style logic for pre-revenue projects</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What this valuation means</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  "It values the startup opportunity, not the repo as a sellable asset.",
                  "It assumes little or no ARR unless commercial evidence is provided.",
                  "It highlights what would increase valuation before fundraising.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Repeat2 className="h-5 w-5 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-sm font-black text-blue-950">Repeatable methodology</p>
                    <p className="mt-1 text-sm text-blue-900">Same repo data and same inputs produce the same valuation range until signals, assumptions, or methodology change.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-black text-gray-900">Upgrade path</p>
                    <p className="mt-1 text-sm text-gray-600">Use the repo result as the hook. The paid report turns it into a company valuation with assumptions, scenarios, PDF, and investor-ready evidence.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-lg shadow-xl shadow-gray-200/70 border border-gray-200 p-6 md:p-8">
              <GitHubRepoValuationWidget />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
