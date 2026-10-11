import { useEffect, useState, type FormEvent } from 'react';
import { supabase, type Category, DEFAULT_CATEGORIES } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatMonthKey, getMonthKeys, monthLabel } from '@/lib/format';
import {
  User,
  Lock,
  DollarSign,
  Tags,
  CalendarDays,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const CURRENCIES = ['$', '€', '£', '₹', '¥', '₩', '₽', '₺', 'A$', 'C$'];

export default function Settings() {
  const { session, profile, refreshProfile } = useAuth();

  // Profile section
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Currency
  const [currency, setCurrency] = useState('$');
  const [currencyMsg, setCurrencyMsg] = useState('');

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Default month
  const [defaultMonth, setDefaultMonth] = useState('current');
  const [monthMsg, setMonthMsg] = useState('');

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const monthKeys = getMonthKeys();

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name);
      setProfileEmail(profile.email);
      setCurrency(profile.currency);
      setDefaultMonth(profile.default_month);
    }
  }, [profile]);

  const fetchCategories = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');
    setCategories((data as Category[]) || []);
  };

  useEffect(() => {
    fetchCategories();
  }, [session?.user?.id]);

  // --- Profile update ---
  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileMsg('');
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError('Name and email cannot be empty.');
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: profileName.trim(), email: profileEmail.trim() })
      .eq('id', session!.user.id);
    setSavingProfile(false);
    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileMsg('Profile updated successfully.');
    refreshProfile();
    setTimeout(() => setProfileMsg(''), 3000);
  };

  // --- Password change ---
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session!.user.email!,
      password: currentPassword,
    });
    if (signInError) {
      setSavingPassword(false);
      setPasswordError('Current password is incorrect.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }
    setPasswordMsg('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  // --- Currency change ---
  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    await supabase.from('profiles').update({ currency: value }).eq('id', session!.user.id);
    setCurrencyMsg('Currency updated.');
    refreshProfile();
    setTimeout(() => setCurrencyMsg(''), 2000);
  };

  // --- Default month change ---
  const handleDefaultMonthChange = async (value: string) => {
    setDefaultMonth(value);
    await supabase.from('profiles').update({ default_month: value }).eq('id', session!.user.id);
    setMonthMsg('Default month updated.');
    refreshProfile();
    setTimeout(() => setMonthMsg(''), 2000);
  };

  // --- Category management ---
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCategory.trim()) return;
    if (categories.some((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      setCategoryError('A category with this name already exists.');
      return;
    }
    await supabase.from('categories').insert({ name: newCategory.trim() });
    setNewCategory('');
    fetchCategories();
  };

  const handleRenameCategory = async (id: string) => {
    if (!editName.trim()) return;
    if (categories.some((c) => c.name.toLowerCase() === editName.trim().toLowerCase() && c.id !== id)) {
      setCategoryError('A category with this name already exists.');
      return;
    }
    await supabase.from('categories').update({ name: editName.trim() }).eq('id', id);
    setEditingId(null);
    setEditName('');
    setCategoryError('');
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  // --- Delete account ---
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    await supabase.from('transactions').delete().eq('user_id', session!.user.id);
    await supabase.from('categories').delete().eq('user_id', session!.user.id);
    await supabase.from('profiles').delete().eq('id', session!.user.id);
    await supabase.auth.signOut();
    setDeletingAccount(false);
  };

  const isDefaultCategory = (name: string) => DEFAULT_CATEGORIES.includes(name);

  const SectionCard = ({ icon: Icon, title, description, children }: {
    icon: typeof User;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <SectionCard icon={User} title="Profile" description="Update your name and email">
        {profileMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3">
            <CheckCircle className="w-4 h-4" />
            {profileMsg}
          </div>
        )}
        {profileError && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3">{profileError}</div>
        )}
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition text-sm shadow-sm shadow-emerald-200"
          >
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard icon={Lock} title="Password" description="Change your password">
        {passwordMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3">
            <CheckCircle className="w-4 h-4" />
            {passwordMsg}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3">{passwordError}</div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition text-sm shadow-sm shadow-emerald-200"
          >
            {savingPassword ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </SectionCard>

      {/* Currency */}
      <SectionCard icon={DollarSign} title="Currency" description="Choose the currency symbol used across the app">
        {currencyMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3">
            <CheckCircle className="w-4 h-4" />
            {currencyMsg}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCurrencyChange(c)}
              className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition ${
                currency === c
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Default month */}
      <SectionCard icon={CalendarDays} title="Default month" description="Which month the dashboard opens to">
        {monthMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3">
            <CheckCircle className="w-4 h-4" />
            {monthMsg}
          </div>
        )}
        <select
          value={defaultMonth}
          onChange={(e) => handleDefaultMonthChange(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800 bg-white"
        >
          <option value="current">Current month</option>
          {monthKeys.map((key) => (
            <option key={key} value={key}>{monthLabel(key)}</option>
          ))}
        </select>
      </SectionCard>

      {/* Categories */}
      <SectionCard icon={Tags} title="Categories" description="Add, rename, or delete your transaction categories">
        {categoryError && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3">{categoryError}</div>
        )}
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
            placeholder="New category name"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 border border-slate-100"
            >
              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameCategory(cat.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none text-sm text-slate-800"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRenameCategory(cat.id)}
                    className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditName('');
                      setCategoryError('');
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-700">{cat.name}</span>
                  {isDefaultCategory(cat.name) && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Default</span>
                  )}
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Delete account */}
      <div className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Delete account</h2>
            <p className="text-xs text-slate-400">Permanently delete your account and all data</p>
          </div>
        </div>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition text-sm"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-4">
              This will permanently delete all your transactions, categories, and account.
              This action cannot be undone. Type <strong>DELETE</strong> below to confirm.
            </div>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition text-slate-800"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteText('');
                }}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deletingAccount}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-medium rounded-lg transition text-sm"
              >
                {deletingAccount ? 'Deleting...' : 'Permanently delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
