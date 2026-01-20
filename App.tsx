import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Editor from './pages/Editor';
import Library from './pages/Library';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
import { ViewState } from './types';

// Define context type for Editor navigation
export interface EditorContext {
  type: 'new_project' | 'new_layout_in_project' | 'existing_layout';
  projectId?: number;
  projectName?: string;
  layoutId?: number;
  layoutName?: string;
}

const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [generatorImageUrl, setGeneratorImageUrl] = useState<string | undefined>();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Helper to navigate to editor with context
  const handleOpenEditor = (context: EditorContext) => {
    setEditorContext(context);
    setCurrentView('editor');
  };

  // Helper to open project detail
  const handleOpenProject = (id: number, name: string) => {
    setSelectedProjectId(id);
    setSelectedProjectName(name);
    setCurrentView('project-detail');
  };

  // Helper to open generator with optional image
  const handleOpenGenerator = (imageUrl?: string) => {
    setGeneratorImageUrl(imageUrl);
    setCurrentView('generator');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onChangeView={setCurrentView}
            onOpenEditor={handleOpenEditor}
            onOpenGenerator={handleOpenGenerator}
            onOpenProject={(id) => setCurrentView('projects')}
          />
        );
      case 'generator':
        return <Generator onBack={() => setCurrentView('dashboard')} initialImage={generatorImageUrl} />;
      case 'projects':
        return <Projects onOpenEditor={handleOpenEditor} onOpenProject={handleOpenProject} />;
      case 'project-detail':
        return (
          <ProjectDetail
            projectId={selectedProjectId!}
            projectName={selectedProjectName}
            onBack={() => setCurrentView('projects')}
            onOpenGenerator={handleOpenGenerator}
            onOpenEditor={handleOpenEditor}
          />
        );
      case 'editor':
        return <Editor onBack={() => setCurrentView('dashboard')} context={editorContext} />;
      case 'library':
        return <Library />;
      case 'admin':
        return <Admin onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <h2 className="text-xl font-serif text-slate-400">功能建设中</h2>
              <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-emerald-600 hover:underline">返回首页</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-surface text-onSurface font-sans">
      {/* Sidebar - visible on all pages except Generator, Editor and Admin */}
      {currentView !== 'generator' && currentView !== 'editor' && currentView !== 'admin' && (
        <Sidebar
          currentView={currentView}
          onChangeView={setCurrentView}
          isAuthenticated={isAuthenticated}
          user={user}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={logout}
        />
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;