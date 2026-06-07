"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CreditCard,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { UpgradeModal } from "@/components/UpgradeModal";
import { StartupAccessModal } from "@/components/StartupAccessModal";
import {
  getPlanDisplayName,
  getPlanLimits,
  normalizePlanKey,
  UNLIMITED_LIMIT,
} from "@/lib/plans/plan-limits";
import { writeStartupProfilePrefill } from "@/lib/startup-profile-prefill";
import { normalizeCloudinaryImageUrl } from "@/lib/images/cloudinary-url";

interface Startup {
  id: string;
  company_name: string;
  logo_url?: string | null;
  stage: string;
  industry?: string | null;
  created_at: string;
  team_size?: number | null;
  arr?: number | null;
  monthly_growth_rate?: number | null;
  total_addressable_market?: number | null;
  profile_data?: Record<string, unknown> | null;
}

interface Valuation {
  id?: string;
  blended_low_range: number;
  blended_high_range: number;
  blended_weighted_average: number;
  created_at: string;
}

interface StartupWithValuation extends Startup {
  valuations: Valuation[];
}

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  plan: string;
  plan_active: boolean;
  billing_cycle?: string;
  subscription_id?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  tier?: string;
  startup_count?: number;
  max_startups?: number;
  workspace_id?: string;
  workspace_role?: "admin" | "member" | "startup_contributor";
  workspace_owner_name?: string | null;
  workspace_owner_email?: string | null;
  valuation_count?: number;
  onboarding_role?: "founder" | "investor_agency" | null;
  onboarding_data?: Record<string, unknown>;
  sales_qualification?: Record<string, unknown>;
}

interface PreviewResult {
  low: number;
  mid: number;
  high: number;
  confidence: string;
  currency?: "INR" | "USD";
}

interface PreviewUsage {
  limit: number;
  used: number;
  remaining: number;
  period: "day" | "month";
  resetAt?: string;
}

interface MarketComparableCompany {
  id: string;
  company_name?: string | null;
  industry?: string | null;
  stage?: string | null;
  country?: string | null;
  arr?: number | null;
  growth_rate?: number | null;
  latest_valuation?: number | null;
  valuation_date?: string | null;
  valuation_multiples?: Record<string, unknown> | null;
  peer_metrics?: Record<string, unknown> | null;
  data_quality?: number | null;
  data_freshness_date?: string | null;
  excluded_reasons?: string[] | null;
}

type DashboardMode = "dashboard" | "startups" | "comparables" | "funding" | "exit";
type AnalyticsMetric = "valuation" | "arr" | "growth" | "readiness";
type ComparableSourceFilter = "all" | "market" | "workspace" | "close";
type ComparablePeerLabel = "Close peer" | "Useful peer" | "Weak peer";
type ComparableMetric = "valuation" | "arr" | "growth" | "multiple";
type UseOfFundsKey = "product_rnd" | "sales_marketing" | "operations" | "capex" | "other";

type FundingRoundInput = {
  type: string;
  valuation: string;
  investment: string;
  equity: string;
  closedDate: string;
};

type FundingFormState = {
  currentlyRaising: boolean;
  targetRaise: string;
  expectedCloseDate: string;
  useOfFunds: Record<UseOfFundsKey, string>;
  fundingRounds: FundingRoundInput[];
};

type ComparablePeer = {
  id: string;
  source: "market" | "workspace";
  companyName: string;
  stage: string;
  industry: string;
  country?: string | null;
  arr: number;
  growthRate: number;
  valuation: number;
  multiple: number;
  qualityScore: number;
  freshnessDate?: string | null;
  similarityScore: number;
  label: ComparablePeerLabel;
  issues: string[];
  href?: string;
};

type ChartPoint = {
  label: string;
  value: number;
  time?: number;
};

type ChartSeries = {
  id: string;
  label: string;
  color: string;
  points: ChartPoint[];
  dashed?: boolean;
  baseline?: boolean;
};

type BarRow = {
  label: string;
  value: number;
  detail?: string;
  href?: string;
  color?: string;
};

const valuationLoadingMessages = [
  "Checking workspace data and latest valuation activity.",
  "Preparing startup cards, report status, and plan limits.",
  "Loading valuation ranges, revenue signals, and readiness gaps.",
  "Organizing company profiles before the dashboard opens.",
  "Reviewing financial inputs and saved valuation reports.",
  "Setting up your portfolio view for faster decisions.",
];

const chartPalette = ["#0f766e", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#475569"];
const useOfFundsCategories: Array<{ key: UseOfFundsKey; label: string }> = [
  { key: "product_rnd", label: "Product and R&D" },
  { key: "sales_marketing", label: "Sales and marketing" },
  { key: "operations", label: "Operations" },
  { key: "capex", label: "Capital expenditures" },
  { key: "other", label: "Other" },
];

const emptyFundingForm: FundingFormState = {
  currentlyRaising: false,
  targetRaise: "",
  expectedCloseDate: "",
  useOfFunds: {
    product_rnd: "",
    sales_marketing: "",
    operations: "",
    capex: "",
    other: "",
  },
  fundingRounds: [],
};

function formatMoneyCompact(value: number) {
  if (!value) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatPercentCompact(value: number) {
  return `${value.toFixed(Math.abs(value % 1) > 0 ? 1 : 0)}%`;
}

function median(values: number[]) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((first, second) => first - second);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeProfileData(startup?: Startup | null) {
  return startup?.profile_data && typeof startup.profile_data === "object" && !Array.isArray(startup.profile_data)
    ? startup.profile_data
    : {};
}

function profileText(profile: Record<string, unknown>, key: string) {
  const value = profile[key];
  return typeof value === "string" ? value : "";
}

function profileNumber(profile: Record<string, unknown>, key: string) {
  const value = profile[key];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function normalizeUseOfFunds(value: unknown): Record<UseOfFundsKey, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { product_rnd: 0, sales_marketing: 0, operations: 0, capex: 0, other: 0 };
  }

  const source = value as Record<string, unknown>;
  return {
    product_rnd: safeNumber(source.product_rnd ?? source.product ?? source.product_r_and_d),
    sales_marketing: safeNumber(source.sales_marketing ?? source.marketing),
    operations: safeNumber(source.operations),
    capex: safeNumber(source.capex ?? source.capital_expenditures),
    other: safeNumber(source.other ?? source.others),
  };
}

function normalizeFundingRounds(value: unknown): FundingRoundInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((round) => {
      if (!round || typeof round !== "object") return null;
      const item = round as Record<string, unknown>;
      return {
        type: String(item.type || item.round || ""),
        valuation: String(item.valuation || item.postMoney || item.post_money || ""),
        investment: String(item.investment || item.amount || ""),
        equity: String(item.equity || item.equity_percent || ""),
        closedDate: String(item.closedDate || item.closed_date || item.date || ""),
      };
    })
    .filter((round): round is FundingRoundInput => Boolean(round));
}

function buildFundingForm(startup?: Startup | null): FundingFormState {
  const profile = safeProfileData(startup);
  const allocation = normalizeUseOfFunds(profile.use_of_funds_allocation);
  const targetRaise = profileNumber(profile, "target_raise");
  return {
    currentlyRaising: Boolean(profile.currently_raising),
    targetRaise: targetRaise ? String(targetRaise) : "",
    expectedCloseDate: profileText(profile, "expected_close_date"),
    useOfFunds: {
      product_rnd: allocation.product_rnd ? String(allocation.product_rnd) : "",
      sales_marketing: allocation.sales_marketing ? String(allocation.sales_marketing) : "",
      operations: allocation.operations ? String(allocation.operations) : "",
      capex: allocation.capex ? String(allocation.capex) : "",
      other: allocation.other ? String(allocation.other) : "",
    },
    fundingRounds: normalizeFundingRounds(profile.funding_rounds),
  };
}

function stageFundingBenchmark(stage?: string | null) {
  const normalizedStage = (stage || "").toLowerCase();
  if (normalizedStage.includes("series-b")) return 12_000_000;
  if (normalizedStage.includes("series-a")) return 4_000_000;
  if (normalizedStage.includes("seed")) return 900_000;
  return 250_000;
}

function annualizedReturn(returnMultiple: number, years = 7) {
  if (!Number.isFinite(returnMultiple) || returnMultiple <= 0) return 0;
  return (Math.pow(returnMultiple, 1 / years) - 1) * 100;
}

function getSortedValuations(startup: StartupWithValuation) {
  return [...(startup.valuations || [])]
    .filter((valuation) => Number(valuation.blended_weighted_average || 0) > 0)
    .sort((first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime());
}

function getLatestValuation(startup: StartupWithValuation) {
  const sorted = getSortedValuations(startup);
  return sorted[sorted.length - 1] || null;
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 text-center">
      <p className="max-w-xs text-sm font-semibold leading-6 text-gray-500">{label}</p>
    </div>
  );
}

