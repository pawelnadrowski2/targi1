import React, { useState, useEffect } from 'react';
import { AppView, TradeOrder, WinnerContext, UserSession, ExhibitorAccount } from './types';
import { ExhibitorForm } from './components/ExhibitorForm';
import { AdminDashboard } from './components/AdminDashboard';
import { LotteryWheel } from './components/LotteryWheel';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { generateCongratulationMessage } from './services/geminiService';
import { Gift, ArrowLeft, PartyPopper, X, LogOut, Store } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [exhibitors, setExhibitors] = useState<ExhibitorAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [lastWinnerContext, setLastWinnerContext] = useState<WinnerContext | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  
  // Admin Settings State
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const LOGO_URL = "https://hurt.hasta.pl/themes/appwise-nowy-20190822135112/assets/img/logo.png";

  // Monitor Online Status for Intranet Mode (Just for UI info in Dashboard)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('fairLotteryData');
    if (storedData) {
      setOrders(JSON.parse(storedData));
    }
    const storedExhibitors = localStorage.getItem('fairLotteryExhibitors');
    if (storedExhibitors) {
      setExhibitors(JSON.parse(storedExhibitors));
    }
    const storedAdminPass = localStorage.getItem('fairLotteryAdminPass');
    if (storedAdminPass) {
      setAdminPassword(storedAdminPass);
    }
  }, []);

  // Persist data whenever state changes
  useEffect(() => {
    localStorage.setItem('fairLotteryData', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('fairLotteryExhibitors', JSON.stringify(exhibitors));
  }, [exhibitors]);

  useEffect(() => {
    localStorage.setItem('fairLotteryAdminPass', adminPassword);
  }, [adminPassword]);

  const handleLogin = (session: UserSession) => {
    setCurrentUser(session);
    if (session.role === 'ADMIN' || session.role === 'SUPERUSER') {
      setCurrentView(AppView.ADMIN);
    } else {
      setCurrentView(AppView.EXHIBITOR);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.LANDING);
  };

  // --- Admin Functions ---
  const handleAddExhibitor = (name: string) => {
    // Generate a random 6 character code (e.g., "AB-123")
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length));
    const suffix = Math.floor(100 + Math.random() * 900); // 3 digits
    const accessCode = `${prefix}-${suffix}`;

    const newExhibitor: ExhibitorAccount = {
      id: crypto.randomUUID(),
      name,
      accessCode
    };
    setExhibitors(prev => [...prev, newExhibitor]);
  };

  const handleRemoveExhibitor = (id: string) => {
    setExhibitors(prev => prev.filter(ex => ex.id !== id));
  };

  // Backup Functionality
  const handleExportBackup = () => {
    const backupData = {
      timestamp: Date.now(),
      version: '1.0',
      systemName: 'TARGI HASta',
      data: {
        orders,
        exhibitors,
        adminPassword
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `targi_hasta_backup_${new Date().toISOString().slice(0,19).replace(/:/g, "-")}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed.systemName === 'TARGI HASta' && parsed.data) {
          if (window.confirm(`Czy na pewno chcesz przywrócić kopię z dnia ${new Date(parsed.timestamp).toLocaleString()}? Obecne dane zostaną nadpisane.`)) {
            if (parsed.data.orders) setOrders(parsed.data.orders);
            if (parsed.data.exhibitors) setExhibitors(parsed.data.exhibitors);
            if (parsed.data.adminPassword) setAdminPassword(parsed.data.adminPassword);
            alert("Pomyślnie przywrócono dane z kopii zapasowej.");
          }
        } else {
          alert("Nieprawidłowy format pliku kopii zapasowej.");
        }
      } catch (error) {
        console.error(error);
        alert("Błąd podczas odczytu pliku. Upewnij się, że to poprawny plik JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    // Automatic backup before clearing
    const confirmClear = window.confirm("Czy na pewno chcesz usunąć WSZYSTKIE dane? \n\nSystem AUTOMATYCZNIE pobierze kopię zapasową przed usunięciem.");
    
    if (confirmClear) {
      handleExportBackup();
      
      // Small delay to allow download to start
      setTimeout(() => {
        setOrders([]);
        localStorage.setItem('fairLotteryData', JSON.stringify([]));
        alert("Baza zamówień została wyczyszczona.");
      }, 1000);
    }
  };

  const handleChangeAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
  };
  
  // -----------------------

  const handleAddOrder = (clientName: string, orderValue: number): TradeOrder => {
    const count = orders.length + 1;
    const ticketSuffix = Math.floor(1000 + Math.random() * 9000); 
    const ticketNumber = `#${count.toString().padStart(3, '0')}-${ticketSuffix}`;

    const newOrder: TradeOrder = {
      id: crypto.randomUUID(),
      clientName,
      orderValue,
      ticketNumber,
      createdAt: Date.now(),
      isWinner: false,
      createdBy: currentUser?.name,
      exhibitorId: currentUser?.id
    };

    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const handleWinnerSelected = async (winner: TradeOrder) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF0000', '#FFFFFF']
    });

    setLoadingMessage(true);
    const updatedOrders = orders.map(o => o.id === winner.id ? { ...o, isWinner: true } : o);
    setOrders(updatedOrders);

    // Always use offline templates generator
    const message = await generateCongratulationMessage(winner);
    
    setLastWinnerContext({
      winner,
      congratulationMessage: message
    });
    setLoadingMessage(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.LANDING:
        return <LandingPage onNavigate={setCurrentView} logoUrl={LOGO_URL} />;
      
      case AppView.LOGIN_ADMIN:
      case AppView.LOGIN_EXHIBITOR:
        return (
          <LoginPage 
            view={currentView} 
            exhibitors={exhibitors}
            onLogin={handleLogin}
            onBack={() => setCurrentView(AppView.LANDING)}
            adminPassword={adminPassword}
            logoUrl={LOGO_URL}
          />
        );

      case AppView.EXHIBITOR:
        if (!currentUser || currentUser.role !== 'EXHIBITOR') return <LandingPage onNavigate={setCurrentView} logoUrl={LOGO_URL} />;
        const exhibitorOrders = orders.filter(o => o.exhibitorId === currentUser.id);
        return (
            <ExhibitorForm 
                onAddOrder={handleAddOrder} 
                exhibitorName={currentUser.name} 
                orders={exhibitorOrders}
            />
        );
      
      case AppView.ADMIN:
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERUSER')) return <LandingPage onNavigate={setCurrentView} logoUrl={LOGO_URL} />;
        return (
          <AdminDashboard 
            orders={orders} 
            exhibitors={exhibitors}
            onClearData={handleClearData} 
            onChangeView={setCurrentView}
            onAddExhibitor={handleAddExhibitor}
            onRemoveExhibitor={handleRemoveExhibitor}
            onChangePassword={handleChangeAdminPassword}
            isSuperuser={currentUser.role === 'SUPERUSER'}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            isOnline={isOnline}
          />
        );
      
      case AppView.LOTTERY:
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERUSER')) return <LandingPage onNavigate={setCurrentView} logoUrl={LOGO_URL} />;
        const candidates = orders.filter(o => !o.isWinner);
        return (
          <div className="flex flex-col items-center justify-center py-12 w-full relative">
             <button 
                onClick={() => setCurrentView(AppView.ADMIN)}
                className="absolute top-0 left-4 px-4 py-2 bg-white text-slate-600 rounded-lg shadow hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"
             >
                <ArrowLeft size={16} />
                Powrót
             </button>

             <div className="mb-8">
               <img src={LOGO_URL} alt="HASta Logo" className="h-24 md:h-32 object-contain drop-shadow-lg" />
             </div>
             
             <div className="bg-slate-900/5 rounded-[3rem] p-12 backdrop-blur-sm border border-white/20 shadow-2xl">
                <LotteryWheel 
                  candidates={candidates} 
                  onWinnerSelected={handleWinnerSelected} 
                  logoUrl={LOGO_URL}
                />
             </div>

             {/* Winner Modal Overlay */}
             {lastWinnerContext && (
               <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                 <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative">
                    <button 
                      onClick={() => setLastWinnerContext(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                        <PartyPopper className="mx-auto text-white mb-4 drop-shadow-md" size={64} />
                        <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight drop-shadow-md">
                          Mamy Zwycięzcę!
                        </h3>
                    </div>

                    <div className="p-8 text-center space-y-6">
                       <div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Wygrywający Bilet</p>
                          <p className="text-4xl font-mono font-black text-slate-800">{lastWinnerContext.winner.ticketNumber}</p>
                       </div>
                       
                       <div className="py-4 border-t border-b border-slate-100">
                          <p className="text-2xl font-bold text-indigo-900">{lastWinnerContext.winner.clientName}</p>
                          <div className="mt-4 flex flex-col items-center justify-center bg-green-50 p-3 rounded-xl border border-green-100">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Store size={12} /> Zwycięskie zamówienie u dostawcy
                            </span>
                            <p className="text-xl font-black text-green-700">
                               {lastWinnerContext.winner.createdBy || 'Nieznany'}
                            </p>
                          </div>
                       </div>

                       <div className="bg-indigo-50 rounded-xl p-6 relative">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                             Gratulacje
                          </div>
                          {loadingMessage ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            </div>
                          ) : (
                            <p className="text-indigo-800 italic text-lg leading-relaxed">
                              "{lastWinnerContext.congratulationMessage}"
                            </p>
                          )}
                       </div>
                       
                       <button
                        onClick={() => setLastWinnerContext(null)}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                       >
                         Dziękuję, graj dalej!
                       </button>
                    </div>
                 </div>
               </div>
             )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => currentUser ? null : setCurrentView(AppView.LANDING)}>
              <img src={LOGO_URL} alt="HASta Logo" className="h-10 object-contain" />
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-500 hidden sm:block text-right">
                  <div className="text-xs uppercase tracking-wider">Zalogowano jako</div>
                  <div className="font-bold text-slate-800">
                     {currentUser.name} 
                     {currentUser.role === 'SUPERUSER' && <span className="ml-1 text-red-500 font-black">(ROOT)</span>}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition-colors shadow-md"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Wyloguj</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col relative">
        <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-grow flex flex-col">
          {renderContent()}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
         <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center justify-center gap-2">
            <img src={LOGO_URL} alt="HASta Logo Footer" className="h-6 opacity-50 grayscale" />
            <p className="text-slate-400 text-xs">
             &copy; {new Date().getFullYear()} TARGI HASta. Wszelkie prawa zastrzeżone.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;