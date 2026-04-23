'use client';

import { useState } from 'react';
import {
  X, User, CreditCard, Shield, Trash2, LogOut,
  AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  plan_active: boolean;
  billing_cycle?: string;
}

interface SettingsModalProps {
  user: UserInfo;
  onClose: () => void;
}

type Section = 'account' | 'subscription' | 'security' | 'danger';

const NAV: { id: Section; label: string; icon: React.ReactNode; danger?: boolean }[] = [
  { id: 'account',      label: 'Account',      icon: <User className="w-4 h-4" /> },
  { id: 'subscription', label: 'Subscription',  icon: <CreditCard className="w-4 h-4" /> },
  { id: 'security',     label: 'Security',      icon: <Shield className="w-4 h-4" /> },
  { id: 'danger',       label: 'Danger Zone',   icon: <Trash2 className="w-4 h-4" />, danger: true },
];

export function SettingsModal({ user, onClose }: SettingsModalProps) {
  const [section, setSection] = useState<Section>('account');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setDeleteError('Type DELETE to confirm'); return; }
    setDeleting(true);
    setDeleteError('');
    try {
      // Delete user data then sign out
      await supabase.from('startups').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
      await supabase.auth.signOut();
      router.push('/');
    } catch {
      setDeleteError('Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  const planLabel = user.plan === 'pro' ? 'Pro' : user.plan === 'plus' ? 'Plus' : user.plan === 'enterprise' ? 'Enterprise' : 'None';
  const planPrice = user.plan === 'pro' ? '$99/mo' : user.plan === 'plus' ? '$199/mo' : user.plan === 'enterprise' ? 'Custom' : '—';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex overflow-hidden"
          style={{ height: '520px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── LEFT SIDEBAR ── */}
          <div className="w-44 bg-gray-50 border-r border-gray-100 flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">Settings</h2>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-0.5">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    section === item.id
                      ? item.danger
                        ? 'bg-red-50 text-red-600'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : item.danger
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Bottom: Sign Out */}
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-white hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar with close */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">
                {NAV.find((n) => n.id === section)?.label}
              </h3>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── ACCOUNT ── */}
              {section === 'account' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.full_name || 'No name set'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="form-label">Full Name</label>
                      <input type="text" defaultValue={user.full_name} className="input" readOnly />
                      <p className="form-hint">Contact support to update your name.</p>
                    </div>
                    <div>
                      <label className="form-label">Email Address</label>
                      <input type="email" defaultValue={user.email} className="input" readOnly />
                      <p className="form-hint">Contact support to change your email.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUBSCRIPTION ── */}
              {section === 'subscription' && (
                <div className="space-y-5">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Current Plan</span>
                      <span className="font-semibold text-gray-900">{planLabel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Billing</span>
                      <span className="text-sm font-medium text-gray-700">{planPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`text-sm font-semibold ${user.plan_active ? 'text-green-600' : 'text-red-500'}`}>
                        {user.plan_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {user.plan !== 'enterprise' && (
                    <a href="/pricing" className="btn btn-primary w-full flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Upgrade Plan
                    </a>
                  )}

                  <p className="text-xs text-gray-400 text-center">
                    To cancel or manage billing, contact{' '}
                    <a href="/contact" className="text-primary hover:underline">support</a>.
                  </p>
                </div>
              )}

              {/* ── SECURITY ── */}
              {section === 'security' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Account secured with email &amp; password</p>
                      <p className="text-xs text-blue-600 mt-0.5">Your account uses Supabase Auth with encrypted credentials.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Change Password</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="form-label">New Password</label>
                        <input type="password" className="input" />
                      </div>
                      <div>
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" className="input" />
                      </div>
                      <button className="btn btn-secondary">Update Password</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DANGER ZONE ── */}
              {section === 'danger' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Permanently delete your account</p>
                      <p className="text-xs text-red-600 mt-1 leading-relaxed">
                        This will delete all your startups, valuations, and reports. This action
                        is <strong>irreversible</strong> and cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">
                      Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                      className="input font-mono"
                      autoComplete="off"
                    />
                    {deleteError && <p className="form-error mt-1">{deleteError}</p>}
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirm !== 'DELETE'}
                    className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : 'Delete My Account'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
