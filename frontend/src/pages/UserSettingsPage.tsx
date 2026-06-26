import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCircle, AtSign, Check, AlertCircle, Lock, Mail,
  Eye, EyeOff, Monitor, Smartphone, Globe, LogOut, Shield,
  ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/forumService';
import Button from '../components/ui/Button';
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  email_verified: boolean;
  phone_number: string | null;
  gstn: string | null;
  trust_level: string;
  registration_status: string;
  secondary_email: string | null;
  secondary_email_verified: boolean;
  forums_default_anonymous: boolean;
  incidents_always_anonymous: boolean;
  forum_anon_handle: string | null;
  created_at: string;
}

interface SessionData {
  id: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}

type MsgState = { type: 'success' | 'error'; text: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDevice(userAgent: string | null): { icon: React.ReactNode; label: string } {
  if (!userAgent) return { icon: <Globe size={16} />, label: 'Unknown device' };
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return { icon: <Smartphone size={16} />, label: 'Mobile browser' };
  }
  return { icon: <Monitor size={16} />, label: 'Desktop browser' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ ok, trueLabel = 'Verified', falseLabel = 'Not verified' }: {
  ok: boolean; trueLabel?: string; falseLabel?: string;
}) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Check size={11} />{trueLabel}</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertCircle size={11} />{falseLabel}</span>;
}

function InlineMsg({ msg }: { msg: MsgState }) {
  if (!msg) return null;
  const isOk = msg.type === 'success';
  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${isOk ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-600 bg-red-50 border border-red-200'}`}>
      {isOk ? <Check size={14} /> : <AlertCircle size={14} />}
      {msg.text}
    </div>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-blue-500">{icon}</span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const UserSettingsPage: React.FC = () => {
  const { user: authUser } = useAuth();

  const [profile, setProfile]       = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Load profile ──
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/profile');
      setProfile(res.data?.user ?? null);
    } catch {
      // Fallback to secure-auth/profile
      try {
        const res2 = await api.get('/secure-auth/profile');
        setProfile(res2.data?.user ?? null);
      } catch { /* silent */ }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Identity summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <UserCircle size={28} className="text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {profile?.first_name
              ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
              : authUser?.username}
          </p>
          <p className="text-sm text-gray-500 truncate">{profile?.email ?? authUser?.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {profile?.trust_level && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize border border-blue-100">
                {profile.trust_level}
              </span>
            )}
            {profile?.created_at && (
              <span className="text-xs text-gray-400">
                Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {profileLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <ProfileDetailsPanel profile={profile} onSaved={loadProfile} />
          <ChangePasswordPanel />
          <AnonHandlePanel profile={profile} onSaved={loadProfile} />
          <SecondaryEmailPanel profile={profile} onSaved={loadProfile} />
          <SessionsPanel />
        </>
      )}
    </div>
  );
};

// ─── Panel: Profile Details ───────────────────────────────────────────────────

