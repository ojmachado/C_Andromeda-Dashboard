
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Button, Card } from './UI';
import { SecureKV } from '../utils/kv';
import type { Workspace, CustomReport } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Helper: Mock Data Generator based on Config ---
export const generateReportData = (config: CustomReport['config'], type: CustomReport['type']) => {
    const { dimension, metrics } = config;
    const isTimeSeries = dimension === 'Dia' || dimension === 'Mês';
    const count = isTimeSeries ? 15 : 6; // 15 days or 6 categories
    
    const categories = isTimeSeries 
        ? Array.from({length: count}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (count - i));
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        })
        : ['Campanha Institucional', 'Retargeting Black Friday', 'Topo de Funil - Vídeo', 'Catálogo de Vendas', 'Leads - Ebook', 'Promoção Relâmpago'];

    return categories.map(cat => {
        const row: any = { label: cat };
        metrics.forEach(metric => {
            let val = 0;
            if (metric.includes('Spend') || metric.includes('Cost')) val = Math.random() * 500 + 100;
            else if (metric.includes('CTR') || metric.includes('Rate')) val = Math.random() * 2 + 0.5;
            else if (metric.includes('Impressions')) val = Math.floor(Math.random() * 50000 + 10000);
            else if (metric.includes('ROAS')) val = Math.random() * 5 + 1;
            else val = Math.floor(Math.random() * 200 + 20); // Clicks, Conversions
            
            row[metric] = val;
        });
        return row;
    });
};

