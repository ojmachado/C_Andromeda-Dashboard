
import React from 'react';
import { Card, Skeleton } from './UI.js';
import type { InsightData } from '../types.js';

export const KpiCard: React.FC<{ label: string; value: string; subValue?: string; icon?: string; isLoading?: boolean }> = ({ label, value, subValue, isLoading }) => (
  <Card className="p-5">
    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
    {isLoading ? (
      <Skeleton className="h-8 w-24 my-1" />
    ) : (
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    )}
    {subValue && <div className="text-xs text-emerald-600 font-medium mt-1">{subValue}</div>}
  </Card>
);

export const KpiGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {children}
  </div>
);

export const ChartContainer: React.FC<{ title: string; data?: number[]; isLoading?: boolean }> = ({ title, data = [], isLoading }) => {
  // Normalize data for chart height (0 to 100%)
  const maxVal = Math.max(...data, 1);
  const normalizedData = data.map(v => (v / maxVal) * 100);

  return (
    <Card className="p-6">
      <h4 className="font-bold text-slate-800 mb-6">{title}</h4>
      <div className="h-64 w-full flex items-end justify-between px-2 pb-6 border-b border-slate-100 gap-1">
          {isLoading ? (
             Array(30).fill(0).map((_, i) => (
               <Skeleton key={i} className="w-full mx-0.5 rounded-t" style={{ height: `${Math.random() * 50 + 20}%` }} />
             ))
          ) : normalizedData.length === 0 ? (
             <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Sem dados de histórico recente</div>
          ) : (
             normalizedData.map((v, i) => (
               <div key={i} className="bg-blue-600 hover:bg-blue-500 transition-all rounded-t w-full relative group" style={{ height: `${v}%` }}>
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    {data[i].toFixed(2)}
                  </div>
               </div>
             ))
          )}
      </div>
    </Card>
  );
};

export const DataTable: React.FC<{ data: InsightData[]; isLoading?: boolean }> = ({ data, isLoading }) => (
  <Card className="overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[600px]">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          {["Nome", "Spend", "Impr", "Clicks", "CTR", "CPM", "CPC"].map(h => (
            <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
           Array(3).fill(0).map((_, i) => (
             <tr key={i} className="border-b border-slate-100">
               <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
               {Array(6).fill(0).map((__, j) => (
                 <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
               ))}
             </tr>
           ))
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-10 text-center text-slate-400">Nenhum dado para exibir.</td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-slate-700 truncate max-w-[200px]" title={row.name}>{row.name}</td>
              <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                {row.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{row.impressions.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{row.clicks.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{row.ctr.toFixed(2)}%</td>
              <td className="px-6 py-4 text-sm text-slate-600">{row.cpm.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{row.cpc.toFixed(2)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </Card>
);
