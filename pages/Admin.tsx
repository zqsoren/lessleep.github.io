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
    const [collapsed, setCollapsed] = useState(false);

    const modules = [
        { id: 'users' as AdminModule, label: '用户管理', icon: 'fa-users' },
        { id: 'prompts' as AdminModule, label: '提示词管理', icon: 'fa-wand-magic-sparkles' },
        { id: 'settings' as AdminModule, label: '高级设置', icon: 'fa-sliders' },
        { id: 'generations' as AdminModule, label: '图片生成管理', icon: 'fa-images' },
    ];

    return (
        <div className="w-full flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">

            {/* Left Sidebar */}
            <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 relative`}>

                {/* Collapse Toggle Button - Floating style or embedded */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 shadow-sm z-10"
                >
                    <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'left'} text-xs`}></i>
                </button>

                {/* Header */}
                <div className={`h-20 border-b border-gray-100 flex items-center ${collapsed ? 'justify-center px-0' : 'px-6'} bg-gradient-to-r from-purple-500 to-indigo-500 transition-all overflow-hidden`}>
                    <button
                        onClick={onBack}
                        className={`w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all ${collapsed ? '' : 'mr-4'}`}
                        title="返回主页"
                    >
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </button>
                    {!collapsed && (
                        <div className="flex-1 whitespace-nowrap overflow-hidden">
                            <h1 className="text-lg font-bold text-white">后台管理系统</h1>
                            <p className="text-xs text-white/80">Admin Dashboard</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
                    {modules.map((module) => (
                        <button
                            key={module.id}
                            onClick={() => setActiveModule(module.id)}
                            title={collapsed ? module.label : ''}
                            className={`
                w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-4'} py-4 rounded-xl transition-all group relative
                ${activeModule === module.id
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                                    : 'text-slate-600 hover:bg-slate-50 hover:shadow-md'
                                }
              `}
                        >
                            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0
                ${activeModule === module.id
                                    ? 'bg-white/20'
                                    : 'bg-slate-100 group-hover:bg-purple-100'
                                }
              `}>
                                <i className={`fa-solid ${module.icon} text-lg ${activeModule === module.id ? 'text-white' : 'text-slate-600 group-hover:text-purple-600'}`}></i>
                            </div>
                            {!collapsed && (
                                <span className="font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 origin-left">
                                    {module.label}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-slate-50 overflow-hidden">
                    <div className={`text-xs text-slate-500 ${collapsed ? 'text-center' : 'text-center flex items-center justify-center gap-1'}`}>
                        <i className="fa-solid fa-shield-halved"></i>
                        {!collapsed && <span>管理员权限</span>}
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
