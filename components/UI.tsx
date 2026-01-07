
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 border border-transparent",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
    ghost: "bg-transparent text-text-secondary hover:text-white hover:bg-white/5"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card-dark border border-border-dark rounded-xl overflow-hidden shadow-sm ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'gray' | 'warning' | 'info' }> = ({ 
  children, 
  variant = 'gray' 
}) => {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    gray: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${styles[variant]} flex items-center gap-1.5`}>
      {variant === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_currentColor]"></span>}
      {children}
    </span>
  );
};

export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title?: string; 
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}> = ({ isOpen, onClose, title, children, footer, className = 'max-w-md', hideHeader = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-card-dark border border-border-dark rounded-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${className}`}>
        {!hideHeader && (
          <div className="px-6 py-5 border-b border-border-dark flex justify-between items-center bg-white/5">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}
        {hideHeader && (
            <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="text-text-secondary hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
        )}
        <div className="p-8 text-white">{children}</div>
        {footer && <div className="px-6 py-4 bg-white/5 border-t border-border-dark flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border border-border-dark rounded-lg overflow-hidden bg-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        <span className={`text-text-secondary transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-4 bg-black/20 text-xs font-mono text-text-secondary overflow-auto max-h-40 border-t border-border-dark">{children}</div>}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`bg-white/5 animate-pulse rounded ${className}`} style={style}></div>
);
