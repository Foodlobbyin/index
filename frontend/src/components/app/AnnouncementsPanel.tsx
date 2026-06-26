import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { forumService, Announcement } from '../../services/forumService';
import { useAuth } from '../../contexts/AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a date as "Month YYYY" — used as the group key and header label. */
function monthLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

/** Format a date as "DD Mon YYYY" — used inside an entry. */
function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Group a flat list of announcements into months, newest month first. */
function groupByMonth(items: Announcement[]): { label: string; entries: Announcement[] }[] {
  const map = new Map<string, Announcement[]>();
  for (const item of items) {
    const key = monthLabel(item.posted_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  // Items are already newest-first from the API; groups preserve that order.
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }));
}

// ── Sub-component: single editable entry ─────────────────────────────────────

interface EntryProps {
  entry: Announcement;
  isAdmin: boolean;
  onSave: (id: number, title: string, content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const AnnouncementEntry: React.FC<EntryProps> = ({ entry, isAdmin, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editContent, setEditContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await onSave(entry.id, editTitle.trim(), editContent.trim());
      setEditing(false);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditing(false);
    setErr(null);
  };

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      {/* Timeline dot */}
      <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
      {/* Vertical line — hidden on last child via CSS */}
      <span className="absolute left-[4px] top-4 bottom-0 w-px bg-blue-100 last:hidden" />

      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        {editing ? (
          <div className="space-y-2">
            <input
              value={editTitle}
              onChange={e => { setEditTitle(e.target.value); setErr(null); }}
              className="w-full text-sm font-semibold border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Title"
              maxLength={200}
            />
            <textarea
              value={editContent}
              onChange={e => { setEditContent(e.target.value); setErr(null); }}
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What's new?"
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim() || !editContent.trim()}
                className="flex items-center gap-1 px-3 py-1 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Check size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{shortDate(entry.posted_at)}</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{entry.title}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ── Month group — collapsible ─────────────────────────────────────────────────

interface MonthGroupProps {
  label: string;
  entries: Announcement[];
  defaultOpen: boolean;
  isAdmin: boolean;
  onSave: (id: number, title: string, content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const MonthGroup: React.FC<MonthGroupProps> = ({
  label, entries, defaultOpen, isAdmin, onSave, onDelete,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Month header — clickable to collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
      >
        <span className="text-sm font-bold text-blue-800 tracking-wide uppercase">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-400 font-medium">
            {entries.length} {entries.length === 1 ? 'update' : 'updates'}
          </span>
          {open ? (
            <ChevronUp size={16} className="text-blue-400" />
          ) : (
            <ChevronDown size={16} className="text-blue-400" />
          )}
        </div>
      </button>

      {/* Entries */}
      {open && (
        <div className="px-4 pt-4 pb-2">
          {entries.map(entry => (
            <AnnouncementEntry
              key={entry.id}
              entry={entry}
              isAdmin={isAdmin}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

const AnnouncementsPanel: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.trust_level === 'admin';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);

  // New entry form (admin only)
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState(''); // optional backdating
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    forumService.getAnnouncements()
      .then(data => setAnnouncements(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    setFormErr(null);
    try {
      const entry = await forumService.createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        posted_at: newDate ? new Date(newDate).toISOString() : undefined,
      });
      // Insert at correct position (sort by posted_at desc)
      setAnnouncements(prev =>
        [entry, ...prev].sort(
          (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
        )
      );
      setNewTitle('');
      setNewContent('');
      setNewDate('');
      setShowForm(false);
    } catch (err: any) {
      setFormErr(err?.response?.data?.error ?? 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (id: number, title: string, content: string) => {
    const updated = await forumService.updateAnnouncement(id, { title, content });
    setAnnouncements(prev => prev.map(a => (a.id === id ? updated : a)));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    await forumService.deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const groups = groupByMonth(announcements);

  // Don't render the panel at all if there are no announcements and user is not admin
  if (!loading && announcements.length === 0 && !isAdmin) return null;

  return (
    <div className="border border-amber-200 bg-amber-50/30 rounded-2xl overflow-hidden">
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-50 to-white cursor-pointer"
        onClick={() => setPanelOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <Megaphone size={18} className="text-amber-600" />
          <span className="font-bold text-gray-800 text-base">Platform Announcements</span>
          {announcements.length > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {announcements.length} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); setShowForm(s => !s); setPanelOpen(true); }}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Update
            </button>
          )}
          {panelOpen
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </div>

      {panelOpen && (
        <div className="px-5 pb-5 pt-3 space-y-3">

          {/* Admin: new entry form */}
          {isAdmin && showForm && (
            <form
              onSubmit={handleCreate}
              className="bg-white border border-amber-200 rounded-xl p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                New Announcement
              </p>
              <input
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setFormErr(null); }}
                placeholder="Title (e.g. New feature: Supplier verification)"
                maxLength={200}
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <textarea
                value={newContent}
                onChange={e => { setNewContent(e.target.value); setFormErr(null); }}
                placeholder="What's the update? Be concise."
                rows={3}
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Date <span className="text-gray-400">(optional — defaults to today)</span>
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
              {formErr && <p className="text-xs text-red-600">{formErr}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormErr(null); }}
                  className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-sm text-gray-400 text-center py-4">Loading…</div>
          )}

          {/* Empty state (admin sees this to prompt first post) */}
          {!loading && announcements.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">
              No announcements yet.
              {isAdmin && (
                <span
                  className="ml-1 text-amber-600 cursor-pointer hover:underline"
                  onClick={() => setShowForm(true)}
                >
                  Post the first one.
                </span>
              )}
            </div>
          )}

          {/* Month groups — newest month open by default, rest collapsed */}
          {groups.map((group, idx) => (
            <MonthGroup
              key={group.label}
              label={group.label}
              entries={group.entries}
              defaultOpen={idx === 0}
              isAdmin={isAdmin}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPanel;
