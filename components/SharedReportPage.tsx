
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReportViewer } from './CustomReportsPage';
import { SecureKV } from '../utils/kv';
import type { CustomReport } from '../types';

export const SharedReportPage: React.FC = () => {
    const { shareId } = useParams();
    const [report, setReport] = useState<CustomReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Add no-index meta tag dynamically
        const meta = document.createElement('meta');
        meta.name = "robots";
        meta.content = "noindex, nofollow";
        document.head.appendChild(meta);

        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            await new Promise(r => setTimeout(r, 800)); // Simulate net latency

            if (!shareId) {
                setError("Link inválido.");
                setLoading(false);
                return;
            }

            const found = SecureKV.getSharedReport(shareId);
            
            if (found) {
                setReport(found);
            } else {
                setError("Relatório não encontrado ou o link expirou.");
            }
            setLoading(false);
        };

        fetchReport();
    }, [shareId]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-text-secondary animate-pulse">Carregando visualização...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500">link_off</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Acesso Indisponível</h1>
                <p className="text-text-secondary max-w-md mb-8">{error}</p>
                <Link to="/login" className="text-primary hover:underline text-sm">
                    Ir para Andromeda Lab
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-background-dark">
            <ReportViewer 
                report={report} 
                isPublicView={true}
            />
        </div>
    );
};