"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, X, FileText, Database, Trash2, CheckCircle2, Clock } from "lucide-react";

interface DeleteStartupModalProps {
  isOpen: boolean;
  startupName: string;
  startupId: string;
  createdDate?: string;
  reportCount?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteStartupModal({
  isOpen,
  startupName,
  startupId,
  createdDate,
  reportCount = 0,
  onClose,
  onSuccess,
}: DeleteStartupModalProps) {
  const [step, setStep] = useState<"confirm" | "details" | "type">("confirm");
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [agreedToDelete, setAgreedToDelete] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== startupName) {
      setError("Company name doesn't match");
      return;
    }

    if (!agreedToDelete) {
      setError("Please confirm you understand the consequences");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/startup/${startupId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete startup");
      }

      alert("✅ Startup and all related data deleted successfully");
      setConfirmText("");
      setAgreedToDelete(false);
      setStep("confirm");
      onClose();
      onSuccess?.();
    } catch (error) {
      setError((error as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 flex items-center justify-between border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-200 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Delete Startup</h2>
              <p className="text-sm text-red-700">Permanent action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-red-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === "confirm" && (
            <>
              <div className="space-y-3">
                <p className="text-neutral-900 font-semibold text-lg">
                  You're about to delete <span className="text-red-600">"{startupName}"</span>
                </p>
                <p className="text-neutral-600 text-sm">
                  This action is permanent and cannot be undone. Please review what will be deleted below.
                </p>
              </div>

              {/* Startup Details */}
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-neutral-600" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Startup Profile</p>
                    <p className="text-xs text-neutral-600">{startupName}</p>
                  </div>
                </div>

                {createdDate && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-neutral-600" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Created Date</p>
                      <p className="text-xs text-neutral-600">{createdDate}</p>
                    </div>
                  </div>
                )}

                {reportCount > 0 && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-neutral-600" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Valuation Reports</p>
                      <p className="text-xs text-neutral-600">{reportCount} report(s) will be deleted</p>
                    </div>
                  </div>
                )}
              </div>

              {/* What Will Be Deleted */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-red-900">What will be permanently deleted:</p>
                <ul className="text-sm text-red-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Startup profile and all settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>All {reportCount > 0 ? reportCount : "associated"} valuation reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>All valuation history and data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>All exported PDFs and documents</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Keep Startup
                </button>
                <button
                  onClick={() => setStep("details")}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "details" && (
            <>
              <div className="space-y-3">
                <p className="text-neutral-900 font-semibold text-lg">
                  Important: Read before deleting
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-yellow-900 font-semibold">⚠️ This cannot be undone</p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>No backups will be available</li>
                    <li>Deleted data cannot be recovered</li>
                    <li>This will immediately free up space in your account</li>
                    <li>Monthly quota is NOT refunded (creations are counted)</li>
                  </ul>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToDelete}
                    onChange={(e) => setAgreedToDelete(e.target.checked)}
                    disabled={loading}
                    className="w-5 h-5 mt-0.5 accent-red-600"
                  />
                  <span className="text-sm text-neutral-900">
                    I understand this action is <span className="font-semibold">permanent and irreversible</span>. I want to delete "{startupName}" and all its data.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("confirm")}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("type")}
                  disabled={loading || !agreedToDelete}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Confirm
                </button>
              </div>
            </>
          )}

          {step === "type" && (
            <>
              <div className="space-y-3">
                <p className="text-neutral-900 font-semibold text-lg">
                  Final confirmation
                </p>
                <p className="text-neutral-600 text-sm">
                  Type the company name exactly to confirm deletion:
                </p>
              </div>

              {/* Type Confirmation */}
              <div className="space-y-2">
                <div className="bg-neutral-50 p-3 rounded-lg border-2 border-neutral-200">
                  <p className="text-sm font-mono text-neutral-600">Company name to delete:</p>
                  <p className="text-lg font-bold text-red-600">{startupName}</p>
                </div>

                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError("");
                  }}
                  placeholder={`Type: ${startupName}`}
                  className="w-full px-4 py-3 text-lg border-2 border-neutral-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                  disabled={loading}
                />

                {confirmText === startupName && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Match confirmed
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 font-semibold">{error}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("details");
                    setConfirmText("");
                    setError("");
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || confirmText !== startupName}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
