import React, { useEffect, useState } from 'react';
import { EditorContext } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface ProjectsProps {
   onOpenEditor: (context: EditorContext) => void;
   onOpenProject: (id: number, name: string) => void;
}

interface Project {
   id: number;
   name: string;
   description?: string;
   image?: string;
   date: string;
}

const Projects: React.FC<ProjectsProps> = ({ onOpenEditor, onOpenProject }) => {
   const { apiRequest, isAuthenticated } = useAuth();
   const [projects, setProjects] = useState<Project[]>([]);
   const [loading, setLoading] = useState(true);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [newProjectName, setNewProjectName] = useState('');
   const [newProjectDesc, setNewProjectDesc] = useState('');

   useEffect(() => {
      if (!isAuthenticated) {
         setLoading(false);
         return;
      }

      loadProjects();
   }, [isAuthenticated]);

   const loadProjects = async () => {
      try {
         const data = await apiRequest<{ projects: Project[] }>('/api/projects');
         setProjects(data.projects);
      } catch (error) {
         console.error('Error loading projects:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleCreateProject = async () => {
      if (!newProjectName.trim()) {
         alert('请输入项目名称');
         return;
      }

      try {
         await apiRequest('/api/projects', {
            method: 'POST',
            body: JSON.stringify({
               name: newProjectName,
               description: newProjectDesc,
               image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=800&q=80'
            })
         });

         setNewProjectName('');
         setNewProjectDesc('');
         setShowCreateModal(false);
         loadProjects(); // Reload projects
      } catch (error) {
         console.error('Error creating project:', error);
         alert('创建项目失败');
      }
   };

   return (
      <div className="flex-1 h-screen p-8 overflow-auto bg-surface-50">
         <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-slate-800 mb-2">我的项目</h1>
               <p className="text-slate-500">管理您的建筑设计项目</p>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

               {/* New Project Card */}
               <div
                  onClick={() => setShowCreateModal(true)}
                  className="aspect-[4/3] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-google-blue hover:text-google-blue hover:bg-blue-50/30 transition-all cursor-pointer group"
               >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all mb-3 shadow-sm">
                     <i className="fa-solid fa-plus text-2xl"></i>
                  </div>
                  <span className="text-sm font-bold">新建项目</span>
               </div>

               {/* Project Cards */}
               {loading ? (
                  // Loading skeleton
                  [1, 2, 3].map((idx) => (
                     <div key={idx} className="aspect-[4/3] rounded-2xl bg-gray-200 animate-pulse"></div>
                  ))
               ) : (
                  projects.map((project) => (
                     <div
                        key={project.id}
                        onClick={() => onOpenProject(project.id, project.name)}
                        className="aspect-[4/3] rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all"
                     >
                        {/* Background Image */}
                        <img
                           src={project.image || 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=800&q=80'}
                           alt={project.name}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                           <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                           <p className="text-sm text-white/80 mb-3">{project.description || '暂无描述'}</p>
                           <div className="flex items-center gap-2 text-xs text-white/60">
                              <i className="fa-regular fa-calendar"></i>
                              <span>{project.date}</span>
                           </div>
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <i className="fa-solid fa-arrow-right text-white"></i>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* Create Project Modal */}
         {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4">新建项目</h3>
                  <input
                     type="text"
                     placeholder="项目名称"
                     value={newProjectName}
                     onChange={(e) => setNewProjectName(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:border-google-blue"
                  />
                  <textarea
                     placeholder="项目描述(可选)"
                     value={newProjectDesc}
                     onChange={(e) => setNewProjectDesc(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:border-google-blue resize-none"
                     rows={3}
                  />
                  <div className="flex gap-3">
                     <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                     >
                        取消
                     </button>
                     <button
                        onClick={handleCreateProject}
                        className="flex-1 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                     >
                        创建
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Projects;