import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Mail, Lock, User, AlertCircle } from 'lucide-react';

type Props = {
  onSuccess: () => void;
  onSwitch: () => void;
};

export default function SignUp({ onSuccess, onSwitch }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
      });
      const { error: catError } = await supabase.from('categories').insert(
        ['Food', 'Rent', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Other'].map((c) => ({
          name: c,
        }))
      );
      if (catError) console.error('Category seed error:', catError.message);
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-3">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start managing your finances today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition shadow-sm shadow-emerald-200"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button onClick={onSwitch} className="text-emerald-600 hover:text-emerald-700 font-medium">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
