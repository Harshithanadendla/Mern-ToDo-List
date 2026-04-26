import { useState } from 'react';
import { Check, Trash2, CreditCard as Edit2, Bell, Calendar, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { Todo } from '../lib/supabase';

interface Props {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

const PRIORITY_STYLES: Record<string, { dot: string; badge: string }> = {
  high: {
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  medium: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  low: {
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays < 0) return `Overdue ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}

function formatReminder(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const priority = PRIORITY_STYLES[todo.priority];
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(todo.id);
  };

  return (
    <div className={`group bg-slate-800/60 border rounded-xl transition-all duration-200 ${
      todo.completed
        ? 'border-slate-700/50 opacity-60'
        : isOverdue
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-slate-700/60 hover:border-slate-600'
    } ${deleting ? 'opacity-0 scale-95' : ''}`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id, todo.completed)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            todo.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-500 hover:border-emerald-500'
          }`}
        >
          {todo.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className={`flex-1 text-sm font-medium leading-snug transition-all ${
              todo.completed ? 'line-through text-slate-500' : 'text-slate-100'
            }`}>
              {todo.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`${priority.dot} w-1.5 h-1.5 rounded-full mt-1`} />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {todo.due_date && (
              <span className={`inline-flex items-center gap-1 text-xs ${
                isOverdue ? 'text-red-400' : 'text-slate-500'
              }`}>
                <Calendar className="w-3 h-3" />
                {formatDate(todo.due_date)}
              </span>
            )}
            {todo.reminder_at && (
              <span className={`inline-flex items-center gap-1 text-xs ${
                todo.reminder_sent ? 'text-slate-600' : 'text-emerald-500/70'
              }`}>
                <Bell className="w-3 h-3" />
                {todo.reminder_sent ? 'Reminded' : formatReminder(todo.reminder_at)}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${priority.badge} capitalize`}>
              <Flag className="w-2.5 h-2.5" />
              {todo.priority}
            </span>
          </div>

          {/* Description */}
          {todo.description && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 mt-1.5 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Less' : 'Details'}
              </button>
              {expanded && (
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed bg-slate-700/30 rounded-lg px-3 py-2">
                  {todo.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(todo)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
