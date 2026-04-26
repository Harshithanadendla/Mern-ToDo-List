import { useState, useEffect } from 'react';
import { Plus, Search, LogOut, CheckSquare, Bell, Import as SortAsc, ListTodo, CheckCheck, Clock, CalendarDays, Layers, BellOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTodos, FilterType, SortType } from '../hooks/useTodos';
import { Todo } from '../lib/supabase';
import TodoItem from './TodoItem';
import TodoModal from './TodoModal';

const FILTERS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Layers className="w-4 h-4" /> },
  { value: 'active', label: 'Active', icon: <ListTodo className="w-4 h-4" /> },
  { value: 'today', label: 'Today', icon: <CalendarDays className="w-4 h-4" /> },
  { value: 'upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4" /> },
  { value: 'completed', label: 'Done', icon: <CheckCheck className="w-4 h-4" /> },
];

const SORTS: { value: SortType; label: string }[] = [
  { value: 'created_at', label: 'Date Added' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const {
    todos, allTodos, loading, filter, setFilter,
    sort, setSort, search, setSearch,
    createTodo, updateTodo, deleteTodo, toggleComplete,
  } = useTodos();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm);
    }
  };

  const activeCount = allTodos.filter(t => !t.completed).length;
  const completedCount = allTodos.filter(t => t.completed).length;
  const overdueCount = allTodos.filter(t =>
    !t.completed && t.due_date && new Date(t.due_date) < new Date()
  ).length;

  const openCreate = () => { setEditingTodo(null); setModalOpen(true); };
  const openEdit = (todo: Todo) => { setEditingTodo(todo); setModalOpen(true); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/25">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            {notifStatus !== 'granted' && (
              <button
                onClick={requestNotifications}
                title="Enable reminders"
                className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all"
              >
                {notifStatus === 'denied' ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </button>
            )}
            <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-white">{activeCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Active</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Completed</div>
          </div>
          <div className={`rounded-xl px-4 py-3 text-center border ${
            overdueCount > 0
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-slate-800/60 border-slate-700/50'
          }`}>
            <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {overdueCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Overdue</div>
          </div>
        </div>

        {/* Search + Create */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors text-sm"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">New Task</span>
          </button>
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  filter === f.value
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SortAsc className="w-4 h-4 text-slate-500" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortType)}
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
            >
              {SORTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">
                {search ? 'No tasks match your search' : filter === 'completed' ? 'No completed tasks yet' : 'No tasks yet'}
              </p>
              {!search && filter === 'all' && (
                <button
                  onClick={openCreate}
                  className="mt-4 text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors"
                >
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleComplete}
                onDelete={deleteTodo}
                onEdit={openEdit}
              />
            ))
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <TodoModal
          todo={editingTodo}
          onClose={() => setModalOpen(false)}
          onCreate={createTodo}
          onUpdate={updateTodo}
        />
      )}
    </div>
  );
}
