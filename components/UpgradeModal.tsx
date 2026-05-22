"use client";

import { X, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { normalizePlanKey } from "@/lib/plans/plan-limits";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: "free" | "pro" | "plus" | "startup" | "agency" | "enterprise";
  limitType: "startup" | "report" | "team";
  limitReason?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  limitType,
  limitReason,
}: UpgradeModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const planKey = normalizePlanKey(currentPlan);

  const getUpgradeDetails = () => {
    if (limitType === "team") {
      return {
        title: "Upgrade to Agency / Investor",
        message: "Team seats are available on Agency / Investor and Enterprise plans.",
        features: [
          "Startup plan stays solo for founders",
          "Agency / Investor includes up to 5 team members",
          "Enterprise includes unlimited team members",
          "Billing, team changes, sharing, deletion, and report generation stay Admin-only",
        ],
        nextPlan: "Agency / Investor",
        buttonText: "View Agency Plans",
        href: "/pricing?plan=agency",
      };
    }

    switch (planKey) {
      case "free":
        if (limitType === "report") {
          return {
            title: "Download professional investor-ready reports",
            message: "Preview your valuation for free. Upgrade to download full professional reports and unlock AI assistance.",
            features: [
              "Clean investor-ready PDF report",
              "Evaldam AI Score included",
              "Shareable investor links",
              "Evidence trail, assumptions, and method breakdown",
              "Saved report history for the startup",
            ],
            nextPlan: "Startup",
            buttonText: "Upgrade to Startup",
            href: "/pricing?plan=startup",
          };
        }

        return {
          title: "Upgrade to Startup",
          message:
            limitType === "startup"
              ? "A paid plan is required to create startup profiles"
              : "A paid plan is required to generate full valuation reports",
          features: [
            "Manage 1 full startup workspace",
            "Investor-ready valuation reports",
            "Watermark-free PDFs",
            "Solo founder workspace",
          ],
          nextPlan: "Startup",
          buttonText: "Upgrade to Startup",
          href: "/pricing?plan=startup",
        };
      case "startup":
        return {
          title: "Upgrade to Agency / Investor",
          message:
            limitType === "startup"
              ? "Startup plan is limited to 1 startup"
              : "Agency / Investor adds more workspaces and team collaboration",
          features: [
            "Manage up to 10 startups",
            "Up to 5 team members",
            "Advanced analytics",
            "Investor, agency, and portfolio workflows",
            "Custom reports",
          ],
          nextPlan: "Agency / Investor",
          buttonText: "Upgrade to Agency",
          href: "/pricing?plan=agency",
        };
      case "agency":
        return {
          title: "Contact Sales",
          message: "Interested in our Enterprise plan?",
          features: [
            "Unlimited startups",
            "Unlimited team members",
            "White-label options",
            "Dedicated account manager",
            "Custom integrations",
            "Advanced controls and SLA support",
          ],
          nextPlan: "Enterprise",
          buttonText: "Contact Sales",
          href: "/pricing?plan=enterprise",
        };
      default:
        return {
          title: "Upgrade",
          message: "Upgrade your plan for more features",
          features: [],
          nextPlan: "Next Plan",
          buttonText: "View Plans",
          href: "/pricing",
        };
    }
  };

  const details = getUpgradeDetails();
  const showLimitReason = Boolean(limitReason);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close upgrade modal"
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="upgrade-modal-title" className="text-2xl font-bold text-neutral-900 mb-2">
            {details.title}
          </h2>
          <p className="text-neutral-600">{details.message}</p>
          {showLimitReason && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 mt-3">
              {limitReason}
            </p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {details.features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700">{feature}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link href={details.href} onClick={onClose} className="w-full btn btn-primary btn-lg flex items-center justify-center gap-2">
            {details.buttonText}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full btn btn-secondary btn-lg"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
