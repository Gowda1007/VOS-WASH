import React, { useEffect } from 'react';
import type { ToastMessage } from '../hooks/useToast';

// --- Logo Component ---
export const Logo: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M50 0 C22.38 0 0 22.38 0 50 C0 71.21 13.97 89.28 33.33 96.67 C33.33 80 40 66.67 50 50 C60 66.67 66.67 80 66.67 96.67 C86.03 89.28 100 71.21 100 50 C100 22.38 77.62 0 50 0 Z M50 20 L58.66 35 L50 50 L41.34 35 Z" />
    </svg>
);


// --- Icon Component ---
// A wrapper for using SVG icons from a library like Heroicons.
// This example assumes you have SVG paths for the icons.
export const Icon: React.FC<{ name: string, className?: string }> = ({ name, className = 'w-6 h-6' }) => {
    const icons: Record<string, string> = {
        'chart-pie': 'M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69-4.69a.75.75 0 10-1.06-1.06l-4.69 4.69A8.25 8.25 0 012.25 10.5z',
        'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
        'users': 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.226c-3.42-.776-6.22-3.64-6.22-7.22 0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5c0 3.58-2.8 6.444-6.22 7.226m-2.16-1.148a4.5 4.5 0 00-5.46 0m5.46 0a4.5 4.5 0 01-5.46 0m5.46 0a4.5 4.5 0 015.46 0',
        'cog-6-tooth': 'M10.343 3.94c.09-.542.56-1.007 1.11-1.227l.4-.16a12.43 12.43 0 014.28 1.43l.16.08c.49.247.8.774.8 1.323l-.01 1.254a10.43 10.43 0 01-1.5 4.699l-.2.383c-.45.865-1.4 1.333-2.39 1.132l-1.62-.324a10.43 10.43 0 01-4.699-1.5l-.383-.2a1.73 1.73 0 01-1.132-2.39l.324-1.62c.2-.99.668-1.94 1.132-2.833l.16-.319zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
        'plus-circle': 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
        'plus': 'M12 4.5v15m7.5-7.5h-15',
        'arrow-left': 'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18',
        'document-duplicate': 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5-.124m7.5 10.375a3 3 0 01-3-3V8.625a3 3 0 013-3h3.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375z',
        'trash': 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.502 0a48.09 48.09 0 013.478-.397m7.54 0a50.935 50.935 0 01-7.54 0',
        'pencil': 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125',
        'logout': 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3 0l3-3m0 0l-3-3m3 3H9',
        'chart-bar-square': 'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v12.75A2.25 2.25 0 006 20.25z',
        'eye': 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        'banknotes': 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6-2.292m0 0v14.25',
        'shopping-cart': 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.125-.824l2.853-6.846A1.125 1.125 0 0018.04 8.25H5.25',
        'tag': 'M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25-2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z M1.5 15a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75H3v8.25H1.5z M4.5 15V6.75H3V15h1.5z',
        'x-mark': 'M6 18L18 6M6 6l12 12',
        'check-circle': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        'x-circle': 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    const path = icons[name] || '';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
};

// --- PageHeader Component ---
export const PageHeader: React.FC<{ title: string, subtitle?: string, children?: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {children && <div className="mt-4 md:mt-0">{children}</div>}
    </div>
);

// --- Card Component ---
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
        {children}
    </div>
);

// --- Badge Component ---
export const Badge: React.FC<{ children: React.ReactNode, color: 'green' | 'amber' | 'red' | 'blue' | 'slate' }> = ({ children, color }) => {
    const colors = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colors[color]}`}>
            {children}
        </span>
    );
};

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
}
export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-2 focus:ring-offset-2 focus:ring-slate-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
    };
    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

// --- Modal Component ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Icon name="x-mark" className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- Toast Components ---
const Toast: React.FC<{ message: ToastMessage, onRemove: (id: number) => void }> = ({ message, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(message.id);
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [message.id, onRemove]);

    const baseClasses = 'flex items-center w-full max-w-xs p-4 space-x-4 text-slate-500 bg-white divide-x divide-slate-200 rounded-lg shadow-lg dark:text-slate-400 dark:divide-slate-700 dark:bg-slate-800';
    
    const icons = {
        success: { icon: 'check-circle', color: 'text-green-500 dark:text-green-400' },
        error: { icon: 'x-circle', color: 'text-red-500 dark:text-red-400' },
        info: { icon: 'information-circle', color: 'text-blue-500 dark:text-blue-400' },
    };
    
    const currentIcon = icons[message.type];

    return (
        <div className={baseClasses} role="alert">
            <Icon name={currentIcon.icon} className={`w-6 h-6 ${currentIcon.color}`} />
            <div className="pl-4 text-sm font-normal">{message.message}</div>
            <button onClick={() => onRemove(message.id)} className="p-1.5 -m-1.5 ml-auto">
                <Icon name="x-mark" className="w-5 h-5" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};