const ProfileDetailsPanel: React.FC<{ profile: ProfileData | null; onSaved: () => void }> = ({ profile, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<MsgState>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [forumsAnon, setForumsAnon]     = useState(false);
  const [incidentsAnon, setIncidentsAnon] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setPhone(profile.phone_number ?? '');
      setForumsAnon(profile.forums_default_anonymous);
      setIncidentsAnon(profile.incidents_always_anonymous);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/profile', {
        first_name: firstName.trim() || null,
        last_name:  lastName.trim()  || null,
        phone_number: phone.trim()   || null,
        forums_default_anonymous:   forumsAnon,
        incidents_always_anonymous: incidentsAnon,
      });
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
      onSaved();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const ReadRow = ({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-36">{label}</span>
      <div className="flex items-center gap-2 min-w-0 flex-wrap justify-end">
        <span className="text-sm text-gray-800 font-medium truncate">{value ?? <span className="text-gray-400 italic">Not set</span>}</span>
        {badge}
      </div>
    </div>
  );

  return (
    <SectionCard title="Profile Details" icon={<UserCircle size={18} />}>
      {/* Read-only fields */}
      <div className="space-y-0">
        <ReadRow label="Email" value={profile?.email} badge={<StatusBadge ok={profile?.email_verified ?? false} />} />
        <ReadRow label="GSTN" value={profile?.gstn} badge={<span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Locked</span>} />
        <ReadRow label="Username" value={profile?.username} />
        <ReadRow label="Trust Level" value={<span className="capitalize">{profile?.trust_level}</span>} />
        <ReadRow label="Status" value={<span className="capitalize">{profile?.registration_status?.replace('_', ' ')}</span>} />
      </div>

      <hr className="border-gray-100" />

      {/* Editable fields */}
      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">First Name</label>
              <input
                type="text" value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Last Name</label>
              <input
                type="text" value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Phone Number</label>
            <input
              type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10-digit Indian mobile number"
            />
          </div>

          {/* Anon toggles */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" checked={forumsAnon}
                onChange={e => setForumsAnon(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">
                <span className="font-medium text-gray-800">Default to anonymous in forums</span>
                <span className="block text-gray-500 text-xs mt-0.5">Forum posts will default to anonymous. You can override per post.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" checked={incidentsAnon}
                onChange={e => setIncidentsAnon(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">
                <span className="font-medium text-gray-800">Always submit incidents anonymously</span>
                <span className="block text-gray-500 text-xs mt-0.5">Your identity will never be attached to incident reports.</span>
              </span>
            </label>
          </div>

          <InlineMsg msg={msg} />

          <div className="flex gap-3">
            <Button type="submit" isLoading={saving}>Save Changes</Button>
            <button type="button" onClick={() => { setEditing(false); setMsg(null); }}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-0">
          <ReadRow label="First Name" value={profile?.first_name} />
          <ReadRow label="Last Name"  value={profile?.last_name} />
          <ReadRow label="Phone"      value={profile?.phone_number} />
          <ReadRow label="Forum anonymous"    value={profile?.forums_default_anonymous ? 'Yes' : 'No'} />
          <ReadRow label="Incidents anonymous" value={profile?.incidents_always_anonymous ? 'Yes' : 'No'} />

          <InlineMsg msg={msg} />

          <div className="pt-3">
            <button onClick={() => { setEditing(true); setMsg(null); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Edit details <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ─── Panel: Change Password ───────────────────────────────────────────────────

const ChangePasswordPanel: React.FC = () => {
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState<MsgState>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPw !== confirmPw) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/profile/change-password', {
        current_password:     currentPw,
        new_password:         newPw,
        confirm_new_password: confirmPw,
      });
      setMsg({ type: 'success', text: 'Password changed. Other devices will be logged out.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  const PwField = ({ label, value, onChange, show, onToggle, placeholder }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; placeholder?: string;
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <SectionCard title="Change Password" icon={<Lock size={18} />}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <PwField label="Current Password" value={currentPw} onChange={setCurrentPw}
          show={showCur} onToggle={() => setShowCur(p => !p)} placeholder="Your current password" />
        <PwField label="New Password" value={newPw} onChange={setNewPw}
          show={showNew} onToggle={() => setShowNew(p => !p)} placeholder="Min 8 chars, upper + lower + number" />
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Confirm New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <InlineMsg msg={msg} />

        <Button type="submit" isLoading={saving}
          disabled={!currentPw || !newPw || !confirmPw}>
          Update Password
        </Button>
      </form>
    </SectionCard>
  );
};

// ─── Panel: Anonymous Handle ──────────────────────────────────────────────────

const AnonHandlePanel: React.FC<{ profile: ProfileData | null; onSaved: () => void }> = ({ profile, onSaved }) => {
  const [handle,  setHandle]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<MsgState>(null);

  useEffect(() => {
    if (profile?.forum_anon_handle) setHandle(profile.forum_anon_handle);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const result = await forumService.setAnonHandle(handle.trim());
      setHandle(result.forum_anon_handle);
      setMsg({ type: 'success', text: 'Anonymous handle saved.' });
      onSaved();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Failed to save handle.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Anonymous Forum Handle" icon={<AtSign size={18} />}>
      <p className="text-sm text-gray-500">
        A pseudonym used when you post anonymously on the forum. Must be unique across all members.
      </p>

      {profile?.forum_anon_handle && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Check size={14} />Current: <span className="font-semibold">@{profile.forum_anon_handle}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
          <input
            type="text" value={handle}
            onChange={e => { setHandle(e.target.value); setMsg(null); }}
            placeholder="your-anon-handle" maxLength={40} minLength={3}
            className="w-full text-sm border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-400">3–40 characters. Letters, numbers, underscores, dots, and hyphens only.</p>
        <InlineMsg msg={msg} />
        <Button type="submit" isLoading={saving}
          disabled={!handle.trim() || handle.trim().length < 3}>
          {profile?.forum_anon_handle ? 'Update Handle' : 'Set Handle'}
        </Button>
      </form>
    </SectionCard>
  );
};

// ─── Panel: Secondary Email ───────────────────────────────────────────────────

const SecondaryEmailPanel: React.FC<{ profile: ProfileData | null; onSaved: () => void }> = ({ profile, onSaved }) => {
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState<'form' | 'verify'>('form');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<MsgState>(null);

  useEffect(() => {
    if (profile?.secondary_email) setEmail(profile.secondary_email);
    // If secondary email exists but not verified, jump to OTP step
    if (profile?.secondary_email && !profile.secondary_email_verified) {
      setStep('verify');
    }
  }, [profile]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.post('/profile/secondary-email', { secondary_email: email.trim() });
      setStep('verify');
      setMsg({ type: 'success', text: 'OTP sent! Check your secondary email inbox.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Failed to send OTP.' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.post('/profile/secondary-email/verify', { otp: otp.trim() });
      setMsg({ type: 'success', text: 'Secondary email verified successfully.' });
      onSaved();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Verification failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Secondary Email" icon={<Mail size={18} />}>
      <p className="text-sm text-gray-500">
        Add a secondary email as a backup. This will also be used to enable primary email changes in the future.
      </p>

      {/* Existing verified secondary email */}
      {profile?.secondary_email && profile.secondary_email_verified && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-gray-800">{profile.secondary_email}</p>
          </div>
          <StatusBadge ok={true} trueLabel="Verified" />
        </div>
      )}

      {step === 'form' || (profile?.secondary_email && profile.secondary_email_verified) ? (
        <form onSubmit={handleSendOTP} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              {profile?.secondary_email && profile.secondary_email_verified ? 'Change Secondary Email' : 'Secondary Email Address'}
            </label>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setMsg(null); }}
              placeholder="you@example.com"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <InlineMsg msg={msg} />
          <Button type="submit" isLoading={saving} disabled={!email.trim()}>
            {profile?.secondary_email ? 'Update & Verify' : 'Send Verification OTP'}
          </Button>
        </form>
      ) : (
        // OTP verification step
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-blue-800">
            OTP sent to <span className="font-medium">{email || profile?.secondary_email}</span>. Check your inbox.
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Enter OTP</label>
            <input
              type="text" value={otp}
              onChange={e => { setOtp(e.target.value); setMsg(null); }}
              placeholder="6-digit OTP" maxLength={6}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-mono"
              required
            />
          </div>
          <InlineMsg msg={msg} />
          <div className="flex gap-3">
            <Button type="submit" isLoading={saving} disabled={otp.trim().length < 6}>
              Verify OTP
            </Button>
            <button type="button"
              onClick={() => { setStep('form'); setMsg(null); setOtp(''); }}
              className="text-sm px-3 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-1 transition-colors">
              <RefreshCw size={13} /> Resend
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
};

// ─── Panel: Sessions ──────────────────────────────────────────────────────────

const SessionsPanel: React.FC = () => {
  const [sessions,  setSessions]  = useState<SessionData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [revoking,  setRevoking]  = useState<number | 'all' | null>(null);
  const [msg,       setMsg]       = useState<MsgState>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile/sessions');
      setSessions(res.data?.sessions ?? []);
    } catch { /* silent — sessions table may not exist yet */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const revokeAll = async () => {
    setRevoking('all'); setMsg(null);
    try {
      await api.delete('/profile/sessions');
      setMsg({ type: 'success', text: 'All other sessions logged out.' });
      loadSessions();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Failed to revoke sessions.' });
    } finally {
      setRevoking(null);
    }
  };

  const revokeOne = async (id: number) => {
    setRevoking(id); setMsg(null);
    try {
      await api.delete(`/profile/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error ?? 'Failed to revoke session.' });
    } finally {
      setRevoking(null);
    }
  };

  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <SectionCard title="Active Sessions" icon={<Shield size={18} />}>
      <p className="text-sm text-gray-500">
        Devices currently logged into your account. Revoke any session you don't recognise.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No session data available.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const { icon, label } = parseDevice(session.user_agent);
            return (
              <div key={session.id}
                className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-3 ${
                  session.is_current ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}>
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-0.5 shrink-0 ${session.is_current ? 'text-blue-500' : 'text-gray-400'}`}>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
                      {session.is_current && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {session.ip_address ? `IP: ${session.ip_address} · ` : ''}
                      Last active: {formatDate(session.last_used_at)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Signed in: {formatDate(session.created_at)}
                    </p>
                  </div>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() => revokeOne(session.id)}
                    disabled={revoking === session.id}
                    className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-1 transition-colors mt-0.5">
                    {revoking === session.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <InlineMsg msg={msg} />

      {otherSessions.length > 1 && (
        <Button
          onClick={revokeAll}
          isLoading={revoking === 'all'}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut size={15} />
          Log out all other devices ({otherSessions.length})
        </Button>
      )}
    </SectionCard>
  );
};

export default UserSettingsPage;
