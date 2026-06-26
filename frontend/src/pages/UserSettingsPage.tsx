import React, { useState, useEffect } from 'react';
import { UserCircle, AtSign, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/forumService';
import Button from '../components/ui/Button';
import api from '../services/api';

const UserSettingsPage: React.FC = () => {
  const { user } = useAuth();

  // ── Anon handle ──────────────────────────────────────────
  const [anonHandle, setAnonHandle] = useState('');
  const [currentHandle, setCurrentHandle] = useState<string | null>(null);
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleMsg, setHandleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load current anon handle from profile
    api.get('/api/secure-auth/profile')
      .then((res) => {
        const h = res.data?.user?.forum_anon_handle ?? res.data?.forum_anon_handle ?? null;
        setCurrentHandle(h);
        if (h) setAnonHandle(h);
      })
      .catch(() => {
        // Try auth/profile fallback
        api.get('/api/auth/profile')
          .then((res) => {
            const h = res.data?.user?.forum_anon_handle ?? res.data?.forum_anon_handle ?? null;
            setCurrentHandle(h);
            if (h) setAnonHandle(h);
          })
          .catch(() => {});
      });
  }, []);

  const handleSaveAnonHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setHandleSaving(true);
    setHandleMsg(null);
    try {
      const result = await forumService.setAnonHandle(anonHandle.trim());
      setCurrentHandle(result.forum_anon_handle);
      setAnonHandle(result.forum_anon_handle);
      setHandleMsg({ type: 'success', text: 'Anonymous handle saved!' });
    } catch (err: any) {
      setHandleMsg({
        type: 'error',
        text: err?.response?.data?.error ?? 'Failed to save handle',
      });
    } finally {
      setHandleSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your forum preferences and account details
        </p>
      </div>

      {/* User info summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <UserCircle size={28} className="text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.first_name || user?.username}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {user?.trust_level && (
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
              {user.trust_level}
            </span>
          )}
        </div>
      </div>

      {/* Anonymous Handle */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AtSign size={20} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-semibold text-gray-900">Anonymous Forum Handle</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose a pseudonym used when you post or reply anonymously on the forum.
              Other members can tag you with this handle. It must be unique across all users.
            </p>
          </div>
        </div>

        {currentHandle && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Check size={14} />
            Current handle: <span className="font-semibold">@{currentHandle}</span>
          </div>
        )}

        <form onSubmit={handleSaveAnonHandle} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <input
              type="text"
              value={anonHandle}
              onChange={(e) => {
                setAnonHandle(e.target.value);
                setHandleMsg(null);
              }}
              placeholder="your-anon-handle"
              maxLength={40}
              minLength={3}
              className="w-full text-sm border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400">
            3–40 characters. Letters, numbers, underscores, dots, and hyphens only.
          </p>

          {handleMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
              handleMsg.type === 'success'
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-600 bg-red-50 border border-red-200'
            }`}>
              {handleMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {handleMsg.text}
            </div>
          )}

          <Button
            type="submit"
            isLoading={handleSaving}
            disabled={!anonHandle.trim() || anonHandle.trim().length < 3}
          >
            {currentHandle ? 'Update Handle' : 'Set Handle'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UserSettingsPage;
