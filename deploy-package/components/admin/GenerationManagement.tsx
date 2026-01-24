import React, { useState, useEffect } from 'react';

// API 地址配置：使用环境变量，生产环境使用 .env.production
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

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

    const [selectedRecord, setSelectedRecord] = useState<GenerationRecord | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, [page]);

    const fetchRecords = async () => {
        // ... existing fetch logic ...
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

    const handleViewDetail = (record: GenerationRecord) => {
        setSelectedRecord(record);
        setShowDetailModal(true);
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        加载中...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => handleViewDetail(record)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                详情
                                            </button>
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

            {/* Detail Modal */}
            {showDetailModal && selectedRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-slate-800">生成详情 (ID: {selectedRecord.id})</h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* 1. Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">User Description</span>
                                    <p className="text-sm text-slate-800">{(selectedRecord as any).user_desc || '-'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Aspect Ratio</span>
                                    <p className="text-sm text-slate-800">{(selectedRecord as any).aspect_ratio || '-'}</p>
                                </div>
                            </div>

                            {/* 2. Advanced Settings */}
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Advanced Settings (User Selection)</span>
                                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-slate-200">
                                    {(selectedRecord as any).advanced_settings || '-'}
                                </pre>
                            </div>

                            {/* 3. Base JSON */}
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Base JSON (Template Base)</span>
                                <pre className="text-xs text-slate-600 overflow-x-auto font-mono bg-white p-3 rounded-lg border border-slate-200 max-h-40">
                                    {(selectedRecord as any).base_json || '-'}
                                </pre>
                            </div>

                            {/* 4. Full Prompt */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <span className="text-xs font-bold text-blue-400 uppercase block mb-1">Full Prompt (Sent to Gemini Step 1)</span>
                                <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-blue-100 max-h-60 overflow-y-auto">
                                    {(selectedRecord as any).full_prompt || '-'}
                                </pre>
                            </div>

                            {/* 5. Final JSON Instruction */}
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <span className="text-xs font-bold text-green-600 uppercase block mb-1">Optimized JSON (Gemini Output &rarr; Image Gen)</span>
                                <pre className="text-xs text-green-900 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-green-100 max-h-60 overflow-y-auto">
                                    {selectedRecord.prompt || '-'}
                                </pre>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-6 py-2 bg-white border border-gray-300 text-slate-700 font-medium rounded-xl hover:bg-gray-50 shadow-sm"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerationManagement;
