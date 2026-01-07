
import React from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Badge, Button } from './UI.js';
import type { Workspace } from '../types.js';

interface AppShellProps {
  children: React.ReactNode;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, workspaces = [], activeWorkspaceId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <header className="h-16 border-b border-border-dark bg-background-dark/95 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/workspaces" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black italic shadow-[0_0_15px_rgba(55,19,236,0.5)] transition-shadow group-hover:shadow-[0_0_25px_rgba(55,19,236,0.7)]">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Andromeda<span className="text-primary">Lab</span></span>
          </Link>

          {activeWorkspaceId && (
            <div className="relative">
              <button 
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all"
              >
                <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {activeWorkspace?.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-white">{activeWorkspace?.name || "Workspace"}</span>
                <span className="text-text-secondary text-[10px]">▼</span>
              </button>

              {isSwitcherOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-card-dark border border-border-dark rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-1 z-50">
                  <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">Seus Workspaces</div>
                  {workspaces.map(w => (
                    <button 
                      key={w.id} 
                      onClick={() => { navigate(`/w/${w.id}/dashboard`); setIsSwitcherOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${w.metaConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'}`}></div>
                         <span className="text-sm font-medium text-white">{w.name}</span>
                      </div>
                      {w.id === activeWorkspaceId && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                    </button>
                  ))}
                  <div className="border-t border-border-dark mt-2 pt-2 px-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">add</span> Criar novo workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <nav className="flex items-center gap-1 md:gap-6">
          <Link 
            to="/workspaces" 
            className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${isActive('/workspaces') || (isActive('/w/') && !activeWorkspaceId) ? 'text-white bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
          >
            Workspaces
          </Link>
          <Link 
            to="/integrations" 
            className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${isActive('/integrations') ? 'text-white bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
          >
            Integrações
          </Link>
          
          {/* Workspace Specific Links */}
          {activeWorkspaceId && (
            <>
                <div className="w-px h-4 bg-border-dark mx-1 opacity-50"></div>
                
                <Link 
                    to={`/w/${activeWorkspaceId}/dashboard`}
                    className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${isActive(`/w/${activeWorkspaceId}/dashboard`) ? 'text-white bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                >
                    Dashboard
                </Link>

                <Link 
                    to={`/w/${activeWorkspaceId}/reports`}
                    className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg flex items-center gap-2 ${isActive(`/w/${activeWorkspaceId}/reports`) ? 'text-white bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                    Relatórios
                </Link>

                <Link 
                    to={`/w/${activeWorkspaceId}/team`} 
                    className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg flex items-center gap-2 ${isActive(`/w/${activeWorkspaceId}/team`) ? 'text-white bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    Equipe
                </Link>

                <Link 
                    to={`/w/${activeWorkspaceId}/logs`} 
                    className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg flex items-center gap-2 ${isActive(`/w/${activeWorkspaceId}/logs`) ? 'text-white bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    Logs
                </Link>
            </>
          )}

          <div className="w-px h-4 bg-border-dark mx-2"></div>
          <Link to="/account" className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-white">Admin User</div>
                <div className="text-[10px] text-text-secondary">Pro Plan</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 border border-white/10 flex items-center justify-center text-white shadow-lg">
               <span className="material-symbols-outlined text-sm">person</span>
            </div>
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
};

export const Stepper: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => (
  <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-12 relative px-4 mt-8">
    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-dark -translate-y-1/2 -z-10"></div>
    {steps.map((label, idx) => {
      const isCompleted = idx < currentStep;
      const isCurrent = idx === currentStep;
      
      return (
        <div key={label} className="flex flex-col items-center bg-transparent px-2 group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 relative z-10 ${
            isCompleted ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(55,19,236,0.4)]' : 
            isCurrent ? 'bg-background-dark border-primary text-primary shadow-[0_0_15px_rgba(55,19,236,0.2)] scale-110' : 
            'bg-background-dark border-border-dark text-slate-500'
          }`}>
            {isCompleted ? <span className="material-symbols-outlined text-sm font-bold">check</span> : idx + 1}
          </div>
          <span className={`hidden md:block absolute mt-12 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors duration-300 ${
            isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-slate-600'
          }`}>
            {label}
          </span>
        </div>
      );
    })}
  </div>
);
