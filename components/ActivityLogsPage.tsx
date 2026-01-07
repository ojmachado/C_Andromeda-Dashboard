
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from './Navigation';
import type { Workspace, ActivityLog } from '../types';

// Helper to generate mock logs matching the design
const generateMockLogs = (count: number): ActivityLog[] => {
    const actions = ['CREATE', 'CONNECT', 'UPDATE', 'DELETE', 'SYNC'] as const;
    const resources = ['Relatório "Black Friday 2023"', 'Conta Ads 101', 'Permissões de Usuário', 'Workspace Antigo', 'Todos os Workspaces', 'Campanha de Natal'];
    const users = [
        { name: 'John Doe', email: 'john@andromedalabs.com', initials: 'JD', color: 'blue' },
        { name: 'Maria Alvez', email: 'maria@client.com', initials: 'MA', color: 'purple' },
        { name: 'Sarah K.', email: 'sarah@agency.com', initials: 'SK', color: 'orange' },
        { name: 'System', email: 'auto-generated', initials: 'SY', color: 'gray' }
    ];

    return Array.from({ length: count }).map((_, i) => {
        const user = users[Math.floor(Math.random() * users.length)];
        const action = user.name === 'System' ? 'SYNC' : actions[Math.floor(Math.random() * (actions.length - 1))];
        const date = new Date();
        date.setHours(date.getHours() - i * Math.random() * 5);

        let details = '';
        let resource = resources[Math.floor(Math.random() * resources.length)];

        switch (action) {
            case 'CREATE': details = 'Criou novo recurso'; break;
            case 'CONNECT': details = 'Conectou conta do Meta Ads'; resource = 'Conta Ads 101'; break;
            case 'UPDATE': details = 'Alterou configurações'; break;
            case 'DELETE': details = 'Removeu item permanentemente'; break;
            case 'SYNC': details = 'Sincronização automática concluída'; resource = 'Todos os Workspaces'; break;
        }

        return {
            id: `log_${Date.now()}_${i}`,
            timestamp: date.toISOString(),
            user: { name: user.name, email: user.email, avatar: user.initials }, // Using avatar field for initials
            action: action as any, 
            resource: resource,
            details: details,
            status: 'SUCCESS'
        };
    });
};

export const ActivityLogsPage = ({ workspaces, isLoading }: { workspaces: Workspace[], isLoading?: boolean }) => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('ALL');
    const [userFilter, setUserFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Memoize mock data generation
    const allLogs = useMemo(() => generateMockLogs(128), []);

    // Filtering
    const filteredLogs = useMemo(() => {
        return allLogs.filter(log => {
            const matchesSearch = 
                log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
            const matchesUser = userFilter === 'ALL' || log.user.name === userFilter;

            return matchesSearch && matchesAction && matchesUser;
        });
    }, [allLogs, searchTerm, actionFilter, userFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const currentData = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Styling Helpers
    const getActionBadge = (action: string) => {
        const styles: Record<string, string> = {
            'CREATE': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500',
            'CONNECT': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500',
            'UPDATE': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500',
            'DELETE': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500',
            'SYNC': 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
        };
        
        const labels: Record<string, string> = {
            'CREATE': 'Criar',
            'CONNECT': 'Conectar',
            'UPDATE': 'Editar',
            'DELETE': 'Excluir',
            'SYNC': 'Sync'
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2 ${styles[action] || styles['SYNC']}`}>
                {labels[action] || action}
            </span>
        );
    };

    const getUserColor = (name: string) => {
        if (name === 'John Doe') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        if (name === 'Maria Alvez') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
        if (name === 'Sarah K.') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
        return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
            <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                    
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de Atividade</h2>
                            <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">Monitore e audite todas as ações realizadas no seu workspace.</p>
                        </div>
                        <button 
                            onClick={() => navigate(`/w/${workspaceId}/dashboard`)}
                            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-[#292348]"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Voltar ao Dashboard
                        </button>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* Search */}
                            <div className="relative w-full lg:w-64">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
                                <input 
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#25213a] border border-gray-200 dark:border-[#383355] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                                    placeholder="Buscar por usuário ou recurso..." 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            {/* Date Filter (Static for visual) */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-gray-50 dark:bg-[#25213a] border border-gray-200 dark:border-[#383355] text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-[#342c5a] transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                    <span>Últimos 30 dias</span>
                                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                </button>
                            </div>

                            {/* Action Filter */}
                            <div className="relative group">
                                <div className="relative">
                                    <select 
                                        className="appearance-none flex items-center gap-2 bg-gray-50 dark:bg-[#25213a] border border-gray-200 dark:border-[#383355] text-gray-700 dark:text-gray-300 pl-9 pr-8 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-[#342c5a] transition-colors focus:outline-none cursor-pointer"
                                        value={actionFilter}
                                        onChange={(e) => setActionFilter(e.target.value)}
                                    >
                                        <option value="ALL">Tipo de Ação</option>
                                        <option value="CREATE">Criar</option>
                                        <option value="CONNECT">Conectar</option>
                                        <option value="UPDATE">Editar</option>
                                        <option value="DELETE">Excluir</option>
                                        <option value="SYNC">Sync</option>
                                    </select>
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-gray-500 pointer-events-none">category</span>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-gray-500 pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* User Filter */}
                            <div className="relative group">
                                <div className="relative">
                                    <select 
                                        className="appearance-none flex items-center gap-2 bg-gray-50 dark:bg-[#25213a] border border-gray-200 dark:border-[#383355] text-gray-700 dark:text-gray-300 pl-9 pr-8 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-[#342c5a] transition-colors focus:outline-none cursor-pointer"
                                        value={userFilter}
                                        onChange={(e) => setUserFilter(e.target.value)}
                                    >
                                        <option value="ALL">Usuário</option>
                                        <option value="John Doe">John Doe</option>
                                        <option value="Maria Alvez">Maria Alvez</option>
                                        <option value="Sarah K.">Sarah K.</option>
                                        <option value="System">System</option>
                                    </select>
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-gray-500 pointer-events-none">person</span>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-gray-500 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Export Button */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button className="flex items-center justify-center w-full lg:w-auto gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span>Exportar CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-[#292348] bg-gray-50 dark:bg-[#25213a]">
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider w-48">Timestamp</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider w-56">Usuário</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider">Ação</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider">Recurso Afetado</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider text-right w-20">Detalhes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#292348]">
                                        {currentData.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-text-secondary">
                                                    Nenhum registro encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            currentData.map((log) => (
                                                <tr key={log.id} className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span>{new Date(log.timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                                {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${getUserColor(log.user.name)}`}>
                                                                {log.user.avatar}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user.name}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">ID: {Math.floor(Math.random() * 9000) + 1000}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                        {getActionBadge(log.action)}
                                                        {log.details}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-500 dark:text-text-secondary">
                                                        {log.resource}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-gray-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-white/5">
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            <div className="p-4 border-t border-gray-100 dark:border-[#292348] flex items-center justify-between bg-white dark:bg-[#1e1b2e]">
                                <p className="text-xs text-gray-500 dark:text-text-secondary">
                                    Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length} logs
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-[#292348] text-gray-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-[#292348] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <button 
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-[#292348] text-gray-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-[#292348] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
