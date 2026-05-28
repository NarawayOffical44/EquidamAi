"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, UserMinus, X } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const activeCount = accessRows.filter((row) => row.status === "accepted").length;

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

  const generateInitialPassword = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const values = new Uint32Array(14);
    window.crypto.getRandomValues(values);
    setPassword(Array.from(values, (value) => characters[value % characters.length]).join(""));
    setShowPassword(true);
    setError("");
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="startup-access-title"
        className="flex max-h-[calc(100vh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:max-h-[calc(100vh-48px)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="startup-access-title" className="text-lg font-semibold text-gray-950">
              Share {startupName || "startup"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Add one contact who can update this startup profile and financial inputs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close startup access"
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-slate-50 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <section className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label htmlFor="startup-access-email" className="form-label">Email</label>
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
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="startup-access-password" className="form-label">Temporary password</label>
                  <button type="button" onClick={generateInitialPassword} className="mb-1 text-xs font-semibold text-primary hover:underline">
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="startup-access-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input pl-9 pr-10"
                    placeholder="Initial password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={inviteStartup}
                disabled={inviting}
                className="btn btn-primary h-11 min-w-20 gap-2 self-end disabled:opacity-50"
              >
                {inviting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inviting
                  </>
                ) : "Invite"}
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Use a dedicated founder or operator email. Existing linked access will be reconnected.
            </p>
          </section>

          <div className="px-5 pt-4 sm:px-6">
            {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{error}</p>}
            {success && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{success}</p>}
          </div>

          <div className="px-5 py-4 sm:px-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">Access</h3>
                <p className="mt-0.5 text-xs text-gray-500">{activeCount} active contact{activeCount === 1 ? "" : "s"}</p>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200">
              <div className="hidden grid-cols-[1fr_112px_112px_44px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                <span>Email</span>
                <span>Status</span>
                <span>Added</span>
                <span className="sr-only">Actions</span>
              </div>
              {accessRows.length === 0 && !loading ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  No startup access added.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {accessRows.map((row) => (
                    <div key={row.id} className="grid gap-3 px-3 py-3 text-sm sm:grid-cols-[1fr_112px_112px_44px] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-950">{row.email}</p>
                        <p className="mt-0.5 text-xs text-gray-500 sm:hidden">
                          {row.status === "accepted" ? "Active" : "Revoked"}
                          {row.created_at ? ` - ${new Date(row.created_at).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <span className={`hidden w-fit rounded px-2 py-1 text-xs font-semibold sm:inline-flex ${row.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {row.status === "accepted" ? "Active" : "Revoked"}
                      </span>
                      <span className="hidden text-xs text-gray-500 sm:block">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
                      </span>
                      <div className="flex justify-end">
                        {row.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => revokeAccess(row.id)}
                            disabled={revokingId === row.id}
                            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Revoke startup access"
                          >
                            {revokingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
