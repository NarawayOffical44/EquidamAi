'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Copy, KeyRound, Loader2, Wallet, Zap } from 'lucide-react';
import { API_MAX_TOP_UP_USD, API_MIN_TOP_UP_USD } from '@/lib/developer-api/pricing';

type ApiKeyRow = {
  id: string;
  status: 'active' | 'revoked' | 'suspended';
};

type ApiWalletState = {
  wallet: {
    balanceDisplay: string;
  };
  usage: {
    usedThisMonthDisplay: string;
  };
};

export function DeveloperApiPanel() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [apiWallet, setApiWallet] = useState<ApiWalletState | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [apiTopUpAmount, setApiTopUpAmount] = useState('5');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [keyActionLoading, setKeyActionLoading] = useState(false);

  const activeApiKey = useMemo(
    () => apiKeys.find((key) => key.status === 'active'),
    [apiKeys]
  );

  const loadDeveloperApi = async () => {
    setApiLoading(true);
    setApiError('');
    try {
      const [keysResponse, walletResponse] = await Promise.all([
        fetch('/api/developer/keys'),
        fetch('/api/developer/wallet'),
      ]);
      const keysData = await keysResponse.json();
      const walletData = await walletResponse.json();
      if (!keysResponse.ok) throw new Error(keysData.error || 'Failed to load API key status');
      if (!walletResponse.ok) throw new Error(walletData.error || 'Failed to load API usage');
      setApiKeys(keysData.keys || []);
      setApiWallet(walletData);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load API usage');
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    void loadDeveloperApi();
  }, []);

  const handleCreateApiKey = async () => {
    setApiError('');
    setApiSuccess('');
    setNewApiSecret('');
    setKeyActionLoading(true);
    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Default API key' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create API key');
      setNewApiSecret(data.secret);
      setApiSuccess('API key created. Copy it now; it will not be shown again.');
      await loadDeveloperApi();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setKeyActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    setApiError('');
    setApiSuccess('');
    setKeyActionLoading(true);
    try {
      const response = await fetch(`/api/developer/keys/${keyId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to revoke API key');
      setApiSuccess('API key revoked.');
      setNewApiSecret('');
      await loadDeveloperApi();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to revoke API key');
    } finally {
      setKeyActionLoading(false);
    }
  };

  const handleTopUpApiCredits = async () => {
    const amountUsd = Number(apiTopUpAmount);
    if (!Number.isFinite(amountUsd) || amountUsd < API_MIN_TOP_UP_USD) {
      setApiError(`Minimum API credit top-up is $${API_MIN_TOP_UP_USD}.`);
      return;
    }
    if (amountUsd > API_MAX_TOP_UP_USD) {
      setApiError(`Maximum API credit top-up is $${API_MAX_TOP_UP_USD.toLocaleString()}.`);
      return;
    }

    setTopUpLoading(true);
    setApiError('');
    try {
      const response = await fetch('/api/developer/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to start checkout');
      setTopUpLoading(false);
    }
  };

  const handleCopyApiSecret = async () => {
    if (!newApiSecret) return;
    await navigator.clipboard.writeText(newApiSecret);
    setApiSuccess('API key copied.');
  };

  if (apiLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {apiError && <p className="form-error text-sm">{apiError}</p>}
      {apiSuccess && <p className="text-sm font-medium text-green-600">{apiSuccess}</p>}

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h4 className="text-sm font-semibold text-gray-900">Developer API</h4>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Generate server-side keys here, read endpoint docs, and add prepaid API credits from Settings or Pricing.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/api-docs" className="btn btn-secondary btn-sm">
            API Docs
          </Link>
          <Link href="/pricing#api-credits" className="btn btn-secondary btn-sm">
            Pricing Credits
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          icon={<Wallet className="h-4 w-4" />}
          label="Current Wallet Balance"
          value={apiWallet?.wallet.balanceDisplay || '$0.00'}
        />
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="Total Credits Used This Month"
          value={apiWallet?.usage.usedThisMonthDisplay || '$0.00'}
        />
      </div>

      <section className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-900">API access</h4>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Create one server-side key. Revoke it immediately if it is exposed.
            </p>
          </div>
          {activeApiKey ? (
            <button
              type="button"
              onClick={() => void handleRevokeApiKey(activeApiKey.id)}
              disabled={keyActionLoading}
              className="btn btn-secondary btn-sm text-red-600 disabled:opacity-50"
            >
              {keyActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleCreateApiKey()}
              disabled={keyActionLoading}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {keyActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Key'}
            </button>
          )}
        </div>

        {newApiSecret && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">Copy this key now. It will not be shown again.</p>
            <div className="mt-2 flex gap-2">
              <input value={newApiSecret} readOnly className="input font-mono text-xs" />
              <button
                type="button"
                onClick={() => void handleCopyApiSecret()}
                className="btn btn-secondary px-3"
                title="Copy API key"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900">Add API credits</h4>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">$</span>
            <input
              type="number"
              min={API_MIN_TOP_UP_USD}
              max={API_MAX_TOP_UP_USD}
              step="1"
              value={apiTopUpAmount}
              onChange={(event) => setApiTopUpAmount(event.target.value)}
              className="input pl-7"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleTopUpApiCredits()}
            disabled={topUpLoading}
            className="btn btn-primary sm:w-auto disabled:opacity-50"
          >
            {topUpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Credits'}
          </button>
        </div>
        <p className="form-hint mt-2">
          Minimum ${API_MIN_TOP_UP_USD}. Maximum ${API_MAX_TOP_UP_USD.toLocaleString()}. API credits are separate from your subscription plan.
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-black text-gray-900">{value}</div>
    </div>
  );
}
