import React from 'react';

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
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || ''} />
        </svg>
    );
};

// --- Card Component ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
        {children}
    </div>
);

// --- PageHeader Component ---
export const PageHeader: React.FC<{ title: string; subtitle?: string; children?: React.ReactNode; }> = ({ title, subtitle, children }) => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
            {subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="mt-4 md:mt-0 flex-shrink-0">
            {children}
        </div>
    </div>
);

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    children: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50';
    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

// --- Badge Component ---
export const Badge: React.FC<{ color: 'green' | 'red' | 'amber' | 'blue', children: React.ReactNode }> = ({ color, children }) => {
     const colorClasses = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
            {children}
        </span>
    );
};