function SnapshotMetricChart({
  series,
  valueFormatter,
}: {
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
}) {
  const snapshots = series
    .filter((item) => !item.dashed)
    .map((item) => {
      const point = item.points[item.points.length - 1];
      return point ? { ...item, point } : null;
    })
    .filter((item): item is ChartSeries & { point: ChartPoint } => Boolean(item))
    .sort((first, second) => second.point.value - first.point.value);
  const benchmark = series.find((item) => item.dashed)?.points.at(-1);
  const visibleSnapshots = snapshots.slice(0, 6);
  const chartItems = benchmark
    ? [
        ...visibleSnapshots,
        {
          id: "benchmark",
          label: "Similar-startup median",
          color: "#111827",
          dashed: true,
          points: [benchmark],
          point: benchmark,
        },
      ]
    : visibleSnapshots;
  const values = chartItems.map((item) => item.point.value).filter((value) => Number.isFinite(value));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values, 1);
  const compressedRange = rawMax - rawMin;
  const minValue = rawMin > 0 && compressedRange < rawMax * 0.4 ? rawMin * 0.72 : 0;
  const maxValue = rawMax + Math.max(compressedRange * 0.14, rawMax * 0.12, 1);

  if (!visibleSnapshots.length) return <EmptyChart label="No current values are available for this chart." />;

  const width = 720;
  const height = 250;
  const padding = { top: 18, right: 82, bottom: 42, left: 64 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xStart = padding.left;
  const xEnd = width - padding.right;
  const yFor = (value: number) => padding.top + (1 - (value - minValue) / (maxValue - minValue)) * innerHeight;
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => minValue + (maxValue - minValue) * ratio);
  const latestLabel = visibleSnapshots[0]?.point.label || "Current";

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] w-full overflow-visible" role="img" aria-label="Current startup baseline comparison chart">
        <defs>
          <linearGradient id="dashboardSnapshotFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={visibleSnapshots[0]?.color || "#0f766e"} stopOpacity="0.18" />
            <stop offset="100%" stopColor={visibleSnapshots[0]?.color || "#0f766e"} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridValues.map((value) => {
          const y = yFor(value);
          return (
            <g key={value}>
              <line x1={xStart} x2={xEnd} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-gray-400 text-[11px] font-semibold">
                {valueFormatter(value)}
              </text>
            </g>
          );
        })}
        <line x1={xStart} x2={xEnd} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#cbd5e1" />
        <text x={xStart} y={height - 18} textAnchor="start" className="fill-gray-500 text-[11px] font-semibold">
          Baseline
        </text>
        <text x={xEnd} y={height - 18} textAnchor="end" className="fill-gray-500 text-[11px] font-semibold">
          {latestLabel}
        </text>
        {visibleSnapshots[0] && (
          <path
            d={`M ${xStart} ${yFor(visibleSnapshots[0].point.value)} L ${xEnd} ${yFor(visibleSnapshots[0].point.value)} L ${xEnd} ${height - padding.bottom} L ${xStart} ${height - padding.bottom} Z`}
            fill="url(#dashboardSnapshotFill)"
          />
        )}
        {chartItems.map((item, index) => {
          const y = yFor(item.point.value);
          const labelX = xEnd + 10;

          return (
            <g key={item.id}>
              <line
                x1={xStart}
                x2={xEnd}
                y1={y}
                y2={y}
                stroke={item.color}
                strokeWidth={item.dashed ? 3 : index === 0 ? 4 : 3}
                strokeLinecap="round"
                strokeDasharray={item.dashed ? "8 7" : "0"}
              />
              {!item.dashed && (
                <>
                  <circle cx={xEnd} cy={y} r={5} fill={item.color} stroke="#fff" strokeWidth="3">
                    <title>{`${item.label}: ${valueFormatter(item.point.value)}`}</title>
                  </circle>
                  <text x={labelX} y={y + 4} className="fill-gray-700 text-[11px] font-bold">
                    {valueFormatter(item.point.value)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500">
        {visibleSnapshots.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
        {benchmark && <span className="inline-flex items-center gap-2">Dashed: similar-startup median {valueFormatter(benchmark.value)}</span>}
        {snapshots.length > visibleSnapshots.length && <span>Showing {visibleSnapshots.length} of {snapshots.length} selected</span>}
      </div>
    </div>
  );
}

function MetricLineChart({
  series,
  valueFormatter,
  emptyLabel,
}: {
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
  emptyLabel: string;
}) {
  const visibleSeries = series
    .map((item) => ({
      ...item,
      points: [...item.points]
        .filter((point) => Number.isFinite(point.value))
        .sort((first, second) => (first.time || 0) - (second.time || 0))
        .slice(-12),
    }))
    .filter((item) => item.points.length > 0);

  if (!visibleSeries.length) return <EmptyChart label={emptyLabel} />;
  const hasTrajectory = visibleSeries.some((item) => !item.dashed && !item.baseline && item.points.length > 1);
  if (!hasTrajectory) return <SnapshotMetricChart series={visibleSeries} valueFormatter={valueFormatter} />;

  const width = 720;
  const height = 250;
  const padding = { top: 16, right: 24, bottom: 42, left: 64 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const allPoints = visibleSeries.flatMap((item) => item.points);
  const timedPoints = allPoints.filter((point) => point.time);
  const minTime = timedPoints.length ? Math.min(...timedPoints.map((point) => point.time as number)) : 0;
  const maxTime = timedPoints.length ? Math.max(...timedPoints.map((point) => point.time as number)) : 0;
  const values = allPoints.map((point) => point.value).filter((value) => Number.isFinite(value));
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 1);
  const rawRange = rawMax - rawMin;
  const yMin = rawMin > 0 && rawRange < rawMax * 0.35 ? rawMin * 0.82 : 0;
  const yMax = rawMax + Math.max(rawRange * 0.16, rawMax * 0.08, 1);
  const ySpan = Math.max(yMax - yMin, 1);
  const xFor = (point: ChartPoint, index: number, points: ChartPoint[]) => {
    if (point.time && maxTime > minTime) return padding.left + ((point.time - minTime) / (maxTime - minTime)) * innerWidth;
    return padding.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  };
  const yFor = (value: number) => padding.top + (1 - (value - yMin) / ySpan) * innerHeight;
  const axisLabels = Array.from(
    new Map(
      allPoints
        .filter((point) => point.time)
        .sort((first, second) => (first.time || 0) - (second.time || 0))
        .map((point) => [point.time, point.label])
    ).entries()
  );
  const labelInterval = Math.max(1, Math.ceil(axisLabels.length / 4));

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] w-full overflow-visible" role="img" aria-label="Startup comparison trend chart">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * innerHeight;
          const value = yMin + ySpan * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={ratio === 1 ? "0" : "4 4"} />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-gray-400 text-[11px] font-semibold">
                {valueFormatter(value)}
              </text>
            </g>
          );
        })}
        {axisLabels.map(([time, label], index) => {
          if (index % labelInterval !== 0 && index !== axisLabels.length - 1) return null;
          const x = maxTime > minTime ? padding.left + (((time as number) - minTime) / (maxTime - minTime)) * innerWidth : padding.left + innerWidth / 2;
          return (
            <text key={time} x={x} y={height - 18} textAnchor="middle" className="fill-gray-500 text-[11px] font-semibold">
              {label}
            </text>
          );
        })}
        {visibleSeries.map((item) => {
          const coords = item.points.map((point, index) => ({
            ...point,
            x: xFor(point, index, item.points),
            y: yFor(point.value),
          }));
          const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
          return (
            <g key={item.id}>
              {item.dashed && coords.length === 1 && (
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={coords[0].y}
                  y2={coords[0].y}
                  stroke={item.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 7"
                />
              )}
              {coords.length > 1 && (
                <path
                  d={path}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={item.dashed ? 3 : 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={item.dashed || item.baseline ? "8 7" : "0"}
                />
              )}
              {coords.map((point, index) =>
                item.dashed && coords.length === 1 ? null : (
                  <circle key={`${item.id}-${index}`} cx={point.x} cy={point.y} r={item.dashed ? 4 : 5} fill={item.color} stroke="#fff" strokeWidth="3">
                    <title>{`${item.label} - ${point.label}: ${valueFormatter(point.value)}`}</title>
                  </circle>
                )
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleSeries.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  rows,
  valueFormatter,
  emptyLabel,
}: {
  rows: BarRow[];
  valueFormatter: (value: number) => string;
  emptyLabel: string;
}) {
  if (!rows.length) return <EmptyChart label={emptyLabel} />;

  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const content = (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{row.label}</p>
                {row.detail && <p className="truncate text-xs font-semibold text-gray-500">{row.detail}</p>}
              </div>
              <p className="font-mono text-xs font-bold text-gray-800">{valueFormatter(row.value)}</p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((row.value / maxValue) * 100, row.value ? 5 : 0)}%`, background: row.color || chartPalette[index % chartPalette.length] }}
              />
            </div>
          </>
        );

        return row.href ? (
          <Link key={row.label} href={row.href} className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-primary/40">
            {content}
          </Link>
        ) : (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-white p-3">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({
  segments,
  emptyLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  emptyLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (!total) return <EmptyChart label={emptyLabel} />;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; length: number; dashOffset: number }>>(
    (acc, segment) => {
      const length = (segment.value / total) * circumference;
      const priorLength = acc.reduce((sum, item) => sum + item.length, 0);
      return [...acc, { ...segment, length, dashOffset: -priorLength }];
    },
    []
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 140 140" className="h-36 w-36 flex-shrink-0" role="img" aria-label="Distribution chart">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {arcs.map((segment) => (
          <circle
            key={segment.label}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="16"
            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
            strokeDashoffset={segment.dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        ))}
        <text x="70" y="68" textAnchor="middle" className="fill-gray-950 text-xl font-bold">
          {total}
        </text>
        <text x="70" y="86" textAnchor="middle" className="fill-gray-500 text-[11px] font-bold">
          total
        </text>
      </svg>
      <div className="w-full space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="font-mono text-xs font-bold text-gray-900">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [startups, setStartups] = useState<StartupWithValuation[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const [activeMode, setActiveMode] = useState<DashboardMode>(() =>
    requestedView === "startups" ||
    requestedView === "comparables" ||
    requestedView === "funding" ||
    requestedView === "exit"
      ? requestedView
      : "dashboard"
  );
  const [analyticsMetric, setAnalyticsMetric] = useState<AnalyticsMetric>("valuation");
  const [analyticsStageFilter, setAnalyticsStageFilter] = useState("all");
  const [analyticsIndustryFilter, setAnalyticsIndustryFilter] = useState("all");
  const [analyticsSelectedStartupIds, setAnalyticsSelectedStartupIds] = useState<string[]>([]);
  const [analyticsShowBenchmark, setAnalyticsShowBenchmark] = useState(true);
  const [selectedComparableStartupId, setSelectedComparableStartupId] = useState("");
  const [fundingForm, setFundingForm] = useState<FundingFormState>(emptyFundingForm);
  const [fundingSaving, setFundingSaving] = useState(false);
  const [fundingMessage, setFundingMessage] = useState("");
  const [fundingError, setFundingError] = useState("");
  const [marketComparables, setMarketComparables] = useState<MarketComparableCompany[]>([]);
  const [marketComparablesLoading, setMarketComparablesLoading] = useState(false);
  const [marketComparablesError, setMarketComparablesError] = useState("");
  const [comparablesSourceFilter, setComparablesSourceFilter] = useState<ComparableSourceFilter>("all");
  const [comparablesMetric, setComparablesMetric] = useState<ComparableMetric>("valuation");
  const [loadingMessage] = useState(
    () => valuationLoadingMessages[Math.floor(Math.random() * valuationLoadingMessages.length)]
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [upgradeLimitType, setUpgradeLimitType] = useState<"startup" | "report" | "team" | "startupAccess">("report");
  const [startupAccessTarget, setStartupAccessTarget] = useState<StartupWithValuation | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [previewForm, setPreviewForm] = useState({
    companyName: "",
    stage: "seed",
    industry: "",
    arr: "",
    monthlyGrowthRate: "",
    teamSize: "",
    totalAddressableMarket: "",
  });
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [, setPreviewUsage] = useState<PreviewUsage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/workspace/context", { credentials: "include" });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.status === 428) {
          setDashboardError("Your workspace is almost ready. Refresh this page in a moment to continue.");
          setLoading(false);
          return;
        }

        if (response.status === 402) {
          router.push("/subscription");
          return;
        }

        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Failed to load workspace");
        const profileData = payload.profileData;

        setUserInfo({
          ...payload.userInfo,
          tier: profileData?.tier || (payload.userInfo?.plan_active ? "pro" : "free"),
          startup_count: profileData?.startup_count || 0,
          max_startups: profileData?.max_startups ?? 1,
        });

        const loadedStartups = (payload.startups as StartupWithValuation[]) || [];
        setStartups(loadedStartups);
        setAnalyticsMetric((current) =>
          current === "valuation" && !loadedStartups.some((startup) => getSortedValuations(startup).length > 0)
            ? "readiness"
            : current
        );
        setAnalyticsSelectedStartupIds((current) => {
          const ids = loadedStartups.map((startup) => startup.id);
          if (!ids.length) return [];
          const existing = current.filter((id) => ids.includes(id));
          return existing.length ? existing : ids;
        });
        setSelectedComparableStartupId((current) => {
          const ids = loadedStartups.map((startup) => startup.id);
          if (current && ids.includes(current)) return current;
          const latestValued = [...loadedStartups]
            .filter((startup) => getLatestValuation(startup))
            .sort(
              (first, second) =>
                new Date(getLatestValuation(second)?.created_at || second.created_at).getTime() -
                new Date(getLatestValuation(first)?.created_at || first.created_at).getTime()
            )[0];
          const completeProfile = loadedStartups.find((startup) => startup.stage && startup.industry);
          return latestValued?.id || completeProfile?.id || ids[0] || "";
        });
        setNowMs(Date.now());
        setDashboardError("");
      } catch (error) {
        setStartups([]);
        setDashboardError(error instanceof Error ? error.message : "Could not load your workspace");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const fmt = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
  const fmtPrecise = (value: number) => `$${(value / 1_000_000).toFixed(2)}M`;
  const fmtPreview = (value: number) => {
    if (previewResult?.currency === "INR") {
      if (value >= 10_000_000) return `INR ${(value / 10_000_000).toFixed(1)}Cr`;
      if (value >= 100_000) return `INR ${(value / 100_000).toFixed(1)}L`;
      return `INR ${Math.round(value).toLocaleString("en-IN")}`;
    }
    return fmt(value);
  };

  const getRange = (startup: StartupWithValuation) => {
    const valuation = getLatestValuation(startup);
    if (!valuation?.blended_low_range) return null;
    return {
      range: `${fmt(valuation.blended_low_range)} - ${fmt(valuation.blended_high_range)}`,
      avg: fmt(valuation.blended_weighted_average),
    };
  };

  const hasIncompleteData = (startup: StartupWithValuation) => {
    const requiredFields: Array<keyof Startup> = [
      "team_size",
      "arr",
      "monthly_growth_rate",
      "total_addressable_market",
    ];
    return requiredFields.some((field) => {
      const value = startup[field];
      return value === null || value === undefined || value === "" || value === 0;
    });
  };

  const getStartupReadiness = (startup: StartupWithValuation) => {
    const checks = [
      {
        key: "profile",
        label: "Profile",
        done: Boolean(startup.company_name && startup.stage && startup.industry),
      },
      { key: "team", label: "Team", done: Number(startup.team_size || 0) > 0 },
      { key: "revenue", label: "Revenue", done: Number(startup.arr || 0) > 0 },
      { key: "growth", label: "Growth", done: Number(startup.monthly_growth_rate || 0) > 0 },
      { key: "market", label: "Market", done: Number(startup.total_addressable_market || 0) > 0 },
      { key: "report", label: "Report", done: Boolean(getLatestValuation(startup)) },
    ];
    const score = Math.round((checks.filter((check) => check.done).length / checks.length) * 100);
    const label = score >= 85 ? "Investor-ready" : score >= 55 ? "In progress" : "Needs inputs";
    return { checks, score, label };
  };

  const readinessColorClass = (score: number) => {
    if (score >= 85) return "bg-emerald-600";
    if (score >= 55) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(((nowMs || new Date(date).getTime()) - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const stageLabel = (stage: string) =>
    stage.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const userName = userInfo?.full_name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "there";
  const userInitial = (userInfo?.full_name || userInfo?.email || "?")[0].toUpperCase();
  const isWorkspaceAdmin = userInfo?.workspace_role === "admin" || !userInfo?.workspace_role;
  const isStartupContributor = userInfo?.workspace_role === "startup_contributor";
  const paidAccessExpired = Boolean(
    userInfo?.plan_active &&
    userInfo?.subscription_end_date &&
    new Date(userInfo.subscription_end_date) < new Date()
  );
  const effectivePlanActive = Boolean(userInfo?.plan_active) && !paidAccessExpired;
  const paidAccessEndedLabel = userInfo?.subscription_end_date
    ? new Date(userInfo.subscription_end_date).toLocaleDateString()
    : null;
  const valuedStartups = startups.filter((startup) => getRange(startup));
  const incompleteStartups = startups.filter(hasIncompleteData);
  const latestReportEntry = valuedStartups
    .map((startup) => ({ startup, valuation: getLatestValuation(startup) }))
    .filter((entry) => entry.valuation)
    .sort((first, second) => new Date(second.valuation.created_at).getTime() - new Date(first.valuation.created_at).getTime())[0];
  const avgValuation = valuedStartups.length
    ? fmt(
        valuedStartups.reduce(
          (sum, startup) => sum + (getLatestValuation(startup)?.blended_weighted_average || 0),
          0
        ) / valuedStartups.length
      )
    : "-";
  const totalArr = startups.reduce((sum, startup) => sum + Number(startup.arr || 0), 0);
  const avgGrowthValues = startups.map((startup) => Number(startup.monthly_growth_rate || 0)).filter((value) => value > 0);
  const avgGrowth = avgGrowthValues.length
    ? `${(avgGrowthValues.reduce((sum, value) => sum + value, 0) / avgGrowthValues.length).toFixed(1)}%`
    : "-";
  const currentPlan = (userInfo?.plan === "pro" || userInfo?.plan === "plus" || userInfo?.plan === "startup" || userInfo?.plan === "agency" || userInfo?.plan === "enterprise")
    ? userInfo.plan
    : "free";
  const normalizedPlan = normalizePlanKey(currentPlan, effectivePlanActive);
  const isFreePlan = normalizedPlan === "free";
  const currentPlanLabel = getPlanDisplayName(currentPlan, effectivePlanActive);
  const planLimits = getPlanLimits(currentPlan, effectivePlanActive);
  const isPortfolioWorkspace =
    normalizedPlan === "agency" ||
    normalizedPlan === "enterprise" ||
    userInfo?.onboarding_role === "investor_agency";
  const startupReadinessEntries = startups.map((startup) => ({
    startup,
    readiness: getStartupReadiness(startup),
    valuationAmount: getLatestValuation(startup)?.blended_weighted_average || 0,
  }));
  const avgReadiness = startupReadinessEntries.length
    ? Math.round(startupReadinessEntries.reduce((sum, entry) => sum + entry.readiness.score, 0) / startupReadinessEntries.length)
    : 0;
  const investorReadyCount = startupReadinessEntries.filter((entry) => entry.readiness.score >= 85).length;
  const reportCoveragePct = startups.length ? Math.round((valuedStartups.length / startups.length) * 100) : 0;
  const totalPortfolioValuationAmount = valuedStartups.reduce(
    (sum, startup) => sum + (getLatestValuation(startup)?.blended_weighted_average || 0),
    0
  );
  const totalPortfolioValuation = totalPortfolioValuationAmount ? fmt(totalPortfolioValuationAmount) : "-";
  const topTrackedStartups = [...startupReadinessEntries]
    .sort((first, second) => second.readiness.score - first.readiness.score || second.valuationAmount - first.valuationAmount)
    .slice(0, 5);
  const attentionStartups = [...startupReadinessEntries]
    .filter((entry) => entry.readiness.score < 85)
    .sort((first, second) => first.readiness.score - second.readiness.score)
    .slice(0, 4);
  const stageMix = startups.reduce<Record<string, number>>((acc, startup) => {
    const key = stageLabel(startup.stage || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const workspaceCountLabel = isPortfolioWorkspace ? "Portfolio companies" : "Startup profiles";
  const startupProfileLimit = planLimits.startupProfiles;
  const createActionLocked = startupProfileLimit < UNLIMITED_LIMIT && startups.length >= startupProfileLimit;
  const workspaceAccessLabel = isPortfolioWorkspace ? "Portfolio workspace access" : "Startup workspace access";
  const reportAllowanceLabel = isFreePlan ? "Limited report access" : "Report access included";
  const aiAllowanceLabel = isFreePlan ? "Limited Startup AI access" : "Higher Startup AI access";
  const teamAllowanceLabel = planLimits.teamSeats >= UNLIMITED_LIMIT
    ? "Team access included"
    : planLimits.teamSeats > 0
      ? "Team access included"
      : "Solo workspace";
  const previewAllowanceLabel = isFreePlan ? "Limited valuation previews" : "Valuation previews included";
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const reportsThisMonth = startups.reduce(
    (sum, startup) =>
      sum +
      (startup.valuations || []).filter((valuation) => String(valuation.created_at || "").slice(0, 7) === currentMonthKey).length,
    0
  );
  const hasFiniteStartupLimit = startupProfileLimit < UNLIMITED_LIMIT;
  const hasFiniteReportLimit = planLimits.reportsPerMonth < UNLIMITED_LIMIT;
  const startupLimitUsage = hasFiniteStartupLimit ? startups.length / Math.max(startupProfileLimit, 1) : 0;
  const reportLimitUsage = hasFiniteReportLimit ? reportsThisMonth / Math.max(planLimits.reportsPerMonth, 1) : 0;
  const proactiveLimitNudges = [
    hasFiniteReportLimit && reportLimitUsage >= 0.8
      ? {
          key: "reports",
          message: `You have ${Math.max(planLimits.reportsPerMonth - reportsThisMonth, 0)} report${Math.max(planLimits.reportsPerMonth - reportsThisMonth, 0) === 1 ? "" : "s"} left this month. Agency gives you ${getPlanLimits("agency", true).reportsPerMonth}.`,
          type: "report" as const,
        }
      : null,
    hasFiniteStartupLimit && startupLimitUsage >= 0.8
      ? {
          key: "startups",
          message: startups.length >= startupProfileLimit
            ? `You're at your startup limit. Agency manages ${getPlanLimits("agency", true).startupProfiles} companies.`
            : `You're using ${startups.length} of ${startupProfileLimit} startup profile${startupProfileLimit === 1 ? "" : "s"}. Agency manages ${getPlanLimits("agency", true).startupProfiles} companies.`,
          type: "startup" as const,
        }
      : null,
  ].filter((item): item is { key: string; message: string; type: "report" | "startup" } => Boolean(item));
  const analyticsStageOptions = Array.from(new Set(startups.map((startup) => startup.stage).filter(Boolean)));
  const analyticsIndustryOptions = Array.from(new Set(startups.map((startup) => startup.industry).filter(Boolean) as string[])).sort();
  const analyticsSelectableStartups = startups.filter((startup) => {
    if (analyticsStageFilter !== "all" && startup.stage !== analyticsStageFilter) return false;
    if (analyticsIndustryFilter !== "all" && startup.industry !== analyticsIndustryFilter) return false;
    return true;
  });
  const analyticsSelectedIdSet = new Set(analyticsSelectedStartupIds);
  const analyticsFilteredStartups = analyticsSelectableStartups.filter((startup) => analyticsSelectedIdSet.has(startup.id));
  const analyticsAllSelectableSelected =
    analyticsSelectableStartups.length > 0 &&
    analyticsSelectableStartups.every((startup) => analyticsSelectedIdSet.has(startup.id));
  const selectAllAnalyticsStartups = () => setAnalyticsSelectedStartupIds(analyticsSelectableStartups.map((startup) => startup.id));
  const clearAnalyticsStartups = () => setAnalyticsSelectedStartupIds([]);
  const toggleAnalyticsStartup = (startupId: string) => {
    setAnalyticsSelectedStartupIds((current) =>
      current.includes(startupId) ? current.filter((id) => id !== startupId) : [...current, startupId]
    );
  };
  const analyticsFilteredReadinessEntries = analyticsFilteredStartups.map((startup) => ({
    startup,
    readiness: getStartupReadiness(startup),
    valuationAmount: getLatestValuation(startup)?.blended_weighted_average || 0,
  }));
  const analyticsFallbackTime = nowMs || new Date(analyticsFilteredStartups[0]?.created_at || "2024-01-01").getTime();
  const getAnalyticsMetricValue = (startup: StartupWithValuation, valuation = getLatestValuation(startup)) => {
    if (analyticsMetric === "arr") return Number(startup.arr || 0);
    if (analyticsMetric === "growth") return Number(startup.monthly_growth_rate || 0);
    if (analyticsMetric === "readiness") return getStartupReadiness(startup).score;
    return Number(valuation?.blended_weighted_average || 0);
  };
  const buildAnalyticsBaselinePoints = (startup: StartupWithValuation, value: number, anchorTime?: number): ChartPoint[] => {
    const dateValue = getLatestValuation(startup)?.created_at || startup.created_at;
    const time = new Date(dateValue).getTime();
    const safeTime = anchorTime && Number.isFinite(anchorTime) ? anchorTime : Number.isFinite(time) ? time : analyticsFallbackTime;
    const oneDay = 86_400_000;

    return Array.from({ length: 7 }, (_, index) => {
      const pointTime = safeTime - (6 - index) * oneDay;
      return {
        label: new Date(pointTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
        time: pointTime,
      };
    });
  };
  const analyticsComparisonSeries = analyticsFilteredStartups
    .map((startup, index) => {
      const valuationPoints = getSortedValuations(startup)
        .map((valuation) => {
          const time = new Date(valuation.created_at).getTime();
          return {
            label: new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: valuation.blended_weighted_average || 0,
            time,
          };
        })
        .filter((point) => Number.isFinite(point.time || 0) && point.value > 0);
      const snapshotValue = getAnalyticsMetricValue(startup);
      const hasRealTrajectory = analyticsMetric === "valuation" && valuationPoints.length > 1;
      const baselinePoints =
        analyticsMetric === "valuation" && valuationPoints.length === 1
          ? buildAnalyticsBaselinePoints(startup, valuationPoints[0].value, valuationPoints[0].time)
          : buildAnalyticsBaselinePoints(startup, snapshotValue);
      const points =
        analyticsMetric === "valuation"
          ? hasRealTrajectory
            ? valuationPoints
            : valuationPoints.length === 1
              ? baselinePoints
              : []
          : Number.isFinite(snapshotValue)
            ? baselinePoints
            : [];

      return {
        id: startup.id,
        label: startup.company_name,
        color: chartPalette[index % chartPalette.length],
        points,
        baseline: !hasRealTrajectory,
      };
    })
    .filter((series) => series.points.length > 0);
  const analyticsSelectedStages = new Set(analyticsFilteredStartups.map((startup) => startup.stage).filter(Boolean));
  const analyticsSelectedIndustries = new Set(analyticsFilteredStartups.map((startup) => startup.industry).filter(Boolean) as string[]);
  const analyticsSimilarStartups = startups.filter((startup) => {
    if (!analyticsFilteredStartups.length) return false;
    return (
      (startup.stage && analyticsSelectedStages.has(startup.stage)) ||
      (startup.industry && analyticsSelectedIndustries.has(startup.industry))
    );
  });
  const analyticsValuationValues = analyticsFilteredStartups
    .map((startup) => getLatestValuation(startup)?.blended_weighted_average || 0)
    .filter((value) => value > 0);
  const analyticsValuationMedian = median(analyticsValuationValues);
  const analyticsValuationBenchmarkValue = median(
    analyticsSimilarStartups
      .map((startup) => getLatestValuation(startup)?.blended_weighted_average || 0)
      .filter((value) => value > 0)
  );
  const analyticsBenchmarkValue = median(
    analyticsSimilarStartups
      .map((startup) => getAnalyticsMetricValue(startup))
      .filter((value) => Number.isFinite(value) && (analyticsMetric === "readiness" || value > 0))
  );
  const analyticsBenchmarkAxis = Array.from(
    new Map(
      analyticsComparisonSeries
        .flatMap((series) => series.points)
        .filter((point) => point.time)
        .sort((first, second) => (first.time || 0) - (second.time || 0))
        .map((point) => [point.time, point.label])
    ).entries()
  );
  const analyticsBenchmarkSeries =
    analyticsShowBenchmark && analyticsBenchmarkValue > 0 && analyticsComparisonSeries.length
      ? {
          id: "similar-startup-benchmark",
          label: "Similar-startup median",
          color: "#111827",
          dashed: true,
          points: analyticsBenchmarkAxis.length
            ? analyticsBenchmarkAxis.map(([time, label]) => ({ label, time: time as number, value: analyticsBenchmarkValue }))
            : [{ label: "Now", time: analyticsFallbackTime, value: analyticsBenchmarkValue }],
        }
      : null;
  const analyticsGraphSeries = analyticsBenchmarkSeries
    ? [...analyticsComparisonSeries, analyticsBenchmarkSeries]
    : analyticsComparisonSeries;
  const analyticsPlottedStartupCount = analyticsComparisonSeries.length;
  const analyticsHasTrajectory = analyticsComparisonSeries.some((series) => series.points.length > 1 && !series.baseline);
  const analyticsLineValueFormatter =
    analyticsMetric === "growth"
      ? formatPercentCompact
      : analyticsMetric === "readiness"
        ? (value: number) => `${Math.round(value)}%`
        : formatMoneyCompact;
  const analyticsStageSegments = Object.entries(
    analyticsFilteredStartups.reduce<Record<string, number>>((acc, startup) => {
      const key = stageLabel(startup.stage || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value], index) => ({ label, value, color: chartPalette[index % chartPalette.length] }));
  const analyticsStatusSegments = [
    {
      label: "Investor-ready",
      value: analyticsFilteredReadinessEntries.filter((entry) => entry.readiness.score >= 85).length,
      color: "#059669",
    },
    {
      label: "In progress",
      value: analyticsFilteredReadinessEntries.filter((entry) => entry.readiness.score >= 55 && entry.readiness.score < 85).length,
      color: "#d97706",
    },
    {
      label: "Needs inputs",
      value: analyticsFilteredReadinessEntries.filter((entry) => entry.readiness.score < 55).length,
      color: "#dc2626",
    },
  ].filter((segment) => segment.value > 0);
  const analyticsMissingInputs = analyticsFilteredStartups.reduce<Record<string, number>>((acc, startup) => {
    getStartupReadiness(startup).checks.forEach((check) => {
      if (!check.done) acc[check.label] = (acc[check.label] || 0) + 1;
    });
    return acc;
  }, {});
  const analyticsMissingRows = Object.entries(analyticsMissingInputs)
    .sort((first, second) => second[1] - first[1])
    .map(([label, count], index) => ({
      label,
      value: count,
      detail: `${count} ${count === 1 ? "startup" : "startups"} affected`,
      color: chartPalette[index % chartPalette.length],
    }));
  const analyticsSummary = {
    tracked: analyticsFilteredStartups.length,
    valued: analyticsFilteredStartups.filter((startup) => getLatestValuation(startup)).length,
    historical: analyticsFilteredStartups.filter((startup) => getSortedValuations(startup).length > 1).length,
    totalValuation: analyticsFilteredStartups.reduce((sum, startup) => sum + (getLatestValuation(startup)?.blended_weighted_average || 0), 0),
    totalArr: analyticsFilteredStartups.reduce((sum, startup) => sum + Number(startup.arr || 0), 0),
    avgReadiness: analyticsFilteredReadinessEntries.length
      ? Math.round(analyticsFilteredReadinessEntries.reduce((sum, entry) => sum + entry.readiness.score, 0) / analyticsFilteredReadinessEntries.length)
      : 0,
  };
  const analyticsTrackingGapCount = Math.max(analyticsSummary.valued - analyticsSummary.historical, 0);
  const analyticsMovementEntries = analyticsFilteredStartups
    .map((startup) => {
      const valuations = getSortedValuations(startup);
      if (valuations.length < 2) return null;
      const previous = valuations[valuations.length - 2];
      const latest = valuations[valuations.length - 1];
      const previousValue = previous.blended_weighted_average || 0;
      const latestValue = latest.blended_weighted_average || 0;
      if (!previousValue || !latestValue) return null;
      const delta = latestValue - previousValue;
      const percent = (delta / previousValue) * 100;
      return { startup, delta, percent };
    })
    .filter((entry): entry is { startup: StartupWithValuation; delta: number; percent: number } => Boolean(entry))
    .sort((first, second) => Math.abs(second.percent) - Math.abs(first.percent));
  const strongestMovement = analyticsMovementEntries[0] || null;
  const valuationBenchmarkGapPct =
    analyticsValuationMedian > 0 && analyticsValuationBenchmarkValue > 0
      ? ((analyticsValuationMedian - analyticsValuationBenchmarkValue) / analyticsValuationBenchmarkValue) * 100
      : null;
  const topAnalyticsBlocker = analyticsMissingRows[0] || null;
  const dashboardInsightItems = [
    {
      label: "Tracking depth",
      value: analyticsSummary.valued ? `${analyticsSummary.historical}/${analyticsSummary.valued}` : "No reports",
      detail: analyticsTrackingGapCount
        ? `${analyticsTrackingGapCount} ${analyticsTrackingGapCount === 1 ? "startup needs" : "startups need"} a repeat report`
        : analyticsSummary.historical
          ? "Repeat reports available for movement"
          : "Run reports to start tracking",
    },
    {
      label: "Largest movement",
      value: strongestMovement ? `${strongestMovement.percent >= 0 ? "+" : ""}${formatPercentCompact(strongestMovement.percent)}` : "No movement",
      detail: strongestMovement ? `${strongestMovement.startup.company_name} vs previous report` : "Needs 2 dated reports for one startup",
    },
    {
      label: "Benchmark position",
      value: valuationBenchmarkGapPct !== null ? `${valuationBenchmarkGapPct >= 0 ? "+" : ""}${formatPercentCompact(valuationBenchmarkGapPct)}` : "Pending",
      detail: valuationBenchmarkGapPct !== null ? "Selected median vs peer benchmark" : "Needs valued peers in this view",
    },
    {
      label: "Top blocker",
      value: topAnalyticsBlocker?.label || "Clear",
      detail: topAnalyticsBlocker?.detail || "No major input blocker in view",
    },
  ];
  const analyticsMetricConfig: Record<AnalyticsMetric, { label: string; title: string; detail: string }> = {
    valuation: {
      label: "Valuation",
      title: "Valuation movement vs benchmark",
      detail: "Compare dated valuation reports over time, with a similar-startup benchmark overlay.",
    },
    arr: {
      label: "ARR",
      title: "Latest ARR comparison",
      detail: "Compare current revenue signals across selected startups. Add dated reports to track movement.",
    },
    growth: {
      label: "Growth",
      title: "Latest growth comparison",
      detail: "Compare current growth signals across selected startups and similar profiles.",
    },
    readiness: {
      label: "Readiness",
      title: "Readiness movement proxy",
      detail: "Compare current input completeness and report readiness. Re-run reports to track progress over time.",
    },
  };
  const analyticsChartTitle =
    analyticsPlottedStartupCount > 0 && !analyticsHasTrajectory
      ? analyticsMetric === "valuation"
        ? "Latest valuation comparison"
        : analyticsMetricConfig[analyticsMetric].title
      : analyticsMetricConfig[analyticsMetric].title;
  const analyticsChartDetail =
    analyticsPlottedStartupCount > 0 && !analyticsHasTrajectory
      ? analyticsMetric === "valuation"
        ? "Run another dated report for the same startup to show true movement over time."
        : "Current saved values for the selected startups. Add more dated reports to see movement over time."
      : analyticsMetricConfig[analyticsMetric].detail;
  const analyticsChartBadge =
    analyticsPlottedStartupCount > 0
      ? analyticsHasTrajectory
        ? `${analyticsPlottedStartupCount} plotted over time`
        : `${analyticsPlottedStartupCount} current`
      : "No data";

  const selectedComparableStartup =
    startups.find((startup) => startup.id === selectedComparableStartupId) || startups[0] || null;
  const selectedComparableValuation = selectedComparableStartup ? getLatestValuation(selectedComparableStartup) : null;
  const selectedComparableValuationAmount = safeNumber(selectedComparableValuation?.blended_weighted_average);
  const selectedComparableArr = safeNumber(selectedComparableStartup?.arr);
  const selectedComparableGrowth = safeNumber(selectedComparableStartup?.monthly_growth_rate);
  const selectedComparableMultiple =
    selectedComparableArr > 0 && selectedComparableValuationAmount > 0
      ? selectedComparableValuationAmount / selectedComparableArr
      : 0;
  const selectedComparableReadiness = selectedComparableStartup
    ? getStartupReadiness(selectedComparableStartup)
    : null;
  const selectedFundingProfile = safeProfileData(selectedComparableStartup);
  const selectedTargetRaise = safeNumber(fundingForm.targetRaise || selectedFundingProfile.target_raise);
  const selectedUseOfFunds = normalizeUseOfFunds(fundingForm.useOfFunds);
  const selectedFundsAllocated = Object.values(selectedUseOfFunds).reduce((sum, value) => sum + safeNumber(value), 0);
  const fundingPeerRows = startups
    .filter((startup) => startup.id !== selectedComparableStartup?.id)
    .map((startup) => {
      const profile = safeProfileData(startup);
      return {
        startup,
        targetRaise: profileNumber(profile, "target_raise"),
      };
    })
    .filter((entry) => entry.targetRaise > 0);
  const filteredFundingPeers = fundingPeerRows.filter((entry) => {
    if (!selectedComparableStartup) return false;
    const sameStage = entry.startup.stage && selectedComparableStartup.stage && entry.startup.stage === selectedComparableStartup.stage;
    const sameIndustry = entry.startup.industry && selectedComparableStartup.industry && entry.startup.industry === selectedComparableStartup.industry;
    return sameStage || sameIndustry;
  });
  const fundingPeerMedian = median((filteredFundingPeers.length ? filteredFundingPeers : fundingPeerRows).map((entry) => entry.targetRaise));
  const fundingFallbackBenchmark = stageFundingBenchmark(selectedComparableStartup?.stage);
  const fundingBenchmark = fundingPeerMedian || fundingFallbackBenchmark;
  const fundingBenchmarkLabel = fundingPeerMedian ? "Workspace peer median" : "Stage benchmark";
  const latestSelectedValuation = selectedComparableValuationAmount;
  const estimatedPostMoney = latestSelectedValuation + selectedTargetRaise;
  const estimatedOwnership = estimatedPostMoney > 0 ? (selectedTargetRaise / estimatedPostMoney) * 100 : 0;
  const exitBaseMultiple =
    selectedComparableStartup?.stage === "pre-revenue" ? 8 :
    selectedComparableStartup?.stage === "seed" ? 6 :
    selectedComparableStartup?.stage === "series-a" ? 4.5 :
    3.5;
  const projectedExitValue = latestSelectedValuation > 0 ? latestSelectedValuation * exitBaseMultiple : 0;
  const investorExitProceeds = projectedExitValue * (estimatedOwnership / 100);
  const investorReturnMultiple = selectedTargetRaise > 0 && investorExitProceeds > 0 ? investorExitProceeds / selectedTargetRaise : 0;
  const investorAnnualizedReturn = annualizedReturn(investorReturnMultiple);

  useEffect(() => {
    setFundingForm(buildFundingForm(selectedComparableStartup));
    setFundingMessage("");
    setFundingError("");
  }, [selectedComparableStartup?.id]);

  const freshnessScore = (dateValue?: string | null) => {
    if (!dateValue) return 4;
    const time = new Date(dateValue).getTime();
    if (!Number.isFinite(time)) return 4;
    const ageDays = Math.max(0, ((nowMs || time) - time) / 86_400_000);
    if (ageDays <= 180) return 10;
    if (ageDays <= 365) return 8;
    if (ageDays <= 730) return 5;
    return 2;
  };

  const freshnessLabel = (dateValue?: string | null) => {
    if (!dateValue) return "Freshness unknown";
    const time = new Date(dateValue).getTime();
    if (!Number.isFinite(time)) return "Freshness unknown";
    const ageDays = Math.max(0, Math.round(((nowMs || time) - time) / 86_400_000));
    if (ageDays <= 45) return "Fresh";
    if (ageDays <= 365) return `${Math.max(1, Math.round(ageDays / 30))} mo old`;
    return `${Math.max(1, Math.round(ageDays / 365))} yr old`;
  };

  const proximityScore = (peerValue: number, selectedValue: number, weight: number) => {
    if (peerValue <= 0 || selectedValue <= 0) return weight * 0.35;
    const distance = Math.abs(Math.log(peerValue / selectedValue));
    return clamp(weight - distance * weight * 0.75, 0, weight);
  };

  const buildPeerLabel = (score: number): ComparablePeerLabel => {
    if (score >= 74) return "Close peer";
    if (score >= 50) return "Useful peer";
    return "Weak peer";
  };

  const scorePeer = ({
    source,
    stage,
    industry,
    arr,
    growthRate,
    valuation,
    qualityScore,
    freshnessDate,
  }: Pick<ComparablePeer, "source" | "stage" | "industry" | "arr" | "growthRate" | "valuation" | "qualityScore" | "freshnessDate">) => {
    if (!selectedComparableStartup) return 0;
    const industryMatch =
      industry &&
      selectedComparableStartup.industry &&
      industry.toLowerCase() === selectedComparableStartup.industry.toLowerCase();
    const stageMatch =
      stage &&
      selectedComparableStartup.stage &&
      stage.toLowerCase() === selectedComparableStartup.stage.toLowerCase();
    const score =
      (industryMatch ? 22 : 8) +
      (stageMatch ? 20 : 7) +
      proximityScore(arr, selectedComparableArr, 18) +
      proximityScore(Math.abs(growthRate), Math.abs(selectedComparableGrowth), 10) +
      (valuation > 0 ? 10 : 1) +
      clamp(qualityScore, 0, 100) * 0.12 +
      freshnessScore(freshnessDate) +
      (source === "workspace" ? 4 : 0);
    return Math.round(clamp(score, 0, 100));
  };

  const marketComparablePeers: ComparablePeer[] = selectedComparableStartup
    ? marketComparables.map((company) => {
        const arr = safeNumber(company.arr);
        const valuation = safeNumber(company.latest_valuation);
        const growthRate = safeNumber(company.growth_rate);
        const qualityScore = company.data_quality === null || company.data_quality === undefined ? 55 : clamp(safeNumber(company.data_quality), 0, 100);
        const freshnessDate = company.data_freshness_date || company.valuation_date || null;
        const multiple = arr > 0 && valuation > 0 ? valuation / arr : 0;
        const issues = [
          arr <= 0 ? "ARR missing" : "",
          valuation <= 0 ? "Valuation missing" : "",
          qualityScore < 55 ? "Low data quality" : "",
          freshnessScore(freshnessDate) <= 5 ? "Older data" : "",
          ...(company.excluded_reasons || []),
        ].filter(Boolean);
        const basePeer = {
          id: `market-${company.id}`,
          source: "market" as const,
          companyName: company.company_name || "Market peer",
          stage: company.stage || selectedComparableStartup.stage || "unknown",
          industry: company.industry || selectedComparableStartup.industry || "unknown",
          country: company.country || null,
          arr,
          growthRate,
          valuation,
          multiple,
          qualityScore,
          freshnessDate,
          issues,
        };
        const similarityScore = scorePeer(basePeer);
        return {
          ...basePeer,
          similarityScore,
          label: buildPeerLabel(similarityScore),
        };
      })
    : [];

  const workspaceComparablePeers: ComparablePeer[] = selectedComparableStartup
    ? startups
        .filter((startup) => startup.id !== selectedComparableStartup.id)
        .map((startup) => {
          const valuation = safeNumber(getLatestValuation(startup)?.blended_weighted_average);
          const arr = safeNumber(startup.arr);
          const growthRate = safeNumber(startup.monthly_growth_rate);
          const readiness = getStartupReadiness(startup);
          const freshnessDate = getLatestValuation(startup)?.created_at || startup.created_at;
          const multiple = arr > 0 && valuation > 0 ? valuation / arr : 0;
          const missingChecks = readiness.checks.filter((check) => !check.done).map((check) => `${check.label} missing`);
          const basePeer = {
            id: `workspace-${startup.id}`,
            source: "workspace" as const,
            companyName: startup.company_name,
            stage: startup.stage || "unknown",
            industry: startup.industry || "unknown",
            country: "Workspace",
            arr,
            growthRate,
            valuation,
            multiple,
            qualityScore: readiness.score,
            freshnessDate,
            issues: [
              valuation <= 0 ? "No saved valuation" : "",
              arr <= 0 ? "ARR missing" : "",
              ...missingChecks.slice(0, 2),
            ].filter(Boolean),
            href: `/startup/${startup.id}`,
          };
          const similarityScore = scorePeer(basePeer);
          return {
            ...basePeer,
            similarityScore,
            label: buildPeerLabel(similarityScore),
          };
        })
    : [];

  const allComparablePeers = [...marketComparablePeers, ...workspaceComparablePeers]
    .sort(
      (first, second) =>
        second.similarityScore - first.similarityScore ||
        second.qualityScore - first.qualityScore ||
        second.valuation - first.valuation
    );
  const filteredComparablePeers = allComparablePeers.filter((peer) => {
    if (comparablesSourceFilter === "market") return peer.source === "market";
    if (comparablesSourceFilter === "workspace") return peer.source === "workspace";
    if (comparablesSourceFilter === "close") return peer.label === "Close peer";
    return true;
  });
  const valuedComparablePeers = allComparablePeers.filter((peer) => peer.valuation > 0);
  const filteredValuedComparablePeers = filteredComparablePeers.filter((peer) => peer.valuation > 0);
  const marketPeerMedian = median(marketComparablePeers.map((peer) => peer.valuation).filter((value) => value > 0));
  const workspacePeerMedian = median(workspaceComparablePeers.map((peer) => peer.valuation).filter((value) => value > 0));
  const combinedPeerMedian = median(valuedComparablePeers.map((peer) => peer.valuation));
  const peerValuationLow = filteredValuedComparablePeers.length
    ? Math.min(...filteredValuedComparablePeers.map((peer) => peer.valuation))
    : 0;
  const peerValuationHigh = filteredValuedComparablePeers.length
    ? Math.max(...filteredValuedComparablePeers.map((peer) => peer.valuation))
    : 0;
  const closePeerCount = allComparablePeers.filter((peer) => peer.label === "Close peer").length;
  const averagePeerQuality = allComparablePeers.length
    ? Math.round(allComparablePeers.reduce((sum, peer) => sum + peer.qualityScore, 0) / allComparablePeers.length)
    : 0;
  const selectedPeerPosition =
    selectedComparableValuationAmount > 0 && peerValuationLow > 0 && peerValuationHigh > 0
      ? selectedComparableValuationAmount < peerValuationLow
        ? "Below peer range"
        : selectedComparableValuationAmount > peerValuationHigh
          ? "Above peer range"
          : "Inside peer range"
      : "Needs valuation";
  const premiumDiscount =
    selectedComparableValuationAmount > 0 && combinedPeerMedian > 0
      ? ((selectedComparableValuationAmount - combinedPeerMedian) / combinedPeerMedian) * 100
      : 0;
  const defensibility =
    closePeerCount >= 5 && averagePeerQuality >= 65 && selectedComparableValuationAmount > 0 && selectedComparableArr > 0
      ? "Strong"
      : closePeerCount >= 2 && valuedComparablePeers.length >= 3
        ? "Needs explanation"
        : "Weak evidence";
  const investorWorthStatus =
    closePeerCount >= 5 && valuedComparablePeers.length >= 6
      ? "Good benchmark set"
      : valuedComparablePeers.length >= 3
        ? "Needs more evidence"
        : "Not enough comparable depth";
  const comparableMetricConfig: Record<ComparableMetric, { label: string; title: string; detail: string }> = {
    valuation: {
      label: "Valuation",
      title: "Valuation trajectory vs peer benchmarks",
      detail: "Selected startup history against industry-market peers, workspace peers, and close-peer median.",
    },
    arr: {
      label: "ARR",
      title: "ARR comparison",
      detail: "Compare selected ARR against market startups and your workspace database.",
    },
    growth: {
      label: "Growth",
      title: "Growth comparison",
      detail: "Compare monthly growth against market and workspace peer medians.",
    },
    multiple: {
      label: "Multiple",
      title: "Valuation / ARR multiple comparison",
      detail: "Pressure-test whether the selected multiple is above, below, or near peer evidence.",
    },
  };
  const getComparableMetricValue = (peer: ComparablePeer) => {
    if (comparablesMetric === "arr") return peer.arr;
    if (comparablesMetric === "growth") return peer.growthRate;
    if (comparablesMetric === "multiple") return peer.multiple;
    return peer.valuation;
  };
  const comparableMetricHasValue = (value: number) =>
    Number.isFinite(value) && (comparablesMetric === "growth" ? value !== 0 : value > 0);
  const comparableMetricFormatter =
    comparablesMetric === "growth"
      ? formatPercentCompact
      : comparablesMetric === "multiple"
        ? (value: number) => `${value.toFixed(value >= 10 ? 1 : 2)}x`
        : formatMoneyCompact;
  const selectedComparableMetricValue =
    comparablesMetric === "arr"
      ? selectedComparableArr
      : comparablesMetric === "growth"
        ? selectedComparableGrowth
        : comparablesMetric === "multiple"
          ? selectedComparableMultiple
          : selectedComparableValuationAmount;
  const selectedComparableSnapshotTime = selectedComparableStartup
    ? new Date(selectedComparableValuation?.created_at || selectedComparableStartup.created_at).getTime()
    : nowMs;
  const selectedComparableSafeTime = Number.isFinite(selectedComparableSnapshotTime) ? selectedComparableSnapshotTime : nowMs;
  const selectedComparableValuationPoints = selectedComparableStartup
    ? getSortedValuations(selectedComparableStartup).map((valuation) => {
        const time = new Date(valuation.created_at).getTime();
        const safeTime = Number.isFinite(time) ? time : selectedComparableSafeTime;
        return {
          label: new Date(safeTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: valuation.blended_weighted_average || 0,
          time: safeTime,
        };
      })
    : [];
  const selectedComparableMetricPoints =
    comparablesMetric === "valuation"
      ? selectedComparableValuationPoints.filter((point) => comparableMetricHasValue(point.value))
      : comparableMetricHasValue(selectedComparableMetricValue)
        ? [{
            label: "Now",
            value: selectedComparableMetricValue,
            time: selectedComparableSafeTime,
          }]
        : [];
  const comparableChartAxis = selectedComparableMetricPoints.length
    ? selectedComparableMetricPoints
    : [{
        label: "Now",
        value: 0,
        time: selectedComparableSafeTime || nowMs,
      }];
  const marketMetricMedian = median(marketComparablePeers.map(getComparableMetricValue).filter(comparableMetricHasValue));
  const workspaceMetricMedian = median(workspaceComparablePeers.map(getComparableMetricValue).filter(comparableMetricHasValue));
  const closePeerMetricMedian = median(allComparablePeers.filter((peer) => peer.label === "Close peer").map(getComparableMetricValue).filter(comparableMetricHasValue));
  const buildComparableBenchmarkSeries = (id: string, label: string, color: string, value: number): ChartSeries | null => {
    if (!comparableMetricHasValue(value)) return null;
    return {
      id,
      label,
      color,
      dashed: true,
      points: comparableChartAxis.map((point) => ({
        label: point.label,
        time: point.time,
        value,
      })),
    };
  };
  const comparableChartSeries = [
    selectedComparableMetricPoints.length
      ? {
          id: "selected-startup",
          label: selectedComparableStartup?.company_name || "Selected startup",
          color: "#7c3aed",
          points: selectedComparableMetricPoints,
        }
      : null,
    buildComparableBenchmarkSeries("market-peer-median", "Industry market median", "#2563eb", marketMetricMedian),
    buildComparableBenchmarkSeries("workspace-peer-median", "Workspace median", "#0f766e", workspaceMetricMedian),
    buildComparableBenchmarkSeries("close-peer-median", "Close-peer median", "#111827", closePeerMetricMedian),
  ].filter(Boolean) as ChartSeries[];
  const selectedComparableMissingActions = selectedComparableStartup
    ? getStartupReadiness(selectedComparableStartup).checks.filter((check) => !check.done)
    : [];
  const closestPeer = allComparablePeers[0] || null;
  const investorInterpretation =
    selectedComparableValuationAmount <= 0
      ? "Run or refresh a valuation before using this peer set in an investor conversation."
      : combinedPeerMedian <= 0
        ? "There are not enough valued peers yet to defend a pricing view from comparables alone."
        : premiumDiscount > 25
          ? "The selected startup prices at a premium to the peer median. The memo should defend stronger growth, market quality, retention, or strategic scarcity."
          : premiumDiscount < -25
            ? "The selected startup prices below the peer median. Investors may see upside, but the team should explain whether the discount is due to risk, stage, or missing evidence."
            : "The selected startup sits near the peer median, which is easier to defend if ARR, growth, and report inputs are complete.";

  useEffect(() => {
    if (activeMode !== "comparables" || !selectedComparableStartup || isFreePlan || isStartupContributor) return;

    const industry = selectedComparableStartup.industry?.trim();
    const stage = selectedComparableStartup.stage?.trim();
    const controller = new AbortController();
    const loadMarketPeers = async () => {
      if (!industry || !stage) {
        setMarketComparables([]);
        setMarketComparablesError("Add industry and stage before loading market peers.");
        setMarketComparablesLoading(false);
        return;
      }

      setMarketComparablesLoading(true);
      setMarketComparablesError("");

      const fetchPeers = async (includeArrBand: boolean) => {
        const params = new URLSearchParams({
          industry,
          stage,
          limit: "80",
        });
        if (includeArrBand && selectedComparableArr > 0) {
          params.set("arrMin", String(Math.max(0, Math.round(selectedComparableArr * 0.25))));
          params.set("arrMax", String(Math.round(selectedComparableArr * 4)));
        }
        const response = await fetch(`/api/comparable-companies?${params}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Could not load market peers.");
        return (payload.data || []) as MarketComparableCompany[];
      };

      try {
        const rangedPeers = await fetchPeers(true);
        const peers = rangedPeers.length || selectedComparableArr <= 0 ? rangedPeers : await fetchPeers(false);
        setMarketComparables(peers);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMarketComparables([]);
        setMarketComparablesError(error instanceof Error ? error.message : "Could not load market peers.");
      } finally {
        if (!controller.signal.aborted) setMarketComparablesLoading(false);
      }
    };

    loadMarketPeers();

    return () => controller.abort();
  }, [
    activeMode,
    selectedComparableStartup,
    selectedComparableArr,
    isFreePlan,
    isStartupContributor,
  ]);

  const openUpgrade = (reason: string, type: "startup" | "report" | "team" | "startupAccess" = "report") => {
    setUpgradeReason(reason);
    setUpgradeLimitType(type);
    setUpgradeModalOpen(true);
  };

  const handlePaidStartupAction = () => {
    if (createActionLocked) {
      openUpgrade(
        isFreePlan
          ? "Free includes one lifetime startup. Upgrade to Startup to add another startup profile."
          : `Your current plan includes ${startupProfileLimit} active startup profile${startupProfileLimit === 1 ? "" : "s"}. Upgrade to add more.`,
        "startup"
      );
      return;
    }
    router.push("/startup/new");
  };

  const openFeatureUpgrade = (feature: string, type: "startup" | "report" | "team" | "startupAccess" = "report") => {
    openUpgrade(`${feature} is reserved for eligible Evaldam AI plans. Upgrade to unlock it from this workspace.`, type);
  };

  const openComparables = () => {
    if (isFreePlan || isStartupContributor) {
      openFeatureUpgrade("Comparable company analysis", "report");
      return;
    }
    setActiveMode("comparables");
    setWorkspaceSidebarOpen(false);
  };

  const openStartupAi = () => {
    if (isStartupContributor) {
      openFeatureUpgrade("Startup AI", "report");
      return;
    }
    router.push("/startup-ai");
  };

  const openPortfolioAnalytics = () => {
    if (planLimits.portfolioDashboard === "none") {
      openFeatureUpgrade("Portfolio analytics and multi-startup comparison", "startup");
      return;
    }
    setActiveMode("dashboard");
  };

  const openApiCredits = () => {
    if (isStartupContributor) {
      openUpgrade("API credits and billing are managed by the workspace Admin.", "report");
      return;
    }
    router.push("/subscription#api-credits");
  };

  const handleShareStartup = (startup: StartupWithValuation) => {
    if (!isWorkspaceAdmin) {
      openUpgrade("Only the workspace Admin can invite startup contacts to update a startup card.", "startupAccess");
      return;
    }

    if (!["agency", "enterprise"].includes(normalizedPlan) || !effectivePlanActive) {
      openUpgrade(
        "Invite Startup lets an incubator, investor, or portfolio Admin share one startup card with the startup team so they can update their own details. Upgrade to Agency / Investor to use it.",
        "startupAccess"
      );
      return;
    }

    setStartupAccessTarget(startup);
  };

  const calculatePreview = async () => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const response = await fetch("/api/valuation-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setPreviewUsage(data.usage || null);
        if (response.status === 429) {
          openUpgrade(data.message || "Upgrade to continue checking valuation previews.", "report");
        }
        throw new Error(data.message || data.error || "Could not calculate preview");
      }

      setPreviewResult(data.data.result);
      writeStartupProfilePrefill({
        companyName: previewForm.companyName,
        stage: previewForm.stage,
        industry: previewForm.industry,
        arr: previewForm.arr,
        monthlyGrowthRate: previewForm.monthlyGrowthRate,
        teamSize: previewForm.teamSize,
        totalAddressableMarket: previewForm.totalAddressableMarket,
        source: "dashboard_preview",
      });
      setPreviewUsage(data.data.usage || null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Could not calculate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveFundingProfile = async () => {
    if (!selectedComparableStartup) return;

    setFundingSaving(true);
    setFundingError("");
    setFundingMessage("");

    const cleanedUseOfFunds = Object.fromEntries(
      useOfFundsCategories.map(({ key }) => [key, safeNumber(fundingForm.useOfFunds[key])])
    );
    const cleanedRounds = fundingForm.fundingRounds
      .map((round) => ({
        type: round.type.trim(),
        valuation: safeNumber(round.valuation),
        investment: safeNumber(round.investment),
        equity: safeNumber(round.equity),
        closed_date: round.closedDate,
      }))
      .filter((round) => round.type || round.valuation || round.investment || round.equity || round.closed_date);

    try {
      const response = await fetch(`/api/startup/${selectedComparableStartup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profile_data: {
            currently_raising: fundingForm.currentlyRaising,
            target_raise: safeNumber(fundingForm.targetRaise),
            expected_close_date: fundingForm.expectedCloseDate || null,
            use_of_funds_allocation: cleanedUseOfFunds,
            funding_rounds: cleanedRounds,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not save funding details.");
      }

      const updatedStartup = payload.startup as StartupWithValuation;
      setStartups((current) =>
        current.map((startup) =>
          startup.id === selectedComparableStartup.id
            ? { ...startup, ...updatedStartup, valuations: startup.valuations }
            : startup
        )
      );
      setFundingMessage("Funding details saved.");
    } catch (error) {
      setFundingError(error instanceof Error ? error.message : "Could not save funding details.");
    } finally {
      setFundingSaving(false);
    }
  };

  const sidebarItems = [
    { key: "startups" as const, label: "Startups", Icon: Database },
    { key: "dashboard" as const, label: "Dashboard", Icon: LayoutDashboard },
    { key: "funding" as const, label: "Funding", Icon: BriefcaseBusiness },
    { key: "exit" as const, label: "Exit & ROI", Icon: TrendingUp },
  ];

  const lockedFeatureCards = [
    {
      title: "Startup AI",
      description: "Ask fundraising, dilution, valuation, and investor-readiness questions.",
      status: isStartupContributor ? "Admin only" : "Available",
      limit: aiAllowanceLabel,
      Icon: Bot,
      locked: isStartupContributor,
      action: openStartupAi,
    },
    {
      title: "Comparables",
      description: "Screen peer companies and market benchmarks before a report is shared.",
      status: isFreePlan || isStartupContributor ? "Paid" : "Available",
      limit: isFreePlan ? "Included from Startup plan" : "Peer benchmark access",
      Icon: BarChart3,
      locked: isFreePlan || isStartupContributor,
      action: openComparables,
    },
    {
      title: "Portfolio analytics",
      description: "Compare readiness, value ranges, traction, and gaps across companies.",
      status: planLimits.portfolioDashboard === "none" ? "Agency+" : "Available",
      limit: planLimits.portfolioDashboard === "advanced" ? "Advanced dashboard" : planLimits.portfolioDashboard === "standard" ? "Standard dashboard" : "Reserved space",
      Icon: BriefcaseBusiness,
      locked: planLimits.portfolioDashboard === "none",
      action: openPortfolioAnalytics,
    },
    {
      title: "API credits",
      description: "Add prepaid credits for model API calls and external workflows.",
      status: isStartupContributor ? "Admin only" : "Separate wallet",
      limit: "Pay as you go",
      Icon: CreditCard,
      locked: isStartupContributor,
      action: openApiCredits,
    },
  ];

  const selectedStartupSelector = (
    <div className="w-full xl:max-w-md">
      <label htmlFor="dashboard-startup-select" className="form-label">Startup</label>
      <select
        id="dashboard-startup-select"
        value={selectedComparableStartup?.id || ""}
        onChange={(event) => setSelectedComparableStartupId(event.target.value)}
        className="input mt-1"
      >
        {startups.map((startup) => {
          const valuation = getLatestValuation(startup)?.blended_weighted_average || 0;
          return (
            <option key={startup.id} value={startup.id}>
              {startup.company_name} / {stageLabel(startup.stage || "unknown")} / {startup.industry || "No industry"} / {valuation ? formatMoneyCompact(valuation) : "No report"}
            </option>
          );
        })}
      </select>
    </div>
  );

  const fundingView = (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Funding rounds</h2>
          <p className="mt-0.5 text-sm text-gray-500">Track current raise, fund use, and round history.</p>
        </div>
        {selectedStartupSelector}
      </section>

      {!selectedComparableStartup ? (
        <EmptyChart label="Add a startup before tracking funding." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <section className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Current funding round</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-950">{selectedComparableStartup.company_name}</h3>
                </div>
                <div className="inline-flex w-fit overflow-hidden border border-slate-400">
                  {[
                    ["Yes", true],
                    ["No", false],
                  ].map(([label, value]) => (
                    <button
                      key={label as string}
                      type="button"
                      onClick={() => setFundingForm((current) => ({ ...current, currentlyRaising: Boolean(value) }))}
                      className={`px-5 py-2 text-sm font-bold ${fundingForm.currentlyRaising === value ? "bg-primary text-white" : "bg-white text-gray-950 hover:bg-slate-50"}`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="target-raise" className="form-label">Capital needed</label>
                  <input
                    id="target-raise"
                    className="input"
                    type="number"
                    min={0}
                    value={fundingForm.targetRaise}
                    onChange={(event) => setFundingForm((current) => ({ ...current, targetRaise: event.target.value }))}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label htmlFor="expected-close-date" className="form-label">Expected closing date</label>
                  <input
                    id="expected-close-date"
                    className="input"
                    type="date"
                    value={fundingForm.expectedCloseDate}
                    onChange={(event) => setFundingForm((current) => ({ ...current, expectedCloseDate: event.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Use of funds</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-950">Allocate the round before sharing it.</h3>
                </div>
                <p className="font-mono text-sm font-bold text-gray-950">
                  {formatMoneyCompact(selectedFundsAllocated)} / {selectedTargetRaise ? formatMoneyCompact(selectedTargetRaise) : "$0"}
                </p>
              </div>
              <div className="space-y-3">
                {useOfFundsCategories.map(({ key, label }) => {
                  const amount = safeNumber(fundingForm.useOfFunds[key]);
                  const width = selectedTargetRaise > 0 ? clamp((amount / selectedTargetRaise) * 100, 0, 100) : 0;
                  return (
                    <div key={key} className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_180px] md:items-center">
                      <label htmlFor={`funding-${key}`} className="text-sm font-bold text-gray-950">{label}</label>
                      <div className="h-2.5 overflow-hidden bg-slate-100">
                        <div className="h-full bg-primary" style={{ width: `${width}%` }} />
                      </div>
                      <input
                        id={`funding-${key}`}
                        className="input"
                        type="number"
                        min={0}
                        value={fundingForm.useOfFunds[key]}
                        onChange={(event) =>
                          setFundingForm((current) => ({
                            ...current,
                            useOfFunds: { ...current.useOfFunds, [key]: event.target.value },
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Past funding rounds</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-950">Keep valuation and dilution history in one place.</h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFundingForm((current) => ({
                      ...current,
                      fundingRounds: [...current.fundingRounds, { type: "", valuation: "", investment: "", equity: "", closedDate: "" }],
                    }))
                  }
                  className="btn btn-secondary btn-sm"
                >
                  Add round
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="py-2 pr-3">Type</th>
                      <th className="px-3 py-2">Post-money / cap</th>
                      <th className="px-3 py-2">Investment</th>
                      <th className="px-3 py-2">Equity %</th>
                      <th className="px-3 py-2">Closed date</th>
                      <th className="py-2 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundingForm.fundingRounds.length ? fundingForm.fundingRounds.map((round, index) => (
                      <tr key={index} className="border-b border-slate-200 last:border-b-0">
                        {[
                          ["type", "Seed"],
                          ["valuation", "5000000"],
                          ["investment", "500000"],
                          ["equity", "10"],
                          ["closedDate", ""],
                        ].map(([field, placeholder]) => (
                          <td key={field} className="px-3 py-2 first:pl-0">
                            <input
                              className="input"
                              type={field === "closedDate" ? "date" : field === "type" ? "text" : "number"}
                              value={round[field as keyof FundingRoundInput]}
                              placeholder={placeholder}
                              onChange={(event) =>
                                setFundingForm((current) => ({
                                  ...current,
                                  fundingRounds: current.fundingRounds.map((item, roundIndex) =>
                                    roundIndex === index ? { ...item, [field]: event.target.value } : item
                                  ),
                                }))
                              }
                            />
                          </td>
                        ))}
                        <td className="py-2 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setFundingForm((current) => ({
                                ...current,
                                fundingRounds: current.fundingRounds.filter((_, roundIndex) => roundIndex !== index),
                              }))
                            }
                            className="text-xs font-bold text-gray-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm font-semibold text-gray-500">
                          No past rounds added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {fundingError && <p className="text-sm font-semibold text-red-600">{fundingError}</p>}
            {fundingMessage && <p className="text-sm font-semibold text-primary">{fundingMessage}</p>}
            <button type="button" onClick={saveFundingProfile} disabled={fundingSaving} className="btn btn-primary inline-flex items-center gap-2">
              {fundingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {fundingSaving ? "Saving..." : "Save funding details"}
            </button>
          </section>

          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Funding benchmark</p>
              <h3 className="mt-1 text-xl font-bold text-gray-950">Raise compared with peers</h3>
              <div className="mt-5 space-y-3">
                <HorizontalBarChart
                  rows={[
                    { label: "Capital needed", value: selectedTargetRaise, detail: selectedComparableStartup.company_name, color: "#0f766e" },
                    { label: fundingBenchmarkLabel, value: fundingBenchmark, detail: fundingPeerMedian ? `${filteredFundingPeers.length || fundingPeerRows.length} workspace peers` : stageLabel(selectedComparableStartup.stage), color: "#111827" },
                  ].filter((row) => row.value > 0)}
                  valueFormatter={formatMoneyCompact}
                  emptyLabel="Add capital needed to benchmark this raise."
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {selectedTargetRaise && fundingBenchmark
                  ? selectedTargetRaise > fundingBenchmark * 1.25
                    ? "This raise is above the current benchmark. Tie the extra capital to milestones and fund use."
                    : selectedTargetRaise < fundingBenchmark * 0.75
                      ? "This raise is below benchmark. Show how the round still reaches the next valuation milestone."
                      : "This raise is close to the benchmark range and easier to defend with clean use-of-funds evidence."
                  : "Add a target raise to compare it against your workspace and stage context."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Round summary</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["Target", selectedTargetRaise ? formatMoneyCompact(selectedTargetRaise) : "-"],
                  ["Allocated", selectedFundsAllocated ? formatMoneyCompact(selectedFundsAllocated) : "-"],
                  ["Peer median", fundingPeerMedian ? formatMoneyCompact(fundingPeerMedian) : "-"],
                  ["Past rounds", String(fundingForm.fundingRounds.length)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                    <p className="mt-2 font-mono text-sm font-bold text-gray-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );

  const exitRoiView = (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Exit & ROI</h2>
          <p className="mt-0.5 text-sm text-gray-500">Estimate exit value, investor ownership, and return scenarios.</p>
        </div>
        {selectedStartupSelector}
      </section>

      {!selectedComparableStartup ? (
        <EmptyChart label="Add a startup before checking exit and ROI." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_440px]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Projected outcome</p>
                <h3 className="mt-1 text-xl font-bold text-gray-950">{selectedComparableStartup.company_name}</h3>
              </div>
              <p className="text-sm font-semibold text-gray-500">
                Based on latest valuation and saved target raise.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Latest valuation", latestSelectedValuation ? formatMoneyCompact(latestSelectedValuation) : "Run report", "Current report value"],
                ["Target raise", selectedTargetRaise ? formatMoneyCompact(selectedTargetRaise) : "Add funding", "Funding page input"],
                ["Ownership sold", estimatedOwnership ? `${estimatedOwnership.toFixed(1)}%` : "-", "Estimated post-money"],
                ["Exit value", projectedExitValue ? formatMoneyCompact(projectedExitValue) : "-", `${exitBaseMultiple}x scenario`],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="mt-2 font-mono text-lg font-bold text-gray-950">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Exit sensitivity</p>
              <div className="mt-4 space-y-3">
                {[0.75, 1, 1.25].map((factor) => {
                  const scenarioMultiple = exitBaseMultiple * factor;
                  const scenarioExitValue = latestSelectedValuation * scenarioMultiple;
                  const scenarioReturn = selectedTargetRaise > 0 && estimatedOwnership > 0
                    ? (scenarioExitValue * (estimatedOwnership / 100)) / selectedTargetRaise
                    : 0;
                  return (
                    <div key={factor} className="grid gap-3 rounded-lg border border-slate-200 px-4 py-3 md:grid-cols-4 md:items-center">
                      <p className="text-sm font-bold text-gray-950">{scenarioMultiple.toFixed(1)}x exit</p>
                      <p className="font-mono text-sm font-bold text-gray-950">{scenarioExitValue ? formatMoneyCompact(scenarioExitValue) : "-"}</p>
                      <p className="font-mono text-sm font-bold text-gray-950">{scenarioReturn ? `${scenarioReturn.toFixed(1)}x return` : "-"}</p>
                      <div className="h-2.5 bg-slate-100">
                        <div className="h-full bg-primary" style={{ width: `${clamp((scenarioReturn / Math.max(exitBaseMultiple, 1)) * 100, 3, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Investor return</p>
              <p className="mt-3 font-mono text-4xl font-bold text-gray-950">
                {investorReturnMultiple ? `${investorReturnMultiple.toFixed(1)}x` : "-"}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {investorAnnualizedReturn ? `${investorAnnualizedReturn.toFixed(1)}% annualized over 7 years` : "Add valuation and target raise to calculate ROI."}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Readiness link</p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {selectedComparableReadiness?.score
                  ? `${selectedComparableReadiness.score}% readiness. Missing inputs reduce confidence in return assumptions.`
                  : "Complete startup inputs before using this in an investor conversation."}
              </p>
              <Link href={`/startup/${selectedComparableStartup.id}`} className="btn btn-secondary mt-4 inline-flex items-center gap-2">
                Open startup <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );

  const comparablesView =
    isFreePlan || isStartupContributor ? (
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Comparable companies</h2>
            <p className="mt-1 text-sm text-gray-500">Paid: investor-grade peer analysis with market and workspace benchmarks.</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Paid comparables combine market startups, your workspace database, valuation multiples, freshness checks, and memo-ready interpretation.
            </p>
            <button
              type="button"
              onClick={() => openFeatureUpgrade("Comparable company analysis", "report")}
              className="btn btn-primary mt-5 inline-flex items-center gap-2"
            >
              Unlock comparables <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    ) : (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex justify-end">
              <div className="w-full xl:max-w-md">
                <label htmlFor="comparable-startup-select" className="form-label">Startup to benchmark</label>
                <select
                  id="comparable-startup-select"
                  value={selectedComparableStartup?.id || ""}
                  onChange={(event) => setSelectedComparableStartupId(event.target.value)}
                  className="input mt-1"
                >
                  {startups.map((startup) => {
                    const valuation = getLatestValuation(startup)?.blended_weighted_average || 0;
                    return (
                      <option key={startup.id} value={startup.id}>
                        {startup.company_name} / {stageLabel(startup.stage || "unknown")} / {startup.industry || "No industry"} / {valuation ? formatMoneyCompact(valuation) : "No valuation"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {!selectedComparableStartup ? (
            <div className="px-4 py-12 text-center sm:px-5">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Database className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Add a startup before benchmarking peers.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Comparables need a selected company profile, stage, industry, ARR, and valuation context.
              </p>
              <button type="button" onClick={handlePaidStartupAction} className="btn btn-primary mx-auto mt-5 inline-flex items-center gap-2">
                Create startup <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 bg-white p-4 sm:p-5">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Comparison chart</p>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">{comparableMetricConfig[comparablesMetric].title}</h3>
                      <p className="mt-1 text-sm leading-5 text-gray-500">{comparableMetricConfig[comparablesMetric].detail}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(comparableMetricConfig) as ComparableMetric[]).map((metric) => (
                        <button
                          key={metric}
                          type="button"
                          onClick={() => setComparablesMetric(metric)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            comparablesMetric === metric
                              ? "border-primary bg-primary text-white"
                              : "border-slate-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          {comparableMetricConfig[metric].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Selected", comparableMetricHasValue(selectedComparableMetricValue) ? comparableMetricFormatter(selectedComparableMetricValue) : "-", selectedComparableStartup.company_name],
                      ["Market median", comparableMetricHasValue(marketMetricMedian) ? comparableMetricFormatter(marketMetricMedian) : "-", `${marketComparablePeers.length} market peers`],
                      ["Workspace median", comparableMetricHasValue(workspaceMetricMedian) ? comparableMetricFormatter(workspaceMetricMedian) : "-", `${workspaceComparablePeers.length} workspace peers`],
                      ["Close-peer median", comparableMetricHasValue(closePeerMetricMedian) ? comparableMetricFormatter(closePeerMetricMedian) : "-", `${closePeerCount} close peers`],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                        <p className="mt-1 font-mono text-sm font-bold text-gray-900">{value}</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-gray-500">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-4 sm:px-5">
                  <MetricLineChart
                    series={comparableChartSeries}
                    valueFormatter={comparableMetricFormatter}
                    emptyLabel="Add valuation, ARR, growth, or peer data to draw the comparison chart."
                  />
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px]">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {selectedComparableStartup.logo_url ? (
                          <Image src={normalizeCloudinaryImageUrl(selectedComparableStartup.logo_url)} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-base font-bold text-gray-800">{(selectedComparableStartup.company_name || "S")[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-bold text-gray-900">{selectedComparableStartup.company_name}</h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {stageLabel(selectedComparableStartup.stage || "unknown")} / {selectedComparableStartup.industry || "Industry missing"}
                        </p>
                      </div>
                    </div>
                    <span className={`w-fit rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase ${
                      defensibility === "Strong"
                        ? "bg-emerald-50 text-emerald-700"
                        : defensibility === "Needs explanation"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-red-50 text-red-700"
                    }`}>
                      {defensibility}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Selected valuation", selectedComparableValuationAmount ? formatMoneyCompact(selectedComparableValuationAmount) : "Not run", selectedComparableValuation?.created_at ? `Updated ${freshnessLabel(selectedComparableValuation.created_at)}` : "Run valuation"],
                      ["Valuation / ARR", selectedComparableMultiple ? `${selectedComparableMultiple.toFixed(selectedComparableMultiple >= 10 ? 1 : 2)}x` : "-", selectedComparableArr ? `${formatMoneyCompact(selectedComparableArr)} ARR` : "ARR missing"],
                      ["Peer median", combinedPeerMedian ? formatMoneyCompact(combinedPeerMedian) : "-", `${valuedComparablePeers.length} valued peers`],
                      ["Position", selectedPeerPosition, premiumDiscount ? `${premiumDiscount > 0 ? "+" : ""}${premiumDiscount.toFixed(0)}% vs median` : "Median unavailable"],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                        <p className="mt-2 font-mono text-sm font-bold text-gray-900">{value}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-gray-500">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Worth investor time?</p>
                        <h3 className="mt-1 text-lg font-bold text-gray-900">{investorWorthStatus}</h3>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 lg:w-[460px]">
                        {[
                          ["Market", marketComparablePeers.length.toString()],
                          ["Workspace", workspaceComparablePeers.length.toString()],
                          ["Close peers", closePeerCount.toString()],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                            <p className="mt-1 font-mono text-sm font-bold text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{investorInterpretation}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Data quality</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Avg quality</p>
                        <p className="mt-2 font-mono text-lg font-bold text-gray-900">{averagePeerQuality || 0}%</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Readiness</p>
                        <p className="mt-2 font-mono text-lg font-bold text-gray-900">{selectedComparableReadiness?.score || 0}%</p>
                      </div>
                    </div>
                    {marketComparablesLoading && (
                      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading market peers
                      </p>
                    )}
                    {marketComparablesError && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                        {marketComparablesError}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Median split</p>
                    <div className="mt-3 space-y-3">
                      {[
                        ["Market median", marketPeerMedian],
                        ["Workspace median", workspacePeerMedian],
                        ["Combined median", combinedPeerMedian],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <span className="text-sm font-bold text-gray-600">{label}</span>
                          <span className="font-mono text-sm font-bold text-gray-900">{safeNumber(value) ? formatMoneyCompact(safeNumber(value)) : "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Ranked comparable set</h3>
                      <p className="mt-1 text-sm text-gray-500">Sorted by industry, stage, ARR proximity, growth, quality, and freshness.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["all", "All"],
                        ["market", "Market"],
                        ["workspace", "Workspace"],
                        ["close", "Close peers"],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setComparablesSourceFilter(key as ComparableSourceFilter)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            comparablesSourceFilter === key
                              ? "border-primary bg-primary text-white"
                              : "border-slate-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-white text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">ARR</th>
                        <th className="px-4 py-3">Growth</th>
                        <th className="px-4 py-3">Valuation</th>
                        <th className="px-4 py-3">Multiple</th>
                        <th className="px-4 py-3">Quality</th>
                        <th className="px-4 py-3">Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredComparablePeers.length ? (
                        filteredComparablePeers.map((peer) => {
                          const row = (
                            <>
                              <td className="px-4 py-3">
                                <p className="font-bold text-gray-900">{peer.companyName}</p>
                                <p className="mt-1 text-xs font-semibold text-gray-500">
                                  {stageLabel(peer.stage)} / {peer.industry}{peer.country ? ` / ${peer.country}` : ""}
                                </p>
                                {peer.issues.length > 0 && (
                                  <p className="mt-1 text-xs font-semibold text-amber-700">{peer.issues.slice(0, 2).join(", ")}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                                  peer.source === "market" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                  {peer.source}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-800">{peer.arr ? formatMoneyCompact(peer.arr) : "-"}</td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-800">{peer.growthRate ? formatPercentCompact(peer.growthRate) : "-"}</td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-800">{peer.valuation ? formatMoneyCompact(peer.valuation) : "-"}</td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-800">{peer.multiple ? `${peer.multiple.toFixed(peer.multiple >= 10 ? 1 : 2)}x` : "-"}</td>
                              <td className="px-4 py-3">
                                <p className="font-mono font-bold text-gray-800">{peer.qualityScore}%</p>
                                <p className="text-xs font-semibold text-gray-500">{freshnessLabel(peer.freshnessDate)}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                                  peer.label === "Close peer"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : peer.label === "Useful peer"
                                      ? "bg-amber-50 text-amber-800"
                                      : "bg-slate-100 text-gray-600"
                                }`}>
                                  {peer.label} / {peer.similarityScore}%
                                </span>
                              </td>
                            </>
                          );
                          return peer.href ? (
                            <tr key={peer.id} className="hover:bg-slate-50">
                              {row}
                            </tr>
                          ) : (
                            <tr key={peer.id} className="hover:bg-slate-50">
                              {row}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm font-semibold text-gray-500">
                            No peers match this filter yet. Broaden the source filter or complete startup data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 lg:hidden">
                  {filteredComparablePeers.length ? (
                    filteredComparablePeers.map((peer) => (
                      <div key={peer.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900">{peer.companyName}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-500">{stageLabel(peer.stage)} / {peer.industry}</p>
                          </div>
                          <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                            peer.source === "market" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {peer.source}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-lg border border-slate-200 bg-white p-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Valuation</p>
                            <p className="mt-1 font-mono font-bold text-gray-900">{peer.valuation ? formatMoneyCompact(peer.valuation) : "-"}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Multiple</p>
                            <p className="mt-1 font-mono font-bold text-gray-900">{peer.multiple ? `${peer.multiple.toFixed(peer.multiple >= 10 ? 1 : 2)}x` : "-"}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Quality</p>
                            <p className="mt-1 font-mono font-bold text-gray-900">{peer.qualityScore}%</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Match</p>
                            <p className="mt-1 font-mono font-bold text-gray-900">{peer.similarityScore}%</p>
                          </div>
                        </div>
                        {peer.issues.length > 0 && (
                          <p className="mt-3 text-xs font-semibold text-amber-800">{peer.issues.slice(0, 3).join(", ")}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm font-semibold text-gray-500">
                      No peers match this filter yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Closest peer rationale</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {closestPeer
                      ? `${closestPeer.companyName} is the strongest current peer at ${closestPeer.similarityScore}% match because it shares the closest available stage, sector, traction, and valuation evidence.`
                      : "No strong peer exists yet. Add profile data or broaden the peer source before using this in a memo."}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Investor objection</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {selectedComparableMissingActions.length
                      ? `Investors will challenge missing ${selectedComparableMissingActions.map((check) => check.label.toLowerCase()).slice(0, 2).join(" and ")} evidence before trusting this benchmark.`
                      : defensibility === "Strong"
                        ? "The main objection will be whether these peers are truly comparable enough to defend the selected multiple."
                        : "The peer set needs more depth before it can carry a high-stakes valuation discussion alone."}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Suggested defense</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    Use the median as the anchor, explain any premium or discount with growth and ARR evidence, and disclose weak or stale data instead of hiding it.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedComparableMissingActions.slice(0, 3).map((check) => (
                      <Link
                        key={check.key}
                        href={check.key === "profile" || check.key === "team" ? `/startup/${selectedComparableStartup.id}?tab=profile` : check.key === "report" ? `/startup/${selectedComparableStartup.id}?tab=reports` : `/startup/${selectedComparableStartup.id}?tab=financials`}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900"
                      >
                        Add {check.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-600">Loading your valuation workspace...</p>
          <p suppressHydrationWarning className="mt-2 max-w-xs text-xs leading-5 text-gray-400">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  const pageTitle =
    activeMode === "dashboard" ? "Dashboard" :
    activeMode === "comparables" ? "Comparables" :
    activeMode === "funding" ? "Funding" :
    activeMode === "exit" ? "Exit & ROI" :
    "Startups";
  const pageDescription = activeMode === "dashboard"
    ? "Workspace overview — valuations, benchmarks, and readiness at a glance."
    : activeMode === "comparables"
      ? "Compare your startup against market and workspace peers."
      : activeMode === "funding"
        ? "Track current and past funding rounds with benchmark context."
        : activeMode === "exit"
          ? "Estimate exit value, investor ownership, and return scenarios."
          : "Manage startup workspaces, reports, and next actions.";

  return (
    <div className="evaldam-workspace min-h-screen bg-white text-gray-900">
      <aside
        onMouseEnter={() => setWorkspaceSidebarOpen(true)}
        onMouseLeave={() => setWorkspaceSidebarOpen(false)}
        className={`fixed inset-y-0 left-0 z-40 hidden overflow-visible flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex ${workspaceSidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className={`relative flex h-16 items-center border-b border-slate-200 bg-white ${workspaceSidebarOpen ? "justify-start px-5" : "justify-center px-3"}`}>
          <div className={`flex min-w-0 items-center gap-3 ${workspaceSidebarOpen ? "" : "justify-center"}`}>
            <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-xl" />
            {workspaceSidebarOpen && (
              <div>
                <p className="text-sm font-bold leading-tight text-gray-900">Evaldam AI</p>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 space-y-1 py-4 ${workspaceSidebarOpen ? "px-3" : "px-2"}`}>
          {sidebarItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMode(key)}
              title={workspaceSidebarOpen ? undefined : label}
              className={`flex w-full items-center py-2.5 text-left text-sm font-semibold transition-all ${workspaceSidebarOpen ? "gap-3 px-4 border-l-[3px]" : "justify-center px-2 rounded-xl border-l-[3px]"} ${
                activeMode === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-gray-500 hover:bg-slate-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {workspaceSidebarOpen && label}
            </button>
          ))}
          <div className="my-3 border-t border-slate-200" />
          <button
            type="button"
            onClick={openStartupAi}
            title={workspaceSidebarOpen ? undefined : "Startup AI"}
            className={`flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold text-gray-600 transition-all hover:bg-slate-50 hover:text-gray-900 ${workspaceSidebarOpen ? "gap-3 px-3" : "justify-center px-2"}`}
          >
            <Bot className="h-4 w-4" />
            {workspaceSidebarOpen && "Startup AI"}
          </button>
          <button
            type="button"
            onClick={openComparables}
            title={workspaceSidebarOpen ? undefined : "Comparables"}
            className={`flex w-full items-center py-2.5 text-left text-sm font-semibold transition-all ${workspaceSidebarOpen ? "gap-3 px-4 border-l-[3px]" : "justify-center px-2 rounded-xl border-l-[3px]"} ${
              activeMode === "comparables"
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent text-gray-500 hover:bg-slate-50 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {workspaceSidebarOpen && "Comparables"}
          </button>
          <Link
            href="/subscription"
            title={workspaceSidebarOpen ? undefined : "Subscription"}
            className={`flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold text-gray-600 transition-all hover:bg-slate-50 hover:text-gray-900 ${workspaceSidebarOpen ? "gap-3 px-3" : "justify-center px-2"}`}
          >
            <CreditCard className="h-4 w-4" />
            {workspaceSidebarOpen && "Subscription"}
          </Link>
          <button
            type="button"
            onClick={openApiCredits}
            title={workspaceSidebarOpen ? undefined : "API Credits"}
            className={`flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold text-gray-600 transition-all hover:bg-slate-50 hover:text-gray-900 ${workspaceSidebarOpen ? "gap-3 px-3" : "justify-center px-2"}`}
          >
            <CreditCard className="h-4 w-4" />
            {workspaceSidebarOpen && "API Credits"}
          </button>
        </nav>

      </aside>

      <div className="lg:pl-20">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <Image src="/logo.png" alt="Evaldam AI" width={28} height={28} className="rounded-xl" />
              <span className="text-sm font-bold text-gray-900">Evaldam AI</span>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 lg:hidden">
                {sidebarItems.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveMode(key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeMode === key ? "bg-slate-100 text-gray-900" : "text-gray-500"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-bold tracking-[0.3px] uppercase text-primary">
                {currentPlanLabel}
              </span>
              {!isWorkspaceAdmin && (
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase text-gray-500">
                  {isStartupContributor ? "Startup Access" : "Member"}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="w-full pb-10">
          <div className="bg-[#005f5f] px-4 py-5 sm:px-6">
            <h1 className="text-xl font-bold text-white">{pageTitle}</h1>
            <p className="mt-0.5 text-sm text-[#a8d5d5]">{pageDescription}</p>
          </div>
          <div className="px-4 pt-4 sm:px-6">
          {dashboardError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-800">
              {dashboardError}
            </div>
          )}

          {paidAccessExpired && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Your paid access ended{paidAccessEndedLabel ? ` on ${paidAccessEndedLabel}` : ""}. Free plan limits now apply.
            </div>
          )}

          {!isWorkspaceAdmin && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900">
              {isStartupContributor
                ? "Startup access: you can update the assigned startup card details. Creating startups, AI, reports, sharing, billing, and team settings are handled by the workspace Admin."
                : "Member access: you can view and update existing startup inputs. Billing, team changes, report generation, sharing, and deletion are handled by the workspace Admin."}
            </div>
          )}

          {activeMode === "dashboard" ? (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                      <h2 className="text-base font-bold text-gray-900">Valuation analytics</h2>
                      <p className="mt-0.5 text-sm text-gray-500">Valuation movement, benchmarks, and readiness across tracked startups.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:w-[640px]">
                      {[
                        ["Tracked", analyticsSummary.tracked.toString()],
                        ["With reports", analyticsSummary.valued.toString()],
                        ["With history", analyticsSummary.historical.toString()],
                        ["Latest value", formatMoneyCompact(analyticsSummary.totalValuation)],
                        ["Avg readiness", `${analyticsSummary.avgReadiness}%`],
                      ].map(([label, value], index) => (
                        <div
                          key={label}
                          className={`border-t border-slate-200 px-0 py-3 sm:border-l sm:border-t-0 sm:py-1 sm:pl-4 ${
                            index === 0 ? "sm:border-l-0" : ""
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                          <p className="mt-1 font-mono text-sm font-bold tabular-nums text-gray-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(analyticsMetricConfig) as AnalyticsMetric[]).map((metric) => (
                        <button
                          key={metric}
                          type="button"
                          onClick={() => setAnalyticsMetric(metric)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            analyticsMetric === metric
                              ? "border-primary bg-primary text-white"
                              : "border-slate-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          {analyticsMetricConfig[metric].label}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:w-[440px]">
                      <select
                        value={analyticsStageFilter}
                        onChange={(event) => setAnalyticsStageFilter(event.target.value)}
                        className="input input-sm !h-10 !py-0 text-xs"
                        aria-label="Filter by stage"
                      >
                        <option value="all">All stages</option>
                        {analyticsStageOptions.map((stage) => (
                          <option key={stage} value={stage}>{stageLabel(stage)}</option>
                        ))}
                      </select>
                      <select
                        value={analyticsIndustryFilter}
                        onChange={(event) => setAnalyticsIndustryFilter(event.target.value)}
                        className="input input-sm !h-10 !py-0 text-xs"
                        aria-label="Filter by industry"
                      >
                        <option value="all">All industries</option>
                        {analyticsIndustryOptions.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 border-t border-slate-200 bg-white px-0 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllAnalyticsStartups}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase ${
                          analyticsAllSelectableSelected ? "border-gray-950 bg-gray-950 text-white" : "border-slate-200 bg-white text-gray-600"
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={clearAnalyticsStartups}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase text-gray-600"
                      >
                        Clear
                      </button>
                      <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase text-gray-600">
                        <input
                          type="checkbox"
                          checked={analyticsShowBenchmark}
                          onChange={(event) => setAnalyticsShowBenchmark(event.target.checked)}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        Peer benchmark
                      </label>
                      <span className="ml-auto text-[11px] font-bold uppercase text-gray-500">
                        {analyticsFilteredStartups.length}/{analyticsSelectableStartups.length} selected
                      </span>
                    </div>
                    <div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-y-auto pr-1">
                      {analyticsSelectableStartups.length ? (
                        analyticsSelectableStartups.map((startup, index) => {
                          const selected = analyticsSelectedIdSet.has(startup.id);
                          const hasGraphData = analyticsMetric === "valuation" ? getSortedValuations(startup).length > 0 : Number.isFinite(getAnalyticsMetricValue(startup));
                          return (
                            <label
                              key={startup.id}
                              className={`inline-flex max-w-[220px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                                selected
                                  ? "border-primary/40 bg-white text-gray-900"
                                  : "border-slate-200 bg-white text-gray-500"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleAnalyticsStartup(startup.id)}
                                className="h-3.5 w-3.5 accent-primary"
                              />
                              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: chartPalette[index % chartPalette.length] }} />
                              <span className="truncate">{startup.company_name}</span>
                              {selected && !hasGraphData && (
                                <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">No report</span>
                              )}
                            </label>
                          );
                        })
                      ) : (
                        <p className="px-1 py-1 text-xs font-semibold text-gray-500">No startups match the current filters.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboardInsightItems.map((item, index) => (
                    <div
                      key={item.label}
                      className={`px-4 py-3.5 sm:px-6 ${index < dashboardInsightItems.length - 1 ? "border-b border-slate-200 sm:border-r xl:border-b-0" : ""}`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{item.label}</p>
                      <p className="mt-1 font-mono text-base font-bold tabular-nums text-gray-900">{item.value}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-0 xl:grid-cols-[minmax(0,1.45fr)_380px]">
                  <div className="min-w-0 border-b border-slate-200 px-4 py-5 sm:px-6 xl:border-b-0 xl:border-r">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{analyticsChartTitle}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{analyticsChartDetail}</p>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {analyticsChartBadge}
                      </span>
                    </div>

                    <MetricLineChart
                      series={analyticsGraphSeries}
                      valueFormatter={analyticsLineValueFormatter}
                      emptyLabel="Select at least one startup with saved data to draw the comparison graph."
                    />
                  </div>

                  <div className="space-y-5 px-4 py-5 sm:px-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-900">Portfolio shape</h3>
                        <span className="text-xs font-bold text-gray-500">{isPortfolioWorkspace ? "Full view" : "Startup view"}</span>
                      </div>
                      <DonutChart segments={analyticsStageSegments} emptyLabel="Add startups to see stage distribution." />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Readiness split</h3>
                      <div className="mt-3">
                        <DonutChart segments={analyticsStatusSegments} emptyLabel="Complete startup inputs to see readiness distribution." />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Main blockers</h3>
                      <div className="mt-3">
                        <HorizontalBarChart rows={analyticsMissingRows} valueFormatter={(value) => value.toString()} emptyLabel="No major missing inputs in the current filter." />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="hidden">
                {[
                  { label: workspaceCountLabel, value: startups.length, detail: workspaceAccessLabel, Icon: Database },
                  { label: "Reports ready", value: valuedStartups.length, detail: reportAllowanceLabel, Icon: FileText },
                  { label: "Needs data", value: incompleteStartups.length, detail: incompleteStartups.length ? "Input gaps to close" : "No major gaps", Icon: AlertCircle },
                  { label: "Avg. valuation", value: avgValuation, detail: totalArr ? `${fmt(totalArr)} total ARR tracked` : "No ARR tracked yet", Icon: TrendingUp },
                ].map(({ label, value, detail, Icon }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                      <Icon className="h-4 w-4 text-gray-300" />
                    </div>
                    <p className="font-mono text-2xl font-bold tabular-nums text-gray-900">{value}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">{detail}</p>
                  </div>
                ))}
              </section>

              {isPortfolioWorkspace ? (
                <section className="hidden">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Portfolio analytics</h2>
                      <p className="text-sm text-gray-500">Combined view across every startup in this workspace.</p>
                    </div>
                    <button type="button" onClick={handlePaidStartupAction} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Add company
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Combined valuation", totalPortfolioValuation, valuedStartups.length ? "Latest reports only" : "Run reports to populate"],
                      ["Tracked ARR", totalArr ? fmt(totalArr) : "-", totalArr ? "Across all startups" : "Add revenue inputs"],
                      ["Avg readiness", startups.length ? `${avgReadiness}%` : "-", `${investorReadyCount} investor-ready`],
                      ["Report coverage", startups.length ? `${reportCoveragePct}%` : "-", `${valuedStartups.length} startups with reports`],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                        <p className="mt-2 font-mono text-xl font-bold text-gray-900">{value}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                    <div className="border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-900">Strongest startups</h3>
                        <span className="text-xs font-bold text-gray-500">Ranked by readiness</span>
                      </div>
                      <div className="space-y-3">
                        {topTrackedStartups.length ? topTrackedStartups.map(({ startup, readiness, valuationAmount }) => (
                          <Link key={startup.id} href={`/startup/${startup.id}`} className="grid gap-3 border border-slate-200 bg-white p-4 transition-all hover:border-primary/30 md:grid-cols-[220px_1fr_100px] md:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                {startup.logo_url ? (
                                  <Image src={normalizeCloudinaryImageUrl(startup.logo_url)} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-800">{(startup.company_name || "S")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-900">{startup.company_name}</p>
                                <p className="text-xs font-semibold text-gray-500">{stageLabel(startup.stage)}{startup.industry ? ` / ${startup.industry}` : ""}</p>
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-gray-500">
                                <span>{readiness.label}</span>
                                <span>{readiness.score}%</span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${readinessColorClass(readiness.score)}`} style={{ width: `${readiness.score}%` }} />
                              </div>
                            </div>
                            <p className="text-right font-mono text-xs font-bold text-gray-800">{valuationAmount ? fmt(valuationAmount) : "No report"}</p>
                          </Link>
                        )) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-gray-500">
                            Add startups to populate portfolio ranking.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-bold text-gray-900">Stage mix</h3>
                        <div className="mt-4 space-y-3">
                          {Object.entries(stageMix).length ? Object.entries(stageMix).map(([stage, count]) => {
                            const width = startups.length ? Math.max((count / startups.length) * 100, 8) : 0;
                            return (
                              <div key={stage}>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-600">
                                  <span>{stage}</span>
                                  <span>{count}</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                                </div>
                              </div>
                            );
                          }) : (
                            <p className="text-sm font-semibold text-gray-500">No startups added yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-bold text-gray-900">Attention queue</h3>
                        <div className="mt-4 space-y-2">
                          {attentionStartups.length ? attentionStartups.map(({ startup, readiness }) => (
                            <Link key={startup.id} href={`/startup/${startup.id}?tab=profile`} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-200 bg-white">
                                  {startup.logo_url ? (
                                    <Image src={normalizeCloudinaryImageUrl(startup.logo_url)} alt="" width={24} height={24} unoptimized className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] font-bold">{(startup.company_name || "S")[0].toUpperCase()}</span>
                                  )}
                                </span>
                                <span className="truncate">{startup.company_name}</span>
                              </span>
                              <span className="font-mono text-xs font-bold">{readiness.score}%</span>
                            </Link>
                          )) : (
                            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
                              No major input gaps across tracked startups.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="hidden">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Portfolio analytics</h2>
                      <p className="text-sm text-gray-500">Track multiple startups, combined valuation, readiness, and report coverage on Agency / Investor workspaces.</p>
                    </div>
                    <button type="button" onClick={() => openFeatureUpgrade("Portfolio analytics and multi-startup tracking", "startup")} className="btn btn-secondary inline-flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Unlock portfolio view
                    </button>
                  </div>
                </section>
              )}

              <section className="hidden">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Operating overview</h2>
                      <p className="text-sm text-gray-500">Status-led view of workspaces, readiness, and valuation output.</p>
                    </div>
                    <button type="button" onClick={() => setActiveMode("startups")} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
                      View startups <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-white text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-4 py-3">Stage</th>
                          <th className="px-4 py-3">Valuation</th>
                          <th className="px-4 py-3">Growth</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {startups.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-gray-500">
                              No startup workspaces yet. Create one from the Startups view.
                            </td>
                          </tr>
                        ) : (
                          startups.slice(0, 6).map((startup) => {
                            const valuation = getRange(startup);
                            const incomplete = hasIncompleteData(startup);
                            return (
                              <tr key={startup.id} className="hover:bg-slate-50/70">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-gray-900">{startup.company_name}</p>
                                  <p className="text-xs text-gray-500">Created {getTimeAgo(startup.created_at)}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{stageLabel(startup.stage)}</td>
                                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">{valuation?.range || "Not generated"}</td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                  {startup.monthly_growth_rate ? `${startup.monthly_growth_rate}% / mo` : "Not added"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${incomplete ? "bg-amber-50 text-amber-800" : valuation ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-gray-600"}`}>
                                    {incomplete ? "Needs data" : valuation ? "Report ready" : "Ready to run"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Link href={`/startup/${startup.id}${incomplete ? "?tab=profile" : ""}`} className="text-xs font-bold text-primary hover:underline">
                                    Open
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold text-gray-900">Plan access</h2>
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-3 text-sm">
                      {[
                        ["Startup profiles", workspaceAccessLabel],
                        ["Valuation previews", previewAllowanceLabel],
                        ["Reports", reportAllowanceLabel],
                        ["Startup AI", aiAllowanceLabel],
                        ["Team seats", teamAllowanceLabel],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-right text-xs font-bold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-bold text-gray-900">Next best action</h2>
                    <div className="mt-4 space-y-3">
                      {incompleteStartups[0] ? (
                        <Link href={`/startup/${incompleteStartups[0].id}?tab=profile`} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-900">
                          Complete {incompleteStartups[0].company_name}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <button type="button" onClick={handlePaidStartupAction} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800">
                          {startups.length ? "Add another workspace" : "Create first workspace"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      {latestReportEntry && (
                        <Link href={`/startup/${latestReportEntry.startup.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800">
                          Latest report: {fmtPrecise(latestReportEntry.valuation.blended_weighted_average)}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="hidden">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Reserved product spaces</h2>
                    <p className="text-sm text-gray-500">Visible for every account; access follows plan and quota rules.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {lockedFeatureCards.map(({ title, description, status, limit, Icon, locked, action }) => (
                    <button
                      key={title}
                      type="button"
                      onClick={action}
                      className="group flex min-h-48 flex-col rounded-xl border border-slate-200 border-l-4 border-l-primary bg-white p-5 text-left shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${locked ? "bg-slate-100 text-gray-500" : "bg-emerald-50 text-emerald-700"}`}>
                          {locked && <Lock className="h-3 w-3" />}
                          {status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-5 text-gray-500">{description}</p>
                      <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-bold text-gray-700">
                        {limit}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {isPortfolioWorkspace && startups.length > 1 && (
                <section className="hidden">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Portfolio movement comparison</h2>
                      <p className="text-sm text-gray-500">Compare latest valuation spread and repeat reports across tracked startups.</p>
                    </div>
                    <span className="text-xs font-bold text-gray-500">Avg. growth {avgGrowth}</span>
                  </div>
                  <div className="space-y-3">
                    {startups.slice(0, 5).map((startup) => {
                      const valuation = getLatestValuation(startup)?.blended_weighted_average || 0;
                      const maxValuation = Math.max(...startups.map((item) => getLatestValuation(item)?.blended_weighted_average || 0), 1);
                      const width = Math.max((valuation / maxValuation) * 100, valuation ? 8 : 0);
                      return (
                        <div key={startup.id} className="grid gap-2 md:grid-cols-[180px_1fr_90px] md:items-center">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {startup.logo_url ? (
                                <Image src={normalizeCloudinaryImageUrl(startup.logo_url)} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-gray-700">{(startup.company_name || "S")[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-gray-900">{startup.company_name}</p>
                              <p className="text-xs text-gray-500">{stageLabel(startup.stage)}</p>
                            </div>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                          </div>
                          <p className="font-mono text-xs font-bold text-gray-700">{valuation ? fmt(valuation) : "No report"}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          ) : activeMode === "funding" ? (
            fundingView
          ) : activeMode === "exit" ? (
            exitRoiView
          ) : activeMode === "comparables" ? (
            comparablesView
          ) : (
            <div className="space-y-6">
              <section>
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{workspaceCountLabel}</p>
                    {!startups.length && <h2 className="mt-1 text-2xl font-bold text-gray-900">Create your first startup</h2>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={openStartupAi} className="btn btn-secondary inline-flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Startup AI
                    </button>
                    {isWorkspaceAdmin && (
                      <button type="button" onClick={handlePaidStartupAction} className="btn btn-primary inline-flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {isPortfolioWorkspace ? "Add company" : "Add startup"}
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {proactiveLimitNudges.length > 0 && (
                <section className="grid gap-3 md:grid-cols-2">
                  {proactiveLimitNudges.map((nudge) => (
                    <div key={nudge.key} className="flex items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary px-4 py-3 text-white">
                      <p className="text-sm font-bold leading-5">{nudge.message}</p>
                      <button
                        type="button"
                        onClick={() => openUpgrade(nudge.message, nudge.type)}
                        className="shrink-0 rounded-lg border border-white/30 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-white/90"
                      >
                        View plan
                      </button>
                    </div>
                  ))}
                </section>
              )}

              {startups.length > 0 ? (
                <section className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-500">
                      {startups.length} {isPortfolioWorkspace ? "companies" : "startups"} tracked
                    </p>
                    <button type="button" onClick={openComparables} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                      Comparables <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {startups.map((startup) => {
                      const valuation = getRange(startup);
                      const incomplete = hasIncompleteData(startup);
                      const readiness = getStartupReadiness(startup);
                      const nextGap = readiness.checks.find((check) => !check.done);
                      const missingChecks = readiness.checks.filter((check) => !check.done);
                      const report = getLatestValuation(startup);
                      const lastReportLabel = report ? getTimeAgo(report.created_at) : "No report yet";
                      const growthLabel = startup.monthly_growth_rate ? `${startup.monthly_growth_rate}%` : "Not added";
                      const href = nextGap?.key === "profile" || nextGap?.key === "team"
                        ? `/startup/${startup.id}?tab=profile`
                        : nextGap && nextGap.key !== "report"
                          ? `/startup/${startup.id}?tab=financials`
                          : `/startup/${startup.id}`;

                      return (
                        <div key={startup.id} className="group flex min-h-[330px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                          <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                {startup.logo_url ? (
                                  <Image src={normalizeCloudinaryImageUrl(startup.logo_url)} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-base font-bold text-gray-800">{(startup.company_name || "S")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h3 className="truncate text-xl font-bold text-gray-900">{startup.company_name}</h3>
                                <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  {stageLabel(startup.stage)}{startup.industry ? ` / ${startup.industry}` : ""}
                                </p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${incomplete ? "bg-amber-50 text-amber-800" : valuation ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-gray-600"}`}>
                              {incomplete ? "Needs data" : valuation ? "Report ready" : "Ready"}
                            </span>
                          </div>

                          <div className="mb-5">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Readiness</p>
                              <span className="font-mono text-xs font-bold text-gray-900">{readiness.score}% / Last report: {lastReportLabel}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full transition-all ${readinessColorClass(readiness.score)}`} style={{ width: `${readiness.score}%` }} />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {missingChecks.length ? (
                                <>
                                  {missingChecks.slice(0, 3).map((check) => {
                                    const chipHref = check.key === "profile" || check.key === "team"
                                      ? `/startup/${startup.id}?tab=profile`
                                      : check.key === "report"
                                        ? `/startup/${startup.id}?tab=reports`
                                        : `/startup/${startup.id}?tab=financials`;
                                    return (
                                      <Link
                                        key={check.key}
                                        href={chipHref}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-500 transition hover:border-primary/40 hover:text-primary"
                                      >
                                        {check.label}
                                      </Link>
                                    );
                                  })}
                                  {missingChecks.length > 3 && (
                                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-500">
                                      +{missingChecks.length - 3} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                  Inputs complete
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-0 border-y border-slate-200">
                            <div className="py-3 pr-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Valuation</p>
                              <p className="mt-2 font-mono text-sm font-bold text-gray-900">{valuation?.avg || "Not run"}</p>
                              <p className="mt-1 truncate text-xs text-gray-500">{valuation?.range || "Generate from startup"}</p>
                            </div>
                            <div className="border-l border-slate-200 py-3 pl-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">ARR</p>
                              <p className="mt-2 font-mono text-sm font-bold text-gray-900">{startup.arr ? fmt(Number(startup.arr)) : "Not added"}</p>
                              <p className="mt-1 text-xs text-gray-500">Current saved ARR</p>
                            </div>
                            <div className="border-l border-slate-200 py-3 pl-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Growth</p>
                              <p className="mt-2 font-mono text-sm font-bold text-gray-900">{growthLabel}</p>
                              <p className="mt-1 text-xs text-gray-500">{startup.monthly_growth_rate ? "Monthly growth" : "Add in Financials"}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={href} className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${nextGap ? "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300" : "border-slate-200 bg-white text-gray-600 hover:border-primary/30 hover:text-primary"}`}>
                              {nextGap ? `Update ${nextGap.label}` : "Inputs ready"}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            {report?.id && (
                              <Link href={`/startup/${startup.id}/report/${report.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:border-primary/30 hover:text-primary">
                                View report
                                <FileText className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>

                          <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold text-gray-500">Created {getTimeAgo(startup.created_at)}</p>
                            <div className="flex items-center gap-2">
                              {!isStartupContributor && (
                                <button
                                  type="button"
                                  onClick={() => handleShareStartup(startup)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:border-primary/30 hover:text-primary"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  Invite
                                </button>
                              )}
                              <Link href={`/startup/${startup.id}?tab=reports`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:border-primary/30 hover:text-primary">
                                Run Report
                              </Link>
                              <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white">
                                Open <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-5">
                      <h2 className="text-lg font-bold text-gray-900">Check a valuation preview</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter numbers for a quick range before creating a full workspace.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="preview-company-name" className="form-label">Company name</label>
                        <input id="preview-company-name" className="input" value={previewForm.companyName} onChange={(e) => setPreviewForm({ ...previewForm, companyName: e.target.value })} placeholder="Your company" />
                      </div>
                      <div>
                        <label htmlFor="preview-stage" className="form-label">Stage</label>
                        <select id="preview-stage" className="input" value={previewForm.stage} onChange={(e) => setPreviewForm({ ...previewForm, stage: e.target.value })}>
                          <option value="pre-revenue">Pre-revenue</option>
                          <option value="seed">Seed</option>
                          <option value="series-a">Series A</option>
                          <option value="series-b+">Series B+</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="preview-industry" className="form-label">Industry</label>
                        <input id="preview-industry" className="input" value={previewForm.industry} onChange={(e) => setPreviewForm({ ...previewForm, industry: e.target.value })} placeholder="SaaS, AI, fintech..." />
                      </div>
                      <div>
                        <label htmlFor="preview-team-size" className="form-label">Team size</label>
                        <input id="preview-team-size" className="input" type="number" min={0} value={previewForm.teamSize} onChange={(e) => setPreviewForm({ ...previewForm, teamSize: e.target.value })} placeholder="5" />
                      </div>
                      <div>
                        <label htmlFor="preview-arr" className="form-label">ARR / yearly revenue</label>
                        <input id="preview-arr" className="input" type="number" min={0} value={previewForm.arr} onChange={(e) => setPreviewForm({ ...previewForm, arr: e.target.value })} placeholder="500000" />
                      </div>
                      <div>
                        <label htmlFor="preview-monthly-growth" className="form-label">Monthly growth %</label>
                        <input id="preview-monthly-growth" className="input" type="number" value={previewForm.monthlyGrowthRate} onChange={(e) => setPreviewForm({ ...previewForm, monthlyGrowthRate: e.target.value })} placeholder="10" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="preview-tam" className="form-label">Market size / TAM</label>
                        <input id="preview-tam" className="input" type="number" min={0} value={previewForm.totalAddressableMarket} onChange={(e) => setPreviewForm({ ...previewForm, totalAddressableMarket: e.target.value })} placeholder="500000000" />
                      </div>
                    </div>
                    {previewError && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900">
                        {previewError}
                      </div>
                    )}
                    <button type="button" onClick={calculatePreview} disabled={previewLoading} className="btn btn-primary mt-5 flex items-center gap-2">
                      {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} {previewLoading ? "Checking..." : "Check valuation"}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Valuation result</p>
                    {previewResult ? (
                      <div className="mt-4">
                        <h3 className="text-2xl font-bold text-gray-900">{previewForm.companyName || "Preview valuation"}</h3>
                        <div className="mt-6 rounded-xl border border-primary/20 bg-slate-50/50 p-6 shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Indicative range</p>
                          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                            {fmtPreview(previewResult.low)} - {fmtPreview(previewResult.high)}
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                            <p className="text-sm font-semibold text-gray-600">Mid-point {fmtPreview(previewResult.mid)}</p>
                            <p className="text-xs font-bold uppercase text-gray-400">{previewResult.confidence} confidence</p>
                          </div>
                        </div>
                        <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-900">
                          This is a preview only. Upgrade to create a full workspace, run the full methodology, and download the investor-ready report.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            writeStartupProfilePrefill({
                              companyName: previewForm.companyName,
                              stage: previewForm.stage,
                              industry: previewForm.industry,
                              arr: previewForm.arr,
                              monthlyGrowthRate: previewForm.monthlyGrowthRate,
                              teamSize: previewForm.teamSize,
                              totalAddressableMarket: previewForm.totalAddressableMarket,
                              source: "dashboard_preview",
                            });
                            if (isFreePlan) {
                              openUpgrade("Upgrade to download the report and run the full investor-ready valuation workflow.", "report");
                            } else {
                              handlePaidStartupAction();
                            }
                          }}
                          className="btn btn-primary mt-5 w-full flex items-center justify-center gap-2"
                        >
                          Create full workspace <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white">
                          <Gauge className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Your preview will appear here</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">
                          Quick range first, full investor-ready report after upgrade.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (isFreePlan) {
                              openUpgrade("Upgrade to create a full workspace, run the full methodology, and download reports.", "report");
                            } else {
                              handlePaidStartupAction();
                            }
                          }}
                          className="btn btn-secondary mx-auto mt-5 flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create full workspace
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
          </div>
        </main>
      </div>

      <ProfileMenu
        userInfo={userInfo || undefined}
        userName={userName}
        userInitial={userInitial}
        onSettingsOpen={() => setSettingsOpen(true)}
        position="left-6"
        planLabel={currentPlanLabel}
        planDetail={workspaceAccessLabel}
        compactButton={!workspaceSidebarOpen}
      />

      {settingsOpen && userInfo && (
        <SettingsModal
          user={{ ...userInfo, valuation_count: valuedStartups.length }}
          onClose={() => setSettingsOpen(false)}
          onUserUpdate={(updates) => setUserInfo((current) => current ? { ...current, ...updates } : current)}
        />
      )}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={currentPlan}
        limitType={upgradeLimitType}
        limitReason={upgradeReason}
      />
      {startupAccessTarget && (
        <StartupAccessModal
          isOpen={Boolean(startupAccessTarget)}
          startupId={startupAccessTarget.id}
          startupName={startupAccessTarget.company_name}
          onClose={() => setStartupAccessTarget(null)}
        />
      )}
    </div>
  );
}
