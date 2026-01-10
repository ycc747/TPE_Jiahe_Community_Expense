
import React, { useState, useEffect } from 'react';
import { Resident, PaymentRecord } from '../types';

interface Props {
  residents: Resident[];
  payments: PaymentRecord[];
}

const ResidentPortal: React.FC<Props> = ({ residents, payments }) => {
  const [aa, setAa] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [error, setError] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [bgImage, setBgImage] = useState('');

  // Valid options
  const aaOptions = ['13', '15', '17', '19', '21', '23'];
  const bOptions = ['', '1', '2', '3'];
  const cOptions = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    const month = new Date().getMonth();
    const isFirstHalf = month < 6;
    const imageUrl = isFirstHalf
      ? 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=1920'
      : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920';
    setBgImage(imageUrl);
  }, []);

  const validateAndSearch = () => {
    setError('');
    if (!aa || !c) {
      setError('正確範例：請選擇完整的號碼與樓層');
      return;
    }
    const addressPart = b ? `${aa}-${b}` : `${aa}`;
    const normalized = `${addressPart}-${c}`;
    setActiveSearch(normalized);
  };

  const filteredResidents = residents.filter(r => r.id === activeSearch);
  const hasSearchResult = activeSearch !== '' && filteredResidents.length > 0;

  return (
    <div
      className="min-h-[80vh] rounded-3xl overflow-hidden relative flex items-center justify-center p-4 transition-all duration-1000 bg-cover bg-center no-print"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/95 p-8 md:p-10 rounded-3xl shadow-2xl border border-white/60 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">台北市嘉禾社區住戶費用查詢</h2>
            <p className="text-indigo-600 font-medium italic">請輸入完整地址與樓層以查閱繳費明細</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-bounce">
              <p className="text-red-700 text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xl font-bold text-gray-700">
              <select
                className="w-20 px-2 py-3 border-2 border-indigo-100 rounded-xl outline-none text-center shadow-inner bg-white"
                value={aa}
                onChange={(e) => setAa(e.target.value)}
              >
                <option value="">--</option>
                {aaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <span>-</span>
              <select
                className="w-24 px-2 py-3 border-2 border-indigo-100 rounded-xl outline-none text-center shadow-inner bg-white"
                value={b}
                onChange={(e) => setB(e.target.value)}
              >
                {bOptions.map(opt => <option key={opt} value={opt}>{opt === '' ? '(無)' : opt}</option>)}
              </select>
              <span>號</span>
              <select
                className="w-16 px-2 py-3 border-2 border-indigo-100 rounded-xl outline-none text-center shadow-inner bg-white"
                value={c}
                onChange={(e) => setC(e.target.value)}
              >
                <option value="">--</option>
                {cOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <span>樓</span>
            </div>

            <button
              onClick={validateAndSearch}
              className="w-full sm:w-64 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
            >
              查詢明細
            </button>
          </div>

          {hasSearchResult ? (
            <div className="space-y-6 pt-6 border-t border-gray-100 animate-fadeIn">
              {filteredResidents.map(resident => {
                const residentPayments = payments
                  .filter(p => p.residentId === resident.id)
                  .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

                return (
                  <div key={resident.id} className="space-y-6">
                    <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <h4 className="text-lg font-black text-indigo-900 mb-4 border-b border-indigo-100 pb-2 flex justify-between">
                        <span>{resident.addressNumber}號 {resident.floor}樓 明細</span>
                        <span className="text-xs text-indigo-500 font-bold">歷史紀錄 ({residentPayments.length})</span>
                      </h4>

                      {residentPayments.length > 0 ? (
                        <div className="space-y-4">
                          {residentPayments.map((p, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 space-y-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-400">登記日: {new Date(p.paidAt).toLocaleDateString()}</span>
                                <span className="font-black text-indigo-600 text-xl">${p.total.toLocaleString()}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1 text-[11px]">
                                <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                                  <span className="text-gray-500">管理費起訖:</span>
                                  <span className="font-bold text-gray-700">{p.prevManagementStart} ~ {p.nextManagementStart}</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                                  <span className="text-gray-500">機車費起訖:</span>
                                  <span className="font-bold text-gray-700">{p.prevMotorcycleStart} ~ {p.nextMotorcycleStart}</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                                  <span className="text-gray-500">汽車費起訖:</span>
                                  <span className="font-bold text-gray-700">{p.prevCarStart} ~ {p.nextCarStart}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center bg-white/50 rounded-xl border border-dashed border-indigo-200">
                          <p className="text-sm text-gray-500 font-bold">目前尚無繳費明細。</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeSearch !== '' && !error && (
            <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center">
              <p className="text-gray-500 font-bold">查無資料</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentPortal;