// --- Report Viewer Component ---
interface ReportViewerProps {
    report: CustomReport;
    onClose?: () => void;
    onEdit?: () => void;
    onShare?: () => void;
    isPublicView?: boolean;
    workspaces?: Workspace[];
    workspaceId?: string;
    isLoading?: boolean;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose, onEdit, onShare, isPublicView = false, workspaces, workspaceId, isLoading }) => {
    const data = useMemo(() => generateReportData(report.config, report.type), [report]);
    const primaryMetric = report.config.metrics[0];
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-content');
        if(!element) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#131022',
                useCORS: true,
                ignoreElements: (el) => el.classList.contains('no-print'),
                windowWidth: 1366 // Force desktop layout
            });

            const imgData = canvas.toDataURL('image/png');
            
            // Fixed width constraint of 1024pt
            const pdfWidth = 1024;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
                unit: 'pt',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio-${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Failed to export PDF", err);
            alert("Erro ao gerar PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    // Calculate Totals for Header
    const totalPrimary = data.reduce((acc, curr) => acc + (curr[primaryMetric] || 0), 0);

    // Helper wrapper for AppShell if not public view
    const ReportContent = (
        <div className={`flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto ${isPublicView ? '' : 'animate-in fade-in'}`}>
            {/* Viewer Header */}
            <div className="bg-white dark:bg-card-dark border-b border-gray-200 dark:border-border-dark px-6 py-4 sticky top-0 z-10 no-print">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {!isPublicView && (
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-text-secondary transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        {isPublicView && (
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black italic shadow-lg shadow-primary/20">
                                A
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{report.name}</h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                    {report.type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-text-secondary mt-0.5">
                                Criado por {report.author} • Editado em {report.lastEdited}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-border-dark mr-2">
                            <span className="material-symbols-outlined text-gray-500 text-sm mr-2">calendar_today</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-white">Últimos 30 dias</span>
                        </div>
                        
                        {!isPublicView && (
                            <>
                                <Button variant="secondary" onClick={onShare} className="gap-1.5">
                                    <span className="material-symbols-outlined text-sm">share</span> Compartilhar
                                </Button>
                                <Button variant="secondary" onClick={onEdit}>
                                    <span className="material-symbols-outlined text-sm">edit</span> Editar
                                </Button>
                            </>
                        )}
                        
                        <Button onClick={handleDownloadPDF} className={isPublicView ? 'bg-primary' : ''} disabled={isExporting}>
                            {isExporting ? (
                                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                            ) : (
                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            )} 
                            {isPublicView ? 'Baixar PDF' : 'Exportar PDF'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Viewer Content */}
            <div id="report-content" className="flex-1 p-6 max-w-[1400px] mx-auto w-full bg-background-light dark:bg-background-dark">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {report.config.metrics.slice(0, 3).map((metric, idx) => {
                        const total = data.reduce((acc, curr) => acc + (curr[metric] || 0), 0);
                        const val = metric.includes('Spend') || metric.includes('Cost') 
                            ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : metric.includes('ROAS') || metric.includes('CTR')
                            ? (total / data.length).toFixed(2) + (metric.includes('CTR') ? '%' : 'x')
                            : Math.floor(total).toLocaleString();

                        return (
                            <Card key={idx} className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1">{metric}</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{val}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${idx === 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                    <span className="material-symbols-outlined">
                                        {metric.includes('Spend') ? 'payments' : metric.includes('Impressions') ? 'visibility' : 'analytics'}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Main Visualization */}
                <Card className="p-6 min-h-[500px] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Análise Detalhada</h3>
                    <div className="flex-1 w-full h-full relative flex items-center justify-center">
                        
                        {/* BAR CHART RENDERER */}
                        {report.type === 'bar' && (
                            <div className="w-full h-full flex items-end justify-between gap-4 px-4 min-h-[400px]">
                                {data.map((row: any, i: number) => {
                                    const val = row[primaryMetric];
                                    const max = Math.max(...data.map((r: any) => r[primaryMetric]));
                                    const height = (val / max) * 100;
                                    
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                                            <div className="w-full bg-primary/20 dark:bg-primary/30 rounded-t-md hover:bg-primary transition-all relative" style={{ height: `${height}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                    {primaryMetric}: {val.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="mt-2 text-[10px] text-gray-500 dark:text-text-secondary text-center truncate w-full" title={row.label}>
                                                {row.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* LINE CHART RENDERER */}
                        {report.type === 'line' && (
                            <div className="w-full h-full min-h-[400px] relative">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 400" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3713ec" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#3713ec" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const max = Math.max(...data.map((r: any) => r[primaryMetric]));
                                        const points = data.map((r: any, i: number) => {
                                            const x = (i / (data.length - 1)) * 1000;
                                            const y = 400 - (r[primaryMetric] / max) * 380; // 20px padding
                                            return `${x},${y}`;
                                        }).join(' ');
                                        
                                        return (
                                            <>
                                                {/* Grid Lines */}
                                                {[0, 100, 200, 300, 400].map(y => (
                                                    <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="1" />
                                                ))}
                                                
                                                {/* Area */}
                                                <polygon points={`${points} 1000,400 0,400`} fill="url(#viewGrad)" />
                                                
                                                {/* Line */}
                                                <polyline points={points} fill="none" stroke="#3713ec" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                                                
                                                {/* Points */}
                                                {data.map((r: any, i: number) => {
                                                    const x = (i / (data.length - 1)) * 1000;
                                                    const y = 400 - (r[primaryMetric] / max) * 380;
                                                    return (
                                                        <g key={i} className="group cursor-pointer">
                                                            <circle cx={x} cy={y} r="4" className="fill-white dark:fill-background-dark stroke-primary stroke-2 hover:scale-150 transition-transform" />
                                                            <foreignObject x={x - 50} y={y - 40} width="100" height="40" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                <div className="bg-gray-900 text-white text-[10px] p-1 rounded text-center shadow-lg">
                                                                    {r.label}<br/>{r[primaryMetric].toFixed(2)}
                                                                </div>
                                                            </foreignObject>
                                                        </g>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                                <div className="flex justify-between mt-4 text-xs text-gray-500 font-mono uppercase">
                                    <span>{data[0].label}</span>
                                    <span>{data[data.length-1].label}</span>
                                </div>
                            </div>
                        )}

                        {/* TABLE RENDERER */}
                        {report.type === 'table' && (
                            <div className="w-full h-full overflow-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-white/5">
                                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-text-secondary uppercase tracking-wider">{report.config.dimension}</th>
                                            {report.config.metrics.map(m => (
                                                <th key={m} className="p-4 text-xs font-bold text-gray-500 dark:text-text-secondary uppercase tracking-wider text-right">{m}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                                        {data.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{row.label}</td>
                                                {report.config.metrics.map(m => (
                                                    <td key={m} className="p-4 text-sm text-gray-600 dark:text-gray-300 text-right font-mono">
                                                        {m.includes('Spend') ? row[m].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : row[m].toFixed(2)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PIE CHART RENDERER */}
                        {report.type === 'pie' && (
                            <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
                                <div className="relative w-72 h-72">
                                    <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                                        <circle r="16" cx="16" cy="16" fill="transparent" stroke="#3713ec" strokeWidth="32" strokeDasharray="40 100" />
                                        <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10b981" strokeWidth="32" strokeDasharray="30 100" strokeDashoffset="-40" />
                                        <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f59e0b" strokeWidth="32" strokeDasharray="15 100" strokeDashoffset="-85" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-bold text-white drop-shadow-md">Total</span>
                                    </div>
                                </div>
                                <div className="mt-8 flex flex-wrap justify-center gap-6">
                                    {data.slice(0,3).map((d: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${i===0 ? 'bg-primary' : i===1 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                            <div className="text-sm">
                                                <span className="text-gray-900 dark:text-white font-medium">{d.label}</span>
                                                <span className="text-gray-500 dark:text-text-secondary ml-1">
                                                    ({((d[primaryMetric] / totalPrimary) * 100).toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
                {isPublicView && (
                    <div className="mt-8 text-center text-xs text-text-secondary">
                        <p>Powered by <span className="font-bold text-white">AndromedaLab</span></p>
                    </div>
                )}
            </div>
        </div>
    );

    if (isPublicView) {
        return ReportContent;
    }

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
            {ReportContent}
        </AppShell>
    );
};

export const CustomReportsPage = ({ workspaces, isLoading }: { workspaces: Workspace[], isLoading?: boolean }) => {
    const { workspaceId } = useParams();
    const [viewMode, setViewMode] = useState<'list' | 'builder' | 'view'>('list');
    const [reports, setReports] = useState<CustomReport[]>([]);
    
    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Builder State
    const [currentReportId, setCurrentReportId] = useState<string | null>(null);
    const [currentViewReport, setCurrentViewReport] = useState<CustomReport | null>(null);
    const [reportName, setReportName] = useState('Novo Relatório Sem Título');
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Spend Amount', 'Impressions']);
    const [selectedDimension, setSelectedDimension] = useState('Nome da Campanha');
    const [vizType, setVizType] = useState<'line' | 'bar' | 'pie' | 'table'>('bar');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load Reports from KV
    useEffect(() => {
        if (workspaceId) {
            setReports(SecureKV.getCustomReports(workspaceId));
        }
    }, [workspaceId]);

    const handleCreateNew = () => {
        setCurrentReportId(null);
        setReportName('Novo Relatório Sem Título');
        setSelectedMetrics(['Spend Amount', 'Impressions']);
        setSelectedDimension('Nome da Campanha');
        setVizType('bar');
        setHasUnsavedChanges(false);
        setViewMode('builder');
    };

    const handleEditReport = (report: CustomReport) => {
        setCurrentReportId(report.id);
        setReportName(report.name);
        setSelectedMetrics(report.config.metrics);
        setSelectedDimension(report.config.dimension);
        setVizType(report.type);
        setHasUnsavedChanges(false);
        setViewMode('builder');
    };

    const handleViewReport = (report: CustomReport) => {
        setCurrentViewReport(report);
        setViewMode('view');
    };

    const handleDeleteReport = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (window.confirm('Tem certeza que deseja excluir este relatório permanentemente?')) {
            if (workspaceId) {
                SecureKV.deleteCustomReport(workspaceId, id);
                setReports(prev => prev.filter(r => r.id !== id));
            }
        }
    };

    const handleSave = () => {
        if (!workspaceId) return;

        const profile = SecureKV.getUserProfile();
        
        const newReport: CustomReport = {
            id: currentReportId || `rep_${Date.now()}`,
            name: reportName,
            author: currentReportId ? (reports.find(r => r.id === currentReportId)?.author || profile.name) : profile.name,
            lastEdited: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
            type: vizType,
            // Preserve existing sharing settings if editing
            isPublic: currentReportId ? reports.find(r => r.id === currentReportId)?.isPublic : false,
            shareId: currentReportId ? reports.find(r => r.id === currentReportId)?.shareId : undefined,
            config: {
                metrics: selectedMetrics,
                dimension: selectedDimension,
                filters: []
            }
        };

        SecureKV.saveCustomReport(workspaceId, newReport);
        
        // Update local state immediately
        setReports(prev => {
            const idx = prev.findIndex(r => r.id === newReport.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = newReport;
                return updated;
            }
            return [newReport, ...prev];
        });

        setHasUnsavedChanges(false);
        setViewMode('list');
    };

    // --- Sharing Logic ---
    const handleOpenShare = () => {
        if (!currentViewReport || !workspaceId) return;
        
        // Generate shareId if missing
        if (!currentViewReport.shareId) {
            const shareId = crypto.randomUUID();
            const updated = { ...currentViewReport, shareId, isPublic: false };
            SecureKV.saveCustomReport(workspaceId, updated);
            setCurrentViewReport(updated); // Update view
            // Also update list state
            setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        }
        
        // Construct Link
        const link = `${window.location.origin}/#/s/${currentViewReport.shareId || ''}`;
        setShareUrl(link);
        setIsShareModalOpen(true);
    };

    const toggleMetric = (metric: string) => {
        setSelectedMetrics(prev => 
            prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
        );
        setHasUnsavedChanges(true);
    };

    // --- MAIN RENDER ---
    
    if (viewMode === 'view' && currentViewReport) {
        return (
            <ReportViewer 
                report={currentViewReport} 
                onClose={() => setViewMode('list')}
                onEdit={() => handleEditReport(currentViewReport)}
                onShare={handleOpenShare}
                workspaces={workspaces}
                workspaceId={workspaceId}
                isLoading={isLoading}
            />
        );
    }

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
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
                                <button className="px-3 py-1.5 rounded-md bg-surface-dark-lighter text-white text-sm font-medium border border-border-dark bg-white/5">Todos ({reports.length})</button>
                                <button className="px-3 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Meus Relatórios</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-text-secondary uppercase font-bold tracking-wider mr-2">Ordenar por:</span>
                                <select className="bg-card-dark border border-border-dark text-white text-sm rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none">
                                    <option>Mais Recentes</option>
                                    <option>Nome (A-Z)</option>
                                    <option>Última Edição</option>
                                </select>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-hidden rounded-xl border border-border-dark bg-card-dark shadow-xl min-h-[300px]">
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
                                    {reports.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-text-secondary">
                                                Nenhum relatório encontrado. Clique em "Criar Novo Relatório" para começar.
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.map((report) => (
                                            <tr key={report.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleViewReport(report)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded ${
                                                            report.type === 'line' ? 'bg-primary/10 text-primary' : 
                                                            report.type === 'pie' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            report.type === 'bar' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-purple-500/10 text-purple-500'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                {report.type === 'line' ? 'monitoring' : report.type === 'pie' ? 'pie_chart' : report.type === 'bar' ? 'bar_chart' : 'table_chart'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-white font-medium text-sm group-hover:text-primary transition-colors">{report.name}</div>
                                                                {report.isPublic && <span className="material-symbols-outlined text-[14px] text-green-400" title="Compartilhado Publicamente">public</span>}
                                                            </div>
                                                            <div className="text-text-secondary text-xs mt-0.5">Criado por {report.author}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                                        report.type === 'line' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                        report.type === 'pie' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        report.type === 'bar' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
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
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleViewReport(report); }}
                                                            className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors" 
                                                            title="Visualizar"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleEditReport(report); }}
                                                            className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors" 
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <div className="w-px h-4 bg-border-dark mx-1"></div>
                                                        <button 
                                                            onClick={(e) => handleDeleteReport(report.id, e)}
                                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors" 
                                                            title="Excluir"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border-dark bg-white/5">
                                <div className="text-xs text-text-secondary">
                                    Mostrando <span className="text-white font-medium">1</span> a <span className="text-white font-medium">{reports.length}</span> de <span className="text-white font-medium">{reports.length}</span> resultados
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-xs font-medium rounded border border-border-dark text-text-secondary opacity-50 cursor-not-allowed">Anterior</button>
                                    <button className="px-3 py-1 text-xs font-medium rounded border border-border-dark text-white hover:bg-white/10 disabled:opacity-50">Próximo</button>
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
                                className="bg-transparent border-none text-white font-bold text-lg focus:ring-0 px-0 w-64 placeholder:text-text-secondary outline-none border-b border-transparent focus:border-primary transition-colors" 
                                type="text" 
                                value={reportName}
                                onChange={(e) => { setReportName(e.target.value); setHasUnsavedChanges(true); }}
                            />
                            {hasUnsavedChanges && <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-500/20 animate-pulse">Não Salvo</span>}
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
                                onClick={() => {
                                    if(hasUnsavedChanges && !confirm("Descartar alterações não salvas?")) return;
                                    setViewMode('list');
                                }}
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
                                        {['Spend Amount', 'Impressions', 'CTR (All)', 'ROAS', 'Clicks', 'CPM', 'Cost Per Result', 'Frequency'].map(metric => (
                                            <label key={metric} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer transition-colors group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedMetrics.includes(metric)}
                                                    onChange={() => toggleMetric(metric)}
                                                    className="rounded border-border-dark bg-background-dark text-primary focus:ring-primary focus:ring-offset-background-dark" 
                                                />
                                                <span className={`text-sm ${selectedMetrics.includes(metric) ? 'text-white font-medium' : 'text-text-secondary group-hover:text-white'}`}>{metric}</span>
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
                                        onChange={(e) => { setSelectedDimension(e.target.value); setHasUnsavedChanges(true); }}
                                    >
                                        <option>Nome da Campanha</option>
                                        <option>Conjunto de Anúncios</option>
                                        <option>Nome do Anúncio</option>
                                        <option>Plataforma (FB/IG)</option>
                                        <option>Idade &amp; Gênero</option>
                                        <option>Dia</option>
                                        <option>Região</option>
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
                                        { id: 'line', icon: 'show_chart', label: 'Linha' },
                                        { id: 'bar', icon: 'bar_chart', label: 'Barra' },
                                        { id: 'pie', icon: 'pie_chart', label: 'Pizza' },
                                        { id: 'table', icon: 'table_chart', label: 'Tabela' }
                                    ].map(type => (
                                        <button 
                                            key={type.id}
                                            onClick={() => { setVizType(type.id as any); setHasUnsavedChanges(true); }}
                                            title={type.label}
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

                        {/* Canvas - Use ReportViewer Logic but simpler for builder preview */}
                        <div className="flex-1 p-8 overflow-y-auto bg-background-dark flex flex-col">
                            <div className="w-full h-full max-h-[600px] rounded-xl border border-dashed border-border-dark bg-white/5 flex flex-col relative group overflow-hidden">
                                {/* Chart Header */}
                                <div className="p-6 flex justify-between items-start border-b border-border-dark/50">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{selectedMetrics.join(' & ')}</h4>
                                        <p className="text-sm text-text-secondary">Por {selectedDimension}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 rounded hover:bg-white/10 text-text-secondary hover:text-white" title="Exportar PNG">
                                            <span className="material-symbols-outlined">download</span>
                                        </button>
                                        <button className="p-2 rounded hover:bg-white/10 text-text-secondary hover:text-white">
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Visual Representation (Simplified for Builder) */}
                                <div className="flex-1 p-8 relative flex items-center justify-center">
                                    {vizType === 'bar' && (
                                        <div className="flex-1 w-full h-full flex items-end justify-between gap-4 relative px-4">
                                            {[40, 65, 30, 50, 85, 45, 60].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col justify-end h-full z-10 group/bar cursor-pointer">
                                                    <div className="w-full bg-primary/20 group-hover/bar:bg-primary transition-all rounded-t-sm relative" style={{ height: `${h}%` }}>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {vizType === 'line' && (
                                        <div className="w-full h-full relative">
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <path d="M0,80 C20,70 40,90 60,40 S80,10 100,50" fill="none" stroke="#3713ec" strokeWidth="2" />
                                                <path d="M0,80 C20,70 40,90 60,40 S80,10 100,50 L100,100 L0,100 Z" fill="url(#grad)" stroke="none" opacity="0.2" />
                                                <defs>
                                                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#3713ec" stopOpacity="1" />
                                                        <stop offset="100%" stopColor="#3713ec" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>
                                    )}

                                    {vizType === 'pie' && (
                                        <div className="w-64 h-64 rounded-full border-8 border-primary/30 flex items-center justify-center relative">
                                            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                                                <circle r="16" cx="16" cy="16" fill="transparent" stroke="#3713ec" strokeWidth="32" strokeDasharray="40 100" />
                                                <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10b981" strokeWidth="32" strokeDasharray="30 100" strokeDashoffset="-40" />
                                            </svg>
                                        </div>
                                    )}

                                    {vizType === 'table' && (
                                        <div className="w-full h-full overflow-hidden">
                                            <table className="w-full text-left text-sm text-text-secondary">
                                                <thead className="border-b border-border-dark text-white bg-white/5">
                                                    <tr>
                                                        <th className="p-3">{selectedDimension}</th>
                                                        {selectedMetrics.map(m => <th key={m} className="p-3 text-right">{m}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[1,2,3,4,5].map(i => (
                                                        <tr key={i} className="border-b border-border-dark/50 hover:bg-white/5">
                                                            <td className="p-3 font-medium text-white">Item {i}</td>
                                                            {selectedMetrics.map(m => <td key={m} className="p-3 text-right font-mono">{(Math.random() * 1000).toFixed(2)}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};
