
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Button, Card, Badge } from './UI';
import type { Workspace, TeamMember } from '../types';

// Mock Data
const MOCK_MEMBERS: TeamMember[] = [
    { id: '1', name: 'Marcela Souza', email: 'marcela.souza@andromedalabs.com', role: 'editor', status: 'active' },
    { id: '2', name: 'João Silva', email: 'joao@client.com', role: 'viewer', status: 'pending' },
    { id: '3', name: 'Admin User', email: 'ojmachadomkt@gmail.com', role: 'admin', status: 'active' }
];

interface EditMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
    onSave: (updated: TeamMember) => void;
    onDelete: (id: string) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, member, onSave, onDelete }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (member) {
            setName(member.name);
            setRole(member.role);
        }
    }, [member]);

    const handleSave = async () => {
        if (!member) return;
        setIsLoading(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 800));
        
        onSave({ ...member, name, role });
        setIsLoading(false);
        setShowSuccess(true);
        
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 1500);
    };

    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-[600px] bg-white dark:bg-[#141122] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2d2a42] z-50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2d2a42]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Editar Membro</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-[#9b92c9] dark:hover:text-white transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-[#292348]">
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Email do Membro
                            </label>
                            <div className="relative flex items-center">
                                <input 
                                    className="w-full h-12 rounded-lg bg-gray-100 dark:bg-[#1e1933] text-gray-500 dark:text-[#9b92c9] border border-gray-200 dark:border-[#2d2a42] px-4 pr-12 text-base focus:outline-none cursor-not-allowed select-none" 
                                    disabled readOnly type="email" value={member.email} 
                                />
                                <div className="absolute right-4 text-gray-400 dark:text-[#565077] pointer-events-none flex items-center">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-[#565077]">
                                O email é o identificador único e não pode ser alterado.
                            </p>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="member-name">
                                Nome do Membro <span className="text-gray-400 dark:text-[#565077] font-normal">(Opcional)</span>
                            </label>
                            <input 
                                id="member-name"
                                className="w-full h-12 rounded-lg bg-white dark:bg-[#141122] text-gray-900 dark:text-white border border-gray-300 dark:border-[#3b3267] focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary px-4 text-base placeholder:text-gray-400 dark:placeholder:text-[#565077] transition-all outline-none" 
                                placeholder="Ex: Marcela Souza" 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Role Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="member-role">
                                Cargo
                            </label>
                            <div className="relative">
                                <select 
                                    id="member-role"
                                    className="w-full h-12 appearance-none rounded-lg bg-white dark:bg-[#141122] text-gray-900 dark:text-white border border-gray-300 dark:border-[#3b3267] focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary px-4 pr-10 text-base transition-all cursor-pointer outline-none"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#9b92c9] pointer-events-none flex items-center">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>expand_more</span>
                                </div>
                            </div>
                            
                            {/* Helper Text */}
                            <div className="mt-3 flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-[#1e1933]/50 border border-blue-100 dark:border-[#2d2a42]">
                                <span className="material-symbols-outlined text-blue-600 dark:text-[#9b92c9] shrink-0" style={{ fontSize: '20px' }}>info</span>
                                <p className="text-sm text-blue-900 dark:text-[#9b92c9] leading-relaxed">
                                    {role === 'admin' && <><span className="font-semibold">Administradores</span> têm acesso total ao workspace, incluindo faturamento e gerenciamento de membros.</>}
                                    {role === 'editor' && <><span className="font-semibold">Editores</span> podem criar e gerenciar campanhas, conectar contas de anúncios, mas não podem gerenciar membros ou faturamento.</>}
                                    {role === 'viewer' && <><span className="font-semibold">Visualizadores</span> podem apenas ver relatórios e dashboards, sem permissão de edição.</>}
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-gray-100 dark:border-[#2d2a42] bg-gray-50 dark:bg-[#131022]">
                    <button 
                        onClick={() => onDelete(member.id)}
                        className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full sm:w-auto text-sm font-medium order-2 sm:order-1"
                    >
                        <span className="material-symbols-outlined group-hover:animate-pulse" style={{ fontSize: '20px' }}>delete</span>
                        Remover Membro
                    </button>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#292348] border border-gray-300 dark:border-[#3b3267] font-medium text-sm transition-colors w-full sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white dark:bg-[#1e1933] border border-green-200 dark:border-green-900/30 p-4 rounded-lg shadow-xl z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Sucesso</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Membro atualizado com sucesso!</span>
                    </div>
                    <button onClick={() => setShowSuccess(false)} className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const TeamManagementPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId } = useParams();
    const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEdit = (member: TeamMember) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleSaveMember = (updated: TeamMember) => {
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
        // Modal closes automatically after success toast in the component
    };

    const handleDeleteMember = (id: string) => {
        if (confirm("Tem certeza que deseja remover este membro?")) {
            setMembers(prev => prev.filter(m => m.id !== id));
            setIsModalOpen(false);
        }
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="max-w-[1200px] mx-auto py-8 px-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border-dark">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">Gerenciar Equipe</h1>
                        <p className="text-text-secondary text-base max-w-2xl">
                            Controle quem tem acesso a este workspace e suas permissões.
                        </p>
                    </div>
                    <Button>
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        <span>Convidar Membro</span>
                    </Button>
                </div>

                {/* Member List */}
                <div className="bg-card-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-border-dark">
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Membro</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Cargo</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {members.map((member) => (
                                <tr key={member.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium text-sm">{member.name}</div>
                                                <div className="text-text-secondary text-xs">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                            member.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                            member.role === 'editor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                                            {member.status === 'active' ? 'Ativo' : 'Pendente'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleEdit(member)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                                            title="Editar Membro"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Render Modal */}
            <EditMemberModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                member={selectedMember}
                onSave={handleSaveMember}
                onDelete={handleDeleteMember}
            />
        </AppShell>
    );
};
