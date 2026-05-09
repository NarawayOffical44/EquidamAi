"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { logger } from "@/lib/utils/logger";

interface PendingReview {
  id: string;
  startup_id: string;
  user_id: string;
  blended_weighted_average: number;
  confidence_level: number;
  created_at: string;
  assigned_reviewer_id: string | null;
  review_claimed_at: string | null;
  startups: { company_name: string };
  users: { full_name: string; email: string };
}

const formatSubmittedAt = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function QueueButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) {
  return (
    <button
      {...props}
      className={[
        "rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "outline"
          ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          : "bg-primary text-white hover:bg-primary/90",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function QueueBadge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "strong";
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        tone === "strong" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-700",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function ReviewQueue() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });

  const fetchQueue = async (offset = 0) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/valuations/review-queue?offset=${offset}&limit=${pagination.limit}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setReviews(result.data || []);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch review queue";
      setError(message);
      logger.error("Review queue fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const claimReview = async (valuationId: string) => {
    try {
      setClaming(valuationId);
      const response = await fetch("/api/valuations/review-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valuationId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Remove from queue
      setReviews(reviews.filter(r => r.id !== valuationId));
      logger.info("Review claimed", { valuationId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim review";
      setError(message);
      logger.error("Review claim failed", err);
    } finally {
      setClaming(null);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading review queue...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <QueueButton onClick={() => fetchQueue()} variant="outline" className="mt-2">
            Retry
          </QueueButton>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-600">No valuations pending review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Review Queue</h2>
        <p className="text-sm text-gray-600">
          {pagination.total} pending ({pagination.offset}-{Math.min(pagination.offset + pagination.limit, pagination.total)})
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Company</th>
              <th className="text-left py-2 px-4">Submitter</th>
              <th className="text-right py-2 px-4">Valuation</th>
              <th className="text-center py-2 px-4">Confidence</th>
              <th className="text-left py-2 px-4">Submitted</th>
              <th className="text-center py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium">{review.startups.company_name}</p>
                  <p className="text-xs text-gray-500">{review.id}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm">{review.users.full_name}</p>
                  <p className="text-xs text-gray-500">{review.users.email}</p>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  ${(review.blended_weighted_average / 1000000).toFixed(1)}M
                </td>
                <td className="py-3 px-4 text-center">
                  <QueueBadge tone={review.confidence_level >= 70 ? "strong" : "neutral"}>
                    {review.confidence_level}%
                  </QueueBadge>
                </td>
                <td className="py-3 px-4 text-xs text-gray-600">
                  {formatSubmittedAt(review.created_at)}
                </td>
                <td className="py-3 px-4 text-center">
                  {review.assigned_reviewer_id ? (
                    <QueueBadge>
                      Claimed
                    </QueueBadge>
                  ) : (
                    <QueueButton
                      onClick={() => claimReview(review.id)}
                      disabled={claiming === review.id}
                      className="whitespace-nowrap"
                    >
                      {claiming === review.id ? "Claiming..." : "Claim Review"}
                    </QueueButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <QueueButton
          onClick={() => fetchQueue(Math.max(0, pagination.offset - pagination.limit))}
          disabled={pagination.offset === 0}
          variant="outline"
        >
          Previous
        </QueueButton>
        <QueueButton
          onClick={() => fetchQueue(pagination.offset + pagination.limit)}
          disabled={pagination.offset + pagination.limit >= pagination.total}
          variant="outline"
        >
          Next
        </QueueButton>
      </div>
    </div>
  );
}
