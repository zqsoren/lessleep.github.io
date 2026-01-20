import React, { useEffect, useState } from 'react';
import { Project, ViewState } from '../types';
import { EditorContext } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
   onChangeView: (view: ViewState) => void;
   onOpenEditor: (context: EditorContext) => void;
   onOpenGenerator: () => void;
   onOpenProject: (id?: number) => void;
}

// Mock Data for Dashboard
const MOCK_RECENT_LAYOUTS = [
   { id: 101, name: '美术馆竞标_最终版_A0', projectId: 1, projectName: '美术馆竞标方案', time: '2小时前' },
   { id: 102, name: '中期汇报_排版_v2', projectId: 2, projectName: '城市滨水景观带', time: '昨天' },
   { id: 103, name: '场地分析汇总页', projectId: 1, projectName: '美术馆竞标方案', time: '3天前' },
];

interface UserStats {
   monthlyGenerations: number;
   monthlyQuota: number;
   remainingQuota: number;
   monthlyDuration: number;
   totalDuration: number;
   totalGenerations: number;
   membershipLevel: string;
   totalRecharge: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView, onOpenEditor, onOpenGenerator, onOpenProject }) => {
   const { user, apiRequest, isAuthenticated } = useAuth();
   const [projects, setProjects] = useState<Project[]>([]);
   const [stats, setStats] = useState<UserStats | null>(null);
   const [loading, setLoading] = useState(true);

   // Modal State
   const [showEditorModal, setShowEditorModal] = useState(false);
   const [editorStep, setEditorStep] = useState<'initial' | 'select_project'>('initial');

   useEffect(() => {
      if (!isAuthenticated) {
         setLoading(false);
         return;
      }

      const loadData = async () => {
         try {
            // Load user statistics
            const statsData = await apiRequest<UserStats>('/api/user/stats');
            setStats(statsData);

            // Load recent projects
            const projectsData = await apiRequest<{ projects: Project[] }>('/api/projects?limit=5');
            setProjects(projectsData.projects);
         } catch (error) {
            console.error('Error loading dashboard data:', error);
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [isAuthenticated, apiRequest]);

   // Handlers
   const handleNewProject = () => {
      onOpenEditor({ type: 'new_project' });
      setShowEditorModal(false);
   };

   const handleSelectProjectForLayout = (proj: { id: number, name: string }) => {
      onOpenEditor({
         type: 'new_layout_in_project',
         projectId: proj.id,
         projectName: proj.name
      });
      setShowEditorModal(false);
      setEditorStep('initial');
   };

   const handleHistoryClick = (layout: typeof MOCK_RECENT_LAYOUTS[0]) => {
      onOpenEditor({
         type: 'existing_layout',
         projectId: layout.projectId,
         projectName: layout.projectName,
         layoutId: layout.id,
         layoutName: layout.name
      });
      setShowEditorModal(false);
   };

   return (
      <div className="flex-1 h-screen p-8 overflow-auto box-border relative scrollbar-hide">

         {/* Header Container */}
         <div className="max-w-7xl mx-auto flex flex-col gap-6">

            {/* 1. Header (Greeting) */}
            <section>
               <h1 className="text-4xl font-sans font-normal text-onSurface mb-2">
                  欢迎回来, <span className="font-bold">建筑师</span>
               </h1>
               <div className="flex items-center gap-2 mt-2 text-onSurface-variant text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Lesleep 已为您服务 <span className="font-bold text-primary">342</span> 天，今日已在线 <span className="font-bold text-primary">45</span> min</span>
               </div>
            </section>

            {/* 2. METRICS Row */}
            <section className="grid grid-cols-3 gap-5 shrink-0">
               {!loading && stats ? [
                  {
                     label: '本月生图数量 (Images)',
                     value: stats.monthlyGenerations.toString(),
                     unit: `/ ${stats.monthlyQuota}`,
                     icon: 'fa-image',
                     color: 'text-google-blue',
                     bg: 'bg-blue-50',
                     change: `剩余: ${stats.remainingQuota}`
                  },
                  {
                     label: '本月在线时长 (Time)',
                     value: (stats.monthlyDuration / 60).toFixed(1),
                     unit: 'h',
                     icon: 'fa-clock',
                     color: 'text-google-red',
                     bg: 'bg-red-50',
                     change: `累计: ${(stats.totalDuration / 60).toFixed(0)}h`
                  },
                  {
                     label: '累计消耗算力 (Total)',
                     value: stats.totalGenerations.toString(),
                     unit: 'imgs',
                     icon: 'fa-bolt',
                     color: 'text-google-yellow',
                     bg: 'bg-yellow-50',
                     change: stats.membershipLevel.toUpperCase()
                  },
               ].map((stat, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur border border-white p-5 rounded-2xl shadow-card hover:shadow-float transition-all group overflow-hidden relative">
                     {/* Hover Gradient Border Effect */}
                     <div className="absolute inset-0 border-2 border-transparent group-hover:border-google-blue/10 rounded-2xl transition-all"></div>

                     <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                           <i className={`fa-solid ${stat.icon} ${stat.color} text-lg`}></i>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{stat.change}</span>
                     </div>
                     <div>
                        <h3 className="text-3xl font-display font-bold text-slate-800">
                           {stat.value} <span className="text-sm font-normal text-slate-500">{stat.unit}</span>
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
                     </div>
                  </div>
               )) : (
                  // Loading skeleton
                  [1, 2, 3].map((idx) => (
                     <div key={idx} className="bg-white/80 backdrop-blur border border-white p-5 rounded-2xl shadow-card animate-pulse">
                        <div className="h-10 w-10 bg-gray-200 rounded-xl mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                     </div>
                  ))
               )}
            </section>

            {/* 3. MAIN CONTENT: Split View (Top 70% / Bottom 30%) */}
            <div className="flex-1 flex flex-col gap-5 overflow-hidden min-h-0 p-2">

               {/* TOP SECTION (70%): Action Cards Side-by-Side */}
               <div className="flex-[9] flex gap-5 min-h-0">

                  {/* Card 1: AI Generator - 加深静态彩虹色 */}
                  <div onClick={onOpenGenerator} className="group flex-1 bg-gradient-to-br from-indigo-100/80 via-purple-100/80 to-pink-100/80 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-[24px] p-8 text-slate-800 hover:text-white relative overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] flex flex-col justify-between border border-purple-200/50 hover:border-transparent">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-0 group-hover:opacity-100"></div>

                     <div>
                        <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:shadow-lg group-hover:bg-white/20 group-hover:text-white transition-all text-indigo-600">
                           <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <h3 className="text-3xl font-bold mb-2 group-hover:text-white transition-colors">AI 灵感生成器</h3>
                        <p className="text-slate-600 group-hover:text-white/90 font-medium text-base leading-relaxed max-w-md transition-colors">
                           Stable Diffusion XL 驱动。支持草图生图、风格迁移、材质替换。为您的设计提供无限灵感。
                        </p>
                     </div>

                     <div className="flex items-center gap-3 text-sm font-bold mt-4 opacity-80 group-hover:opacity-100 group-hover:gap-4 transition-all bg-white/50 group-hover:bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
                        <span>立即开始</span> <i className="fa-solid fa-arrow-right"></i>
                     </div>
                  </div>

                  {/* Card 2: Smart Editor - 静态也显示淡彩虹 */}
                  <div onClick={() => setShowEditorModal(true)} className="group flex-1 bg-gradient-to-br from-blue-50/80 via-red-50/60 to-yellow-50/80 hover:bg-gradient-to-r hover:from-google-blue hover:via-google-red hover:to-google-yellow rounded-[24px] border border-blue-200/50 hover:border-transparent p-8 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] flex flex-col justify-between">
                     <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-google-blue/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>

                     <div>
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-google-blue flex items-center justify-center text-3xl mb-6 group-hover:rotate-12 transition-transform shadow-sm group-hover:bg-white/20 group-hover:text-white">
                           <i className="fa-solid fa-pen-ruler"></i>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-2 group-hover:text-white transition-colors">智能排版编辑器</h3>
                        <p className="text-slate-600 font-medium text-base leading-relaxed max-w-md group-hover:text-white/90 transition-colors">
                           基于 Fabric.js 的专业矢量排版引擎。智能对齐、图框生成、批量导出。让分析图制作更高效。
                        </p>
                     </div>

                     <div className="flex items-center gap-3 text-sm font-bold text-google-blue group-hover:text-white mt-4 group-hover:gap-4 transition-all bg-blue-100/60 group-hover:bg-white/20 w-fit px-4 py-2 rounded-full">
                        <span>新建画布</span> <i className="fa-solid fa-arrow-right"></i>
                     </div>
                  </div>

               </div>

               {/* BOTTOM SECTION (30%): Recent Projects (Horizontal Scroll) - 减小高度 */}
               <div className="flex-[2] bg-white/60 backdrop-blur rounded-[24px] border border-white p-4 shadow-sm flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                     <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="fa-regular fa-clock text-google-blue"></i> 最近项目 (Recent Projects)
                     </h2>
                     <button
                        onClick={() => onOpenProject(projects[0]?.id)}
                        className="text-xs font-bold text-google-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                     >
                        查看全部
                     </button>
                  </div>

                  <div className="flex-1 flex gap-4 overflow-x-auto items-center pb-2 scrollbar-hide">
                     {/* Horizontal Project List */}
                     {projects.map((project) => (
                        <div
                           key={project.id}
                           onClick={() => onOpenProject(project.id)}
                           className="group min-w-[300px] h-full bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer flex gap-3 relative overflow-hidden"
                        >
                           {/* Rainbow Hover Bottom Border */}
                           <div className="absolute left-0 bottom-0 right-0 h-1 bg-gradient-to-r from-google-blue via-google-red to-google-yellow opacity-0 group-hover:opacity-100 transition-opacity"></div>

                           <div className="w-24 h-full rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           </div>

                           <div className="flex-1 flex flex-col justify-center min-w-0">
                              <h3 className="font-bold text-slate-800 text-sm mb-1 truncate group-hover:text-google-blue transition-colors">{project.name}</h3>
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">{project.desc || 'No description'}</p>
                              <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md font-mono">{project.date}</span>
                              </div>
                           </div>
                        </div>
                     ))}

                     {/* Empty State */}
                     {projects.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                           <i className="fa-solid fa-folder-open text-2xl mb-2 opacity-50"></i>
                           <p className="text-xs">暂无最近项目</p>
                        </div>
                     )}
                  </div>
               </div>

            </div>

         </div>

         {/* Editor Selection Modal */}
         {showEditorModal && (
            <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="bg-surface rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-white/40">

                  {/* Modal Header */}
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-surface-50">
                     <h3 className="text-xl font-display font-medium text-onSurface">
                        {editorStep === 'initial' ? '开始编辑 (Start Editing)' : '选择项目 (Select)'}
                     </h3>
                     <button onClick={() => setShowEditorModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                     </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 bg-surface">

                     {editorStep === 'initial' ? (
                        <>
                           <div className="grid grid-cols-2 gap-4 mb-8">
                              <button
                                 onClick={handleNewProject}
                                 className="aspect-[4/3] rounded-2xl border border-gray-200 hover:border-google-blue hover:bg-blue-50 flex flex-col items-center justify-center gap-3 group transition-all"
                              >
                                 <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-folder-plus"></i>
                                 </div>
                                 <span className="font-bold text-onSurface text-sm">新建项目</span>
                              </button>

                              <button
                                 onClick={() => setEditorStep('select_project')}
                                 className="aspect-[4/3] rounded-2xl border border-gray-200 hover:border-google-blue hover:bg-blue-50 flex flex-col items-center justify-center gap-3 group transition-all"
                              >
                                 <div className="w-12 h-12 rounded-full bg-surface border border-gray-200 text-onSurface flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-file-circle-plus"></i>
                                 </div>
                                 <span className="font-bold text-onSurface text-sm">新建排版</span>
                              </button>
                           </div>

                           <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">最近排版</h4>
                              <div className="space-y-2">
                                 {MOCK_RECENT_LAYOUTS.map((layout) => (
                                    <button
                                       key={layout.id}
                                       onClick={() => handleHistoryClick(layout)}
                                       className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left group"
                                    >
                                       <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-google-blue">
                                          <i className="fa-regular fa-file-image"></i>
                                       </div>
                                       <div className="flex-1">
                                          <h5 className="font-bold text-sm text-onSurface group-hover:text-primary transition-colors">{layout.name}</h5>
                                          <p className="text-[10px] text-gray-500">{layout.projectName}</p>
                                       </div>
                                       <span className="text-[10px] text-gray-400">{layout.time}</span>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </>
                     ) : (
                        <div className="animate-in slide-in-from-right duration-300">
                           <button onClick={() => setEditorStep('initial')} className="mb-4 text-xs text-gray-500 hover:text-primary flex items-center gap-1">
                              <i className="fa-solid fa-arrow-left"></i> 返回
                           </button>
                           <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                              {projects.map((proj) => (
                                 <button
                                    key={proj.id}
                                    onClick={() => handleSelectProjectForLayout(proj)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-google-blue hover:bg-blue-50 transition-all text-left"
                                 >
                                    <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center text-xs font-bold">
                                       {proj.name.substring(0, 1)}
                                    </div>
                                    <span className="font-bold text-sm text-onSurface flex-1">{proj.name}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}

                  </div>
               </div>
            </div>
         )}

      </div>
   );
};

export default Dashboard;