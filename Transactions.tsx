import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, type Transaction, type Category } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, getMonthKeys, monthLabel, parseMonthKey } from '@/lib/format';
import TransactionForm from '@/components/TransactionForm';
import { Plus, Pencil, Trash2, Filter, Search, AlertTriangle, X } from 'lucide-react';

export default function Transactions() {
  const { profile, session } = useAuth();
  const currency = profile?.currency || '$';
  const monthKeys = useMemo(() => getMonthKeys(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [monthFilter, setMonthFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTransactions = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error(error.message);
    setTransactions((data as Transaction[]) || []);
    setLoading(false);
  }, [session?.user?.id]);

  const fetchCategories = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');
    setCategories((data as Category[]) || []);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const handleEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('transactions').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      console.error(error.message);
      return;
    }
    setDeleteTarget(null);
    fetchTransactions();
  };

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (search.trim() && !t.description.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (monthFilter !== 'all') {
        const { year, month } = parseMonthKey(monthFilter);
        const tDate = new Date(t.date + 'T00:00:00');
        if (tDate.getFullYear() !== year || tDate.getMonth() !== month) return false;
      }
      return true;
    });
  }, [transactions, monthFilter, categoryFilter, search]);

  const hasFilters = monthFilter !== 'all' || categoryFilter !== 'all' || search.trim() !== '';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all your transactions</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition shadow-sm shadow-emerald-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm text-slate-700 bg-white"
            >
              <option value="all">All months</option>
              {monthKeys.map((key) => (
                <option key={key} value={key}>{monthLabel(key)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm text-slate-700 bg-white"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm text-slate-700"
                placeholder="Search description..."
              />
            </div>
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setMonthFilter('all');
              setCategoryFilter('all');
              setSearch('');
            }}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="text-slate-400 text-sm py-12 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No transactions found</p>
            {!hasFilters && (
              <button
                onClick={handleAdd}
                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Add your first transaction
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-4 hover:bg-slate-50 transition"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    t.amount >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                  }`}
                >
                  <span className="text-sm font-bold">
                    {t.amount >= 0 ? (
                      <span className="text-emerald-600">+</span>
                    ) : (
                      <span className="text-red-600">-</span>
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                  <p className="text-xs text-slate-400">
                    {t.category} · {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {t.amount >= 0 ? '+' : '-'}
                  {formatCurrency(t.amount, currency)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-2 rounded-lg hover:bg-slate-200 transition text-slate-400 hover:text-slate-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-2 rounded-lg hover:bg-red-100 transition text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <TransactionForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSaved={() => fetchTransactions()}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Delete transaction?</h3>
              <p className="text-sm text-slate-500 mb-6">
                "{deleteTarget.description}" will be permanently removed.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
