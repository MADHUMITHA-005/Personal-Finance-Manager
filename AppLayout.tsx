import { useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Wallet, LayoutDashboard, ArrowRightLeft, Settings, LogOut, Menu, X } from 'lucide-react';

type Page = 'dashboard' | 'transactions' | 'settings';

type Props = {
  current: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
};

const navItems: { key: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ current, onNavigate, children }: Props) {
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navButton = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const active = current === item.key;
    return (
      <button
        key={item.key}
        onClick={() => {
          onNavigate(item.key);
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition ${
          active
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className="w-5 h-5" />
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800">FinanceFlow</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(navButton)}
        </nav>

        <div className="border-t border-slate-200 pt-3 mt-3">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-slate-700 truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">FinanceFlow</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
          </button>
        </header>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-3 space-y-1">
            {navItems.map(navButton)}
            <div className="border-t border-slate-200 pt-2 mt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition ${
                  active ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
