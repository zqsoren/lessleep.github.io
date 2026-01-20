import React, { useState, useEffect } from 'react';
import DesignFiles from '../components/project/DesignFiles';
import AnalysisImages from '../components/project/AnalysisImages';
import LayoutSchemes from '../components/project/LayoutSchemes';
import GenerationHistory from '../components/project/GenerationHistory';

interface ProjectDetailProps {
    projectId: number;
    projectName: string;
    onBack: () => void;
    onOpenGenerator: (imageUrl?: string) => void;
    onOpenEditor: (layoutData?: any) => void;
}

type TabId = 'files' | 'analysis' | 'layouts' | 'history';

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'files', label: '设计文件', icon: 'fa-folder-open' },
    { id: 'analysis', label: '设计分析图', icon: 'fa-chart-pie' },
    { id: 'layouts', label: '方案排版', icon: 'fa-layer-group' },
    { id: 'history', label: '生图历史', icon: 'fa-clock-rotate-left' },
];

const ProjectDetail: React.FC<ProjectDetailProps> = ({
    projectId,
    projectName,
    onBack,
    onOpenGenerator,
    onOpenEditor
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('files');

    return (
        <div className="flex-1 h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">

            {/* Left Tab Bar - 竖向排列 */}
            <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
                {/* Header */}
                <div className="h-20 border-b border-gray-100 flex items-center px-6 shrink-0">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 flex items-center justify-center text-slate-600 hover:text-google-blue transition-all mr-4 group"
                    >
                        <i className="fa-solid fa-arrow-left text-lg group-hover:scale-110 transition-transform"></i>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold text-slate-800 truncate">{projectName}</h1>
                        <p className="text-xs text-slate-400 font-medium">项目管理</p>
                    </div>
                </div>

                {/* Tabs - 竖向 */}
                <nav className="flex-1 p-5 space-y-3 overflow-y-auto">
                    {TABS.map((tab, index) => {
                        const gradients = [
                            'from-blue-500 to-indigo-500',
                            'from-purple-500 to-pink-500',
                            'from-orange-500 to-red-500',
                            'from-green-500 to-teal-500'
                        ];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group relative overflow-hidden
                                    ${activeTab === tab.id
                                        ? 'bg-gradient-to-r ' + gradients[index] + ' text-white shadow-lg shadow-' + gradients[index].split(' ')[1].replace('to-', '') + '/30 scale-[1.02]'
                                        : 'text-slate-600 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50/50 hover:shadow-md'
                                    }
                                `}
                            >
                                {/* Background decoration */}
                                {activeTab === tab.id && (
                                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                )}

                                {/* Icon with background circle */}
                                <div className={`
                                    w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all relative z-10
                                    ${activeTab === tab.id
                                        ? 'bg-white/20 backdrop-blur-sm'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-blue-100 group-hover:to-purple-100'
                                    }
                                `}>
                                    <i className={`fa-solid ${tab.icon} text-lg ${activeTab === tab.id ? 'text-white' : 'text-slate-600 group-hover:text-google-blue'}`}></i>
                                </div>

                                <div className="flex-1 relative z-10">
                                    <span className={`font-semibold text-sm block ${activeTab === tab.id ? 'text-white' : ''}`}>
                                        {tab.label}
                                    </span>
                                    {activeTab === tab.id && (
                                        <span className="text-xs text-white/80 font-medium">当前选中</span>
                                    )}
                                </div>

                                {/* Arrow indicator */}
                                {activeTab === tab.id && (
                                    <i className="fa-solid fa-chevron-right text-white/60 text-sm relative z-10"></i>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-5 border-t border-gray-100 space-y-2 shrink-0 bg-gradient-to-b from-transparent to-slate-50/50">
                    <button className="w-full px-4 py-3 text-sm font-medium text-slate-600 hover:text-google-blue hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-purple-100 flex items-center justify-center transition-all">
                            <i className="fa-solid fa-share-nodes text-sm"></i>
                        </div>
                        <span>分享项目</span>
                    </button>
                    <button className="w-full px-4 py-3 text-sm font-medium text-slate-600 hover:text-google-blue hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-purple-100 flex items-center justify-center transition-all">
                            <i className="fa-solid fa-cog text-sm"></i>
                        </div>
                        <span>项目设置</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'files' && (
                    <DesignFiles
                        projectId={projectId}
                        onOpenGenerator={onOpenGenerator}
                    />
                )}
                {activeTab === 'analysis' && (
                    <AnalysisImages
                        projectId={projectId}
                        onOpenGenerator={onOpenGenerator}
                        onOpenEditor={onOpenEditor}
                    />
                )}
                {activeTab === 'layouts' && (
                    <LayoutSchemes
                        projectId={projectId}
                        onOpenEditor={onOpenEditor}
                    />
                )}
                {activeTab === 'history' && (
                    <GenerationHistory projectId={projectId} />
                )}
            </div>
        </div>
    );
};

export default ProjectDetail;
