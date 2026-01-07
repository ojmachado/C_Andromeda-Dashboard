
import React from 'react';
import { DASHBOARD_TEMPLATES } from '../utils/kv';
import type { DashboardTemplate } from '../types';

interface TemplateSelectorProps {
    currentTemplateId: string;
    onSelect: (template: DashboardTemplate) => void;
    onClose: () => void;
}

export const DashboardTemplateSelector: React.FC<TemplateSelectorProps> = ({ currentTemplateId, onSelect, onClose }) => {
    const categories = [
        { id: 'all', label: 'Todos' },
        { id: 'ecom', label: 'Vendas' },
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '60vh' }}>
                {filteredTemplates.map(template => {
                    const isSelected = template.id === currentTemplateId;
                    
                    return (
                        <div
                            key={template.id}
                            className={`group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#1e1b2e] border-2 transition-all ${
                                isSelected 
                                ? 'border-primary shadow-[0_0_15px_rgba(55,19,236,0.15)]' 
                                : 'border-gray-200 dark:border-[#292348] hover:border-primary/50 hover:shadow-lg'
                            }`}
                        >
                            {/* Header / Icon Area */}
                            <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#25213a] dark:to-[#1a1729] flex items-center justify-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                    template.category === 'ecom' ? 'bg-emerald-500' :
                                    template.category === 'leads' ? 'bg-blue-500' :
                                    template.category === 'awareness' ? 'bg-purple-500' :
                                    'bg-primary'
                                }`}>
                                    <span className="material-symbols-outlined text-[32px]">{template.icon}</span>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md">
                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                            Padrão
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{template.name}</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-xs text-slate-400 dark:text-text-secondary">{template.icon}</span>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-text-secondary">
                                        Foco: {template.category === 'ecom' ? 'Vendas' : template.category === 'leads' ? 'Cadastros' : template.category === 'awareness' ? 'Alcance' : 'Geral'}
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
            
            <div className="mt-6 flex justify-end pt-4 border-t border-gray-200 dark:border-[#292348]">
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};