
import React from 'react';
import { DASHBOARD_TEMPLATES } from '../utils/kv';
import type { DashboardTemplate } from '../types';

interface TemplateSelectorProps {
    currentTemplateId: string;
    onSelect: (template: DashboardTemplate) => void;
    onClose?: () => void; // Made optional for full page view
}

const ChartPreview = ({ type, colorClass }: { type: string, colorClass: string }) => {
    // Map Tailwind bg classes to Hex colors for SVG manipulation
    const colorMap: Record<string, string> = {
        'bg-emerald-500': '#10b981',
        'bg-blue-500': '#3b82f6',
        'bg-sky-500': '#0ea5e9',
        'bg-purple-500': '#a855f7',
        'bg-primary': '#3713ec', 
        'bg-amber-500': '#f59e0b'
    };
    
    const stroke = colorMap[colorClass] || '#3713ec';

    if (type === 'ecom') {
        // Bar Chart Simulation
        return (
            <div className="w-full h-full flex items-end justify-between px-4 gap-1.5 pb-0 opacity-90">
                {[35, 55, 40, 70, 50, 85, 60, 95].map((h, i) => (
                    <div 
                        key={i} 
                        className="flex-1 rounded-t-sm transition-all duration-500 ease-out" 
                        style={{ height: `${h}%`, backgroundColor: stroke, opacity: 0.2 + (i * 0.1) }}
                    ></div>
                ))}
            </div>
        );
    }
    
    if (type === 'messaging') {
        // Conversation/Timeline View
        return (
             <div className="w-full h-full flex flex-col justify-center gap-2 px-6 opacity-80">
                <div className="h-2.5 w-[60%] rounded-full opacity-40" style={{ backgroundColor: stroke }}></div>
                <div className="h-2.5 w-[40%] rounded-full opacity-20" style={{ backgroundColor: stroke }}></div>
                <div className="h-2.5 w-[80%] rounded-full self-end opacity-60" style={{ backgroundColor: stroke }}></div>
                <div className="h-2.5 w-[50%] rounded-full self-end opacity-30" style={{ backgroundColor: stroke }}></div>
                <div className="h-2.5 w-[70%] rounded-full opacity-50" style={{ backgroundColor: stroke }}></div>
             </div>
        );
    }

    if (type === 'awareness') {
        // Area Chart (Waves)
        return (
            <div className="w-full h-full relative overflow-hidden flex items-end pb-2">
                <svg viewBox="0 0 100 40" className="w-full h-[80%] drop-shadow-sm" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d="M0,40 L0,20 Q25,5 50,20 T100,10 V40 Z" fill={`url(#grad-${type})`} />
                    <path d="M0,20 Q25,5 50,20 T100,10" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
        );
    }

    if (type === 'leads') {
        // Funnel / Bar mix
        return (
            <div className="w-full h-full flex flex-col items-center justify-end pb-3 gap-1">
                {[100, 80, 60, 40].map((w, i) => (
                    <div 
                        key={i}
                        className="h-3 rounded-full opacity-80"
                        style={{ width: `${w}%`, backgroundColor: stroke, opacity: 1 - (i * 0.2) }}
                    ></div>
                ))}
            </div>
        );
    }

    // Default / General / Traffic (Line Chart)
    return (
        <div className="w-full h-full flex items-end pb-4 px-2">
            <svg viewBox="0 0 100 40" className="w-full h-[70%] overflow-visible" preserveAspectRatio="none">
                <path 
                    d="M0,35 Q25,40 50,20 T100,5" 
                    fill="none" 
                    stroke={stroke} 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                />
                <circle cx="0" cy="35" r="2" fill={stroke} />
                <circle cx="50" cy="20" r="2" fill={stroke} />
                <circle cx="100" cy="5" r="2" fill={stroke} />
            </svg>
        </div>
    );
};

