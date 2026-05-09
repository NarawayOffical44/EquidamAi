'use client';

import { useEffect, useState } from 'react';
import {
  X, User, CreditCard, Shield, Trash2, LogOut,
  AlertTriangle, CheckCircle2, Zap, Users, Mail, Loader2, UserMinus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackFeatureUsage, trackFormSubmission } from '@/lib/analytics/ga4';

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

type Section = 'account' | 'subscription' | 'team' | 'security';
type TeamMember = {
  id: string;
  email: string;
  role: 'owner' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  accepted_at?: string | null;
  created_at?: string | null;
};

const BASE_NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'account',      label: 'Account',      icon: <User className="w-4 h-4" /> },
  { id: 'subscription', label: 'Subscription',  icon: <CreditCard className="w-4 h-4" /> },
  { id: 'security',     label: 'Security',      icon: <Shield className="w-4 h-4" /> },
];

export function SettingsModal({ user, onClose }: SettingsModalProps) {
  const [section, setSection] = useState<Section>('account');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [seatsInfo, setSeatsInfo] = useState({ current: 0, max: 0, available: 0 });
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const isEnterprise = user.plan === 'enterprise';
  const navItems = isEnterprise
    ? [...BASE_NAV.slice(0, 2), { id: 'team' as const, label: 'Team', icon: <Users className="w-4 h-4" /> }, ...BASE_NAV.slice(2)]
    : BASE_NAV;

  const loadTeam = async () => {
    setTeamLoading(true);
    setTeamError('');
    try {
      const response = await fetch('/api/team/members');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load team members');
      setTeamMembers(data.members || []);
      setSeatsInfo(data.seatsInfo || { current: 0, max: 0, available: 0 });
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : 'Failed to load team members');
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (section === 'team' && isEnterprise) {
      loadTeam();
      trackFeatureUsage('team_settings_opened', { plan: user.plan });
    }
  }, [section, isEnterprise, user.plan]);

  useEffect(() => {
    if (section === 'team' && !isEnterprise) setSection('account');
  }, [section, isEnterprise]);

  const handleInviteTeamMember = async () => {
    setTeamError('');
    setTeamSuccess('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setTeamError('Enter a valid email address.');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail: email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send invitation');

      setInviteEmail('');
      setTeamSuccess(`Invitation sent to ${email}.`);
      trackFormSubmission('team_invite_sent', { invitedDomain: email.split('@')[1], plan: user.plan });
      await loadTeam();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    setTeamError('');
    setTeamSuccess('');
    setRemovingMemberId(memberId);
    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove member');

      setTeamSuccess('Team member removed.');
      trackFeatureUsage('team_member_removed', { plan: user.plan });
      await loadTeam();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error.message);
        throw error;
      }
      onClose();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      onClose();
      router.push('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setDeleteError('Type DELETE to confirm'); return; }
    setDeleting(true);
    setDeleteError('');
    try {
      // Delete all user data in order of dependencies
      // First delete valuations (depends on startups)
      await supabase.from('valuations').delete().eq('user_id', user.id);

      // Then delete startups
      await supabase.from('startups').delete().eq('user_id', user.id);

      // Finally delete user profile
      await supabase.from('users').delete().eq('id', user.id);

      // Sign out and redirect
      try {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Signout error:', error.message);
      } catch (e) {
        console.error('Logout during delete:', e);
      }
      router.push('/');
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError('Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordNew) { setPasswordError('New password is required'); return; }
    if (!passwordConfirm) { setPasswordError('Confirm password is required'); return; }
    if (passwordNew.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    if (passwordNew !== passwordConfirm) { setPasswordError('Passwords do not match'); return; }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordNew });
      if (error) {
        setPasswordError(error.message || 'Failed to update password');
      } else {
        setPasswordSuccess('Password updated successfully!');
        setPasswordNew('');
        setPasswordConfirm('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex overflow-hidden"
          style={{ height: 'min(640px, calc(100vh - 32px))' }}
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
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    section === item.id
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
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
                {navItems.find((n) => n.id === section)?.label}
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

                  <div className="border-t pt-5 mt-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Delete Account</h4>
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Permanently delete your account</p>
                        <p className="text-xs text-red-600 mt-1 leading-relaxed">
                          This will delete all your startups, valuations, and reports. This action
                          is <strong>irreversible</strong> and cannot be undone.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
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
              {section === 'team' && isEnterprise && (
                <div className="space-y-5">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Team seats</h4>
                        <p className="text-xs text-gray-500 mt-1">Invite teammates to collaborate from your workspace.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{seatsInfo.current}/{seatsInfo.max}</div>
                        <div className="text-xs text-gray-500">accepted seats</div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${seatsInfo.max > 0 ? Math.min(100, (seatsInfo.current / seatsInfo.max) * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {seatsInfo.max > 0 ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="input pl-9"
                          placeholder="teammate@company.com"
                        />
                      </div>
                      <button
                        onClick={handleInviteTeamMember}
                        disabled={inviteLoading || seatsInfo.available <= 0}
                        className="btn btn-primary sm:w-auto disabled:opacity-50"
                      >
                        {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl">
                      <p className="text-sm font-semibold text-amber-900">Team seats are available on Enterprise.</p>
                      <p className="text-xs text-amber-800 mt-1">Enterprise workspaces can invite advisors, analysts, or partners into the same workspace.</p>
                    </div>
                  )}

                  {teamError && <p className="form-error text-sm">{teamError}</p>}
                  {teamSuccess && <p className="text-sm text-green-600 font-medium">✓ {teamSuccess}</p>}

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Members</span>
                      {teamLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                    {teamMembers.length === 0 && !teamLoading ? (
                      <div className="p-6 text-center">
                        <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No team members yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">{member.email}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {member.role} · {member.status}
                                {member.created_at ? ` · invited ${new Date(member.created_at).toLocaleDateString()}` : ''}
                              </div>
                            </div>
                            {member.role !== 'owner' && member.status !== 'revoked' && (
                              <button
                                onClick={() => handleRemoveTeamMember(member.id)}
                                disabled={removingMemberId === member.id}
                                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Remove member"
                              >
                                {removingMemberId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                        <input
                          type="password"
                          value={passwordNew}
                          onChange={(e) => setPasswordNew(e.target.value)}
                          className="input"
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div>
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          className="input"
                          placeholder="Confirm password"
                        />
                      </div>
                      {passwordError && <p className="form-error text-sm">{passwordError}</p>}
                      {passwordSuccess && <p className="text-sm text-green-600 font-medium">✓ {passwordSuccess}</p>}
                      <button
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        className="btn btn-primary w-full disabled:opacity-50"
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
