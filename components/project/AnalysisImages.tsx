import React, { useState, useEffect } from 'react';

interface AnalysisImage {
    id: string;
    projectId: number;
    category: string;
    url: string;
    generatedTime: string;
}

interface AnalysisImagesProps {
    projectId: number;
    onOpenGenerator: () => void;
    onOpenEditor: (imageUrl: string) => void;
}

const CATEGORIES = [
    { id: 'all', label: '全部' },
    { id: 'pre', label: '前期分析' },
    { id: 'scheme', label: '方案分析' },
    { id: 'tech', label: '技术分析' },
    { id: 'render', label: '效果图' },
    { id: 'drawing', label: '技术图纸' },
];

const AnalysisImages: React.FC<AnalysisImagesProps> = ({
    projectId,
    onOpenGenerator,
    onOpenEditor
}) => {
    const [images, setImages] = useState<AnalysisImage[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        loadImages();
    }, [projectId]);

    const loadImages = () => {
        try {
            const stored = localStorage.getItem(`project_${projectId}_analysis`);
            if (stored) {
                setImages(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load analysis images', e);
        }
    };

    const filteredImages = activeCategory === 'all'
        ? images
        : images.filter(img => img.category === activeCategory);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 60) return `${minutes}分钟前`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
        return `${Math.floor(minutes / 1440)}天前`;
    };

    const getCategoryLabel = (categoryId: string) => {
        return CATEGORIES.find(c => c.id === categoryId)?.label || '全部';
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">

                {/* 分类筛选栏 */}
                <div className="mb-6 flex gap-3 flex-wrap">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`
                px-4 py-2 rounded-full text-sm font-bold transition-all
                ${activeCategory === category.id
                                    ? 'bg-google-blue text-white shadow-md'
                                    : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
                                }
              `}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* 卡片网格 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                    {/* 加号绘制卡 */}
                    <button
                        onClick={onOpenGenerator}
                        className="aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-google-blue hover:text-google-blue hover:bg-blue-50/30 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-all mb-3 shadow-sm">
                            <i className="fa-solid fa-plus text-2xl"></i>
                        </div>
                        <span className="text-sm font-bold">去AI绘图</span>
                    </button>

                    {/* 分析图卡片 */}
                    {filteredImages.map((image) => (
                        <div
                            key={image.id}
                            className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all"
                        >
                            {/* 图片背景 */}
                            <img
                                src={image.url}
                                alt="分析图"
                                className="w-full h-full object-cover"
                            />

                            {/* 左上角分类标签 */}
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                                {getCategoryLabel(image.category)}
                            </div>

                            {/* Hover编辑图标 */}
                            <div
                                onClick={() => onOpenEditor(image.url)}
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                    <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                        <i className="fa-solid fa-pen text-google-blue text-xl"></i>
                                    </div>
                                    <p className="text-white text-xs font-bold text-center mt-2">编辑</p>
                                </div>
                            </div>

                            {/* 右下角时间 */}
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-[10px]">
                                {formatTime(image.generatedTime)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalysisImages;
