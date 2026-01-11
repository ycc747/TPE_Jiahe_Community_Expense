import React, { useState, useEffect } from 'react';
import { AddressRegistration, User } from '../types';
import { getAllRegistrations, saveRegistration, getPendingRegistrations, getAllUsers, saveUser, updateUserRole } from '../utils/auth';

interface Props {
    currentUser: User;
}

const ApprovalPanel: React.FC<Props> = ({ currentUser }) => {
    const [registrations, setRegistrations] = useState<AddressRegistration[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending'>('pending');

    // Modal state
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [targetReg, setTargetReg] = useState<AddressRegistration | null>(null);

    useEffect(() => {
        loadRegistrations();
    }, [filter]);

    const loadRegistrations = () => {
        const regs = filter === 'pending' ? getPendingRegistrations() : getAllRegistrations();
        setRegistrations(regs.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    };

    const handleApprove = (reg: AddressRegistration) => {
        const updatedReg: AddressRegistration = {
            ...reg,
            status: 'approved',
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString()
        };

        saveRegistration(updatedReg);

        // Update user's registered addresses
        const users = getAllUsers();
        const user = users.find(u => u.id === reg.userId);
        if (user) {
            if (!user.registeredAddresses.includes(reg.residentId)) {
                user.registeredAddresses.push(reg.residentId);
                saveUser(user);
            }
        }

        loadRegistrations();
    };

    const handleReject = (reg: AddressRegistration) => {
        const updatedReg: AddressRegistration = {
            ...reg,
            status: 'rejected',
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString()
        };

        saveRegistration(updatedReg);
        loadRegistrations();
    };

    // Triggered by button click
    const confirmApproveStaff = (reg: AddressRegistration) => {
        setTargetReg(reg);
        setShowStaffModal(true);
    };

    // Execute approval
    const executeApproveStaff = () => {
        if (!targetReg) return;

        // 1. Approve Registration (to clear it)
        const updatedReg: AddressRegistration = {
            ...targetReg,
            status: 'approved',
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString()
        };
        saveRegistration(updatedReg);

        // 2. Promote User Role
        updateUserRole(targetReg.userId, 'KEEP');

        // 3. Reload
        loadRegistrations();
        setShowStaffModal(false);
        setTargetReg(null);
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
        <div className="max-w-6xl mx-auto p-8 no-print">
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800">住戶申請審核</h2>
                        <p className="text-gray-600 mt-2">核准住戶門號登記申請</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${filter === 'pending'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            待審核 ({getPendingRegistrations().length})
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${filter === 'all'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            全部
                        </button>
                    </div>
                </div>

                {registrations.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg font-bold">目前沒有{filter === 'pending' ? '待審核的' : ''}申請</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registrations.map(reg => {
                            const user = getAllUsers().find(u => u.id === reg.userId);
                            const isStaffApply = reg.residentId === 'STAFF_APPLY';
                            const canApprove = isStaffApply
                                ? ['MGR', 'ADMIN'].includes(currentUser.role)
                                : true; // KEEP can approve normal residents

                            return (
                                <div key={reg.id} className="border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {isStaffApply ? (
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-black text-indigo-700 flex items-center gap-2">
                                                        <span>👮</span> 申請管理員/警衛/委員身分
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadge(reg.status)}`}>
                                                        {getStatusText(reg.status)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-black text-gray-800">{reg.residentId}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadge(reg.status)}`}>
                                                        {getStatusText(reg.status)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p><span className="font-bold">申請人：</span>{user?.username || '未知'} ({user?.role})</p>
                                                <p><span className="font-bold">申請時間：</span>{new Date(reg.requestedAt).toLocaleString('zh-TW')}</p>
                                                {reg.approvedBy && (
                                                    <>
                                                        <p><span className="font-bold">審核者：</span>{getAllUsers().find(u => u.id === reg.approvedBy)?.username || '未知'}</p>
                                                        <p><span className="font-bold">審核時間：</span>{reg.approvedAt ? new Date(reg.approvedAt).toLocaleString('zh-TW') : '-'}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {reg.status === 'pending' && canApprove && (
                                            <div className="flex gap-2">
                                                {isStaffApply ? (
                                                    <button
                                                        onClick={() => confirmApproveStaff(reg)}
                                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                                                    >
                                                        ✓ 核准為 KEEP
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleApprove(reg)}
                                                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                                                    >
                                                        ✓ 核准
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleReject(reg)}
                                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                                                >
                                                    ✗ 拒絕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Staff Approval Modal */}
            {showStaffModal && targetReg && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-popIn border-2 border-indigo-100">
                        <h3 className="text-2xl font-black text-gray-800 mb-4 text-center">權限升級確認</h3>
                        <p className="text-gray-600 mb-8 text-center font-bold">
                            確定要核准 <span className="text-indigo-600">{getAllUsers().find(u => u.id === targetReg.userId)?.username}</span> 成為管理員/警衛 (KEEP) 嗎？<br />
                            <span className="text-sm text-gray-500 font-normal mt-2 block">(核准後該用戶將獲得管理系統存取權限)</span>
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowStaffModal(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={executeApproveStaff}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-95"
                            >
                                確認核准
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalPanel;
