import React, { useState, useEffect } from 'react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

interface GenerationRecord {
    id: number;
    user_id: number;
    username: string;
    category_id?: string;
    subtype_id?: string;
    style_id?: string;
    prompt?: string;
    image_url?: string;
    status: string;
    created_at: string;
}

const GenerationManagement: React.FC = () => {
    const [records, setRecords] = useState<GenerationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchRecords();
    }, [page]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/admin/generations?page=${page}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRecords(data.records);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">图片生成管理</h1>
                <p className="text-slate-500">查看所有用户的图片生成记录</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">用户名</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">图片链接</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">提示词</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">生成时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        加载中...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        暂无生成记录
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-900">{record.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.username}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {record.image_url ? (
                                                <a
                                                    href={`http://localhost:3001${record.image_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center gap-2"
                                                >
                                                    <i className="fa-solid fa-image"></i>
                                                    查看图片
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={record.prompt || ''}>
                                            {record.prompt || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(record.created_at).toLocaleString('zh-CN')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                        >
                            上一页
                        </button>
                        <span className="text-sm text-slate-600">第 {page} 页 / 共 {totalPages} 页</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerationManagement;
