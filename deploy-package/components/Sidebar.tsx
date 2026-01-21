import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isAuthenticated: boolean;
  user: { username: string; email: string; avatar?: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isAuthenticated, user, onOpenLogin, onLogout }) => {
  return (
    <aside className="w-72 bg-surface flex flex-col h-screen sticky top-0 shrink-0 z-20 border-r border-gray-100 relative">

      {/* 1. Logo Section */}
      <div className="pt-8 px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 relative shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="rainbowGradSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="50%" stopColor="#EA4335" />
                <stop offset="100%" stopColor="#FBBC04" />
              </linearGradient>
            </defs>
            <path d="M50 5 L95 50 L95 95 L5 95 L5 50 Z" fill="url(#rainbowGradSidebar)" />
            <rect x="25" y="50" width="15" height="15" fill="white" rx="2" />
            <rect x="60" y="50" width="15" height="15" fill="white" rx="2" />
            <path d="M40 80 Q50 90 60 80" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 leading-none">
            Zzzap
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-tight mt-0.5 whitespace-nowrap">Architectural AI Studio</p>
        </div>
      </div>

      {/* 2. Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {[
          { id: 'dashboard', icon: 'fa-house', label: '首页' },
          { id: 'projects', icon: 'fa-folder-open', label: '我的项目' },
          { id: 'library', icon: 'fa-layer-group', label: '素材库' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as ViewState)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative
              ${(currentView === item.id || (currentView === 'project-detail' && item.id === 'projects'))
                ? 'bg-google-blue text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            <i className={`fa-solid ${item.icon} text-base`}></i>
            <span className="font-medium text-sm">{item.label}</span>

            {/* Active indicator */}
            {(currentView === item.id || (currentView === 'project-detail' && item.id === 'projects')) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
            )}
          </button>
        ))}
      </nav>

      {/* 3. Bottom Section: Login or User Info */}
      <div className="px-4 pb-6 mt-auto space-y-4">
        {!isAuthenticated ? (
          /* Login Button - 未登录状态 */
          <button
            onClick={onOpenLogin}
            className="w-full py-4 bg-gradient-to-r from-google-blue via-google-red to-google-yellow text-white font-bold rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-3 group"
          >
            <i className="fa-solid fa-right-to-bracket text-lg group-hover:scale-110 transition-transform"></i>
            <span>登录 / 注册</span>
          </button>
        ) : (
          <>
            {/* Recharge Card - 已登录状态 */}
            <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-4 text-slate-800 shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all border border-white/30">
              {/* Decorative Circles */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-pink-400/30 to-yellow-400/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 delay-100"></div>

              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center">
                    <i className="fa-solid fa-crown text-yellow-600 text-sm"></i>
                  </div>
                  <span className="text-[10px] font-bold bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-slate-700">Pro</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">算力余额</p>
                  <h3 className="text-xl font-bold font-mono text-slate-800">2,450 <span className="text-xs font-normal opacity-70">pts</span></h3>
                </div>
                <button className="w-full py-2 mt-1 bg-white/60 backdrop-blur-sm text-slate-800 text-xs font-bold rounded-lg hover:bg-white/80 transition-colors shadow-sm border border-white/50">
                  立即充值
                </button>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-google-blue transition-colors relative">
                <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="User" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-google-blue transition-colors">{user?.username}</h4>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="登出"
              >
                <i className="fa-solid fa-right-from-bracket text-xs text-slate-400 hover:text-red-500 transition-colors"></i>
              </button>
            </div>

            {/* Admin Dashboard Entry - Only for admins */}
            {user?.role === 'admin' && (
              <button
                onClick={() => onChangeView('admin')}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 group mt-2"
              >
                <i className="fa-solid fa-shield-halved text-base group-hover:scale-110 transition-transform"></i>
                <span className="text-sm">后台管理</span>
              </button>
            )}
          </>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;