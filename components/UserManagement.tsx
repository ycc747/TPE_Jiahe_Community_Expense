import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getAllUsers, saveUser, deleteUser, updateUserRole, hashPassword, getUserRegistrations } from '../utils/auth';

interface Props {
    currentUser: User;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('EXT');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string, username: string } | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        setUsers(getAllUsers());
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (users.some(u => u.username === newUsername)) {
            setError('帳號已存在');
            return;
        }

        try {
            const newUser: User = {
                id: `user-${newUsername.toLowerCase()}-${Date.now()}`,
                username: newUsername,
                passwordHash: await hashPassword(newPassword),
                role: newRole,
                registeredAddresses: [],
                createdAt: new Date().toISOString()
            };

            saveUser(newUser);
            setSuccess(`成功新增使用者 ${newUsername} (${newRole})`);
            setNewUsername('');
            setNewPassword('');
            loadUsers();
        } catch (err) {
            setError('新增失敗');
        }
    };

    const handleDeleteClick = (userId: string, username: string) => {
        setUserToDelete({ id: userId, username });
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            setSuccess(`已刪除使用者 ${userToDelete.username}`);
            setUserToDelete(null);
            setShowDeleteModal(false);
            loadUsers();
        }
    };

    const handleRoleChange = (userId: string, username: string, newRole: UserRole) => {
        updateUserRole(userId, newRole);
        setSuccess(`已將使用者 ${username} 的權限更改為 ${newRole}`);
        loadUsers();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="text-xs text-green-600 font-bold ml-1 bg-green-50 px-1 rounded">(已核准)</span>;
            case 'pending': return <span className="text-xs text-yellow-600 font-bold ml-1 bg-yellow-50 px-1 rounded">(待核准)</span>;
            case 'rejected': return <span className="text-xs text-red-600 font-bold ml-1 bg-red-50 px-1 rounded">(已退件)</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-black text-gray-800 mb-8">帳號權限管理</h1>

                {/* Add New User Section */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
                        <span>➕</span> 新增管理人員 / 住戶
                    </h2>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-bounce">
                            <p className="text-red-700 font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                            <p className="text-green-700 font-bold">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">帳號</label>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                                placeholder="輸入帳號"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">密碼</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                                placeholder="輸入密碼"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">角色權限</label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as UserRole)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="MGR">經理 (MGR)</option>
                                <option value="KEEP">委員 (KEEP)</option>
                                <option value="EXT">住戶 (EXT)</option>
                                <option value="ADMIN">管理員 (ADMIN)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 h-[52px]"
                        >
                            新增帳號
                        </button>
                    </form>
                </div>

                {/* User List Section */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-8 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800">現有帳號列表</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-500">帳號</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-500">角色</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-500">已登記門號</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-500">建立時間</th>
                                    <th className="py-4 px-6 text-right text-sm font-bold text-gray-500">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => {
                                    const registrations = getUserRegistrations(user.id);

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-800">{user.username}</td>
                                            <td className="py-4 px-6">
                                                {user.id === currentUser.id ? (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200">
                                                        ADMIN (您)
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, user.username, e.target.value as UserRole)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500' :
                                                            user.role === 'MGR' ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500' :
                                                                user.role === 'KEEP' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' :
                                                                    'bg-green-50 text-green-700 border-green-200 focus:ring-green-500'
                                                            }`}
                                                    >
                                                        <option value="EXT">住戶 (EXT)</option>
                                                        <option value="KEEP">委員 (KEEP)</option>
                                                        <option value="MGR">經理 (MGR)</option>
                                                        <option value="ADMIN">管理員 (ADMIN)</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                {registrations.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {registrations.map(reg => (
                                                            <div key={reg.id} className="text-sm">
                                                                <span className="font-bold text-gray-700">{reg.residentId.replace(/-/g, '號 ')}樓</span>
                                                                {getStatusBadge(reg.status)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">無登記紀錄</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {user.id !== currentUser.id && ( // Protect self
                                                    <button
                                                        onClick={() => handleDeleteClick(user.id, user.username)}
                                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors border border-red-200 text-sm"
                                                    >
                                                        刪除
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Custom Modal for Delete Confirmation */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-popIn border-2 border-red-100">
                        <h3 className="text-2xl font-black text-gray-800 mb-4 text-center">刪除確認</h3>
                        <p className="text-gray-600 mb-8 text-center font-bold">
                            確定要刪除使用者 <span className="text-red-600">{userToDelete.username}</span> 嗎？<br />
                            <span className="text-sm text-gray-500 font-normal mt-2 block">(此操作無法復原)</span>
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg transition-transform active:scale-95"
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

export default UserManagement;
