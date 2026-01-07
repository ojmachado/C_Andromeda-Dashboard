
import React, { useState, useMemo } from 'react';
import { Card, Skeleton } from './UI.js';
import type { InsightData } from '../types.js';

interface KpiCardProps {
    label: string;
    value: string;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    isLoading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subValue, trend, icon = 'equalizer', isLoading }) => {
    const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';
    const trendIcon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove';
    const trendBg = trend === 'up' ? 'bg-emerald-500/10' : trend === 'down' ? 'bg-rose-500/10' : 'bg-slate-500/10';

    return (
        <Card className="p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-4xl">{icon}</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
            {isLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
            ) : (
                <div className="flex flex-col gap-1 relative z-10">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
                    {subValue && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium w-fit px-1.5 py-0.5 rounded ${trendBg} ${trendColor}`}>
                            <span className="material-symbols-outlined text-[14px]">{trendIcon}</span>
                            {subValue}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export const KpiGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    {children}
  </div>
);

export const ChartContainer: React.FC<{ title: string; data?: { date: string, value: number }[]; isLoading?: boolean; yAxisLabel?: string }> = ({ title, data = [], isLoading, yAxisLabel }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  // Create SVG path for the line
  const width = 1000;
  const height = 200;
  const paddingLeft = yAxisLabel ? 40 : 0;
  const graphWidth = width - paddingLeft;
  
  const points = data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1 || 1)) * graphWidth;
      const y = height - (d.value / maxVal) * height; // Invert Y because SVG 0 is top
      return `${x},${y}`;
  }).join(' ');

  const areaPath = `${points} ${width},${height} ${paddingLeft},${height}`;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-slate-800 dark:text-white">{title}</h4>
      </div>
      
      <div className="h-64 w-full relative flex">
          {yAxisLabel && (
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 font-mono uppercase tracking-widest whitespace-nowrap origin-center">
                  {yAxisLabel}
              </div>
          )}

          {isLoading ? (
             <Skeleton className="w-full h-full rounded-lg" />
          ) : data.length === 0 ? (
             <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-700 rounded-lg">
                 Sem dados suficientes para gerar o gráfico.
             </div>
          ) : (
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
                 <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3713ec" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3713ec" stopOpacity="0" />
                    </linearGradient>
                 </defs>
                 {/* Grid lines */}
                 <line x1={paddingLeft} y1={height} x2={width} y2={height} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                 <line x1={paddingLeft} y1={height/2} x2={width} y2={height/2} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

                 {/* Area */}
                 <polygon points={areaPath} fill="url(#gradient)" />

                 {/* Line */}
                 <polyline points={points} fill="none" stroke="#3713ec" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                 
                 {/* Data Points (only show if few points) */}
                 {data.length < 30 && data.map((d, i) => {
                     const x = paddingLeft + (i / (data.length - 1 || 1)) * graphWidth;
                     const y = height - (d.value / maxVal) * height;
                     return (
                         <g key={i} className="group/point">
                             <circle cx={x} cy={y} r="4" fill="#131022" stroke="#3713ec" strokeWidth="2" className="group-hover/point:scale-150 transition-transform cursor-pointer" />
                             {/* Tooltip */}
                             <foreignObject x={x - 60} y={y - 50} width="120" height="40" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-slate-900 text-white text-[10px] rounded px-2 py-1 text-center shadow-lg border border-slate-700">
                                    <div className="font-bold">{d.date}</div>
                                    <div>{d.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                </div>
                             </foreignObject>
                         </g>
                     );
                 })}
             </svg>
          )}
      </div>
      {!isLoading && data.length > 0 && (
          <div className="flex justify-between text-xs text-text-secondary mt-2 font-mono" style={{ paddingLeft: paddingLeft }}>
              <span>{data[0]?.date}</span>
              <span>{data[data.length - 1]?.date}</span>
          </div>
      )}
    </Card>
  );
};

type SortKey = keyof InsightData;
type SortDirection = 'asc' | 'desc';

export const DataTable: React.FC<{ data: InsightData[]; isLoading?: boolean }> = ({ data, isLoading }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'spend', direction: 'desc' });

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] ?? 0;
        const valB = b[sortConfig.key] ?? 0;

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <span className="material-symbols-outlined text-[10px] opacity-30 ml-1">unfold_more</span>;
      return <span className="material-symbols-outlined text-[10px] ml-1">{sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'}</span>;
  };

  const headers: { key: SortKey; label: string }[] = [
      { key: 'name', label: 'Nome' },
      { key: 'status', label: 'Status' },
      { key: 'adPreviewLink', label: 'Link do Anúncio' },
      { key: 'spend', label: 'Investimento' },
      { key: 'messages', label: 'Msgs' }, 
      { key: 'costPerConversation', label: 'Custo/Msg' },
      { key: 'impressions', label: 'Impr.' },
      { key: 'clicks', label: 'Clicks' },
      { key: 'ctr', label: 'CTR' },
      { key: 'cpc', label: 'CPC' },
      { key: 'cpa', label: 'CPA' },
  ];

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1400px]">
        <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
          <tr>
            {headers.map(h => (
              <th 
                key={h.key} 
                onClick={() => h.key !== 'adPreviewLink' && requestSort(h.key)}
                className={`px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${h.key !== 'adPreviewLink' ? 'cursor-pointer hover:text-primary' : ''} transition-colors select-none group whitespace-nowrap`}
              >
                <div className="flex items-center">
                    {h.label}
                    {h.key !== 'adPreviewLink' && <SortIcon column={h.key} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
             Array(5).fill(0).map((_, i) => (
               <tr key={i} className="border-b border-slate-100 dark:border-white/5">
                 <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                 {Array(10).fill(0).map((__, j) => (
                   <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                 ))}
               </tr>
             ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-6 py-10 text-center text-slate-400">Nenhum item com veiculação no período selecionado.</td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-sm truncate max-w-[280px]" title={row.name}>
                    {/* Primary: Ad Name linked to Ad Details */}
                    {row.detailsLink ? (
                        <a 
                            href={row.detailsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold text-slate-700 dark:text-white hover:text-primary hover:underline decoration-dashed underline-offset-4 transition-all block mb-0.5"
                        >
                            {row.name}
                        </a>
                    ) : (
                        <span className="font-semibold text-slate-700 dark:text-white block mb-0.5">{row.name}</span>
                    )}
                    
                    {/* Secondary: Campaign Name linked to Campaign Details */}
                    {row.campaignName ? (
                        <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <span className="material-symbols-outlined text-[12px] opacity-50">campaign</span>
                            {row.campaignDetailsLink ? (
                                <a 
                                    href={row.campaignDetailsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate max-w-[200px] hover:text-primary hover:underline transition-colors"
                                    title={`Ir para Campanha: ${row.campaignName}`}
                                >
                                    {row.campaignName}
                                </a>
                            ) : (
                                <span className="truncate max-w-[200px]" title={row.campaignName}>{row.campaignName}</span>
                            )}
                        </div>
                    ) : row.objective && (
                         <div className="text-[10px] font-mono text-text-secondary mt-0.5 opacity-70">
                            {row.objective.replace('OUTCOME_', '')}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${row.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {row.status || 'UNKNOWN'}
                    </span>
                </td>
                
                {/* Link do Anúncio (Facebook & Instagram) */}
                <td className="px-6 py-4">
                    {row.adPreviewLink ? (
                        <div className="flex items-center gap-2">
                            {/* Facebook Link */}
                            <a 
                                href={row.adPreviewLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-colors"
                                title="Visualizar no Facebook"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                            {/* Instagram Link (Uses same preview but visualized differently) */}
                            <a 
                                href={row.adPreviewLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 hover:bg-pink-500 hover:text-white transition-colors"
                                title="Visualizar no Instagram"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                        </div>
                    ) : (
                        <span className="text-xs text-text-secondary opacity-30">N/A</span>
                    )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono font-medium">
                  {row.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                
                {/* Mensagens */}
                <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-white">
                  {row.messages > 0 ? (
                      <div className="flex items-center gap-1">
                          {row.messages.toLocaleString()}
                      </div>
                  ) : <span className="text-slate-500 opacity-50">-</span>}
                </td>
                
                {/* Custo Por Mensagem */}
                <td className="px-6 py-4 text-sm font-mono font-medium">
                  {row.messages > 0 ? (
                      <span className={row.costPerConversation < 5 ? 'text-emerald-400' : row.costPerConversation < 15 ? 'text-amber-400' : 'text-rose-400'}>
                         {row.costPerConversation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                  ) : <span className="text-slate-500 opacity-50">-</span>}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.clicks.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.ctr.toFixed(2)}%</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.cpc.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-bold text-slate-400">
                    {row.cpa > 0 ? row.cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
};
