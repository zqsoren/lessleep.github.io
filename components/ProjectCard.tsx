import React from 'react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpen, onDelete }) => {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative flex flex-col h-full">
      {/* Image Area */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => onOpen(project.id)}>
        <img 
          src={project.image} 
          alt={project.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-aeax-dark/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <button className="bg-white text-aeax-dark px-6 py-2 rounded-full text-xs font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-aeax-accent">
            打开项目
          </button>
          <span className="text-white text-[10px] uppercase tracking-wider font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
            最后编辑: {project.date}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-aeax-dark truncate pr-2 text-lg" title={project.name}>{project.name}</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              className="text-slate-300 hover:text-red-500 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50"
              title="删除项目"
            >
              <i className="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
            {project.prompt ? project.prompt : '无详细描述...'}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
           <span className="text-[10px] font-bold text-aeax-accent bg-aeax-dark/5 px-2 py-1 rounded">V1.0</span>
           <i className="fa-solid fa-ellipsis text-slate-300 hover:text-aeax-dark cursor-pointer"></i>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;