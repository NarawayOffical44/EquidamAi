'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Settings, Zap, Trash2, LogOut, ChevronRight } from 'lucide-react';

interface UserData {
  email: string;
  full_name: string;
  plan: string;
  plan_active: boolean;
  billing_cycle: string;
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name, plan, plan_active, billing_cycle')
          .eq('id', authUser.id)
          .single();

        if (userData) setUser(userData as UserData);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const planPrice = user?.plan === 'pro' ? 99 : user?.plan === 'plus' ? 199 : 'Custom';
  const planCycle = user?.billing_cycle === 'annual' ? '/year' : '/month';

  // Not logged in — show Login + Sign Up
  if (!loading && !user) {
    return (
      <div className="flex items-center gap-3">
        <a href="/login" className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
          Log in
        </a>
        <a href="/signup" className="btn btn-primary text-sm py-2 px-4">
          Sign Up
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-primary text-black font-bold flex items-center justify-center hover:opacity-80 transition"
      >
        {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="p-6 border-b border-neutral-700">
            <h3 className="font-bold text-white mb-1">{user?.full_name || 'User'}</h3>
            <p className="text-sm text-neutral-400">{user?.email}</p>
          </div>

          {/* Subscription Info */}
          <div className="p-6 border-b border-neutral-700 bg-neutral-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-400">Current Plan</span>
              <span className="text-sm font-bold text-primary capitalize">{user?.plan}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-400">Billing</span>
              <span className="text-sm text-white">${planPrice}{planCycle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Status</span>
              <span className={`text-sm font-bold ${user?.plan_active ? 'text-green-400' : 'text-red-400'}`}>
                {user?.plan_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile */}
            <button
              onClick={() => {
                setOpen(false);
                // TODO: Open profile modal
              }}
              className="w-full px-6 py-3 flex items-center justify-between text-white hover:bg-neutral-700 transition"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span className="text-sm">Profile Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Upgrade */}
            {user?.plan !== 'enterprise' && (
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/pricing');
                }}
                className="w-full px-6 py-3 flex items-center justify-between text-primary hover:bg-neutral-700 transition"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Upgrade Plan</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => {
                setOpen(false);
                // TODO: Open settings modal
              }}
              className="w-full px-6 py-3 flex items-center justify-between text-white hover:bg-neutral-700 transition"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Delete Account */}
            <button
              onClick={() => {
                setOpen(false);
                handleDeleteAccount();
              }}
              className="w-full px-6 py-3 flex items-center justify-between text-red-400 hover:bg-red-900/20 transition"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete Account</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 flex items-center justify-between text-neutral-400 hover:bg-neutral-700 transition border-t border-neutral-700"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
