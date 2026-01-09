
import React, { useState, useEffect } from 'react';
import { Resident, PaymentRecord, FEE_CONFIG } from '../types';

interface Props {
  residents: Resident[];
  payments: PaymentRecord[];
  onPaymentSubmit: (record: PaymentRecord, updatedResident: Resident) => void;
  onPaymentOverride?: (record: PaymentRecord, updatedResident: Resident) => void;
}

interface ParkingConfig {
  smallCount: number;
  largeCount: number;
}

const AdminPortal: React.FC<Props> = ({ residents, payments, onPaymentSubmit }) => {
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const now = new Date();
  const initialY = now.getFullYear();
  const initialM = now.getMonth() + 1;

  // 繳費起算與結算設定，預設相同
  const [prevMgmt, setPrevMgmt] = useState({ y: initialY, m: initialM });
  const [nextMgmt, setNextMgmt] = useState({ y: initialY, m: initialM });
  
  const [prevMoto, setPrevMoto] = useState({ y: initialY, m: initialM });
  const [nextMoto, setNextMoto] = useState({ y: initialY, m: initialM });
  
  const [prevCar, setPrevCar] = useState({ y: initialY, m: initialM });
  const [nextCar, setNextCar] = useState({ y: initialY, m: initialM });

  const [motoConfig, setMotoConfig] = useState<ParkingConfig>({ smallCount: 0, largeCount: 0 });
  const [carConfig, setCarConfig] = useState<ParkingConfig>({ smallCount: 0, largeCount: 0 });

  const [isPreview, setIsPreview] = useState(false);
  const [isChairmanMode, setIsChairmanMode] = useState(false);

  // 繳費紀錄的主鍵年月（以管理費起算月為準）
  const year = prevMgmt.y;
  const month = prevMgmt.m;

  const existingPayment = payments.find(p => p.residentId === selectedResidentId && p.year === year && p.month === month);
  const isPaidForPeriod = !!existingPayment;

  const getMonthDiffInclusive = (start: {y: number, m: number}, end: {y: number, m: number}) => {
    const diff = (end.y - start.y) * 12 + (end.m - start.m);
    return diff >= 0 ? diff + 1 : 0;
  };

  const calculateFees = () => {
    const mgmtMonths = getMonthDiffInclusive(prevMgmt, nextMgmt);
    const motoMonths = getMonthDiffInclusive(prevMoto, nextMoto);
    const carMonths = getMonthDiffInclusive(prevCar, nextCar);

    const mgmtTotal = FEE_CONFIG.MANAGEMENT * mgmtMonths;
    const motoTotal = ((motoConfig.smallCount * FEE_CONFIG.MOTORCYCLE.small) + (motoConfig.largeCount * FEE_CONFIG.MOTORCYCLE.large)) * motoMonths;
    const carTotal = ((carConfig.smallCount * FEE_CONFIG.CAR.small) + (carConfig.largeCount * FEE_CONFIG.CAR.large)) * carMonths;
    
    return { 
      management: mgmtTotal, 
      motorcycle: motoTotal, 
      car: carTotal, 
      total: mgmtTotal + motoTotal + carTotal,
      mgmtMonths, motoMonths, carMonths
    };
  };

  const fees = calculateFees();

  const handleConfirm = () => {
    const resident = residents.find(r => r.id === selectedResidentId);
    if (!resident) return;

    const formatYM = (d: {y: number, m: number}) => `${d.y}-${d.m.toString().padStart(2, '0')}`;

    const newRecord: PaymentRecord = {
      residentId: selectedResidentId,
      year,
      month,
      managementFee: fees.management,
      motorcycleFee: fees.motorcycle,
      carFee: fees.car,
      total: fees.total,
      paidAt: new Date().toISOString(),
      prevManagementStart: formatYM(prevMgmt),
      prevMotorcycleStart: formatYM(prevMoto),
      prevCarStart: formatYM(prevCar),
      nextManagementStart: formatYM(nextMgmt),
      nextMotorcycleStart: formatYM(nextMoto),
      nextCarStart: formatYM(nextCar)
    };

    const updatedResident: Resident = {
      ...resident,
      motorcycleCount: motoConfig.smallCount + motoConfig.largeCount,
      carCount: carConfig.smallCount + carConfig.largeCount,
      motorcycleParking: motoConfig.largeCount > 0 ? 'large' : (motoConfig.smallCount > 0 ? 'small' : 'none'),
      carParking: carConfig.largeCount > 0 ? 'large' : (carConfig.smallCount > 0 ? 'small' : 'none')
    };

    onPaymentSubmit(newRecord, updatedResident);
    setIsPreview(false);
  };

  if (isPreview) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-2xl border-4 border-indigo-600 animate-fadeIn no-print">
        <h2 className="text-3xl font-black text-gray-800 mb-8 text-center border-b pb-4">
          {isChairmanMode ? "主委糾紛調解 - 重新設定預覽" : "確認繳費資訊"}
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-bold text-gray-500">住戶：</span>
            <span className="font-black text-indigo-700 text-xl">{selectedResidentId}</span>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-indigo-100 text-sm font-bold text-gray-600">
              <span>項目</span>
              <span>月份數</span>
              <span>小計</span>
            </div>
            <div className="flex justify-between items-center">
              <span>管理費</span>
              <span className="text-indigo-600 font-bold">{fees.mgmtMonths}月</span>
              <span className="font-bold font-mono">${fees.management}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>機車費</span>
              <span className="text-indigo-600 font-bold">{fees.motoMonths}月</span>
              <span className="font-bold font-mono">${fees.motorcycle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>汽車費</span>
              <span className="text-indigo-600 font-bold">{fees.carMonths}月</span>
              <span className="font-bold font-mono">${fees.car}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-indigo-700 border-t mt-4 pt-4">
              <span>繳費總計</span>
              <span>${fees.total}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button onClick={() => setIsPreview(false)} className="py-4 bg-gray-200 rounded-xl font-bold">返回修改</button>
            <button onClick={handleConfirm} className="py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">確認並自動列印</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 no-print">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">嘉禾社區住戶繳費登記</h2>
            <button 
              onClick={() => setIsChairmanMode(!isChairmanMode)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${isChairmanMode ? 'bg-red-100 border-red-300 text-red-600 font-bold' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
            >
              {isChairmanMode ? "⚠️ 主委模式開啟" : "切換主委權限"}
            </button>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">選擇住戶</label>
            <select 
              className="w-full p-4 border-2 border-indigo-50 rounded-xl bg-white shadow-sm text-lg font-bold"
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
            >
              <option value="">-- 請選擇 --</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.addressNumber}號 {r.floor}樓</option>)}
            </select>
          </div>

          {isPaidForPeriod && !isChairmanMode && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <p className="text-yellow-700 font-bold text-sm">此週期已完成繳費。若需修改已鎖定資料，請啟動主委模式。</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 text-lg">🛵 機車租用 (小$100/大$200)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl">
                  <span className="font-bold">小車位</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMotoConfig(p => ({...p, smallCount: Math.max(0, p.smallCount - 1)}))} className="w-8 h-8 rounded-full border">-</button>
                    <span className="text-lg font-black">{motoConfig.smallCount}</span>
                    <button onClick={() => setMotoConfig(p => ({...p, smallCount: p.smallCount + 1}))} className="w-8 h-8 rounded-full border">+</button>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-xl">
                  <span className="font-bold">大車位</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMotoConfig(p => ({...p, largeCount: Math.max(0, p.largeCount - 1)}))} className="w-8 h-8 rounded-full border">-</button>
                    <span className="text-lg font-black">{motoConfig.largeCount}</span>
                    <button onClick={() => setMotoConfig(p => ({...p, largeCount: p.largeCount + 1}))} className="w-8 h-8 rounded-full border">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-4 text-lg">🚗 汽車租用 (小$1200/大$1800)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl">
                  <span className="font-bold">小車位</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCarConfig(p => ({...p, smallCount: Math.max(0, p.smallCount - 1)}))} className="w-8 h-8 rounded-full border">-</button>
                    <span className="text-lg font-black">{carConfig.smallCount}</span>
                    <button onClick={() => setCarConfig(p => ({...p, smallCount: p.smallCount + 1}))} className="w-8 h-8 rounded-full border">+</button>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-xl">
                  <span className="font-bold">大車位</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCarConfig(p => ({...p, largeCount: Math.max(0, p.largeCount - 1)}))} className="w-8 h-8 rounded-full border">-</button>
                    <span className="text-lg font-black">{carConfig.largeCount}</span>
                    <button onClick={() => setCarConfig(p => ({...p, largeCount: p.largeCount + 1}))} className="w-8 h-8 rounded-full border">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-500 uppercase border-b pb-2">繳費期間設定</h4>
            {[
              { l: '社區管理費 ($800)', ps: prevMgmt, pt: setPrevMgmt, ns: nextMgmt, nt: setNextMgmt, color: 'indigo' },
              { l: '機車停車費', ps: prevMoto, pt: setPrevMoto, ns: nextMoto, nt: setNextMoto, color: 'purple' },
              { l: '汽車停車費', ps: prevCar, pt: setPrevCar, ns: nextCar, nt: setNextCar, color: 'blue' },
            ].map((item, i) => (
              <div key={i} className={`p-6 bg-${item.color}-50/30 rounded-2xl border-2 border-${item.color}-100 grid grid-cols-1 md:grid-cols-2 gap-8`}>
                <div>
                  <p className="text-sm font-black text-gray-600 mb-2">{item.l}：繳費起算年月</p>
                  <div className="flex gap-2">
                    <input type="number" value={item.ps.y} onChange={e => item.pt({...item.ps, y: Number(e.target.value)})} className="w-2/3 p-4 border rounded-xl text-xl font-bold" />
                    <input type="number" value={item.ps.m} onChange={e => item.pt({...item.ps, m: Number(e.target.value)})} className="w-1/3 p-4 border rounded-xl text-xl font-bold" min="1" max="12" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-gray-600 mb-2">{item.l}：繳費結算年月</p>
                  <div className="flex gap-2">
                    <input type="number" value={item.ns.y} onChange={e => item.nt({...item.ns, y: Number(e.target.value)})} className="w-2/3 p-4 border rounded-xl text-xl font-bold" />
                    <input type="number" value={item.ns.m} onChange={e => item.nt({...item.ns, m: Number(e.target.value)})} className="w-1/3 p-4 border rounded-xl text-xl font-bold" min="1" max="12" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <button
              onClick={() => setIsPreview(true)}
              disabled={(isPaidForPeriod && !isChairmanMode) || !selectedResidentId}
              className={`w-full py-6 rounded-2xl font-black text-2xl transition-all shadow-xl ${
                isChairmanMode && isPaidForPeriod ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white disabled:bg-gray-300'
              }`}
            >
              {isChairmanMode && isPaidForPeriod ? '糾紛重設預覽' : '登記並預覽'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl sticky top-8">
          <h3 className="font-bold border-b border-gray-700 pb-2 mb-4 text-xs text-gray-400">即時費用計算</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">管理費 ({fees.mgmtMonths}月):</span>
              <span className="font-mono font-bold">${fees.management}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">機車費 ({fees.motoMonths}月):</span>
              <span className="font-mono font-bold">${fees.motorcycle}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">汽車費 ({fees.carMonths}月):</span>
              <span className="font-mono font-bold">${fees.car}</span>
            </div>
            <div className="flex justify-between text-3xl font-black text-yellow-400 border-t border-gray-700 pt-6 mt-4">
              <span>總額</span>
              <span>${fees.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
