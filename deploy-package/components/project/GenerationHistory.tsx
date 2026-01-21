import React, { useState, useEffect } from 'react';

interface GenerationRecord {
    id: string;
    url: string;
    generatedTime: string;
    prompt?: string;
}

interface GenerationHistoryProps {
    projectId: number;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({ projectId }) => {
    const [records, setRecords] = useState<GenerationRecord[]>([]);
    const [showPopup, setShowPopup] = useState<string | null>(null);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = () => {
        try {
            const stored = localStorage.getItem('generation_history');
            if (stored) {
                const allRecords: GenerationRecord[] = JSON.parse(stored);
                // 仅保留最近20条
                setRecords(allRecords.slice(0, 20));
            }
        } catch (e) {
            console.error('Failed to load generation history', e);
        }
    };

    const handleSaveToProject = (record: GenerationRecord) => {
        try {
            // 添加到设计分析图
            const analysisKey = `project_${projectId}_analysis`;
            const stored = localStorage.getItem(analysisKey);
            const existingImages = stored ? JSON.parse(stored) : [];

            // 检查是否已存在(避免重复)
            const exists = existingImages.some((img: any) => img.url === record.url);
            if (exists) {
                alert('该图片已存在于项目中');
                setShowPopup(null);
                return;
            }

            // 添加新图片
            const newImage = {
                id: Date.now().toString(),
                projectId,
                category: 'all',
                url: record.url,
                generatedTime: record.generatedTime,
            };

            const updatedImages = [...existingImages, newImage];
            localStorage.setItem(analysisKey, JSON.stringify(updatedImages));

            alert('已保存至项目');
            setShowPopup(null);
        } catch (e) {
            console.error('Failed to save to project', e);
            alert('保存失败,请重试');
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 60) return `${minutes}分钟前`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
        return `${Math.floor(minutes / 1440)}天前`;
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">

                {/* 提示信息 */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <i className="fa-solid fa-info-circle text-google-blue text-lg mt-0.5"></i>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-800 mb-1">生图历史</h3>
                        <p className="text-xs text-slate-600">仅展示最近20条AI生图记录,点击可保存至项目</p>
                    </div>
                </div>

                {/* 卡片网格 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {records.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => setShowPopup(record.id)}
                            className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all hover:ring-2 hover:ring-google-blue"
                        >
                            {/* 图片背景 */}
                            <img
                                src={record.url}
                                alt="生图记录"
                                className="w-full h-full object-cover"
                            />

                            {/* 右下角时间 */}
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-[10px]">
                                {formatTime(record.generatedTime)}
                            </div>

                            {/* 操作弹窗 */}
                            {showPopup === record.id && (
                                <div
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="bg-white rounded-xl p-4 shadow-2xl animate-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => handleSaveToProject(record)}
                                            className="px-6 py-3 bg-google-blue text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <i className="fa-solid fa-download"></i>
                                            保存至项目
                                        </button>
                                        <button
                                            onClick={() => setShowPopup(null)}
                                            className="mt-2 w-full px-6 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* 空状态 */}
                    {records.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                            <i className="fa-solid fa-clock-rotate-left text-5xl mb-4 opacity-50"></i>
                            <p className="text-sm">暂无生图历史</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerationHistory;
