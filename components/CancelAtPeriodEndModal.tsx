"use client";

import { CalendarClock, X } from "lucide-react";

interface CancelAtPeriodEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentPlan: string;
  endDateLabel: string | null;
  isLoading?: boolean;
}

export function CancelAtPeriodEndModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  endDateLabel,
  isLoading = false,
}: CancelAtPeriodEndModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 text-gray-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Cancel auto-renewal?</h2>
              <p className="mt-1 text-sm text-gray-500">{currentPlan}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Your plan stays active{endDateLabel ? ` until ${endDateLabel}` : " until the current paid period ends"}. Your startup data,
          reports, team access, and account history are not deleted.
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-semibold text-gray-700">
            Keep auto-renewal
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-gray-950 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isLoading ? "Cancelling..." : "Cancel at period end"}
          </button>
        </div>
      </div>
    </div>
  );
}
