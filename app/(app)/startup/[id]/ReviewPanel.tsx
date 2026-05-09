"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileCheck, Loader2, XCircle } from "lucide-react";
import { trackFeatureUsage } from "@/lib/analytics/ga4";

type ReviewState = {
  status: "not_requested" | "pending_review" | "approved" | "rejected";
  reviewer_notes?: string;
  final_valuation?: number | null;
  reviewed_at?: string;
  adjustments?: Array<{ field: string; original_value: any; adjusted_value: any; reason: string }>;
};

export function ReviewPanel({ valuation }: { valuation: any }) {
  const [review, setReview] = useState<ReviewState>({ status: "not_requested" });
  const [notes, setNotes] = useState("");
  const [finalValuation, setFinalValuation] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!valuation?.id) return;

    setLoading(true);
    fetch(`/api/valuations/${valuation.id}/review`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setReview(data.data);
          setNotes(data.data.reviewer_notes || "");
          setFinalValuation(data.data.final_valuation ? String(data.data.final_valuation) : "");
        }
      })
      .finally(() => setLoading(false));
  }, [valuation?.id]);

  if (!valuation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <p className="text-sm text-gray-500">Generate a valuation before requesting professional review.</p>
      </div>
    );
  }

  const submitReview = async (action: "pending_review" | "approved" | "rejected") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/valuations/${valuation.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewer_notes: notes,
          adjustments: [],
          final_valuation: action === "approved" ? Number(finalValuation || valuation.blended_weighted_average || 0) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReview(data.data);
        trackFeatureUsage("professional_review_action", {
          valuation_id: valuation.id,
          action,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const statusIcon =
    review.status === "approved" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
    review.status === "rejected" ? <XCircle className="w-5 h-5 text-red-600" /> :
    review.status === "pending_review" ? <Clock className="w-5 h-5 text-amber-600" /> :
    <FileCheck className="w-5 h-5 text-gray-400" />;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Professional Review</h3>
            <p className="text-sm text-gray-500 mt-1">
              Request, approve, or reject a valuation with reviewer notes and a locked final valuation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium capitalize">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : statusIcon}
            {review.status.replace(/_/g, " ")}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Current valuation</label>
            <div className="input bg-gray-50">
              ${((valuation.blended_weighted_average || 0) / 1_000_000).toFixed(2)}M
            </div>
          </div>
          <div>
            <label className="form-label">Final reviewed valuation</label>
            <input
              type="number"
              value={finalValuation}
              onChange={(event) => setFinalValuation(event.target.value)}
              placeholder={String(valuation.blended_weighted_average || "")}
              className="input"
            />
          </div>
        </div>

        <label className="form-label">Reviewer notes</label>
        <textarea
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="input resize-none"
          placeholder="Document assumptions reviewed, adjustments made, evidence checked, and any limitations."
        />

        <div className="flex flex-wrap gap-3 mt-5">
          <button disabled={saving} onClick={() => submitReview("pending_review")} className="btn btn-secondary btn-sm">
            Request Review
          </button>
          <button disabled={saving} onClick={() => submitReview("approved")} className="btn btn-primary btn-sm">
            {saving ? "Saving..." : "Approve"}
          </button>
          <button disabled={saving} onClick={() => submitReview("rejected")} className="btn btn-secondary btn-sm">
            Reject
          </button>
        </div>

        {review.reviewed_at && (
          <p className="text-xs text-gray-400 mt-4">
            Last updated {new Date(review.reviewed_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
