
import React, { useState, useMemo } from 'react';
import { Resident, PaymentRecord, User } from '../types';

interface Props {
    residents: Resident[];
    payments: PaymentRecord[];
    onDeletePayment: (residentId: string, year: number, month: number) => void;
    currentUser: User;
}

interface PaymentWithResident extends PaymentRecord {
    resident: Resident;
}

const RecordDeletion: React.FC<Props> = ({
    residents,
    payments,
    onDeletePayment,
    currentUser
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ residentId: string; year: number; month: number } | null>(null);

    // Get payments from the last 3 days
    const recentPayments = useMemo(() => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);

        return payments
            .filter(p => {
                const paymentDate = new Date(p.paidAt);
                return paymentDate >= threeDaysAgo;
            })
            .map(p => ({
                ...p,
                resident: residents.find(r => r.id === p.residentId)!
            }))
            .filter(p => p.resident) // Ensure resident exists
            .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    }, [payments, residents]);

    const handleDeleteClick = (residentId: string, year: number, month: number) => {
        setDeleteTarget({ residentId, year, month });
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (deleteTarget) {
            onDeletePayment(deleteTarget.residentId, deleteTarget.year, deleteTarget.month);
            setShowDeleteDialog(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-800">清除繳費紀錄</h2>
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm font-bold text-red-700">僅限 MGR/ADMIN</span>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-700 mb-4">
                        最近三天的繳費紀錄
                        <span className="ml-3 text-sm font-bold text-indigo-600">
                            ({recentPayments.length} 筆)
                        </span>
                    </h3>
                </div>

                {recentPayments.length > 0 ? (
                    <div className="space-y-4">
                        {recentPayments.map((payment, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-red-300 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-gray-800">
                                                {payment.resident.addressNumber}號 {payment.resident.floor}樓
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                登記日期: {new Date(payment.paidAt).toLocaleDateString('zh-TW')}
                                            </span>
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                                {payment.year}年{payment.month}月
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="bg-white p-3 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">管理費期間</div>
                                                <div className="font-bold text-sm text-gray-700">
                                                    {payment.prevManagementStart} ~ {payment.nextManagementStart}
                                                </div>
                                                <div className="text-xs text-indigo-600 font-bold mt-1">
                                                    ${payment.managementFee.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">機車費期間</div>
                                                <div className="font-bold text-sm text-gray-700">
                                                    {payment.prevMotorcycleStart} ~ {payment.nextMotorcycleStart}
                                                </div>
                                                <div className="text-xs text-purple-600 font-bold mt-1">
                                                    ${payment.motorcycleFee.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">汽車費期間</div>
                                                <div className="font-bold text-sm text-gray-700">
                                                    {payment.prevCarStart} ~ {payment.nextCarStart}
                                                </div>
                                                <div className="text-xs text-blue-600 font-bold mt-1">
                                                    ${payment.carFee.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                            <span className="text-gray-600 font-bold">總計</span>
                                            <span className="text-2xl font-black text-gray-800">
                                                ${payment.total.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteClick(payment.residentId, payment.year, payment.month)}
                                        className="ml-6 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-md"
                                        title="刪除此紀錄"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-bold">最近三天無繳費紀錄</p>
                    </div>
                )}
            </div>

            {/* Delete Single Record Dialog */}
            {showDeleteDialog && deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-red-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-gray-800">確認刪除</h3>
                        </div>

                        <p className="text-gray-700 font-bold mb-6 leading-relaxed">
                            確定要刪除此繳費紀錄嗎？
                            <br />
                            <span className="text-red-600">{deleteTarget.year}年{deleteTarget.month}月</span>
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowDeleteDialog(false);
                                    setDeleteTarget(null);
                                }}
                                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecordDeletion;
