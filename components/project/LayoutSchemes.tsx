import React, { useState, useEffect } from 'react';

interface LayoutScheme {
    id: string;
    projectId: number;
    name: string;
    thumbnail: string;
    canvasData: any;
    lastEditTime: string;
}

interface LayoutSchemesProps {
    projectId: number;
    onOpenEditor: (layoutData?: any) => void;
}

const LayoutSchemes: React.FC<LayoutSchemesProps> = ({ projectId, onOpenEditor }) => {
    const [schemes, setSchemes] = useState<LayoutScheme[]>([]);

    useEffect(() => {
        loadSchemes();

        // 监听storage事件,实现双向联动
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === `project_${projectId}_layouts`) {
                loadSchemes();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [projectId]);

    const loadSchemes = () => {
        try {
            const stored = localStorage.getItem(`project_${projectId}_layouts`);
            if (stored) {
                setSchemes(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load layout schemes', e);
        }
    };

    const handleNewLayout = () => {
        // 创建新排版方案
        const newScheme: LayoutScheme = {
            id: Date.now().toString(),
            projectId,
            name: `排版方案${schemes.length + 1}`,
            thumbnail: '',
            canvasData: null,
            lastEditTime: new Date().toISOString(),
        };

        const updatedSchemes = [...schemes, newScheme];
        setSchemes(updatedSchemes);
        localStorage.setItem(`project_${projectId}_layouts`, JSON.stringify(updatedSchemes));

        // 跳转到编辑器
        onOpenEditor({ layoutId: newScheme.id, layoutName: newScheme.name });
    };

    const handleEditLayout = (scheme: LayoutScheme) => {
        onOpenEditor({
            layoutId: scheme.id,
            layoutName: scheme.name,
            canvasData: scheme.canvasData,
        });
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                    {/* 加号新建卡 */}
                    <button
                        onClick={handleNewLayout}
                        className="aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-google-blue hover:text-google-blue hover:bg-blue-50/30 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-all mb-3 shadow-sm">
                            <i className="fa-solid fa-plus text-2xl"></i>
                        </div>
                        <span className="text-sm font-bold">新建排版方案</span>
                    </button>

                    {/* 排版方案卡片 */}
                    {schemes.map((scheme) => (
                        <div
                            key={scheme.id}
                            onClick={() => handleEditLayout(scheme)}
                            className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all bg-white border border-gray-100"
                        >
                            {/* 缩略图背景 */}
                            {scheme.thumbnail ? (
                                <img
                                    src={scheme.thumbnail}
                                    alt={scheme.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                    <i className="fa-solid fa-layer-group text-4xl text-gray-300"></i>
                                </div>
                            )}

                            {/* Hover编辑图标 */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                    <i className="fa-solid fa-pencil text-google-blue text-sm"></i>
                                </div>
                            </div>

                            {/* 底部信息 */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3">
                                <h3 className="text-sm font-bold text-slate-800 truncate mb-1">{scheme.name}</h3>
                                <p className="text-xs text-slate-400">{formatTime(scheme.lastEditTime)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LayoutSchemes;
