
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Button, Modal } from './UI';
import type { Workspace, TeamMember } from '../types';

// Mock Data matching the design
const MOCK_MEMBERS: TeamMember[] = [
    { id: '1', name: 'Ana Silva', email: 'ana@company.com', role: 'admin', status: 'active', avatar: 'AS' },
    { id: '2', name: 'Carlos Souza', email: 'carlos@company.com', role: 'editor', status: 'pending', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0U_Y4Pw-DfshcBgt1GE-BF8rxVIxAu7OVroK4Z5JG7GlPxMt3QegXTnt3NunKJySV1wCGnq3Vw1WSxxKc6Ol_AJv5D7o4s1jee6EYxZ1cvpOr2u7J4v0JR3XARSbINI6LlgHKmqsk02uFWmcuhvKhPR9o2MRSd6LvoQgXF_0WttpfmJ19BA-dGJnLLrw2HL5WXFBKLjyyHMrQ4YGWamnXsnItyx04ywP28erpiw8uJ8uQe2M_pz_XLQ6kJwM1m-j8Kbd0xKrwSbE' },
    { id: '3', name: 'Beatriz Lima', email: 'bia@company.com', role: 'viewer', status: 'active', avatar: 'BL' }
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
                                    {role === 'editor' && <><span className="font-semibold">Editores</span> (Analistas) podem criar e gerenciar campanhas, conectar contas de anúncios, mas não podem gerenciar membros ou faturamento.</>}
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
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (member: TeamMember) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleSaveMember = (updated: TeamMember) => {
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    };

    const handleDeleteMember = (id: string) => {
        if (confirm("Tem certeza que deseja remover este membro?")) {
            setMembers(prev => prev.filter(m => m.id !== id));
            setIsModalOpen(false);
        }
    };

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 border border-primary/20">
                        <span className="material-symbols-outlined text-[14px]">shield_person</span>
                        Admin
                    </span>
                );
            case 'editor':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                        <span className="material-symbols-outlined text-[14px]">analytics</span>
                        Analista
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Visualizador
                    </span>
                );
        }
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
                
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-text-secondary mb-6">
                    <Link to={`/w/${workspaceId}/dashboard`} className="hover:text-primary dark:hover:text-white transition-colors">Dashboard</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="font-medium text-gray-900 dark:text-white">Membros</span>
                </nav>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Membros do Workspace</h1>
                        <p className="text-gray-500 dark:text-text-secondary text-base max-w-2xl">
                            Gerencie quem tem acesso aos dados, permissões de análise e configurações deste workspace.
                        </p>
                    </div>
                    <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 h-11 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-primary/25 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Convidar Membro
                    </button>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary group-focus-within:text-primary transition-colors material-symbols-outlined text-[20px]">search</span>
                        <input 
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-white" 
                            placeholder="Buscar por nome ou email..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0">
                        <button className="flex items-center gap-2 px-3 h-10 rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary dark:hover:border-primary text-sm font-medium text-gray-600 dark:text-text-secondary transition-colors whitespace-nowrap">
                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                            <span>Cargo: Todos</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 h-10 rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark hover:border-primary dark:hover:border-primary text-sm font-medium text-gray-600 dark:text-text-secondary transition-colors whitespace-nowrap">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            <span>Status: Todos</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                        </button>
                    </div>
                </div>

                {filteredMembers.length > 0 ? (
                    /* Members Table */
                    <div className="rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark overflow-hidden shadow-sm mb-16">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider w-[35%]">Membro</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider w-[20%]">Cargo</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider w-[20%]">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider w-[25%] text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-border-dark">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {member.avatar?.startsWith('http') ? (
                                                        <div className="size-10 rounded-full overflow-hidden">
                                                            <img alt={member.name} className="w-full h-full object-cover" src={member.avatar} />
                                                        </div>
                                                    ) : (
                                                        <div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${member.role === 'viewer' ? 'bg-pink-600' : 'bg-gradient-to-br from-blue-500 to-primary'}`}>
                                                            {member.avatar || member.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{member.name}</span>
                                                        <span className="text-sm text-gray-500 dark:text-text-secondary">{member.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(member.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        {member.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${member.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    </span>
                                                    <span className={`text-sm font-medium ${member.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {member.status === 'active' ? 'Ativo' : 'Pendente'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {member.status === 'pending' && (
                                                        <button className="text-xs font-medium text-primary hover:text-primary-dark hover:underline mr-2">
                                                            Reenviar
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEdit(member)}
                                                        className="text-gray-400 dark:text-text-secondary hover:text-primary dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteMember(member.id)}
                                                        className="text-gray-400 dark:text-text-secondary hover:text-red-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Table Footer/Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                            <p className="text-xs text-gray-500 dark:text-text-secondary">
                                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredMembers.length}</span> de <span className="font-medium">{filteredMembers.length}</span> membros
                            </p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark text-xs font-medium text-gray-500 dark:text-text-secondary opacity-50 cursor-not-allowed">Anterior</button>
                                <button className="px-3 py-1 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark text-xs font-medium text-gray-500 dark:text-text-secondary opacity-50 cursor-not-allowed">Próximo</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark/50 text-center max-w-2xl mx-auto mt-4">
                        <div className="size-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 ring-8 ring-gray-50 dark:ring-white/[0.02]">
                            <span className="material-symbols-outlined text-[40px] text-gray-400 dark:text-text-secondary">group_add</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum membro convidado ainda</h3>
                        <p className="text-gray-500 dark:text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
                            Comece a colaborar convidando seus colegas para analisar dados e gerenciar campanhas neste workspace.
                        </p>
                        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 h-10 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                            Convidar o primeiro membro
                        </button>
                    </div>
                )}
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
