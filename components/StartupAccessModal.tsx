"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, UserMinus, X } from "lucide-react";

type StartupAccessRecord = {
  id: string;
  email: string;
  status: "accepted" | "revoked";
  accepted_at?: string | null;
  revoked_at?: string | null;
  created_at?: string | null;
};

interface StartupAccessModalProps {
  isOpen: boolean;
  startupId: string;
  startupName: string;
  onClose: () => void;
}

export function StartupAccessModal({
  isOpen,
  startupId,
  startupName,
  onClose,
}: StartupAccessModalProps) {
  const [accessRows, setAccessRows] = useState<StartupAccessRecord[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAccess = async () => {
    if (!startupId) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/startup/${startupId}/access`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load startup access");
      setAccessRows(data.access || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load startup access");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void loadAccess();
  }, [isOpen, startupId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const inviteStartup = async () => {
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid startup contact email.");
      return;
    }

    if (password.length < 8) {
      setError("Set an initial password with at least 8 characters.");
      return;
    }

    setInviting(true);
    try {
      const response = await fetch(`/api/startup/${startupId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitedEmail: normalizedEmail, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to invite startup");

      setEmail("");
      setPassword("");
      setSuccess(data.message || "Startup access added.");
      await loadAccess();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to invite startup");
    } finally {
      setInviting(false);
    }
  };

  const revokeAccess = async (accessId: string) => {
    setError("");
    setSuccess("");
    setRevokingId(accessId);

    try {
      const response = await fetch(`/api/startup/${startupId}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to revoke access");

      setSuccess(data.message || "Startup access revoked.");
      await loadAccess();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="startup-access-title"
        className="flex max-h-[calc(100vh-32px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary">Enterprise startup sharing</p>
            <h2 id="startup-access-title" className="mt-1 text-xl font-black text-gray-900">
              Share {startupName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Invite one startup contact to update this card's profile and financial inputs only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close startup access"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="startup-access-email" className="sr-only">Startup email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="startup-access-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input pl-9"
                  placeholder="founder@startup.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="startup-access-password" className="sr-only">Initial password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="startup-access-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input pl-9"
                  placeholder="Initial password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={inviteStartup}
              disabled={inviting}
              className="btn btn-primary h-11 disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
            </button>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            The same email/login can only be connected to one startup card. This access cannot create startups, use AI, generate reports, or manage workspace settings.
          </p>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
          {success && <p className="mt-4 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-700">{success}</p>}

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <span className="text-sm font-bold text-gray-900">Startup access</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {accessRows.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No startup access has been added yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {accessRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{row.email}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {row.status === "accepted" ? "Active" : "Revoked"}
                        {row.created_at ? ` - added ${new Date(row.created_at).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    {row.status === "accepted" && (
                      <button
                        type="button"
                        onClick={() => revokeAccess(row.id)}
                        disabled={revokingId === row.id}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                        title="Revoke startup access"
                      >
                        {revokingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
