import { useState, useEffect, FormEvent } from 'react';
import { X, Flag, Calendar, Bell, AlignLeft, Type } from 'lucide-react';
import { Todo, Priority } from '../lib/supabase';
import { CreateTodoPayload } from '../hooks/useTodos';

interface Props {
  todo?: Todo | null;
  onClose: () => void;
  onCreate: (payload: CreateTodoPayload) => Promise<{ error: Error | null } | undefined>;
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<{ error: Error | null } | undefined>;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-slate-400 border-slate-600 bg-slate-700/50 data-[selected]:bg-slate-500 data-[selected]:border-slate-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400 border-amber-600/50 bg-amber-500/10 data-[selected]:bg-amber-500/30 data-[selected]:border-amber-400' },
  { value: 'high', label: 'High', color: 'text-red-400 border-red-600/50 bg-red-500/10 data-[selected]:bg-red-500/30 data-[selected]:border-red-400' },
];

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TodoModal({ todo, onClose, onCreate, onUpdate }: Props) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [priority, setPriority] = useState<Priority>(todo?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(toLocalDatetimeValue(todo?.due_date ?? null));
  const [reminderAt, setReminderAt] = useState(toLocalDatetimeValue(todo?.reminder_at ?? null));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null,
    };

    let result;
    if (todo) {
      result = await onUpdate(todo.id, { ...payload, reminder_sent: reminderAt !== toLocalDatetimeValue(todo.reminder_at) ? false : todo.reminder_sent });
    } else {
      result = await onCreate(payload);
    }

    setLoading(false);
    if (result?.error) {
      setError(result.error.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{todo ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
              <Type className="w-3.5 h-3.5" /> Title
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details (optional)"
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
              <Flag className="w-3.5 h-3.5" /> Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                    priority === p.value
                      ? p.value === 'high'
                        ? 'bg-red-500/30 border-red-400 text-red-300'
                        : p.value === 'medium'
                        ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                        : 'bg-slate-500/40 border-slate-400 text-slate-200'
                      : p.value === 'high'
                      ? 'bg-red-500/10 border-red-600/40 text-red-400 hover:border-red-500'
                      : p.value === 'medium'
                      ? 'bg-amber-500/10 border-amber-600/40 text-amber-400 hover:border-amber-500'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date + Reminder */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Bell className="w-3.5 h-3.5" /> Reminder
              </label>
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={e => setReminderAt(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white font-semibold transition-all duration-200 text-sm shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : todo ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
