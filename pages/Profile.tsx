import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// API 地址配置
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface UserStats {
    totalGenerations: number;
    remainingCredits: number;
    membershipDays: number;
    monthlyGenerations: number;
}

interface ProfileProps {
    onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences'>('info');
    const [stats, setStats] = useState<UserStats>({
        totalGenerations: 0,
        remainingCredits: 0,
        membershipDays: 0,
        monthlyGenerations: 0,
    });

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: '',
        bio: '',
    });

    const [avatarPreview, setAvatarPreview] = useState<string>(
        user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/user/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats({
                    totalGenerations: data.totalGenerations || 0,
                    remainingCredits: data.remainingQuota || 0,
                    membershipDays: 365,
                    monthlyGenerations: data.monthlyGenerations || 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('保存成功！');
            } else {
                alert('保存失败，请重试');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fa-solid fa-images text-2xl opacity-80"></i>
                                    <span className="text-xs opacity-80">累计</span>
                                </div>
                                <div className="text-3xl font-bold">{stats.totalGenerations.toLocaleString()}</div>
                                <div className="text-xs opacity-80 mt-1">总生图数</div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fa-solid fa-coins text-2xl opacity-80"></i>
                                    <span className="text-xs opacity-80">可用</span>
                                </div>
                                <div className="text-3xl font-bold">{stats.remainingCredits.toLocaleString()}</div>
                                <div className="text-xs opacity-80 mt-1">剩余积分</div>
                            </div>

                            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fa-solid fa-crown text-2xl opacity-80"></i>
                                    <span className="text-xs opacity-80">会员</span>
                                </div>
                                <div className="text-3xl font-bold">{stats.membershipDays}</div>
                                <div className="text-xs opacity-80 mt-1">剩余天数</div>
                            </div>
                        </div>

                        {/* Avatar Upload */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">头像</h3>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                                    />
                                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors shadow-lg">
                                        <i className="fa-solid fa-camera text-white text-xs"></i>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div>
                                    <p className="text-slate-600 text-sm mb-2">点击相机图标上传新头像</p>
                                    <p className="text-slate-400 text-xs">支持 JPG、PNG 格式，最大 2MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Form */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">基本信息</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        placeholder="请输入用户名"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        placeholder="请输入邮箱"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">手机号</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        placeholder="请输入手机号"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">个人简介</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="介绍一下自己吧..."
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {saving ? '保存中...' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">账号安全</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">当前密码</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    placeholder="请输入当前密码"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">新密码</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    placeholder="请输入新密码"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">确认新密码</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    placeholder="请再次输入新密码"
                                />
                            </div>
                            <button className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                修改密码
                            </button>
                        </div>
                    </div>
                );

            case 'preferences':
                return (
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">偏好设置</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-800">邮件通知</div>
                                    <div className="text-sm text-slate-500">接收系统邮件通知</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-800">自动保存</div>
                                    <div className="text-sm text-slate-500">自动保存生成的图片</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8 overflow-y-auto">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span className="font-medium">返回</span>
                </button>
                <h1 className="text-4xl font-bold text-slate-800">个人中心</h1>
                <p className="text-slate-500 mt-2">管理你的账号信息和偏好设置</p>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-2xl p-4 shadow-lg">
                            <nav className="space-y-2">
                                {[
                                    { id: 'info', icon: 'fa-user', label: '个人信息' },
                                    { id: 'security', icon: 'fa-shield-halved', label: '账号安全' },
                                    { id: 'preferences', icon: 'fa-sliders', label: '偏好设置' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <i className={`fa-solid ${tab.icon}`}></i>
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-9">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
