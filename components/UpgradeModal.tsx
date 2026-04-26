"use client";

import { X, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: "free" | "pro" | "plus";
  limitType: "startup" | "report";
  limitReason?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  limitType,
  limitReason,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const getUpgradeDetails = () => {
    switch (currentPlan) {
      case "free":
        return {
          title: "Upgrade to Pro",
          message:
            limitType === "startup"
              ? "Free plan limited to 1 startup profile"
              : "Free plan limited to 3 evaluation reports per month",
          features: [
            "Manage up to 3 startups",
            "Unlimited evaluation reports",
            "Watermark-free PDFs",
            "Priority support",
          ],
          nextPlan: "Pro",
          buttonText: "Upgrade to Pro",
          href: "/pricing?plan=pro",
        };
      case "pro":
        return {
          title: "Upgrade to Plus",
          message:
            limitType === "startup"
              ? "Pro plan limited to 3 startups"
              : "Pro plan limited to unlimited reports",
          features: [
            "Manage up to 10 startups",
            "Advanced analytics",
            "Team collaboration",
            "Custom reports",
          ],
          nextPlan: "Plus",
          buttonText: "Upgrade to Plus",
          href: "/pricing?plan=plus",
        };
      case "plus":
        return {
          title: "Contact Sales",
          message: "Interested in our Enterprise plan?",
          features: [
            "Unlimited startups",
            "Dedicated account manager",
            "Custom integrations",
            "SLA support",
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {details.title}
          </h2>
          <p className="text-neutral-600">{details.message}</p>
          {limitReason && (
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
          <Link href={details.href} onClick={onClose}>
            <button className="w-full btn btn-primary btn-lg flex items-center justify-center gap-2">
              {details.buttonText}
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <button
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
