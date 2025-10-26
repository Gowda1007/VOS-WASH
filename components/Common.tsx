import React, { useEffect } from 'react';
import type { ToastMessage } from '../hooks/useToast';

// --- Logo Component ---
export const Logo: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
    <img alt="" src="data:image/jpg;base64,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" />
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
        'banknotes': 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h.375m16.5 0h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h.375M3.75 21v-6.135A14.953 14.953 0 0112 15c4.478 0 8.565.93 11.25 2.565V21',
        'tag': 'M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25zM12.75 4.5a.75.75 0 000 1.5h5.25a.75.75 0 000-1.5H12.75zM15 4.5a3 3 0 106 0 3 3 0 00-6 0zM17.25 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
        'shopping-cart': 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.087-.835l1.823-6.836a.75.75 0 00-.73-.965H5.168L4.6 3zM6 14.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm12 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
        'x-mark': 'M6 18L18 6M6 6l12 12',
        'sun': 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
        'moon': 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.92-.99 6.752-2.648z',
        'computer-desktop': 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z',
        'whatsapp': 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12.012 2.163c-5.423 0-9.816 4.393-9.816 9.816 0 5.423 4.393 9.816 9.816 9.816 5.423 0 9.816-4.393 9.816-9.816s-4.393-9.816-9.816-9.816z',
        'printer': 'M6.72 7.662a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 00.75.75h9a.75.75 0 000-1.5h-9a.75.75 0 00-.75.75zM12 15a.75.75 0 01.75-.75h.008a.75.75 0 010 1.5h-.008A.75.75 0 0112 15zM4.5 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V8.25a3 3 0 00-3-3h-3.75a.75.75 0 010-1.5h3.75a4.5 4.5 0 014.5 4.5v10.5a4.5 4.5 0 01-4.5 4.5h-15a4.5 4.5 0 01-4.5-4.5V8.25a4.5 4.5 0 014.5-4.5h3.75a.75.75 0 010 1.5H4.5z',
        'ellipsis-vertical': 'M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z',
        'calendar-days': 'M3.75 9h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M5.25 3h13.5c.966 0 1.75.784 1.75 1.75v14.5c0 .966-.784 1.75-1.75 1.75H5.25c-.966 0-1.75-.784-1.75-1.75V4.75C3.5 3.784 4.284 3 5.25 3z',
    };
    
    const path = icons[name] || '';

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} strokeWidth="1.5" stroke="currentColor" fillRule="evenodd" clipRule="evenodd">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
};


// --- Card Component ---
// A simple container with consistent styling.
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 ${className}`}>
        {children}
    </div>
);

// --- PageHeader Component ---
// For consistent page titles and subtitles.
export const PageHeader: React.FC<{ title: string, subtitle?: string, children?: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {children && <div className="mt-4 md:mt-0 flex items-center gap-2">{children}</div>}
    </div>
);

// --- Badge Component ---
export const Badge: React.FC<{ color: 'green' | 'red' | 'amber' | 'blue' | 'slate', children: React.ReactNode }> = ({ color, children }) => {
    const colors = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
            {children}
        </span>
    );
};

// --- Button Component ---
type ButtonVariant = 'primary' | 'secondary' | 'danger';
export const Button: React.FC<{ 
    onClick?: () => void;
    children: React.ReactNode; 
    variant?: ButtonVariant; 
    className?: string; 
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}> = ({ onClick, children, variant = 'primary', className = '', disabled, type = 'button' }) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-slate-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </button>
    );
};

// --- Toast Components ---
export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void; }> = ({ toasts, removeToast }) => (
    <div className="fixed bottom-5 right-5 z-[100] space-y-3 w-80">
        {toasts.map(toast => (
            <ToastItem key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
    </div>
);

const ToastItem: React.FC<ToastMessage & { onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const typeClasses = {
        success: { bg: 'bg-green-500', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        error: { bg: 'bg-red-500', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
        info: { bg: 'bg-blue-500', icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z' },
    };

    return (
        <div className={`flex items-center p-4 rounded-lg shadow-lg text-white ${typeClasses[type].bg} animate-toast-in`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d={typeClasses[type].icon} />
            </svg>
            <p className="text-sm font-medium flex-grow">{message}</p>
            <button onClick={onDismiss} className="ml-3 -mr-1 p-1 rounded-full hover:bg-black/20">
                <Icon name="x-mark" className="w-4 h-4" />
            </button>
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
            `}</style>
        </div>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Icon name="x-mark" className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- EmptyState Component ---
interface EmptyStateProps {
    icon: React.ComponentProps<typeof Icon>['name'];
    title: string;
    message: string;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => (
    <div className="text-center py-12 px-6">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-full text-slate-400 dark:text-slate-500">
             <Icon name={icon} className="w-8 h-8"/>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{message}</p>
    </div>
);