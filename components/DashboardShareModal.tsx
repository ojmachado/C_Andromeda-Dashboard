
import React, { useState, useEffect } from 'react';
import { Modal, Button } from './UI';
import { SecureKV } from '../utils/kv';
import type { Workspace } from '../types';

interface DashboardShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Workspace | undefined;
    onUpdateWorkspace: (updated: Workspace) => void;
}

export const DashboardShareModal: React.FC<DashboardShareModalProps> = ({ isOpen, onClose, workspace, onUpdateWorkspace }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [shareId, setShareId] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (workspace && isOpen) {
            // Load existing config or init
            const config = SecureKV.getWorkspaceShareConfig(workspace.id);
            if (config) {
                setIsEnabled(config.isEnabled);
                setShareId(config.shareId);
                const url = `${window.location.origin}/#/shared/dashboard/${config.shareId}`;
                setShareUrl(url);
            } else {
                setIsEnabled(false);
                // Generate a new ID but don't save yet until user enables
                const newId = crypto.randomUUID().slice(0, 12); 
                setShareId(newId);
                setShareUrl(`${window.location.origin}/#/shared/dashboard/${newId}`);
            }
        }
    }, [workspace, isOpen]);

    const handleToggle = () => {
        setIsEnabled(!isEnabled);
    };

    const handleSave = () => {
        if (!workspace) return;
        
        const config = { isEnabled, shareId };
        SecureKV.saveWorkspaceShareConfig(workspace.id, config);
        
        // Update local workspace state to reflect change (opt)
        const updatedWs = { ...workspace, sharedConfig: config };
        onUpdateWorkspace(updatedWs);
        onClose();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!workspace) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Configurar Compartilhamento de Dashboard"
            className="max-w-[560px]"
        >
            <div className="flex flex-col gap-6">
                {/* Toggle Section */}
                <div className="flex items-center justify-between p-4 bg-background-dark/50 rounded-xl border border-border-dark hover:border-border-dark/80 transition-colors">
                    <div className="flex flex-col gap-1">
                        <span className="text-white font-semibold text-sm">Ativar link público</span>
                        <span className="text-text-secondary text-xs">Nenhuma autenticação será exigida para visualizar.</span>
                    </div>
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer group">
                        <input 
                            checked={isEnabled}
                            onChange={handleToggle}
                            className="sr-only peer" 
                            type="checkbox" 
                        />
                        <div className="w-12 h-7 bg-[#292348] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary group-hover:peer-checked:bg-primary/90"></div>
                    </label>
                </div>

                {/* Conditional Content: Link Field */}
                <div className={`flex flex-col gap-3 transition-opacity duration-200 ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Link de Compartilhamento</label>
                        {isEnabled && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Ativo
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">link</span>
                            </div>
                            <input 
                                className="block w-full pl-10 pr-3 py-2.5 bg-background-dark border border-border-dark text-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 outline-none font-mono" 
                                readOnly 
                                type="text" 
                                value={shareUrl}
                            />
                        </div>
                        <button 
                            onClick={handleCopy}
                            className="px-4 py-2.5 bg-[#292348] hover:bg-[#352d5a] text-white border border-border-dark hover:border-border-dark/80 rounded-lg text-sm font-medium transition-all flex items-center gap-2 group whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[18px] group-active:scale-90 transition-transform">
                                {isCopied ? 'check' : 'content_copy'}
                            </span>
                            {isCopied ? 'Copiado' : 'Copiar'}
                        </button>
                    </div>
                </div>

                {/* Info Callout */}
                <div className="flex gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="material-symbols-outlined text-primary shrink-0 mt-0.5 text-[20px]">info</span>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-white">Visibilidade Limitada</p>
                        <p className="text-sm text-[#c4b5fd]">
                            Este link inclui meta tags "noindex", impedindo que seja listado no Google. 
                            Qualquer pessoa com a URL poderá visualizar os dados deste dashboard.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 gap-3">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
        </Modal>
    );
};