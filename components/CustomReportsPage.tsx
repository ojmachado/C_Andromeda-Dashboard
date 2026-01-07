
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Button, Card } from './UI';
import type { Workspace, CustomReport } from '../types';

const MOCK_REPORTS: CustomReport[] = [
    {
        id: '1',
        name: 'Performance Q3 - Black Friday',
        author: 'Admin',
        lastEdited: 'Há 2 horas',
        type: 'line',
        config: { metrics: ['Spend', 'Impressions'], dimension: 'Campaign Name', filters: [] }
    },
    {
        id: '2',
        name: 'Análise de Criativos - Vídeo vs Imagem',
        author: 'Marketing Team',
        lastEdited: 'Ontem',
        type: 'pie',
        config: { metrics: ['CTR'], dimension: 'Ad Format', filters: [] }
    },
    {
        id: '3',
        name: 'ROAS por Campanha (Outubro)',
        author: 'Admin',
        lastEdited: '05 Out 2023',
        type: 'table',
        config: { metrics: ['ROAS', 'Spend'], dimension: 'Campaign Name', filters: [] }
    }
];

export const CustomReportsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId } = useParams();
    const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
    const [reports, setReports] = useState<CustomReport[]>(MOCK_REPORTS);

    // Builder State
    const [reportName, setReportName] = useState('Novo Relatório Sem Título');
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Spend Amount', 'Impressions']);
    const [selectedDimension, setSelectedDimension] = useState('Nome da Campanha');
    const [vizType, setVizType] = useState<'line' | 'bar' | 'pie' | 'table'>('bar');

    const handleCreateNew = () => {
        setReportName('Novo Relatório Sem Título');
        setViewMode('builder');
    };

    const handleSave = () => {
        const newReport: CustomReport = {
            id: Date.now().toString(),
            name: reportName,
            author: 'Você',
            lastEdited: 'Agora mesmo',
            type: vizType,
            config: {
                metrics: selectedMetrics,
                dimension: selectedDimension,
                filters: []
            }
        };
        setReports([newReport, ...reports]);
        setViewMode('list');
    };

    const toggleMetric = (metric: string) => {
        setSelectedMetrics(prev => 
            prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
        );
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            {viewMode === 'list' ? (
                <div className="max-w-[1200px] mx-auto py-8 px-6 flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border-dark">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">Relatórios Personalizados</h1>
                            <p className="text-text-secondary text-base max-w-2xl">
                                Crie visualizações customizadas dos seus dados do Meta Ads. Combine métricas, dimensões e filtros para insights profundos.
                            </p>
                        </div>
                        <Button onClick={handleCreateNew}>
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>Criar Novo Relatório</span>
                        </Button>
                    </div>

                    {/* Table Section */}
                    <div className="flex flex-col gap-4">
                        {/* Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-1">
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 rounded-md bg-surface-dark-lighter text-white text-sm font-medium border border-border-dark">Todos</button>
                                <button className="px-3 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Meus Relatórios</button>
                                <button className="px-3 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Compartilhados</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-text-secondary uppercase font-bold tracking-wider mr-2">Ordenar por:</span>
                                <select className="bg-card-dark border border-border-dark text-white text-sm rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none">
                                    <option>Última Edição</option>
                                    <option>Nome (A-Z)</option>
                                    <option>Mais Recentes</option>
                                </select>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-hidden rounded-xl border border-border-dark bg-card-dark shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-border-dark">
                                        <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-1/3">Nome do Relatório</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Última Edição</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-dark">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded ${
                                                        report.type === 'line' ? 'bg-primary/10 text-primary' : 
                                                        report.type === 'pie' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        'bg-purple-500/10 text-purple-500'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {report.type === 'line' ? 'monitoring' : report.type === 'pie' ? 'pie_chart' : 'table_chart'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium text-sm group-hover:text-primary transition-colors cursor-pointer">{report.name}</div>
                                                        <div className="text-text-secondary text-xs mt-0.5">Criado por {report.author}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                                    report.type === 'line' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                    report.type === 'pie' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                }`}>
                                                    {report.type === 'line' ? 'Gráfico de Linha' : report.type === 'pie' ? 'Pizza' : report.type === 'bar' ? 'Barras' : 'Tabela Dinâmica'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-text-secondary text-sm">{report.lastEdited}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Visualizar">
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                    <button className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Editar">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Duplicar">
                                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                    </button>
                                                    <div className="w-px h-4 bg-border-dark mx-1"></div>
                                                    <button className="p-1.5 rounded-md hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors" title="Excluir">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border-dark bg-white/5">
                                <div className="text-xs text-text-secondary">
                                    Mostrando <span className="text-white font-medium">1</span> a <span className="text-white font-medium">{reports.length}</span> de <span className="text-white font-medium">{reports.length}</span> resultados
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-xs font-medium rounded border border-border-dark text-text-secondary opacity-50 cursor-not-allowed">Anterior</button>
                                    <button className="px-3 py-1 text-xs font-medium rounded border border-border-dark text-white hover:bg-white/10">Próximo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // BUILDER INTERFACE
                <div className="h-[calc(100vh-64px)] flex flex-col bg-background-dark">
                    {/* Top Bar */}
                    <div className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-card-dark shrink-0">
                        <div className="flex items-center gap-4">
                            <input 
                                className="bg-transparent border-none text-white font-bold text-lg focus:ring-0 px-0 w-64 placeholder:text-text-secondary outline-none" 
                                type="text" 
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            />
                            <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-500/20">Não Salvo</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-background-dark rounded-md border border-border-dark p-1">
                                <button className="p-1.5 rounded hover:bg-white/5 text-text-secondary hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                </button>
                                <span className="text-sm text-white px-2 border-r border-border-dark mr-2">Últimos 30 dias</span>
                                <span className="text-xs text-text-secondary px-1">1 Set - 30 Set</span>
                            </div>
                            <div className="h-6 w-px bg-border-dark mx-2"></div>
                            <button 
                                onClick={() => setViewMode('list')}
                                className="text-sm font-medium text-text-secondary hover:text-white px-3 py-2 transition-colors"
                            >
                                Cancelar
                            </button>
                            <Button onClick={handleSave}>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Salvar Relatório
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar Config */}
                        <div className="w-80 border-r border-border-dark bg-card-dark flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                            <div className="p-4 border-b border-border-dark">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Configuração</h3>
                                
                                {/* Metrics */}
                                <div className="mb-6">
                                    <label className="text-xs font-medium text-text-secondary mb-2 block">Métricas (KPIs)</label>
                                    <div className="space-y-2">
                                        {['Spend Amount', 'Impressions', 'CTR (All)', 'ROAS', 'Clicks', 'CPM'].map(metric => (
                                            <label key={metric} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedMetrics.includes(metric)}
                                                    onChange={() => toggleMetric(metric)}
                                                    className="rounded border-border-dark bg-background-dark text-primary focus:ring-primary focus:ring-offset-background-dark" 
                                                />
                                                <span className="text-sm text-white">{metric}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Dimensions */}
                                <div className="mb-6">
                                    <label className="text-xs font-medium text-text-secondary mb-2 block">Dimensões (Agrupar por)</label>
                                    <select 
                                        className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        value={selectedDimension}
                                        onChange={(e) => setSelectedDimension(e.target.value)}
                                    >
                                        <option>Nome da Campanha</option>
                                        <option>Conjunto de Anúncios</option>
                                        <option>Plataforma (FB/IG)</option>
                                        <option>Idade &amp; Gênero</option>
                                    </select>
                                </div>

                                {/* Filters */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-medium text-text-secondary block">Filtros Avançados</label>
                                        <button className="text-xs text-primary font-medium hover:underline">+ Adicionar</button>
                                    </div>
                                    <div className="p-3 bg-background-dark rounded-lg border border-border-dark flex items-center justify-between gap-2 group">
                                        <div className="text-xs text-white">
                                            <span className="text-text-secondary">Spend</span> &gt; $100
                                        </div>
                                        <button className="text-text-secondary hover:text-red-400 hidden group-hover:block">
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Viz Type */}
                            <div className="p-4 mt-auto border-t border-border-dark bg-white/5">
                                <label className="text-xs font-medium text-text-secondary mb-3 block">Tipo de Visualização</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'line', icon: 'show_chart' },
                                        { id: 'bar', icon: 'bar_chart' },
                                        { id: 'pie', icon: 'pie_chart' },
                                        { id: 'table', icon: 'table_chart' }
                                    ].map(type => (
                                        <button 
                                            key={type.id}
                                            onClick={() => setVizType(type.id as any)}
                                            className={`flex items-center justify-center p-2 rounded border transition-all ${
                                                vizType === type.id 
                                                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/20' 
                                                : 'bg-background-dark text-text-secondary hover:text-white border-border-dark hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{type.icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="flex-1 p-8 overflow-y-auto bg-background-dark flex flex-col">
                            <div className="w-full h-full max-h-[600px] rounded-xl border border-dashed border-border-dark bg-white/5 flex flex-col relative group">
                                {/* Chart Header */}
                                <div className="p-6 flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{selectedMetrics[0] || 'Metric'} vs {selectedMetrics[1] || 'Metric'}</h4>
                                        <p className="text-sm text-text-secondary">Grouped by {selectedDimension}</p>
                                    </div>
                                    <button className="p-2 rounded hover:bg-white/10 text-text-secondary hover:text-white">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                </div>

                                {/* Abstract Visual Representation */}
                                <div className="flex-1 px-8 pb-8 flex items-end justify-between gap-4 relative">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-x-8 inset-y-8 flex flex-col justify-between pointer-events-none opacity-20">
                                        <div className="w-full h-px bg-text-secondary"></div>
                                        <div className="w-full h-px bg-text-secondary"></div>
                                        <div className="w-full h-px bg-text-secondary"></div>
                                        <div className="w-full h-px bg-text-secondary"></div>
                                        <div className="w-full h-px bg-text-secondary"></div>
                                    </div>

                                    {/* Simulated Bars */}
                                    <div className="w-full bg-surface-dark-lighter rounded-t-md h-[40%] relative group/bar hover:bg-opacity-80 transition-all cursor-pointer"></div>
                                    <div className="w-full bg-primary rounded-t-md h-[65%] relative group/bar hover:bg-primary-dark transition-all cursor-pointer shadow-[0_0_20px_rgba(55,19,236,0.3)]"></div>
                                    <div className="w-full bg-surface-dark-lighter rounded-t-md h-[30%] relative group/bar hover:bg-opacity-80 transition-all cursor-pointer"></div>
                                    <div className="w-full bg-surface-dark-lighter rounded-t-md h-[50%] relative group/bar hover:bg-opacity-80 transition-all cursor-pointer"></div>
                                    <div className="w-full bg-surface-dark-lighter rounded-t-md h-[85%] relative group/bar hover:bg-opacity-80 transition-all cursor-pointer"></div>
                                </div>

                                {/* X-Axis Labels */}
                                <div className="px-8 pb-4 flex justify-between text-xs text-text-secondary border-t border-white/5 pt-2">
                                    <span>Campanha A</span>
                                    <span>Black Friday</span>
                                    <span>Retargeting</span>
                                    <span>Topo Funil</span>
                                    <span>Conversão</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};
