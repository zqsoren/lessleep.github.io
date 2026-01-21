import React, { useState, useEffect } from 'react';

// API 地址配置：使用环境变量，生产环境使用 .env.production
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface PromptTemplate {
    id: number;
    category_id: string;
    subtype_id: string;
    style_id: string;
    style_name: string;
    prompt: string;
    updated_at: string;
}

const PromptManagement: React.FC = () => {
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/admin/prompts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPrompts(data.prompts);
            }
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrompt = async () => {
        if (!selectedPrompt) return;

        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`${API_URL}/api/admin/prompts/${selectedPrompt.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: editedPrompt })
            });

            if (response.ok) {
                alert('提示词更新成功!');
                fetchPrompts();
                setSelectedPrompt(null);
            }
        } catch (error) {
            console.error('Failed to update prompt:', error);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">提示词管理</h1>
                <p className="text-slate-500">管理系统提示词模板</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Left: Prompt List */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">提示词列表</h3>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-12 text-slate-500">
                                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                    加载中...
                                </div>
                            ) : prompts.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    暂无提示词模板
                                </div>
                            ) : (
                                prompts.map((prompt) => (
                                    <button
                                        key={prompt.id}
                                        onClick={() => {
                                            setSelectedPrompt(prompt);
                                            setEditedPrompt(prompt.prompt);
                                        }}
                                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedPrompt?.id === prompt.id
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="font-medium text-slate-900">{prompt.style_name}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {prompt.category_id} / {prompt.subtype_id}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Edit Area */}
                    <div>
                        {selectedPrompt ? (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">编辑提示词</h3>
                                <div className="mb-4">
                                    <div className="text-sm text-slate-600 mb-2">
                                        <strong>名称:</strong> {selectedPrompt.style_name}
                                    </div>
                                    <div className="text-sm text-slate-600 mb-2">
                                        <strong>分类:</strong> {selectedPrompt.category_id} / {selectedPrompt.subtype_id}
                                    </div>
                                </div>
                                <textarea
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
                                    className="w-full h-[400px] px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                                    placeholder="输入提示词..."
                                />
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleUpdatePrompt}
                                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        <i className="fa-solid fa-save mr-2"></i>
                                        更新提示词
                                    </button>
                                    <button
                                        onClick={() => setSelectedPrompt(null)}
                                        className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <div className="text-center">
                                    <i className="fa-solid fa-hand-pointer text-4xl mb-4"></i>
                                    <p>请从左侧选择一个提示词进行编辑</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptManagement;
