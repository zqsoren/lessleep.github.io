import React, { useState } from 'react';
import UserManagement from '../components/admin/UserManagement';
import PromptManagement from '../components/admin/PromptManagement';
import GenerationManagement from '../components/admin/GenerationManagement';
import AdvancedSettings from '../components/admin/AdvancedSettings';

interface AdminProps {
    onBack: () => void;
}

type AdminModule = 'users' | 'prompts' | 'settings' | 'generations';

const Admin: React.FC<AdminProps> = ({ onBack }) => {
    const [activeModule, setActiveModule] = useState<AdminModule>('users');

    const modules = [
        { id: 'users' as AdminModule, label: '用户管理', icon: 'fa-users' },
        { id: 'prompts' as AdminModule, label: '提示词管理', icon: 'fa-wand-magic-sparkles' },
        { id: 'settings' as AdminModule, label: '高级设置', icon: 'fa-sliders' },
        { id: 'generations' as AdminModule, label: '图片生成管理', icon: 'fa-images' },
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">

            {/* Left Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                {/* Header */}
                <div className="h-20 border-b border-gray-100 flex items-center px-6 bg-gradient-to-r from-purple-500 to-indigo-500">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all mr-4"
                    >
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">后台管理系统</h1>
                        <p className="text-xs text-white/80">Admin Dashboard</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
                    {modules.map((module) => (
                        <button
                            key={module.id}
                            onClick={() => setActiveModule(module.id)}
                            className={`
                w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-left group
                ${activeModule === module.id
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-[1.02]'
                                    : 'text-slate-600 hover:bg-slate-50 hover:shadow-md'
                                }
              `}
                        >
                            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-all
                ${activeModule === module.id
                                    ? 'bg-white/20'
                                    : 'bg-slate-100 group-hover:bg-purple-100'
                                }
              `}>
                                <i className={`fa-solid ${module.icon} text-lg ${activeModule === module.id ? 'text-white' : 'text-slate-600 group-hover:text-purple-600'}`}></i>
                            </div>
                            <span className="font-semibold text-sm">{module.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-slate-50">
                    <div className="text-xs text-slate-500 text-center">
                        <i className="fa-solid fa-shield-halved mr-1"></i>
                        管理员权限
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {activeModule === 'users' && <UserManagement />}
                {activeModule === 'prompts' && <PromptManagement />}
                {activeModule === 'settings' && <AdvancedSettings />}
                {activeModule === 'generations' && <GenerationManagement />}
            </div>
        </div>
    );
};

export default Admin;
