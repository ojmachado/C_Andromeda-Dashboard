
import React, { useState, useEffect } from 'react';
import { Button, Card } from './UI';
import { SecureKV } from '../utils/kv';

const MASTER_EMAIL = "ojmachadomkt@gmail.com";

interface LoginPageProps {
    onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isFirstRun, setIsFirstRun] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDetect = async () => {
        setError(null);
        setIsLoading(true);
        
        // Simulation delay
        await new Promise(r => setTimeout(r, 600));

        if (!email) {
            setError("Por favor, insira um e-mail.");
            setIsLoading(false);
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail === MASTER_EMAIL) {
            // Check if password exists
            const hasPwd = SecureKV.hasMasterPassword();
            setIsFirstRun(!hasPwd);
            setStep('password');
        } else {
            // For this SaaS, only the master user is allowed in the demo/early access
            setError("Usuário não encontrado ou sem permissão de acesso.");
        }
        setIsLoading(false);
    };

    const handleSubmitPassword = async () => {
        setError(null);
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 800));

        if (isFirstRun) {
            // Setting password for the first time
            if (password.length < 6) {
                setError("A senha deve ter pelo menos 6 caracteres.");
                setIsLoading(false);
                return;
            }
            SecureKV.setMasterPassword(password);
            SecureKV.login(email);
            onLogin();
        } else {
            // Verifying password
            if (SecureKV.verifyMasterPassword(password)) {
                SecureKV.login(email);
                onLogin();
            } else {
                setError("Senha incorreta.");
            }
        }
        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (step === 'email') handleDetect();
            else handleSubmitPassword();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-6">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black italic shadow-[0_0_25px_rgba(55,19,236,0.6)]">
                            A
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-white">Andromeda<span className="text-primary">Lab</span></span>
                    </div>
                </div>

                <Card className="p-8 border-border-dark bg-card-dark/80 backdrop-blur-xl shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-2 text-center">
                        {step === 'email' ? 'Acessar Dashboard' : (isFirstRun ? 'Definir Senha Mestra' : 'Bem-vindo de volta')}
                    </h2>
                    <p className="text-text-secondary text-sm text-center mb-8">
                        {step === 'email' 
                            ? 'Digite seu e-mail corporativo para continuar.' 
                            : (isFirstRun 
                                ? 'Usuário Master detectado. Por favor, crie sua senha de segurança.' 
                                : `Login como ${email}`
                            )
                        }
                    </p>

                    <div className="space-y-4">
                        {step === 'email' ? (
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2 ml-1">E-mail</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">mail</span>
                                    <input 
                                        type="email" 
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="w-full bg-background-dark/50 border border-border-dark rounded-lg py-3 pl-10 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary/30"
                                        placeholder="nome@empresa.com"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2 ml-1">
                                    {isFirstRun ? 'Nova Senha' : 'Senha'}
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">lock</span>
                                    <input 
                                        type="password" 
                                        autoFocus
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="w-full bg-background-dark/50 border border-border-dark rounded-lg py-3 pl-10 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary/30"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {!isFirstRun && (
                                    <button 
                                        onClick={() => { setStep('email'); setPassword(''); setError(null); }}
                                        className="text-xs text-primary hover:text-primary-dark mt-2 ml-1 font-medium transition-colors"
                                    >
                                        Trocar conta
                                    </button>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs font-medium animate-in fade-in">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <Button 
                            onClick={step === 'email' ? handleDetect : handleSubmitPassword}
                            isLoading={isLoading}
                            className="w-full py-3 text-base shadow-xl shadow-primary/10 mt-2"
                        >
                            {step === 'email' ? 'Detectar' : (isFirstRun ? 'Gerar Senha e Entrar' : 'Entrar')}
                        </Button>
                        
                        {step === 'email' && (
                            <div className="mt-6 pt-6 border-t border-border-dark text-center">
                                <p className="text-xs text-text-secondary">
                                    Protegido por criptografia de ponta a ponta.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
