"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface CancelSubscriptionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentPlan: string;
  isLoading?: boolean;
}

export function CancelSubscriptionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  isLoading: externalLoading = false,
}: CancelSubscriptionConfirmModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [understood, setUnderstood] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");

  if (!isOpen) return null;

  const REQUIRED_PHRASE = "I want to delete my subscription and data";

  const canProceedToStep2 = understood;
  const canConfirm = typedConfirmation.trim() === REQUIRED_PHRASE;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      await onConfirm();
      closeAndReset();
    } catch (e) {
      // The parent settings panel shows the user-facing error.
    }
  };

  const reset = () => {
    setStep(1);
    setUnderstood(false);
    setTypedConfirmation("");
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Cancel Subscription &amp; Delete Data</h2>
          </div>
          <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold mb-2">This action is permanent and destructive.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your plan will be downgraded to <strong>Free</strong> immediately or at the end of the current billing period.</li>
                <li><strong>All your data will be permanently deleted</strong>: startups, valuations, reports, evidence trails, AI chat history, team access, etc.</li>
                <li>You will not be able to recover this data later.</li>
              </ul>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="understand"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="understand" className="text-sm text-gray-700">
                I understand that canceling my subscription will downgrade me to the Free plan and that I am requesting to permanently delete all my account data.
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={closeAndReset} className="flex-1 rounded-lg border py-2.5 text-sm font-medium">
                Keep my subscription
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continue to deletion confirmation
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              To confirm you want to cancel your <strong>{currentPlan}</strong> subscription and permanently delete all your data, please type the following phrase exactly:
            </p>

            <div className="rounded bg-gray-100 p-3 font-mono text-sm text-center text-gray-800">
              {REQUIRED_PHRASE}
            </div>

            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder="Type the phrase above"
              className="w-full rounded-lg border p-3 text-sm"
            />

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-lg border py-2.5 text-sm font-medium">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canConfirm}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                I understand the consequences
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="text-red-600">
              <AlertTriangle className="mx-auto h-10 w-10" />
            </div>
            <p className="font-semibold text-lg">Final Confirmation</p>
            <p className="text-sm text-gray-600">
              Clicking the button below will cancel your subscription and immediately trigger permanent deletion of all your data.
            </p>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(2)} className="flex-1 rounded-lg border py-2.5 text-sm font-medium">
                Go back
              </button>
              <button
                onClick={handleConfirm}
                disabled={externalLoading}
                className="flex-1 rounded-lg bg-red-700 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {externalLoading ? "Processing..." : "Yes, cancel and delete everything"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
