import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// API 地址配置
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface Package {
    id: string;
    name: string;
    price: number;
    credits: number;
    features: string[];
    recommended?: boolean;
}

interface RechargeRecord {
    id: number;
    order_number: string;
    amount: number;
    credits: number;
    payment_method: string;
    status: string;
    created_at: string;
}

const packages: Package[] = [
    {
        id: 'starter',
        name: '尝鲜版',
        price: 2.99,
        credits: 50,
        features: ['AI绘图', '尝鲜体验', '不浪费'],
    },
    {
        id: 'popular',
        name: '畅享版',
        price: 9.9,
        credits: 200,
        features: ['AI绘图', '项目全套图', '积分不过期'],
        recommended: true,
    },
    {
        id: 'pro',
        name: '无忧版',
        price: 29.9,
        credits: 800,
        features: ['AI绘图', '长期稳定使用', '低至0.3元/张'],
    },
];

interface RechargeProps {
    onBack: () => void;
}

const Recharge: React.FC<RechargeProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [selectedPackage, setSelectedPackage] = useState<string>('popular');
    const [paymentMethod, setPaymentMethod] = useState<string>('wechat');
    const [records, setRecords] = useState<RechargeRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRechargeRecords();
    }, []);

    const fetchRechargeRecords = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/user/recharge-records`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
            }
        } catch (error) {
            console.error('Failed to fetch recharge records:', error);
        }
    };

    const handleRecharge = async (packageId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/user/recharge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    package_id: packageId,
                    payment_method: paymentMethod
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert('充值订单已创建！订单号：' + data.order_number);
                fetchRechargeRecords();
            } else {
                alert('充值失败，请重试');
            }
        } catch (error) {
            console.error('Recharge error:', error);
            alert('充值失败，请重试');
        } finally {
            setLoading(false);
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
                <h1 className="text-4xl font-bold text-slate-800">充值中心</h1>
                <p className="text-slate-500 mt-2">选择适合你的套餐，开启AI创作之旅</p>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Package Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 ${selectedPackage === pkg.id
                                ? 'border-purple-500 scale-105'
                                : 'border-transparent hover:border-purple-200'
                                }`}
                            onClick={() => setSelectedPackage(pkg.id)}
                        >
                            {pkg.recommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                                        推荐
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{pkg.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        ¥{pkg.price}
                                    </span>
                                </div>
                                <p className="text-slate-500 mt-2">{pkg.credits} 积分</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {pkg.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2 text-slate-600">
                                        <i className="fa-solid fa-check text-green-500"></i>
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecharge(pkg.id);
                                }}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? '处理中...' : '立即充值'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">支付方式</h3>
                    <div className="flex gap-4">
                        {[
                            { id: 'wechat', name: '微信支付', icon: 'fa-brands fa-weixin', color: 'text-green-500' },
                            { id: 'alipay', name: '支付宝', icon: 'fa-brands fa-alipay', color: 'text-blue-500' },
                            { id: 'card', name: '银行卡', icon: 'fa-solid fa-credit-card', color: 'text-purple-500' },
                        ].map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${paymentMethod === method.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-200'
                                    }`}
                            >
                                <i className={`${method.icon} ${method.color} text-xl`}></i>
                                <span className="font-medium text-slate-700">{method.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recharge History */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">充值记录</h3>
                    {records.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                            <p>暂无充值记录</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">时间</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">订单号</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">金额</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">积分</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {new Date(record.created_at).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-slate-600">{record.order_number}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-800">¥{record.amount}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{record.credits}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    {record.status === 'completed' ? '已完成' : record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recharge;
