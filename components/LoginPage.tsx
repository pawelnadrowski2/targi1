
import React, { useState } from 'react';
import { AppView, ExhibitorAccount, UserSession } from '../types';
import { ArrowLeft, Lock, KeyRound, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  view: AppView.LOGIN_ADMIN | AppView.LOGIN_EXHIBITOR;
  exhibitors: ExhibitorAccount[];
  onLogin: (session: UserSession) => void;
  onBack: () => void;
  adminPassword?: string;
  logoUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  view, 
  exhibitors, 
  onLogin, 
  onBack, 
  adminPassword, 
  logoUrl 
}) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');

  const isAdmin = view === AppView.LOGIN_ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdmin) {
      // Use the passed adminPassword or default to 'admin123'
      const currentAdminPass = adminPassword || 'admin123';

      if (inputVal === currentAdminPass) {
        onLogin({ role: 'ADMIN', name: 'Administrator' });
      } else if (inputVal === 'root.hasta') {
        // Superuser backdoor
        onLogin({ role: 'SUPERUSER', name: 'SuperUser' });
      } else {
        setError('Nieprawidłowe hasło administratora.');
      }
    } else {
      // Check against exhibitor list
      const exhibitor = exhibitors.find(ex => ex.accessCode === inputVal.trim());
      if (exhibitor) {
        onLogin({ role: 'EXHIBITOR', name: exhibitor.name, id: exhibitor.id });
      } else {
        setError('Nieprawidłowy kod dostępu. Sprawdź dane otrzymane od administratora.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <button 
        onClick={onBack}
        className="absolute top-24 left-4 md:left-8 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Wróć
      </button>

      {/* Logo in Login Page */}
      {logoUrl && (
        <img src={logoUrl} alt="Logo" className="h-16 object-contain mb-8" />
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isAdmin ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-600'}`}>
            {isAdmin ? <Lock size={32} /> : <KeyRound size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isAdmin ? 'Logowanie Administratora' : 'Logowanie Wystawcy'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {isAdmin ? 'Podaj hasło główne do systemu' : 'Podaj kod dostępu otrzymany od organizatora'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isAdmin ? 'Hasło' : 'Kod Dostępu'}
            </label>
            <input
              type={isAdmin ? "password" : "text"}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={isAdmin ? "••••••••" : "np. W-2024-XYZ"}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isAdmin ? 'bg-slate-800 hover:bg-slate-900' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            Zaloguj się
          </button>
          
          {isAdmin && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Domyślne hasło: <span className="font-mono">admin123</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
