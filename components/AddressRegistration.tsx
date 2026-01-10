import React, { useState, useEffect } from 'react';
import { User, AddressRegistration } from '../types';
import { ADDRESS_NUMBERS } from '../types';
import { saveRegistration, getUserRegistrations, getAllUsers, saveUser } from '../utils/auth';

interface Props {
    user: User;
    onComplete: () => void;
}

const AddressRegistrationComponent: React.FC<Props> = ({ user, onComplete }) => {
    const [addressNumber, setAddressNumber] = useState('');
    const [floor, setFloor] = useState('');
    const [myRegistrations, setMyRegistrations] = useState<AddressRegistration[]>([]);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadRegistrations();
    }, []);

    const loadRegistrations = () => {
        const regs = getUserRegistrations(user.id);
        setMyRegistrations(regs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!addressNumber || !floor) {
            alert('請選擇完整的門號與樓層');
            return;
        }

        const residentId = `${addressNumber}-${floor}`;

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
            setAddressNumber('');
            setFloor('');
            loadRegistrations();
        }, 2000);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    門牌號碼
                                </label>
                                <select
                                    value={addressNumber}
                                    onChange={(e) => setAddressNumber(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    required
                                >
                                    <option value="">請選擇</option>
                                    {ADDRESS_NUMBERS.map(num => (
                                        <option key={num} value={num}>{num}號</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    樓層
                                </label>
                                <select
                                    value={floor}
                                    onChange={(e) => setFloor(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    required
                                >
                                    <option value="">請選擇</option>
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(f => (
                                        <option key={f} value={f}>{f}樓</option>
                                    ))}
                                </select>
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

                    {myRegistrations.length > 0 && (
                        <div>
                            <h3 className="text-xl font-black text-gray-800 mb-4">我的登記紀錄</h3>
                            <div className="space-y-3">
                                {myRegistrations.map(reg => (
                                    <div key={reg.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-800">{reg.residentId}</p>
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
        </div>
    );
};

export default AddressRegistrationComponent;
