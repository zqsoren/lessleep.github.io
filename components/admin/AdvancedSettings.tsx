import React from 'react';

const AdvancedSettings: React.FC = () => {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">高级设置</h1>
                <p className="text-slate-500">系统配置和高级选项</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center py-20 text-slate-400">
                    <i className="fa-solid fa-sliders text-6xl mb-6"></i>
                    <h3 className="text-xl font-bold text-slate-600 mb-2">高级设置</h3>
                    <p className="text-slate-500">此功能正在开发中...</p>
                    <p className="text-sm text-slate-400 mt-2">
                        未来将包含: 系统配置、默认参数、邮件设置等
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSettings;
