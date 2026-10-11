import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, getMonthKeys, monthLabel, parseMonthKey } from '@/lib/format';
import TransactionForm from '@/components/TransactionForm';
import type { Transaction } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

type Props = {
  onNavigate: (page: 'transactions') => void;
};

export default function Dashboard({ onNavigate }: Props) {
  const { profile, session } = useAuth();
  const currency = profile?.currency || '$';
  const [monthKeys] = useState(() => getMonthKeys());
  const [monthIndex, setMonthIndex] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const selectedKey = monthKeys[monthIndex];

  useEffect(() => {
    if (profile?.default_month && profile.default_month !== 'current') {
      const idx = monthKeys.indexOf(profile.default_month);
      if (idx >= 0) setMonthIndex(idx);
    }
  }, [profile?.default_month]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { year, month } = parseMonthKey(selectedKey);
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endMonth = month + 1;
    const endYear = endMonth > 11 ? year + 1 : year;
    const endMonthStr = endMonth > 11 ? '01' : String(endMonth).padStart(2, '0');
    const endDate = `${endYear}-${endMonthStr}-01`;

    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error.message);
        setTransactions((data as Transaction[]) || []);
        setLoading(false);
      });
  }, [session?.user?.id, selectedKey]);

  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.amount >= 0) {
        income += Number(t.amount);
      } else {
        expenses += Math.abs(Number(t.amount));
        byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(Number(t.amount));
      }
    }
    return { income, expenses, balance: income - expenses, byCategory };
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  const categoryEntries = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategoryAmount = categoryEntries.length > 0 ? categoryEntries[0][1] : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of your finances</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition shadow-sm shadow-emerald-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add transaction
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3">
        <button
          onClick={() => setMonthIndex((i) => Math.min(i + 1, monthKeys.length - 1))}
          disabled={monthIndex >= monthKeys.length - 1}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="font-semibold text-slate-800">{monthLabel(selectedKey)}</span>
        <button
          onClick={() => setMonthIndex((i) => Math.max(i - 1, 0))}
          disabled={monthIndex <= 0}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Income</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.income, currency)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expenses, currency)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Net Balance</span>
          </div>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
            {formatCurrency(summary.balance, currency)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Spending by category</h2>
          {loading ? (
            <p className="text-slate-400 text-sm py-8 text-center">Loading...</p>
          ) : categoryEntries.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No expenses this month</p>
          ) : (
            <div className="space-y-3">
              {categoryEntries.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{cat}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(amount, currency)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent transactions</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {loading ? (
            <p className="text-slate-400 text-sm py-8 text-center">Loading...</p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No transactions yet this month</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                    <p className="text-xs text-slate-400">
                      {t.category} · {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ml-3 ${
                      t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {t.amount >= 0 ? '+' : '-'}
                    {formatCurrency(t.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          // re-trigger fetch by changing the effect dependency
          setMonthIndex((i) => i);
        }}
      />
    </div>
  );
}
