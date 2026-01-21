import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { login, register, sendVerificationCode } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

    // Login form
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register form
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regCode, setRegCode] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(loginUsername, loginPassword);

        setIsLoading(false);

        if (result.success) {
            onClose();
            resetForms();
        } else {
            setError(result.error || '登录失败');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await register(regUsername, regEmail, regPassword, regCode);

        setIsLoading(false);

        if (result.success) {
            onClose();
            resetForms();
        } else {
            setError(result.error || '注册失败');
        }
    };

    const handleSendCode = async () => {
        if (!regEmail) {
            setError('请输入邮箱');
            return;
        }

        setError('');
        setIsLoading(true);

        const result = await sendVerificationCode(regEmail);

        setIsLoading(false);

        if (result.success) {
            setCodeSent(true);
            setCountdown(60);

            // Development only: show code in console
            if (result.code) {
                console.log('验证码:', result.code);
                alert(`验证码已发送(开发模式): ${result.code}`);
            }

            // Countdown
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCodeSent(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setError(result.error || '发送验证码失败');
        }
    };

    const resetForms = () => {
        setLoginUsername('');
        setLoginPassword('');
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegCode('');
        setError('');
        setCodeSent(false);
        setCountdown(0);
    };

    const handleClose = () => {
        resetForms();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-google-blue via-google-red to-google-yellow p-6 flex items-center justify-between">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-1">欢迎来到 Zzzap</h2>
                        <p className="text-white/80 text-sm">Architectural AI Studio</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="relative z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => {
                            setActiveTab('login');
                            setError('');
                        }}
                        className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'login' ? 'text-google-blue' : 'text-slate-500'
                            }`}
                    >
                        登录
                        {activeTab === 'login' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-google-blue"></div>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('register');
                            setError('');
                        }}
                        className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'register' ? 'text-google-blue' : 'text-slate-500'
                            }`}
                    >
                        注册
                        {activeTab === 'register' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-google-blue"></div>
                        )}
                    </button>
                </div>

                {/* Forms */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {activeTab === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                                <input
                                    type="text"
                                    value={loginUsername}
                                    onChange={(e) => setLoginUsername(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-google-blue focus:border-transparent outline-none transition-all"
                                    placeholder="请输入用户名"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-google-blue focus:border-transparent outline-none transition-all"
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-google-blue to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? '登录中...' : '登录'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                                <input
                                    type="text"
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-google-blue focus:border-transparent outline-none transition-all"
                                    placeholder="请输入用户名"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                                <input
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-google-blue focus:border-transparent outline-none transition-all"
                                    placeholder="请输入邮箱"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                                <input
                                    type="password"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-google-blue focus:border-transparent outline-none transition-all"
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">验证码</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={regCode}
                                        onChange={(e) => setRegCode(e.target.value)}
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-google-blue focus:border-transparent outline-none transition-all"
                                        placeholder="请输入验证码"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={codeSent || isLoading}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {codeSent ? `${countdown}s` : '获取验证码'}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-google-blue to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? '注册中...' : '注册'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
