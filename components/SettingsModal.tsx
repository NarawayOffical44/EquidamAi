'use client';

import { useEffect, useState } from 'react';
import {
  X, User, CreditCard, Shield, Trash2, LogOut,
  AlertTriangle, CheckCircle2, Zap, Users, Mail, Loader2, UserMinus,
  KeyRound, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackFeatureUsage, trackFormSubmission } from '@/lib/analytics/ga4';
import { UpgradeModal } from '@/components/UpgradeModal';
import { canUseTeamSeats, TEAM_SEAT_UPGRADE_LABEL } from '@/lib/team/seat-limits';
import { getPlanDisplayName } from '@/lib/plans/plan-limits';
import { DeveloperApiPanel } from '@/components/settings/DeveloperApiPanel';
import { isWorkEmail, WORK_EMAIL_ERROR } from '@/lib/utils/work-email';

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  plan_active: boolean;
  billing_cycle?: string;
  workspace_id?: string;
  workspace_role?: 'admin' | 'member';
  workspace_owner_name?: string | null;
  workspace_owner_email?: string | null;
  valuation_count?: number;
}

interface SettingsModalProps {
  user: UserInfo;
  onClose: () => void;
}

type Section = 'account' | 'subscription' | 'api' | 'team' | 'security';
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
  { id: 'api', label: 'API Usage', icon: <KeyRound className="w-4 h-4" /> },
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
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [teamUpgradeOpen, setTeamUpgradeOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const isWorkspaceAdmin = user.workspace_role !== 'member';
  const hasTeamAccess = canUseTeamSeats(user.plan, user.plan_active) || user.workspace_role === 'member';
  const navItems = [
    ...BASE_NAV.slice(0, 2),
    { id: 'team' as const, label: 'Team', icon: <Users className="w-4 h-4" /> },
    ...BASE_NAV.slice(2),
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const loadTeam = async () => {
    setTeamLoading(true);
    setTeamError('');
    try {
      const params = user.workspace_id ? `?workspaceId=${encodeURIComponent(user.workspace_id)}` : '';
      const response = await fetch(`/api/team/members${params}`);
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

  const handleInviteTeamMember = async () => {
    setTeamError('');
    setTeamSuccess('');
    if (!isWorkspaceAdmin) {
      setTeamError('Only the workspace Admin can invite members.');
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setTeamError('Enter a valid email address.');
      return;
    }
    if (!isWorkEmail(email)) {
      setTeamError(WORK_EMAIL_ERROR);
      return;
    }
    if (invitePassword.length < 8) {
      setTeamError('Set an initial password with at least 8 characters.');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail: email, password: invitePassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add team member');

      setInviteEmail('');
      setInvitePassword('');
      setTeamSuccess(data.message || `Team member added: ${email}.`);
      trackFormSubmission('team_member_added', { invitedDomain: email.split('@')[1], plan: user.plan });
      await loadTeam();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : 'Failed to add team member');
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

  const planLabel = getPlanDisplayName(user.plan, user.plan_active);
  const planPrice = user.plan === 'pro' || user.plan === 'startup'
    ? '$44/mo'
    : user.plan === 'plus' || user.plan === 'agency'
      ? '$250/mo'
      : user.plan === 'enterprise'
        ? 'Custom'
        : 'Free';
  const hasUnlimitedTeamSeats = seatsInfo.max > 999;
  const teamSeatsLabel = teamLoading && seatsInfo.max === 0
    ? 'Checking'
    : hasUnlimitedTeamSeats
      ? `${seatsInfo.current}/Unlimited`
      : `${seatsInfo.current}/${seatsInfo.max}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-full max-w-5xl flex flex-col md:flex-row overflow-hidden"
          style={{ height: 'min(760px, calc(100vh - 32px))' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── LEFT SIDEBAR ── */}
          <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <h2 id="settings-modal-title" className="font-bold text-gray-900 text-lg">Settings</h2>
              <p className="mt-1 text-xs text-gray-500">
                {planLabel} {isWorkspaceAdmin ? 'Admin' : 'Member'}
              </p>
            </div>

            {/* Nav */}
            <nav className="flex gap-2 overflow-x-auto p-2 md:flex-1 md:flex-col md:gap-0 md:space-y-0.5 md:overflow-visible">
              {navItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    if (item.id === 'team') {
                      if (hasTeamAccess) void loadTeam();
                      trackFeatureUsage('team_settings_opened', { plan: user.plan, role: user.workspace_role || 'admin', hasAccess: hasTeamAccess });
                    }
                    if (item.id === 'api') trackFeatureUsage('developer_api_settings_opened', { plan: user.plan });
                  }}
                  aria-current={section === item.id ? 'page' : undefined}
                  className={`min-w-max md:min-w-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    section === item.id
                      ? 'bg-white text-primary border border-primary/20'
                      : 'text-gray-600 hover:text-gray-900'
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
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
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
              <div>
                <h3 className="font-semibold text-gray-900">
                  {navItems.find((n) => n.id === section)?.label}
                </h3>
                <p className="text-xs text-gray-500">
                  Manage workspace access, billing, API credits, and security.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── ACCOUNT ── */}
              {section === 'account' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200/60">
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
                      <label htmlFor="settings-full-name" className="form-label">Full Name</label>
                      <input id="settings-full-name" type="text" defaultValue={user.full_name} className="input" readOnly />
                      <p className="form-hint">Contact support to update your name.</p>
                    </div>
                    <div>
                      <label htmlFor="settings-email" className="form-label">Email Address</label>
                      <input id="settings-email" type="email" defaultValue={user.email} className="input" readOnly />
                      <p className="form-hint">Contact support to change your email.</p>
                    </div>
                  </div>

                  {isWorkspaceAdmin ? (
                  <div className="border-t pt-5 mt-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Delete Account</h4>
                    <div className="flex items-start gap-3 p-4 bg-white border border-red-100 rounded-xl mb-4">
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
                      <label htmlFor="delete-confirm" className="form-label">
                        Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                      </label>
                      <input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                        className="input font-mono"
                        autoComplete="off"
                      />
                      {deleteError && <p className="form-error mt-1">{deleteError}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirm !== 'DELETE'}
                      className="w-full py-2.5 px-4 rounded-lg border border-red-200 bg-white font-semibold text-sm text-red-700 transition-all flex items-center justify-center gap-2 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? 'Deleting...' : 'Delete My Account'}
                    </button>
                  </div>
                  ) : (
                    <div className="alert alert-warning">
                      <span>Account deletion is restricted for workspace members. Contact the workspace Admin or support if access should be removed.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── SUBSCRIPTION ── */}
              {section === 'subscription' && (
                <div className="space-y-5">
                  {!isWorkspaceAdmin && (
                    <div className="alert alert-info">
                      <span>Billing and plan changes are managed by the workspace Admin.</span>
                    </div>
                  )}
                  <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-3">
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

                  {isWorkspaceAdmin && user.plan !== 'enterprise' && (
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
              {section === 'api' && <DeveloperApiPanel />}

              {section === 'team' && (
                <div className="space-y-5">
                  {!hasTeamAccess ? (
                    <div className="space-y-4">
                      <div className="alert alert-warning">
                        <span>Team workspaces are available on {TEAM_SEAT_UPGRADE_LABEL} plans.</span>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <h4 className="text-sm font-semibold text-gray-900">Two-role team access</h4>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                          Startup is a solo founder workspace. Agency / Investor adds up to 5 team members. Enterprise adds unlimited team members, white-label options, and advanced controls.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTeamUpgradeOpen(true)}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Upgrade for Team Access
                      </button>
                    </div>
                  ) : (
                    <>
                  {!isWorkspaceAdmin && (
                    <div className="alert alert-info">
                      <span>You are a Member in this workspace. You can review and update inputs; billing, team changes, report generation, sharing, and deletion stay with the workspace Admin.</span>
                    </div>
                  )}
                  <div className="p-4 bg-white rounded-xl border border-slate-200/60">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Team seats</h4>
                        <p className="text-xs text-gray-500 mt-1">Admin can add teammates. Members can review and update profile or financial inputs.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{teamSeatsLabel}</div>
                        <div className="text-xs text-gray-500">{hasUnlimitedTeamSeats ? 'team plan' : 'member seats'}</div>
                      </div>
                    </div>
                    {hasUnlimitedTeamSeats ? (
                      <div className="mt-4 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary">
                        Unlimited member seats included on this workspace plan.
                      </div>
                    ) : (
                      <div className="mt-4 h-2 rounded-full border border-slate-200/60 bg-white overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${seatsInfo.max > 0 ? Math.min(100, (seatsInfo.current / seatsInfo.max) * 100) : 0}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {isWorkspaceAdmin && teamLoading && seatsInfo.max === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                      Checking team seat allowance...
                    </div>
                  ) : isWorkspaceAdmin && seatsInfo.max > 0 ? (
                    <div className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <label htmlFor="team-invite-email" className="sr-only">Team member email</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="team-invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="input pl-9"
                            placeholder="teammate@company.com"
                          />
                        </div>
                        <p className="form-hint mt-1">Use their work email.</p>
                      </div>
                      <div>
                        <label htmlFor="team-invite-password" className="sr-only">Initial password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="team-invite-password"
                            type="password"
                            value={invitePassword}
                            onChange={(e) => setInvitePassword(e.target.value)}
                            className="input pl-9"
                            placeholder="Initial password"
                            autoComplete="new-password"
                          />
                        </div>
                        <p className="form-hint mt-1">They will use this to sign in.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleInviteTeamMember}
                        disabled={inviteLoading || seatsInfo.available <= 0}
                        className="btn btn-primary h-11 disabled:opacity-50"
                      >
                        {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Member'}
                      </button>
                    </div>
                  ) : isWorkspaceAdmin ? (
                    <div className="p-4 border border-amber-200 bg-white rounded-xl">
                      <p className="text-sm font-semibold text-amber-900">Team seats are available on {TEAM_SEAT_UPGRADE_LABEL}.</p>
                      <p className="text-xs text-amber-800 mt-1">Upgrade to invite advisors, analysts, or partners into the same workspace.</p>
                    </div>
                  ) : null}

                  {teamError && <p className="form-error text-sm">{teamError}</p>}
                  {teamSuccess && <p className="text-sm text-green-600 font-medium">✓ {teamSuccess}</p>}

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
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
                                {member.role === 'owner' ? 'Admin' : 'Member'} - {member.status}
                                {member.created_at ? ` - invited ${new Date(member.created_at).toLocaleDateString()}` : ''}
                              </div>
                            </div>
                            {isWorkspaceAdmin && member.role !== 'owner' && member.status !== 'revoked' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTeamMember(member.id)}
                                disabled={removingMemberId === member.id}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 disabled:opacity-50"
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
                    </>
                  )}
                </div>
              )}

              {section === 'security' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-white border border-blue-100 rounded-xl">
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
                        <label htmlFor="settings-new-password" className="form-label">New Password</label>
                        <input
                          id="settings-new-password"
                          type="password"
                          value={passwordNew}
                          onChange={(e) => setPasswordNew(e.target.value)}
                          className="input"
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-confirm-password" className="form-label">Confirm New Password</label>
                        <input
                          id="settings-confirm-password"
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
                        type="button"
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
      <UpgradeModal
        isOpen={teamUpgradeOpen}
        onClose={() => setTeamUpgradeOpen(false)}
        currentPlan={user.plan === 'pro' || user.plan === 'plus' ? user.plan : 'free'}
        limitType="team"
      />
    </>
  );
}
