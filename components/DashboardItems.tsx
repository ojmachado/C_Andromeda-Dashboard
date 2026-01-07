
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

export const DataTable: React.FC<{ data: InsightData[]; isLoading?: boolean; viewLevel?: 'campaign' | 'adset' | 'ad' }> = ({ data, isLoading, viewLevel = 'campaign' }) => {
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

  const headers = [
      { key: 'name', label: viewLevel === 'campaign' ? 'Campanha' : viewLevel === 'adset' ? 'Conjunto' : 'Anúncio' },
      { key: 'status', label: 'Status' },
      // FB/IG Columns only for ads
      ...(viewLevel === 'ad' ? [
          { key: 'fbLink', label: 'FB', icon: 'facebook' },
          { key: 'igLink', label: 'IG', icon: 'instagram' }
      ] : []),
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
            {headers.map((h, i) => (
              <th 
                key={i}
                onClick={() => h.key !== 'fbLink' && h.key !== 'igLink' && requestSort(h.key as SortKey)}
                className={`px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ${h.key !== 'fbLink' && h.key !== 'igLink' ? 'cursor-pointer hover:text-primary' : ''} transition-colors select-none group whitespace-nowrap`}
              >
                <div className="flex items-center gap-1">
                    {h.icon === 'facebook' && (
                        <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    )}
                    {h.icon === 'instagram' && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="24" rx="6" fill="url(#ig_gradient)" />
                            <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
                            <circle cx="18" cy="6" r="1.5" fill="white" />
                            <defs>
                                <linearGradient id="ig_gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#f09433" />
                                    <stop offset="0.25" stopColor="#e6683c" />
                                    <stop offset="0.5" stopColor="#dc2743" />
                                    <stop offset="0.75" stopColor="#cc2366" />
                                    <stop offset="1" stopColor="#bc1888" />
                                </linearGradient>
                            </defs>
                        </svg>
                    )}
                    {!h.icon && h.label}
                    {h.key !== 'fbLink' && h.key !== 'igLink' && <SortIcon column={h.key as SortKey} />}
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
                 {Array(11).fill(0).map((__, j) => (
                   <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                 ))}
               </tr>
             ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-10 text-center text-slate-400">Nenhum item com veiculação no período selecionado.</td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-sm truncate max-w-[280px]" title={row.name}>
                    {/* Primary: Name linked to Details */}
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
                    
                    {/* Secondary: Campaign Name (Only for AdSet/Ad levels) */}
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
                
                {/* Facebook Link */}
                {viewLevel === 'ad' && (
                    <td className="px-6 py-4">
                        {row.fbLink ? (
                            <a 
                                href={row.fbLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-colors"
                                title="Abrir no Facebook"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-500/5 border border-slate-500/10 flex items-center justify-center text-slate-400 cursor-not-allowed opacity-50">
                                <span className="material-symbols-outlined text-sm">block</span>
                            </div>
                        )}
                    </td>
                )}

                {/* Instagram Link */}
                {viewLevel === 'ad' && (
                    <td className="px-6 py-4">
                        {row.igLink ? (
                            <a 
                                href={row.igLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center hover:bg-pink-500/20 transition-colors group/ig"
                                title="Abrir no Instagram"
                            >
                                <svg className="w-4 h-4 group-hover/ig:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="6" fill="url(#ig_gradient_btn)" />
                                    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
                                    <circle cx="18" cy="6" r="1.5" fill="white" />
                                    <defs>
                                        <linearGradient id="ig_gradient_btn" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#f09433" />
                                            <stop offset="0.25" stopColor="#e6683c" />
                                            <stop offset="0.5" stopColor="#dc2743" />
                                            <stop offset="0.75" stopColor="#cc2366" />
                                            <stop offset="1" stopColor="#bc1888" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </a>
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-500/5 border border-slate-500/10 flex items-center justify-center text-slate-400 cursor-not-allowed opacity-50">
                                <span className="material-symbols-outlined text-sm">block</span>
                            </div>
                        )}
                    </td>
                )}

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
