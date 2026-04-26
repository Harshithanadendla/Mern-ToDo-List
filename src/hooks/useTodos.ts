import { useState, useEffect, useCallback } from 'react';
import { supabase, Todo, Priority } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'upcoming';
export type SortType = 'created_at' | 'due_date' | 'priority';

export interface CreateTodoPayload {
  title: string;
  description: string;
  priority: Priority;
  reminder_at: string | null;
  due_date: string | null;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function sortTodos(todos: Todo[], sort: SortType): Todo[] {
  return [...todos].sort((a, b) => {
    if (sort === 'priority') {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    if (sort === 'due_date') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function filterTodos(todos: Todo[], filter: FilterType): Todo[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  switch (filter) {
    case 'active':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    case 'today':
      return todos.filter(t => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= todayStart && d < todayEnd;
      });
    case 'upcoming':
      return todos.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) > now && !t.completed;
      });
    default:
      return todos;
  }
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('created_at');
  const [search, setSearch] = useState('');

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTodos(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Reminder polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const now = new Date().toISOString();
      const { data: dueReminders } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .eq('reminder_sent', false)
        .lte('reminder_at', now);

      if (dueReminders && dueReminders.length > 0) {
        for (const todo of dueReminders) {
          if (Notification.permission === 'granted') {
            new Notification('Todo Reminder', {
              body: todo.title,
              icon: '/vite.svg',
            });
          }
          await supabase
            .from('todos')
            .update({ reminder_sent: true })
            .eq('id', todo.id);
        }
        fetchTodos();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, fetchTodos]);

  const createTodo = async (payload: CreateTodoPayload) => {
    if (!user) return;
    const { error } = await supabase.from('todos').insert({
      ...payload,
      user_id: user.id,
    });
    if (!error) fetchTodos();
    return { error };
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const { error } = await supabase.from('todos').update(updates).eq('id', id);
    if (!error) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
    return { error };
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) setTodos(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  const toggleComplete = (id: string, completed: boolean) =>
    updateTodo(id, { completed: !completed });

  const filtered = filterTodos(
    todos.filter(t =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    ),
    filter
  );

  return {
    todos: sortTodos(filtered, sort),
    allTodos: todos,
    loading,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    refetch: fetchTodos,
  };
}
