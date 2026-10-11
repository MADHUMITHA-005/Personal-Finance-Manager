import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Settings from '@/pages/Settings';

type Page = 'dashboard' | 'transactions' | 'settings';

function AppContent() {
  const { session, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (authView === 'login') {
      return <Login onSuccess={() => {}} onSwitch={() => setAuthView('signup')} />;
    }
    return <SignUp onSuccess={() => setAuthView('login')} onSwitch={() => setAuthView('login')} />;
  }

  return (
    <AppLayout current={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={(p) => setPage(p)} />}
      {page === 'transactions' && <Transactions />}
      {page === 'settings' && <Settings />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
