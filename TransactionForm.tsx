import { useState, useEffect, type FormEvent } from 'react';
import { supabase, type Transaction, type Category } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
  onSaved: () => void;
};

export default function TransactionForm({ open, onClose, editing, onSaved }: Props) {
  const { session } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setDescription(editing.description);
      setAmount(Math.abs(editing.amount).toFixed(2));
      setCategory(editing.category);
      setDate(editing.date);
      setType(editing.amount >= 0 ? 'income' : 'expense');
    } else {
      setDescription('');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().slice(0, 10));
      setType('expense');
    }
    setError('');
  }, [editing, open]);

  useEffect(() => {
    if (open && session?.user?.id) {
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')
        .then(({ data }) => setCategories(data as Category[] || []));
    }
  }, [open, session]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    const signedAmount = type === 'expense' ? -parsedAmount : parsedAmount;
    setLoading(true);

    if (editing) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          description: description.trim(),
          amount: signedAmount,
          category,
          date,
        })
        .eq('id', editing.id);
      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('transactions').insert({
        description: description.trim(),
        amount: signedAmount,
        category,
        date,
      });
      setLoading(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? 'Edit transaction' : 'Add transaction'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                type === 'expense'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
              placeholder="Grocery shopping"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition shadow-sm shadow-emerald-200"
          >
            {loading ? 'Saving...' : editing ? 'Save changes' : 'Add transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
