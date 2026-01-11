import React, { useState } from 'react';
import { getUserByUsername, verifyPassword, setCurrentUser, initializeDefaultUsers, registerUser } from '../utils/auth';

interface Props {
    onLoginSuccess: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    React.useEffect(() => {
        // Initialize admin user on mount
        initializeDefaultUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Handle Registration
                try {
                    const newUser = await registerUser(username, password);
                    // Auto login after registration
                    setCurrentUser(newUser);
                    onLoginSuccess();
                } catch (err: any) {
                    setError(err.message || '註冊失敗');
                    setLoading(false);
                }
            } else {
                // Handle Login
                const user = getUserByUsername(username);

                if (!user) {
                    setError('使用者不存在');
                    setLoading(false);
                    return;
                }

                const isValid = await verifyPassword(password, user.passwordHash);

                if (!isValid) {
                    setError('密碼錯誤');
                    setLoading(false);
                    return;
                }

                // Login successful
                setCurrentUser(user);
                onLoginSuccess();
            }
        } catch (err) {
            setError(isRegistering ? '註冊失敗' : '登入失敗，請稍後再試');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-gray-800 mb-2">台北市嘉禾社區</h1>
                        <p className="text-gray-600 font-medium">費用管理系統</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                            <p className="text-red-700 text-sm font-bold">⚠️ {error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-700">
                                {isRegistering ? '註冊新帳號' : '住戶登入'}
                            </h2>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                帳號
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder={isRegistering ? "請設定您的帳號" : "請輸入帳號"}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                密碼
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder={isRegistering ? "請設定您的密碼" : "請輸入密碼"}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (isRegistering ? '註冊中...' : '登入中...') : (isRegistering ? '確認註冊' : '登入')}
                        </button>

                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setError('');
                                    setUsername('');
                                    setPassword('');
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                            >
                                {isRegistering ? '已有帳號？返回登入' : '第一次使用？註冊新帳號'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-center text-gray-500">
                            <span className="font-bold">測試帳號：</span>admin / admin123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
