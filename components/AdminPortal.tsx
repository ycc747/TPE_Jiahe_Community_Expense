
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Resident, PaymentRecord, FEE_CONFIG, User } from '../types';

interface Props {
  residents: Resident[];
  payments: PaymentRecord[];
  onPaymentSubmit: (record: PaymentRecord, updatedResident: Resident) => void;
  onPaymentOverride?: (record: PaymentRecord, updatedResident: Resident) => void;
  currentUser: User;
}

interface ParkingConfig {
  smallCount: number;
  largeCount: number;
}

const AdminPortal: React.FC<Props> = ({ residents, payments, onPaymentSubmit, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{ residentId: string; total: number } | null>(null);
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

  const [mgmtError, setMgmtError] = useState(false);
  const [motoError, setMotoError] = useState(false);
  const [carError, setCarError] = useState(false);

  // Check if redirected with payment success
  useEffect(() => {
    if (location.state?.lastPayment) {
      const payment = location.state.lastPayment as PaymentRecord;
      setLastPaymentInfo({ residentId: payment.residentId, total: payment.total });
      setShowSuccessBanner(true);

      // Clear the location state to prevent showing banner on refresh
      navigate(location.pathname, { replace: true });

      // Auto-hide banner after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  const isBeforeOrEqual = (d1: { y: number, m: number }, d2: { y: number, m: number }) => {
    if (d1.y < d2.y) return true;
    if (d1.y > d2.y) return false;
    return d1.m <= d2.m;
  };

  const validateAndSetDates = (
    type: 'mgmt' | 'moto' | 'car',
    target: 'prev' | 'next',
    val: { y: number, m: number }
  ) => {
    let hasError = false;
    if (type === 'mgmt') {
      if (target === 'prev') {
        setPrevMgmt(val);
        if (!isBeforeOrEqual(val, nextMgmt)) {
          setNextMgmt(val);
          hasError = true;
        }
      } else {
        setNextMgmt(val);
        if (!isBeforeOrEqual(prevMgmt, val)) {
          setPrevMgmt(val);
          hasError = true;
        }
      }
      setMgmtError(hasError);
    } else if (type === 'moto') {
      if (target === 'prev') {
        setPrevMoto(val);
        if (!isBeforeOrEqual(val, nextMoto)) {
          setNextMoto(val);
          hasError = true;
        }
      } else {
        setNextMoto(val);
        if (!isBeforeOrEqual(prevMoto, val)) {
          setPrevMoto(val);
          hasError = true;
        }
      }
      setMotoError(hasError);
    } else {
      if (target === 'prev') {
        setPrevCar(val);
        if (!isBeforeOrEqual(val, nextCar)) {
          setNextCar(val);
          hasError = true;
        }
      } else {
        setNextCar(val);
        if (!isBeforeOrEqual(prevCar, val)) {
          setPrevCar(val);
          hasError = true;
        }
      }
      setCarError(hasError);
    }
  };

  useEffect(() => {
    const currentYM = { y: initialY, m: initialM };

    // Auto-update if current time is past the previous "next" date
    // We fetch the current values from state or props if persisted, 
    // but here we check against the initial defaults/state.
    if (!isBeforeOrEqual(currentYM, nextMgmt)) setPrevMgmt(currentYM);
    if (!isBeforeOrEqual(currentYM, nextMoto)) setPrevMoto(currentYM);
    if (!isBeforeOrEqual(currentYM, nextCar)) setPrevCar(currentYM);
  }, []);

  const [isPreview, setIsPreview] = useState(false);
  const [isChairmanMode, setIsChairmanMode] = useState(false);

  // 繳費紀錄的主鍵年月（以管理費起算月為準）
  const year = prevMgmt.y;
  const month = prevMgmt.m;

  const existingPayment = payments.find(p => p.residentId === selectedResidentId && p.year === year && p.month === month);
  const isPaidForPeriod = !!existingPayment;

  const getMonthDiffInclusive = (start: { y: number, m: number }, end: { y: number, m: number }) => {
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

    const formatYM = (d: { y: number, m: number }) => `${d.y}-${d.m.toString().padStart(2, '0')}`;

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

  const parseYM = (s: string) => {
    const [y, m] = s.split('-').map(Number);
    return { y, m };
  };

  const isResidentPaidForMonth = (resId: string, targetTable: { y: number, m: number }) => {
    return payments.some(p => {
      if (p.residentId !== resId) return false;
      const start = parseYM(p.prevManagementStart);
      const end = parseYM(p.nextManagementStart);
      return isBeforeOrEqual(start, targetTable) && isBeforeOrEqual(targetTable, end);
    });
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPaidReport = () => {
    const target = { y: initialY, m: initialM };
    const paidList = residents.filter(r => isResidentPaidForMonth(r.id, target));

    let csvContent = "門號,樓層,狀態,繳費金額\n";
    paidList.forEach(r => {
      const p = payments.find(pay => pay.residentId === r.id && parseYM(pay.prevManagementStart).y === target.y && parseYM(pay.prevManagementStart).m === target.m);
      csvContent += `${r.addressNumber},${r.floor},已繳費,${p?.total || ''}\n`;
    });

    downloadCSV(`嘉禾社區_${target.y}_${target.m}_已繳費名單.csv`, csvContent);
  };

  const exportUnpaidReport = () => {
    let lastY = initialY;
    let lastM = initialM - 1;
    if (lastM === 0) {
      lastM = 12;
      lastY -= 1;
    }
    const target = { y: lastY, m: lastM };
    const unpaidList = residents.filter(r => !isResidentPaidForMonth(r.id, target));

    let csvContent = "門號,樓層,狀態,欠繳月份\n";
    unpaidList.forEach(r => {
      csvContent += `${r.addressNumber},${r.floor},欠繳,${target.y}-${target.m}\n`;
    });

    downloadCSV(`嘉禾社區_${target.y}_${target.m}_欠繳名單.csv`, csvContent);
  };

  if (isPreview) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Success Banner */}
        {showSuccessBanner && lastPaymentInfo && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-6 rounded-2xl shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-800 font-black text-lg">✓ 繳費登記成功</p>
                  <p className="text-green-700 font-bold mt-1">
                    門號：<span className="text-green-900 font-black">{lastPaymentInfo.residentId}</span>
                    ｜　總金額：<span className="text-green-900 font-black text-xl">NT$ {lastPaymentInfo.total.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-green-600 hover:text-green-800 font-bold text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Banner */}
      {showSuccessBanner && lastPaymentInfo && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-6 rounded-2xl shadow-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-black text-lg">✓ 繳費登記成功</p>
                <p className="text-green-700 font-bold mt-1">
                  門號：<span className="text-green-900 font-black">{lastPaymentInfo.residentId}</span>
                  ｜　總金額：<span className="text-green-900 font-black text-xl">NT$ {lastPaymentInfo.total.toLocaleString()}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-green-600 hover:text-green-800 font-bold text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
                      <button onClick={() => setMotoConfig(p => ({ ...p, smallCount: Math.max(0, p.smallCount - 1) }))} className="w-8 h-8 rounded-full border">-</button>
                      <span className="text-lg font-black">{motoConfig.smallCount}</span>
                      <button onClick={() => setMotoConfig(p => ({ ...p, smallCount: p.smallCount + 1 }))} className="w-8 h-8 rounded-full border">+</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl">
                    <span className="font-bold">大車位</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setMotoConfig(p => ({ ...p, largeCount: Math.max(0, p.largeCount - 1) }))} className="w-8 h-8 rounded-full border">-</button>
                      <span className="text-lg font-black">{motoConfig.largeCount}</span>
                      <button onClick={() => setMotoConfig(p => ({ ...p, largeCount: p.largeCount + 1 }))} className="w-8 h-8 rounded-full border">+</button>
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
                      <button onClick={() => setCarConfig(p => ({ ...p, smallCount: Math.max(0, p.smallCount - 1) }))} className="w-8 h-8 rounded-full border">-</button>
                      <span className="text-lg font-black">{carConfig.smallCount}</span>
                      <button onClick={() => setCarConfig(p => ({ ...p, smallCount: p.smallCount + 1 }))} className="w-8 h-8 rounded-full border">+</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl">
                    <span className="font-bold">大車位</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setCarConfig(p => ({ ...p, largeCount: Math.max(0, p.largeCount - 1) }))} className="w-8 h-8 rounded-full border">-</button>
                      <span className="text-lg font-black">{carConfig.largeCount}</span>
                      <button onClick={() => setCarConfig(p => ({ ...p, largeCount: p.largeCount + 1 }))} className="w-8 h-8 rounded-full border">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black text-gray-500 uppercase border-b pb-2">繳費期間設定</h4>
              {[
                { l: '社區管理費 ($800)', ps: prevMgmt, pt: (v: any) => validateAndSetDates('mgmt', 'prev', v), ns: nextMgmt, nt: (v: any) => validateAndSetDates('mgmt', 'next', v), color: 'indigo', error: mgmtError },
                { l: '機車停車費', ps: prevMoto, pt: (v: any) => validateAndSetDates('moto', 'prev', v), ns: nextMoto, nt: (v: any) => validateAndSetDates('moto', 'next', v), color: 'purple', error: motoError },
                { l: '汽車停車費', ps: prevCar, pt: (v: any) => validateAndSetDates('car', 'prev', v), ns: nextCar, nt: (v: any) => validateAndSetDates('car', 'next', v), color: 'blue', error: carError },
              ].map((item, i) => (
                <div key={i} className={`p-6 bg-${item.color}-50/30 rounded-2xl border-2 ${item.error ? 'border-red-400 bg-red-50' : `border-${item.color}-100`} grid grid-cols-1 md:grid-cols-2 gap-8 relative`}>
                  {item.error && (
                    <div className="md:col-span-2 bg-red-600 text-white text-xs py-2 px-4 rounded-lg font-black animate-pulse flex items-center gap-2">
                      ⚠️ 設定時間設定錯誤, "繳費結算年月"要等於或晚於"繳費起算年月", 或"繳費起算年月"要等於或早於"繳費結算年月"
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-black mb-2 ${item.error ? 'text-red-700' : 'text-gray-600'}`}>{item.l}：繳費起算年月</p>
                    <div className="flex gap-2">
                      <input type="number" value={item.ps.y} onChange={e => item.pt({ ...item.ps, y: Number(e.target.value) })} className={`w-2/3 p-4 border rounded-xl text-xl font-bold ${item.error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'}`} />
                      <input type="number" value={item.ps.m} onChange={e => item.pt({ ...item.ps, m: Number(e.target.value) })} className={`w-1/3 p-4 border rounded-xl text-xl font-bold ${item.error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'}`} min="1" max="12" />
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-black mb-2 ${item.error ? 'text-red-700' : 'text-gray-600'}`}>{item.l}：繳費結算年月</p>
                    <div className="flex gap-2">
                      <input type="number" value={item.ns.y} onChange={e => item.nt({ ...item.ns, y: Number(e.target.value) })} className={`w-2/3 p-4 border rounded-xl text-xl font-bold ${item.error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'}`} />
                      <input type="number" value={item.ns.m} onChange={e => item.nt({ ...item.ns, m: Number(e.target.value) })} className={`w-1/3 p-4 border rounded-xl text-xl font-bold ${item.error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'}`} min="1" max="12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <button
                onClick={() => setIsPreview(true)}
                disabled={(isPaidForPeriod && !isChairmanMode) || !selectedResidentId}
                className={`w-full py-6 rounded-2xl font-black text-2xl transition-all shadow-xl ${isChairmanMode && isPaidForPeriod ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white disabled:bg-gray-300'
                  }`}
              >
                {isChairmanMode && isPaidForPeriod ? '糾紛重設預覽' : '登記並預覽'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-green-100">
            <h3 className="font-bold text-green-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              報表匯出中心
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={exportPaidReport}
                className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl transition-all border border-green-200 group"
              >
                <div className="text-left">
                  <p className="font-black text-sm">匯出本月已繳名單</p>
                  <p className="text-[10px] opacity-70 font-bold">{initialY}年{initialM}月</p>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              <button
                onClick={exportUnpaidReport}
                className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl transition-all border border-red-200 group"
              >
                <div className="text-left">
                  <p className="font-black text-sm">匯出上月欠繳名單</p>
                  <p className="text-[10px] opacity-70 font-bold">
                    {initialM === 1 ? initialY - 1 : initialY}年{initialM === 1 ? 12 : initialM - 1}月
                  </p>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
