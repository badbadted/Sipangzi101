
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { Layout, MapPin, Ruler, Calendar, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete }) => {
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING: return 'bg-blue-100 text-blue-700';
      case ProjectStatus.DESIGNING: return 'bg-purple-100 text-purple-700';
      case ProjectStatus.CONSTRUCTION: return 'bg-orange-100 text-orange-700';
      case ProjectStatus.COMPLETED: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  return (
    <div 
      onClick={() => onClick(project.id)}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative"
    >
      <button 
        onClick={handleDeleteClick}
        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        title="刪除專案"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex justify-between items-start mb-4 pr-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
            {project.title}
          </h3>
          <p className="text-slate-500 text-sm mt-1">{project.clientName}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex items-center text-slate-600 text-sm">
          <MapPin size={16} className="mr-2 text-slate-400" />
          {project.location || '未標註地點'}
        </div>
        <div className="flex items-center text-slate-600 text-sm">
          <Ruler size={16} className="mr-2 text-slate-400" />
          {project.size} 坪
        </div>
        <div className="flex items-center text-slate-600 text-sm col-span-2">
          <Calendar size={16} className="mr-2 text-slate-400" />
          {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center">
          <Layout size={16} className="text-slate-400 mr-2" />
          <span className="text-sm text-slate-500">{project.rooms.length} 個空間需求</span>
        </div>
        <div className="text-indigo-600 text-sm font-medium">查看詳情 →</div>
      </div>
    </div>
  );
};
