"use client";

import { AlertTriangle, CheckCircle, Target, TrendingUp, Wrench } from "lucide-react";
import type React from "react";
import type { SignalAnalysis } from "@/lib/valuation/signal-analysis";

function SignalBlock({
  title,
  items,
  tone,
  Icon,
}: {
  title: string;
  items: string[];
  tone: "green" | "amber" | "blue" | "gray" | "red";
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    gray: "border-gray-200 bg-gray-50 text-gray-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <h3 className="text-xs font-black uppercase tracking-wide">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SignalAnalysisPanel({
  analysis,
  compact = false,
}: {
  analysis?: SignalAnalysis;
  compact?: boolean;
}) {
  if (!analysis) return null;

  const hasAny =
    analysis.valueDrivers.length ||
    analysis.evidenceGaps.length ||
    analysis.investorObjections.length ||
    analysis.nextValueLevers.length ||
    analysis.methodSignals.length;

  if (!hasAny) return null;

  return (
    <section className="space-y-4 text-left">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-primary">Signals that matter</p>
        {!compact && (
          <p className="mt-1 text-sm text-gray-500">
            Only the evidence that changes confidence, risk, or valuation range.
          </p>
        )}
      </div>

      <div className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2"}>
        {analysis.valueDrivers.length > 0 && (
          <SignalBlock title="Value drivers" items={analysis.valueDrivers} tone="green" Icon={TrendingUp} />
        )}
        {analysis.evidenceGaps.length > 0 && (
          <SignalBlock title="Evidence gaps" items={analysis.evidenceGaps} tone="amber" Icon={AlertTriangle} />
        )}
        {analysis.investorObjections.length > 0 && (
          <SignalBlock title="Investor objections" items={analysis.investorObjections} tone="red" Icon={Target} />
        )}
        {analysis.nextValueLevers.length > 0 && (
          <SignalBlock title="Next value levers" items={analysis.nextValueLevers} tone="blue" Icon={Wrench} />
        )}
        {analysis.methodSignals.length > 0 && (
          <SignalBlock title="Method signals" items={analysis.methodSignals} tone="gray" Icon={CheckCircle} />
        )}
      </div>
    </section>
  );
}
