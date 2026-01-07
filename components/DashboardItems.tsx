
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

// Enhanced Data Point Interface
export interface ChartDataPoint {
    date: string;
    value?: number; // legacy/simple support
    spend?: number;
    conversations?: number;
    [key: string]: any;
}

export const ChartContainer: React.FC<{ title: string; data?: ChartDataPoint[]; isLoading?: boolean; yAxisLabel?: string }> = ({ title, data = [], isLoading, yAxisLabel }) => {
  const isDualLine = data.length > 0 && typeof data[0].spend === 'number' && typeof data[0].conversations === 'number';

  // Calculate Max Values for Scales
  const maxSpend = useMemo(() => Math.max(...data.map(x => x.spend || 0), 1), [data]);
  const maxConv = useMemo(() => Math.max(...data.map(x => x.conversations || 0), 1), [data]);

  // Formatters
  const formatCurrencyCompact = (val: number) => {
      if (val >= 1000) return `R$ ${(val/1000).toFixed(1)}k`;
      return `R$ ${Math.round(val)}`;
  };

  // Helper for smooth bezier
  const getSmoothPath = (key: 'value' | 'spend' | 'conversations', width: number, height: number) => {
      const values = data.map(d => d[key] as number || 0);
      const max = key === 'conversations' ? maxConv : (key === 'spend' ? maxSpend : Math.max(...values, 1));
      
      const points = values.map((val, i) => {
          const x = (i / (values.length - 1 || 1)) * width;
          const y = height - (val / max) * (height - 40) - 20; // Increased padding for labels
          return [x, y];
      });

      if (points.length === 0) return "";
      let d = `M ${points[0][0]},${points[0][1]}`;

      for (let i = 0; i < points.length - 1; i++) {
          const [x0, y0] = points[i];
          const [x1, y1] = points[i + 1];
          const cp1x = x0 + (x1 - x0) * 0.5;
          const cp1y = y0;
          const cp2x = x1 - (x1 - x0) * 0.5;
          const cp2y = y1;
          d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
      }
      return d;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h4 className="font-bold text-slate-800 dark:text-white">{title}</h4>
        
        {isDualLine && !isLoading && (
            <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-[#3713ec] relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#3713ec]"></div>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">Investimento</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-[#10b981] relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#10b981]"></div>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">Conversas</span>
                </div>
            </div>
        )}
      </div>
      
      <div className="h-72 w-full relative">
          {isLoading ? (
             <Skeleton className="w-full h-full rounded-lg" />
          ) : data.length === 0 ? (
             <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-700 rounded-lg">
                 Sem dados suficientes para gerar o gráfico.
             </div>
          ) : (
             <svg viewBox="0 0 1000 280" className="w-full h-full overflow-visible preserve-3d font-sans">
                 {/* Grid lines & Axis Labels */}
                 {[0, 0.5, 1].map((p, i) => {
                     const y = 280 - (280 - 40) * p - 20; // Match point scale logic
                     return (
                        <g key={p}>
                            <line x1="40" y1={y} x2="960" y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />
                            {/* Left Axis (Spend) */}
                            <text x="35" y={y + 4} textAnchor="end" fill="#3713ec" fontSize="10" fontWeight="bold" opacity="0.6">
                                {formatCurrencyCompact(maxSpend * p)}
                            </text>
                            {/* Right Axis (Conversations) - Only if dual */}
                            {isDualLine && (
                                <text x="965" y={y + 4} textAnchor="start" fill="#10b981" fontSize="10" fontWeight="bold" opacity="0.6">
                                    {Math.round(maxConv * p)}
                                </text>
                            )}
                        </g>
                     );
                 })}

                 {isDualLine ? (
                     <>
                        {/* Spend Line */}
                        <path d={getSmoothPath('spend', 1000, 280)} fill="none" stroke="#3713ec" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                        
                        {/* Conversations Line */}
                        <path d={getSmoothPath('conversations', 1000, 280)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

                        {/* Interactive Overlay & Points */}
                        {data.map((d, i) => {
                             const x = (i / (data.length - 1 || 1)) * 1000;
                             const ySpend = 280 - ((d.spend || 0) / maxSpend) * 240 - 20;
                             const yConv = 280 - ((d.conversations || 0) / maxConv) * 240 - 20;

                             // Logic to declutter labels: Show first, last, and every ~5th point
                             const density = Math.ceil(data.length / 8); 
                             const showLabel = i === 0 || i === data.length - 1 || i % density === 0;

                             return (
                                 <g key={i} className="group/point">
                                     {/* Invisible hover bar */}
                                     <rect x={x - 10} y="0" width="20" height="280" fill="transparent" className="cursor-pointer" />
                                     
                                     {/* Vertical Guide Line on Hover */}
                                     <line x1={x} y1="20" x2={x} y2="260" stroke="white" strokeWidth="1" opacity="0" className="group-hover/point:opacity-20 transition-opacity" />

                                     {/* Spend Dot */}
                                     <circle cx={x} cy={ySpend} r="4" fill="#131022" stroke="#3713ec" strokeWidth="2" className="opacity-100 transition-opacity" />
                                     
                                     {/* Conv Dot */}
                                     <circle cx={x} cy={yConv} r="4" fill="#131022" stroke="#10b981" strokeWidth="2" className="opacity-100 transition-opacity" />

                                     {/* Static Labels (Smartly hidden if too dense) */}
                                     {showLabel && (
                                         <>
                                            <text x={x} y={ySpend - 12} textAnchor="middle" fill="#3713ec" fontSize="11" fontWeight="bold" className="drop-shadow-md">
                                                {formatCurrencyCompact(d.spend || 0)}
                                            </text>
                                            <text x={x} y={yConv + 18} textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold" className="drop-shadow-md">
                                                {d.conversations}
                                            </text>
                                         </>
                                     )}

                                     {/* Tooltip (Always shows full details on hover) */}
                                     <foreignObject x={Math.min(Math.max(x - 75, 0), 850)} y="0" width="150" height="100" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none z-50">
                                        <div className="bg-slate-900/95 backdrop-blur-md text-white text-[11px] rounded-lg p-2 shadow-xl border border-slate-700/50 flex flex-col gap-1 mt-2">
                                            <div className="font-bold text-slate-300 border-b border-white/10 pb-1 mb-1 text-center">{d.date}</div>
                                            <div className="flex justify-between items-center gap-3">
                                                <span className="text-[#818cf8]">Investimento:</span>
                                                <span className="font-mono font-bold">{(d.spend || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-3">
                                                <span className="text-[#34d399]">Conversas:</span>
                                                <span className="font-mono font-bold">{(d.conversations || 0).toLocaleString('pt-BR')}</span>
                                            </div>
                                        </div>
                                     </foreignObject>
                                 </g>
                             );
                        })}
                     </>
                 ) : (
                     // Fallback Single Line
                     <>
                        <path d={getSmoothPath('value', 1000, 280)} fill="none" stroke="#3713ec" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                     </>
                 )}
             </svg>
          )}
      </div>
      {!isLoading && data.length > 0 && (
          <div className="flex justify-between text-xs text-text-secondary mt-2 font-mono uppercase tracking-widest px-8">
              <span>{data[0]?.date}</span>
              <span>{data[Math.floor(data.length/2)]?.date}</span>
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
      { key: 'messages', label: 'Mensagens' }, 
      { key: 'costPerConversation', label: 'Custo por Mensagem' },
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
