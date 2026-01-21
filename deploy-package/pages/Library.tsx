import React from 'react';

const Library: React.FC = () => {
    return (
        <div className="flex-1 h-screen flex flex-col items-center justify-center bg-surface-50 p-8">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-google-blue text-4xl mb-4 shadow-sm animate-bounce">
                <i className="fa-solid fa-layer-group"></i>
            </div>
            <h1 className="text-2xl font-display font-medium text-slate-800 mb-2">素材库 (Library)</h1>
            <p className="text-slate-500 text-sm mb-6">管理您的项目素材、贴图和模型资产。</p>
            <button className="px-6 py-2 bg-white border border-gray-200 rounded-full font-bold text-slate-600 hover:bg-gray-50 flex items-center gap-2 transition-all">
                <i className="fa-solid fa-cloud-arrow-up"></i> 上传素材
            </button>
        </div>
    );
};

export default Library;
