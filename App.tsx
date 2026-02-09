
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, RoomType } from './types';
import { ProjectCard } from './components/ProjectCard';
import { RoomEditor } from './components/RoomEditor';
import { BriefingView } from './components/BriefingView';
import { subscribeToProjects, createProject, updateProject, deleteProject } from './services/projectService';
import {
  Plus,
  ChevronLeft,
  Save,
  Layout,
  Trash2,
  AlertTriangle,
  X,
  Edit
} from 'lucide-react';



const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Project Form State
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    clientName: '',
    location: '',
    size: 30,
    stylePreference: '',
    status: ProjectStatus.PLANNING,
    rooms: []
  });

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToProjects((updatedProjects) => {
      setProjects(updatedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleEditProject = () => {
    if (!selectedProject) return;

    // Load project data into form
    setNewProject({
      title: selectedProject.title,
      clientName: selectedProject.clientName,
      location: selectedProject.location,
      size: selectedProject.size,
      stylePreference: selectedProject.stylePreference,
      status: selectedProject.status,
      rooms: selectedProject.rooms
    });

    setIsEditing(true);
    setEditingProjectId(selectedProject.id);
  };

  const handleSaveProject = async () => {
    if (!newProject.title) return;

    try {
      if (isEditing && editingProjectId) {
        // Update existing project
        await updateProject(editingProjectId, {
          title: newProject.title,
          clientName: newProject.clientName,
          location: newProject.location,
          size: newProject.size,
          stylePreference: newProject.stylePreference,
          status: newProject.status,
          rooms: newProject.rooms
        });
        setIsEditing(false);
        setSelectedProjectId(editingProjectId);
        setEditingProjectId(null);
      } else {
        // Create new project
        const projectToSave = {
          ...newProject,
          createdAt: new Date().toISOString(),
        } as Omit<Project, 'id'>;

        const newId = await createProject(projectToSave);
        setIsCreating(false);
        setSelectedProjectId(newId);
      }

      // Reset form
      setNewProject({
        title: '',
        clientName: '',
        location: '',
        size: 30,
        stylePreference: '',
        status: ProjectStatus.PLANNING,
        rooms: []
      });
    } catch (err) {
      console.error('Failed to save project:', err);
      setError('儲存專案失敗，請稍後再試');
    }
  };

  const executeDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      if (selectedProjectId === projectToDelete.id) {
        setSelectedProjectId(null);
      }
      setProjectToDelete(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('刪除專案失敗，請稍後再試');
      setProjectToDelete(null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">載入專案資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-[150] bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-lg animate-slideUp max-w-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <div>
              <p className="font-semibold">發生錯誤</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/90 flex items-center justify-center p-8 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={32} />
          </button>
          <img
            src={previewImage}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn"
            alt="放大預覽"
          />
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slideUp">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">確定要刪除專案？</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                確定要刪除「<span className="font-semibold text-slate-700">{projectToDelete.title}</span>」嗎？<br />
                此動作將永久移除所有需求資料。
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => { setSelectedProjectId(null); setIsCreating(false); }}
          >
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layout className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-display">
              DecoBrief
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {!selectedProjectId && !isCreating && !isEditing ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 font-display">裝潢專案列表</h1>
                <p className="text-slate-500 mt-2">彙整屋主需求，提供給設計師的精準簡報</p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
              >
                <Plus size={20} className="mr-2" />
                建立需求簡報
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layout className="text-slate-300" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-800">目前尚無專案</h3>
                <p className="text-slate-500 mt-1">點擊上方按鈕開始建立您的第一個裝潢需求簡報。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={setSelectedProjectId}
                    onDelete={(id) => setProjectToDelete(project)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (isCreating || isEditing) ? (
          <div className="max-w-4xl mx-auto animate-slideUp">
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                if (isEditing && editingProjectId) {
                  // Return to project detail when canceling edit
                  setSelectedProjectId(editingProjectId);
                  setEditingProjectId(null);
                }
              }}
              className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium"
            >
              <ChevronLeft size={20} className="mr-1" />
              返回列表
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8 bg-indigo-50 border-b border-indigo-100">
                <h1 className="text-2xl font-bold text-indigo-900">
                  {isEditing ? '編輯裝潢需求簡報' : '建立裝潢需求簡報'}
                </h1>
                <p className="text-indigo-600/70">
                  {isEditing ? '修改專案資料與各個空間的需求。' : '請填寫基本資料與各個空間的需求，方便設計師精準提案。'}
                </p>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">專案名稱</label>
                    <input
                      type="text"
                      placeholder="例如：中山北路 - 溫馨三房"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                      value={newProject.title}
                      onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">屋主姓名</label>
                    <input
                      type="text"
                      placeholder="王大明"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                      value={newProject.clientName}
                      onChange={e => setNewProject({ ...newProject, clientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">坪數 (坪)</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                      value={newProject.size}
                      onChange={e => setNewProject({ ...newProject, size: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">風格偏好描述</label>
                  <textarea
                    placeholder="描述你喜歡的風格、色調，或任何參考物件..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 text-slate-900"
                    value={newProject.stylePreference}
                    onChange={e => setNewProject({ ...newProject, stylePreference: e.target.value })}
                  />
                </div>

                <hr className="border-slate-100" />

                <RoomEditor
                  rooms={newProject.rooms || []}
                  onChange={rooms => setNewProject({ ...newProject, rooms })}
                />

                <div className="pt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-6 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={!newProject.title}
                    className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 font-medium"
                  >
                    <Save size={20} className="mr-2" />
                    {isEditing ? '更新專案簡報' : '儲存專案簡報'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <button
                onClick={() => setSelectedProjectId(null)}
                className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium"
              >
                <ChevronLeft size={20} className="mr-1" />
                返回專案列表
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleEditProject}
                  className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors font-medium text-sm"
                >
                  <Edit size={16} className="mr-2" />
                  編輯專案
                </button>
                <button
                  onClick={() => setProjectToDelete(selectedProject!)}
                  className="flex items-center px-4 py-2 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition-colors font-medium text-sm"
                >
                  <Trash2 size={16} className="mr-2" />
                  刪除專案
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-display">{selectedProject?.title}</h2>
                    <p className="text-slate-500 text-lg">{selectedProject?.location} · {selectedProject?.clientName}</p>
                  </div>
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold">
                    {selectedProject?.status}
                  </span>
                </div>

                <div className="flex items-center space-x-8 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl min-w-[150px]">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">設計坪數</p>
                    <p className="text-2xl font-black text-slate-800">{selectedProject?.size} 坪</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></div>
                    風格描述
                  </h3>
                  <p className="text-slate-600 leading-relaxed bg-indigo-50/30 p-5 rounded-xl border border-indigo-100/50">
                    {selectedProject?.stylePreference || '尚未填寫風格偏好。'}
                  </p>
                </div>
              </div>

              <BriefingView
                rooms={selectedProject?.rooms || []}
                onPreviewImage={setPreviewImage}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-indigo-600 p-2 rounded-lg inline-block mb-4">
            <Layout className="text-white" size={24} />
          </div>
          <p className="text-slate-400 text-sm">DecoBrief © 2025 裝潢需求匯整專家</p>
          <p className="text-slate-600 text-xs mt-2">幫助屋主與設計師建立精準溝通橋樑</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .font-display {
          letter-spacing: -0.01em;
        }
      `}</style>
    </div>
  );
};

export default App;
