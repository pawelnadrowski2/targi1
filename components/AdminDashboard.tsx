import React, { useState, useMemo, useRef } from 'react';
import { TradeOrder, AppView, ExhibitorAccount } from '../types';
import { Trash2, Gift, Users, DollarSign, Plus, Copy, UserMinus, BarChart3, PieChart, Download, Settings, KeyRound, AlertTriangle, Upload, Database, FileSpreadsheet, Globe, SignalHigh, SignalLow } from 'lucide-react';

interface AdminDashboardProps {
  orders: TradeOrder[];
  exhibitors: ExhibitorAccount[];
  onClearData: () => void;
  onChangeView: (view: AppView) => void;
  onAddExhibitor: (name: string) => void;
  onRemoveExhibitor: (id: string) => void;
  onChangePassword: (newPass: string) => void;
  isSuperuser: boolean;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  isOnline: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, 
  exhibitors,
  onClearData, 
  onChangeView,
  onAddExhibitor,
  onRemoveExhibitor,
  onChangePassword,
  isSuperuser,
  onExportBackup,
  onImportBackup,
  isOnline
}) => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'ACCESS' | 'REPORTS' | 'SETTINGS'>('ORDERS');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Exhibitor creation state
  const [newExhibitorName, setNewExhibitorName] = useState('');
  
  // Settings state
  const [passInput1, setPassInput1] = useState('');
  const [passInput2, setPassInput2] = useState('');
  const [passMessage, setPassMessage] = useState('');

  // Stats
  const totalValue = orders.reduce((acc, curr) => acc + curr.orderValue, 0);
  const eligibleCount = orders.filter(o => !o.isWinner).length;

  const filteredOrders = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.createdBy && o.createdBy.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculations for Reports
  const exhibitorStats = useMemo(() => {
    const acc: Record<string, { count: number, value: number }> = {};
    orders.forEach(o => {
        const name = o.createdBy || 'Nieznany';
        if (!acc[name]) acc[name] = { count: 0, value: 0 };
        acc[name].count++;
        acc[name].value += o.orderValue;
    });
    return Object.entries(acc)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const clientStats = useMemo(() => {
    const acc: Record<string, { count: number, value: number }> = {};
    orders.forEach(o => {
        const name = o.clientName;
        if (!acc[name]) acc[name] = { count: 0, value: 0 };
        acc[name].count++;
        acc[name].value += o.orderValue;
    });
    return Object.entries(acc)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Skopiowano kod: ${text}`);
  };

  const handleCreateExhibitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExhibitorName.trim()) {
      onAddExhibitor(newExhibitorName.trim());
      setNewExhibitorName('');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput1.length < 5) {
      setPassMessage("Hasło musi mieć min. 5 znaków.");
      return;
    }
    if (passInput1 !== passInput2) {
      setPassMessage("Hasła nie są identyczne.");
      return;
    }
    onChangePassword(passInput1);
    setPassMessage("Hasło administratora zostało zmienione!");
    setPassInput1('');
    setPassInput2('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const downloadCSV = () => {
    const BOM = "\uFEFF";
    const headers = [
      "ID Zamówienia", 
      "Numer Biletu", 
      "Klient", 
      "Wartość (PLN)", 
      "Wystawca (ID)", 
      "Wystawca (Nazwa)", 
      "Data Zgłoszenia", 
      "Godzina", 
      "Czy Wygrał"
    ];
    
    const rows = orders.map(o => {
      const dateObj = new Date(o.createdAt);
      
      // Strict Formatting: DD.MM.YYYY
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const dateStr = `${day}.${month}.${year}`;

      // Strict Formatting: HH:MM:SS
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;

      return [
        o.id,
        o.ticketNumber,
        `"${o.clientName.replace(/"/g, '""')}"`, 
        o.orderValue.toFixed(2).replace('.', ','),
        o.exhibitorId || '',
        `"${(o.createdBy || '').replace(/"/g, '""')}"`,
        dateStr,
        timeStr,
        o.isWinner ? "TAK" : "NIE"
      ];
    });

    const csvContent = BOM + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `targi_hasta_wyniki_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'ORDERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Zamówienia i Losowanie
        </button>
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'REPORTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Raporty i Statystyki
        </button>
        <button
          onClick={() => setActiveTab('ACCESS')}
          className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'ACCESS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Dostęp dla Dostawców
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'SETTINGS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Settings size={16} />
          Ustawienia
        </button>
      </div>

      {activeTab === 'ORDERS' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Wszystkie Zamówienia</p>
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Łączna Wartość</p>
                <p className="text-2xl font-bold text-slate-900">{totalValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Gift size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Do Losowania</p>
                <p className="text-2xl font-bold text-slate-900">{eligibleCount}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
             <h2 className="text-2xl font-bold text-slate-800">Lista Zgłoszeń</h2>
             <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                <input 
                  type="text" 
                  placeholder="Szukaj..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-full md:w-auto"
                />
                <button 
                  onClick={downloadCSV}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold transition-colors flex items-center gap-2 border border-emerald-200"
                >
                  <FileSpreadsheet size={18} />
                  Eksportuj Szczegóły
                </button>
                <button 
                  onClick={() => onChangeView(AppView.LOTTERY)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2 shadow-md"
                  disabled={eligibleCount === 0}
                >
                  <Gift size={18} />
                  Rozpocznij Losowanie
                </button>
             </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="px-6 py-4">Nr Biletu</th>
                    <th className="px-6 py-4">Klient</th>
                    <th className="px-6 py-4">Wystawca</th>
                    <th className="px-6 py-4">Wartość</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-slate-700">{order.ticketNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{order.clientName}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{order.createdBy || '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{order.orderValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(order.createdAt).toLocaleString('pl-PL')}</td>
                        <td className="px-6 py-4 text-center">
                          {order.isWinner ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                               Zwycięzca
                             </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              Oczekuje
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Brak wyników
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-6">
             <button 
               onClick={onClearData}
               className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded hover:bg-red-50 transition-colors"
             >
               <Trash2 size={16} />
               Wyczyść Bazy Danych
             </button>
          </div>
        </>
      ) : activeTab === 'REPORTS' ? (
        /* REPORTS TAB */
        <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Exhibitor Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={20} className="text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Ranking Wystawców</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-3">Wystawca</th>
                                <th className="px-6 py-3 text-center">Liczba Zam.</th>
                                <th className="px-6 py-3 text-right">Łączna Wartość</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {exhibitorStats.length > 0 ? (
                                exhibitorStats.map((stat, idx) => (
                                    <tr key={stat.name} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                            <span className="text-slate-400 w-4 text-xs">#{idx+1}</span>
                                            {stat.name}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 bg-slate-50/50">
                                            {stat.count}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                            {stat.value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">Brak danych</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Client Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PieChart size={20} className="text-purple-600" />
                        <h3 className="font-bold text-slate-800">Ranking Klientów</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-3">Klient</th>
                                <th className="px-6 py-3 text-center">Liczba Zam.</th>
                                <th className="px-6 py-3 text-right">Łączna Wartość</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {clientStats.length > 0 ? (
                                clientStats.map((stat, idx) => (
                                    <tr key={stat.name} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                            <span className="text-slate-400 w-4 text-xs">#{idx+1}</span>
                                            {stat.name}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 bg-slate-50/50">
                                            {stat.count}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                            {stat.value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">Brak danych</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      ) : activeTab === 'SETTINGS' ? (
        /* SETTINGS TAB */
        <div className="animate-in fade-in duration-300 max-w-2xl mx-auto space-y-6">
          
          {/* Network / Environment Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                      <Globe size={24} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-800">Status Sieci</h3>
                      <p className="text-sm text-slate-500">Informacje o środowisku pracy.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      {isOnline ? <SignalHigh size={24} /> : <SignalLow size={24} />}
                      <div>
                          <p className="font-bold text-sm">Internet</p>
                          <p className="text-xs opacity-80">{isOnline ? 'Połączono' : 'Brak połączenia'}</p>
                      </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 flex items-center gap-3">
                      <Database size={24} />
                      <div>
                          <p className="font-bold text-sm">Tryb Pracy</p>
                          <p className="text-xs opacity-80">Offline / Intranet</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Password Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Zmień Hasło Administratora</h3>
                  <p className="text-sm text-slate-500">Zaktualizuj hasło dostępu do panelu.</p>
                </div>
             </div>

             <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Nowe Hasło</label>
                     <input 
                       type="password" 
                       value={passInput1}
                       onChange={e => setPassInput1(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="Nowe hasło"
                       required
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Potwierdź Nowe Hasło</label>
                     <input 
                       type="password" 
                       value={passInput2}
                       onChange={e => setPassInput2(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="Powtórz hasło"
                       required
                     />
                  </div>
                </div>
                
                {passMessage && (
                  <div className={`p-3 rounded-lg text-sm ${passMessage.includes('zmienione') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {passMessage}
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors">
                  Zapisz Nowe Hasło
                </button>
             </form>
          </div>

          {/* Backup Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Kopie Zapasowe i Przywracanie</h3>
                  <p className="text-sm text-slate-500">Zabezpiecz dane lub przenieś je na inne urządzenie.</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-700 mb-2">Eksport Danych</p>
                  <p className="text-xs text-slate-500 mb-4">Pobierz pełną kopię bazy danych (zamówienia, wystawcy, hasła) do pliku JSON.</p>
                  <button 
                    onClick={onExportBackup}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Pobierz Kopię Zapasową
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-700 mb-2">Import Danych</p>
                  <p className="text-xs text-slate-500 mb-4">Przywróć dane z pliku JSON. UWAGA: Nadpisze to obecny stan systemu.</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".json"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload size={16} />
                    Wgraj Plik Kopii
                  </button>
                </div>
             </div>
          </div>

          {isSuperuser && (
             <div className="bg-red-50 border border-red-100 rounded-xl p-6">
               <div className="flex items-start gap-3">
                 <AlertTriangle className="text-red-600 shrink-0 mt-1" size={20} />
                 <div className="w-full">
                    <h4 className="text-lg font-bold text-red-800">Strefa Superusera</h4>
                    <p className="text-red-700/80 text-sm mb-4">
                      Jeśli administrator zapomniał hasła, możesz je zresetować do domyślnego 'admin123'.
                    </p>
                    <button 
                      onClick={() => {
                        if(window.confirm('Czy na pewno zresetować hasło admina do "admin123"?')) {
                          onChangePassword('admin123');
                          alert('Hasło zostało zresetowane.');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg w-full sm:w-auto"
                    >
                      Resetuj Hasło Admina
                    </button>
                 </div>
               </div>
             </div>
          )}
        </div>
      ) : (
        /* ACCESS TAB */
        <div className="animate-in fade-in duration-300 space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Dodaj Nowego Dostawcę</h3>
              <p className="text-indigo-700/80 text-sm mt-1">
                Wygeneruj unikalny kod dostępu, który przekażesz dostawcy.
              </p>
            </div>
            <form onSubmit={handleCreateExhibitor} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newExhibitorName}
                onChange={(e) => setNewExhibitorName(e.target.value)}
                placeholder="Nazwa Firmy / Wystawcy"
                className="px-4 py-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
                required
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2"
              >
                <Plus size={18} /> Dodaj
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Aktywni Dostawcy ({exhibitors.length})</h3>
             </div>
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">Nazwa Wystawcy</th>
                    <th className="px-6 py-3">Kod Dostępu (Hasło)</th>
                    <th className="px-6 py-3 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exhibitors.length > 0 ? (
                    exhibitors.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                            <Users size={14} />
                          </div>
                          {ex.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group">
                             <code className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono text-slate-700">
                               {ex.accessCode}
                             </code>
                             <button 
                               onClick={() => copyToClipboard(ex.accessCode)}
                               className="text-slate-400 hover:text-indigo-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                               title="Kopiuj kod"
                             >
                               <Copy size={14} />
                             </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => {
                               if(window.confirm(`Czy usunąć dostęp dla ${ex.name}?`)) {
                                 onRemoveExhibitor(ex.id);
                               }
                             }}
                             className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                             title="Usuń dostęp"
                           >
                             <UserMinus size={18} />
                           </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        Brak zdefiniowanych dostawców. Dodaj pierwszego powyżej.
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};