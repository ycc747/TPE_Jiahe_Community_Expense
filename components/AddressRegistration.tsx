import React, { useState, useEffect } from 'react';
import { User, AddressRegistration } from '../types';
import { saveRegistration, getUserRegistrations } from '../utils/auth';

interface Props {
    user: User;
    onComplete: () => void;
    onLogout: () => void;
}

const AddressRegistrationComponent: React.FC<Props> = ({ user, onComplete, onLogout }) => {
    // New 3-stage address state
    const [aa, setAa] = useState('');
    const [b, setB] = useState('');
    const [c, setC] = useState('');

    const [myRegistrations, setMyRegistrations] = useState<AddressRegistration[]>([]);
    const [success, setSuccess] = useState(false);

    // Modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Options logic mirrored from ResidentPortal
    const aaOptions = ['13', '15', '17', '19', '21', '23'];
    const bOptions = (aa === '21' || aa === '23') ? ['', '1', '2', '3'] : ['', '1'];
    const cOptions = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

    useEffect(() => {
        loadRegistrations();
    }, []);

    // Auto-reset suffix if invalid
    useEffect(() => {
        if (!bOptions.includes(b)) {
            setB('');
        }
    }, [aa]);

    const loadRegistrations = () => {
        const regs = getUserRegistrations(user.id);
        setMyRegistrations(regs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!aa || !c) {
            alert('請選擇完整的門號與樓層');
            return;
        }

        // Construct resident ID: aa-b-c or aa-c
        const addressPart = b ? `${aa}-${b}` : `${aa}`;
        const residentId = `${addressPart}-${c}`;

        // Check if already registered
        const alreadyRegistered = myRegistrations.some(r => r.residentId === residentId);
        if (alreadyRegistered) {
            alert('此門號已登記過');
            return;
        }

        const registration: AddressRegistration = {
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            residentId,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };

        saveRegistration(registration);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setAa('');
            setB('');
            setC('');
            loadRegistrations();
        }, 2000);
    };

    const handleStaffApply = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmApply = () => {
        const registration: AddressRegistration = {
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            residentId: 'STAFF_APPLY',
            status: 'pending',
            requestedAt: new Date().toISOString()
        };

        saveRegistration(registration);
        loadRegistrations();
        setShowConfirmModal(false);
        setShowSuccessModal(true);
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            approved: 'bg-green-100 text-green-700 border-green-300',
            rejected: 'bg-red-100 text-red-700 border-red-300'
        };
        return badges[status as keyof typeof badges] || badges.pending;
    };

    const getStatusText = (status: string) => {
        const texts = {
            pending: '待核准',
            approved: '已核准',
            rejected: '已拒絕'
        };
        return texts[status as keyof typeof texts] || status;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-gray-800 mb-2">住戶門號登記</h2>
                        <p className="text-gray-600">首次登入請登記您的住戶門號，待管理員核准後即可查看繳費資訊</p>
                    </div>

                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-pulse">
                            <p className="text-green-700 font-bold">✓ 申請已送出，請等待管理員核准</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mb-8">
                        {/* New 3-Column Layout for Address Selection */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">主號</label>
                                <div className="flex items-center">
                                    <select
                                        value={aa}
                                        onChange={(e) => setAa(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-center"
                                        required
                                    >
                                        <option value="">--</option>
                                        {aaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">分號 (之X)</label>
                                <div className="flex items-center">
                                    <span className="mr-2 font-bold text-gray-400">-</span>
                                    <select
                                        value={b}
                                        onChange={(e) => setB(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-center"
                                    >
                                        {bOptions.map(opt => <option key={opt} value={opt}>{opt === '' ? '(主號)' : opt}</option>)}
                                    </select>
                                    <span className="ml-2 font-bold text-gray-700">號</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">樓層</label>
                                <div className="flex items-center">
                                    <select
                                        value={c}
                                        onChange={(e) => setC(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-center"
                                        required
                                    >
                                        <option value="">--</option>
                                        {cOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <span className="ml-2 font-bold text-gray-700">樓</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                送出申請
                            </button>
                            {user.role !== 'EXT' && (
                                <button
                                    type="button"
                                    onClick={onComplete}
                                    className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
                                >
                                    跳過
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mb-8 pt-6 border-t border-gray-100">
                        <p className="text-center text-gray-500 text-sm mb-4">或者</p>
                        <button
                            type="button"
                            onClick={handleStaffApply}
                            className="w-full py-3 border-2 border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <span>👮</span> 社區管理員或警衛 (非本社區住戶)
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="text-gray-500 hover:text-red-500 font-bold underline transition-colors"
                        >
                            登出並返回首頁
                        </button>
                    </div>

                    {myRegistrations.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-black text-gray-800 mb-4">我的登記紀錄</h3>
                            <div className="space-y-3">
                                {myRegistrations.map(reg => (
                                    <div key={reg.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-800">
                                                {reg.residentId === 'STAFF_APPLY' ? '申請管理人員/警衛身分' : reg.residentId}
                                            </p>
                                            <p className="text-sm text-gray-500">申請時間：{new Date(reg.requestedAt).toLocaleString('zh-TW')}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusBadge(reg.status)}`}>
                                            {getStatusText(reg.status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Modal for Confirmation */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-popIn">
                        <h3 className="text-2xl font-black text-gray-800 mb-4 text-center">申請確認</h3>
                        <p className="text-gray-600 mb-8 text-center font-bold">
                            確定要申請成為社區管理員或警衛嗎？<br />
                            <span className="text-sm text-gray-500 font-normal mt-2 block">(此申請需由社區主委核准後方可生效)</span>
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmApply}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-95"
                            >
                                確認申請
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal for Success */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-popIn border-4 border-green-400">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <h3 className="text-2xl font-black text-green-800 mb-2">申請已送出！</h3>
                        </div>
                        <div className="text-gray-600 mb-8 text-center space-y-2">
                            <p className="font-bold">請等待社區主委核准。</p>
                            <p className="text-sm">核准後您的權限將自動提升，屆時請重新登入系統。</p>
                        </div>
                        <button
                            onClick={handleCloseSuccess}
                            className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg transition-transform active:scale-95"
                        >
                            確定
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressRegistrationComponent;