export const DashboardTemplateSelector: React.FC<TemplateSelectorProps> = ({ currentTemplateId, onSelect, onClose }) => {
    const categories = [
        { id: 'all', label: 'Todos' },
        { id: 'ecom', label: 'Vendas' },
        { id: 'messaging', label: 'Conversas' },
        { id: 'leads', label: 'Leads' },
        { id: 'awareness', label: 'Engajamento' }
    ];
    
    const [filter, setFilter] = React.useState('all');

    const filteredTemplates = DASHBOARD_TEMPLATES.filter(t => filter === 'all' || t.category === filter);

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                            filter === cat.id 
                            ? 'bg-primary text-white' 
                            : 'bg-white dark:bg-[#292348] text-slate-600 dark:text-text-secondary hover:text-white hover:bg-gray-200 dark:hover:bg-[#352d5e]'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1" style={{ maxHeight: onClose ? '60vh' : 'none' }}>
                {filteredTemplates.map(template => {
                    const isSelected = template.id === currentTemplateId;
                    
                    const colorClass = 
                        template.category === 'ecom' ? 'bg-emerald-500' :
                        template.category === 'leads' ? 'bg-blue-500' :
                        template.category === 'messaging' ? 'bg-sky-500' :
                        template.category === 'awareness' ? 'bg-purple-500' :
                        'bg-primary';

                    return (
                        <div
                            key={template.id}
                            className={`group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#1e1b2e] border-2 transition-all ${
                                isSelected 
                                ? 'border-primary shadow-[0_0_15px_rgba(55,19,236,0.15)]' 
                                : 'border-gray-200 dark:border-[#292348] hover:border-primary/50 hover:shadow-lg'
                            }`}
                        >
                            {/* Header / Chart Preview Area */}
                            <div className="relative h-32 bg-gray-50 dark:bg-[#151221] border-b border-gray-100 dark:border-[#292348] flex items-end justify-center overflow-hidden">
                                {/* Decorative Grid */}
                                <div 
                                    className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                                    style={{ 
                                        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', 
                                        backgroundSize: '16px 16px' 
                                    }}
                                ></div>
                                
                                {/* Dynamic Chart */}
                                <div className="w-full h-24 px-4 relative z-10 group-hover:scale-105 transition-transform duration-500 origin-bottom">
                                    <ChartPreview type={template.category} colorClass={colorClass} />
                                </div>

                                {/* Floating Icon Badge */}
                                <div className={`absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg ${colorClass} z-20`}>
                                    <span className="material-symbols-outlined text-[18px]">{template.icon}</span>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-3 right-3 z-20">
                                        <span className="flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md border border-white/10">
                                            <span className="material-symbols-outlined text-[12px]">check</span>
                                            Ativo
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{template.name}</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-text-secondary flex items-center gap-1">
                                        Foco: {template.category === 'ecom' ? 'Vendas' : template.category === 'leads' ? 'Cadastros' : template.category === 'messaging' ? 'Conversas' : template.category === 'awareness' ? 'Alcance' : 'Geral'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-text-secondary mb-6 line-clamp-3 leading-relaxed">
                                    {template.description}
                                </p>

                                <div className="mt-auto grid grid-cols-2 gap-3">
                                    <button 
                                        className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-[#292348] py-2 text-sm font-medium text-slate-700 dark:text-white transition-colors hover:bg-gray-200 dark:hover:bg-[#352d5e] cursor-not-allowed opacity-70"
                                        title="Preview indisponível"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        Visualizar
                                    </button>
                                    
                                    {isSelected ? (
                                        <button className="flex items-center justify-center rounded-lg bg-green-500/10 py-2 text-sm font-medium text-green-500 cursor-default border border-green-500/20">
                                            Selecionado
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onSelect(template)}
                                            className="flex items-center justify-center rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark shadow-lg shadow-primary/20"
                                        >
                                            Definir Padrão
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {onClose && (
                <div className="mt-6 flex justify-end pt-4 border-t border-gray-200 dark:border-[#292348]">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            )}
        </div>
    );
};
