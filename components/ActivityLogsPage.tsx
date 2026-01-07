
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Button, Card, Badge } from './UI';
import type { Workspace, ActivityLog } from '../types';

// Helper to generate mock logs
const generateMockLogs = (count: number): ActivityLog[] => {
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'SYNC'] as const;
    const resources = ['Campanha', 'Conjunto de Anúncios', 'Anúncio', 'Workspace', 'Integração', 'Relatório'];
    const statuses = ['SUCCESS', 'FAILURE', 'WARNING'] as const;
    const users = [
        { name: 'Admin User', email: 'admin@andromedalabs.com' },
        { name: 'Marketing Team', email: 'marketing@client.com' },
        { name: 'System Bot', email: 'bot@system.internal' }
    ];

    return Array.from({ length: count }).map((_, i) => {
        const user = users[Math.floor(Math.random() * users.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const date = new Date();
        date.setHours(date.getHours() - i * 2); // Spread out over time

        return {
            id: `log_${Date.now()}_${i}`,
            timestamp: date.toISOString(),
            user,
            action,
            resource: resources[Math.floor(Math.random() * resources.length)],
            details: `Executou ação de ${action.toLowerCase()} em ${Math.floor(Math.random() * 10)} itens.`,
            status: Math.random() > 0.9 ? 'FAILURE' : Math.random() > 0.8 ? 'WARNING' : 'SUCCESS'
        };
    });
};

export const ActivityLogsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId } = useParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Memoize mock data generation to act as "database"
    const allLogs = useMemo(() => generateMockLogs(65), []);

    // Filtering
    const filteredLogs = useMemo(() => {
        return allLogs.filter(log => {
            const matchesSearch = 
                log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

            return matchesSearch && matchesAction;
        });
    }, [allLogs, searchTerm, actionFilter]);

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

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'UPDATE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'DELETE': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'LOGIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'SYNC': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>;
            case 'FAILURE': return <span className="material-symbols-outlined text-red-500 text-sm">error</span>;
            case 'WARNING': return <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>;
            default: return null;
        }
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-dark pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Logs de Atividade</h1>
                        <p className="text-text-secondary">Registro completo de auditoria e ações realizadas neste workspace.</p>
                    </div>
                    <Button variant="secondary" onClick={() => alert("Download iniciado (CSV)...")}>
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exportar Logs
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">search</span>
                            <input 
                                type="text" 
                                placeholder="Buscar por usuário, recurso..." 
                                className="w-full bg-background-light dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white focus:border-primary outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-primary outline-none"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="ALL">Todas Ações</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="SYNC">Sync</option>
                        </select>
                    </div>
                    <div className="text-xs text-text-secondary font-mono">
                        Total de registros: {filteredLogs.length}
                    </div>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ação</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recurso</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Detalhes</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {currentData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                            Nenhum registro encontrado para os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                                        {log.user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{log.user.name}</span>
                                                        <span className="text-[10px] text-text-secondary">{log.user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                {log.resource}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[200px]" title={log.details}>
                                                {log.details}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end" title={log.status}>
                                                    {getStatusIcon(log.status)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <div className="text-xs text-text-secondary">
                            Mostrando <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> de <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs font-medium rounded border border-slate-200 dark:border-border-dark text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-xs font-medium rounded border border-slate-200 dark:border-border-dark text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </AppShell>
    );
};
