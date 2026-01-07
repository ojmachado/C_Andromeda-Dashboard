
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from './Navigation';
import { SecureKV } from '../utils/kv';
import type { Workspace, UserProfile } from '../types';

export const AccountSettingsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setProfile(SecureKV.getUserProfile());
    }, []);

    const handleSave = () => {
        if (profile) {
            SecureKV.saveUserProfile(profile);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const handleDeleteAccount = () => {
        SecureKV.clearAll();
        navigate('/login');
    };

    const updateProfile = (key: keyof UserProfile, value: any) => {
        setProfile(prev => prev ? ({ ...prev, [key]: value }) : null);
    };

    if (!profile) return null;

    return (
        <AppShell workspaces={workspaces}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Page Header */}
                <div className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-2 text-slate-900 dark:text-white">Configurações da Conta</h1>
                        <p className="text-gray-500 dark:text-text-secondary text-base font-normal max-w-2xl">
                            Gerencie suas informações pessoais, segurança e preferências de sistema do seu workspace no Andromeda Lab.
                        </p>
                    </div>
                    {showSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span className="text-sm font-bold">Alterações Salvas!</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <nav className="flex flex-col space-y-1">
                            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                                Minha Conta
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                                <span className="material-symbols-outlined text-[20px]">group_work</span>
                                Equipe & Membros
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                                Cobrança
                            </a>
                            <a href="/integrations" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                                <span className="material-symbols-outlined text-[20px]">api</span>
                                Integrações
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                                Notificações
                            </a>
                        </nav>
                    </aside>

                    {/* Main Form Column */}
                    <div className="col-span-1 lg:col-span-9 space-y-8">
                        
                        {/* Section: Personal Info */}
                        <section className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informações Pessoais</h2>
                                <span className="material-symbols-outlined text-gray-400">badge</span>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6 mb-6">
                                    <div className="flex-shrink-0">
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Foto de Perfil</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 rounded-full bg-cover bg-center border-2 border-gray-200 dark:border-border-dark" style={{ backgroundImage: `url("${profile.avatar}")` }}></div>
                                            <div className="flex flex-col gap-2">
                                                <button className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-medium rounded-lg text-gray-900 dark:text-white transition-colors">Alterar</button>
                                                <button className="text-xs text-red-500 hover:text-red-400 font-medium text-left">Remover</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex flex-col">
                                            <span className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nome Completo</span>
                                            <input 
                                                className="w-full h-11 rounded-lg border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 outline-none transition-all" 
                                                type="text" 
                                                value={profile.name}
                                                onChange={(e) => updateProfile('name', e.target.value)}
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <span className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cargo</span>
                                            <input 
                                                className="w-full h-11 rounded-lg border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 outline-none transition-all" 
                                                type="text" 
                                                value={profile.role}
                                                onChange={(e) => updateProfile('role', e.target.value)}
                                            />
                                        </label>
                                        <label className="flex flex-col md:col-span-2">
                                            <span className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</span>
                                            <div className="relative">
                                                <input 
                                                    className="w-full h-11 rounded-lg border-gray-300 dark:border-border-dark bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-4 cursor-not-allowed outline-none" 
                                                    readOnly 
                                                    type="email" 
                                                    value={profile.email}
                                                />
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" title="Contate o admin para alterar o email">lock</span>
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-text-secondary mt-1">O email de login não pode ser alterado diretamente.</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-border-dark">
                                    <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
                                        <span>Salvar Informações</span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Section: Security */}
                        <section className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Segurança da Conta</h2>
                                <span className="material-symbols-outlined text-gray-400">security</span>
                            </div>
                            <div className="p-6 space-y-8">
                                {/* Password Change */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100 dark:border-border-dark">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Senha</h3>
                                        <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">Recomendamos alterar sua senha periodicamente.</p>
                                    </div>
                                    <button className="border border-gray-300 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">key</span>
                                        Mudar Senha
                                    </button>
                                </div>
                                {/* 2FA */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100 dark:border-border-dark">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Autenticação de Dois Fatores (2FA)</h3>
                                        <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">Adicione uma camada extra de segurança à sua conta.</p>
                                    </div>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={profile.twoFactorEnabled}
                                            onChange={() => updateProfile('twoFactorEnabled', !profile.twoFactorEnabled)}
                                            className="sr-only peer" 
                                        />
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{profile.twoFactorEnabled ? 'Ativado' : 'Desativado'}</span>
                                    </label>
                                </div>
                                {/* Active Sessions */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sessões Ativas</h3>
                                    <div className="space-y-3">
                                        {/* Session Item 1 */}
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-border-dark">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-300">
                                                    <span className="material-symbols-outlined text-[20px]">desktop_mac</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Chrome no Windows <span className="text-xs text-primary font-bold ml-2 bg-primary/10 px-2 py-0.5 rounded-full">Atual</span></p>
                                                    <p className="text-xs text-gray-500 dark:text-text-secondary">São Paulo, Brasil • Ativo agora</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Session Item 2 */}
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-border-dark">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-300">
                                                    <span className="material-symbols-outlined text-[20px]">smartphone</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Safari no iPhone 14</p>
                                                    <p className="text-xs text-gray-500 dark:text-text-secondary">Rio de Janeiro, Brasil • Há 2 horas</p>
                                                </div>
                                            </div>
                                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Deslogar sessão">
                                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Preferences */}
                        <section className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preferências</h2>
                                <span className="material-symbols-outlined text-gray-400">tune</span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <label className="flex flex-col">
                                        <span className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Idioma Preferencial</span>
                                        <div className="relative">
                                            <select 
                                                className="w-full h-11 rounded-lg border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 appearance-none outline-none"
                                                value={profile.language}
                                                onChange={(e) => updateProfile('language', e.target.value)}
                                            >
                                                <option value="pt-BR">Português (Brasil)</option>
                                                <option value="en-US">English (US)</option>
                                                <option value="es-ES">Español</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
                                        </div>
                                    </label>
                                    <label className="flex flex-col">
                                        <span className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Fuso Horário</span>
                                        <div className="relative">
                                            <select 
                                                className="w-full h-11 rounded-lg border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-4 appearance-none outline-none"
                                                value={profile.timezone}
                                                onChange={(e) => updateProfile('timezone', e.target.value)}
                                            >
                                                <option value="utc-3">(GMT-03:00) Brasilia</option>
                                                <option value="utc-4">(GMT-04:00) Manaus</option>
                                                <option value="utc-5">(GMT-05:00) New York</option>
                                                <option value="utc+0">(GMT+00:00) London</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
                                        </div>
                                    </label>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-border-dark">
                                    <button onClick={handleSave} className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-white dark:bg-white/5 dark:hover:bg-white/10 px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                                        <span>Salvar Preferências</span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Section: Danger Zone */}
                        <section className="rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden">
                            <div className="bg-red-50 dark:bg-red-900/10 px-6 py-5 border-b border-red-100 dark:border-red-900/20 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Zona de Perigo</h2>
                                <span className="material-symbols-outlined text-red-400 dark:text-red-500">warning</span>
                            </div>
                            <div className="p-6 bg-white dark:bg-card-dark">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Excluir Conta</h3>
                                        <p className="text-sm text-gray-500 dark:text-text-secondary mt-1 max-w-lg">
                                            Uma vez que você excluir sua conta, não há volta. Por favor, tenha certeza. Todos os workspaces, análises e relatórios serão permanentemente removidos.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                                        Excluir Minha Conta
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-[#1e1933] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-border-dark p-6 transform transition-all scale-100 animate-in zoom-in-95">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                                <span className="material-symbols-outlined text-[24px]">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tem certeza absoluta?</h3>
                            <p className="text-gray-500 dark:text-text-secondary mb-6 text-sm">
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta, configurações e removerá seu acesso a todos os workspaces.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white font-medium text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleDeleteAccount}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
                                >
                                    Sim, excluir conta
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};
