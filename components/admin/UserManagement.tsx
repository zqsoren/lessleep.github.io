import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

interface User {
    id: number;
    username: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    remaining_credits: number;
    total_generations: number;
    monthly_generations: number;
    created_at: string;
    last_login?: string;
}

interface RechargeRecord {
    id: number;
    order_number: string;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Recharge modal
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);

    useEffect(() => {
        fetchUsers();
    }, [search, statusFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
            });

            const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (userId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleViewRecharge = async (userId: number) => {
        setSelectedUserId(userId);
        setShowRechargeModal(true);

        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/recharge`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRechargeRecords(data.records);
            }
        } catch (error) {
            console.error('Failed to fetch recharge records:', error);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">用户管理</h1>
                <p className="text-slate-500">管理系统用户、查看用户信息和充值记录</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">搜索</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="用户名/手机号/邮箱"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">账号状态</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        >
                            <option value="">全部</option>
                            <option value="active">启用</option>
                            <option value="disabled">禁用</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
                            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            重置筛选
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">用户名</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">邮箱</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">手机号</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">剩余生图数</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">累计生图</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">本月生图</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">会员充值</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">账号状态</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">注册时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        加载中...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                        暂无数据
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-900">{user.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.username}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900 font-mono">{user.remaining_credits}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{user.total_generations}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{user.monthly_generations}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => handleViewRecharge(user.id)}
                                                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                                            >
                                                查看记录
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => handleStatusToggle(user.id, user.status)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {user.status === 'active' ? '启用' : '禁用'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(user.created_at).toLocaleDateString('zh-CN')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            上一页
                        </button>
                        <span className="text-sm text-slate-600">
                            第 {page} 页 / 共 {totalPages} 页
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>

            {/* Recharge Modal */}
            {showRechargeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-500">
                            <h3 className="text-lg font-bold text-white">充值记录</h3>
                            <button
                                onClick={() => setShowRechargeModal(false)}
                                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {rechargeRecords.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                                    <p>暂无充值记录</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">订单号</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">金额</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">支付方式</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">状态</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">充值时间</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {rechargeRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm font-mono text-slate-600">{record.order_number}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-slate-900">¥{record.amount}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{record.payment_method}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {new Date(record.created_at).toLocaleString('zh-CN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
