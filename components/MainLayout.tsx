import React from 'react';
import type { View } from '../types';
import { Icon } from './Common';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
    onNewInvoice: () => void;
}

const navItems: { view: View; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: 'chart-pie' },
    { view: 'invoices', label: 'Invoices', icon: 'document-text' },
    { view: 'customers', label: 'Customers', icon: 'users' },
    { view: 'settings', label: 'Settings', icon: 'cog-6-tooth' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate, onNewInvoice }) => {
    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center h-20 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                        <img src="/logo-sm.png" alt="VOS WASH Logo" className="w-12 h-12" />
                        <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">VOS WASH Pro</h1>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map(item => (
                        <NavItem
                            key={item.view}
                            {...item}
                            isActive={currentView === item.view}
                            onClick={() => onNavigate(item.view)}
                        />
                    ))}
                </nav>
                 <div className="px-4 py-4">
                    <button
                        onClick={onNewInvoice}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition"
                    >
                        <Icon name="plus-circle" className="w-6 h-6" />
                        New Invoice
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-8 pb-24 md:pb-8">
                    {children}
                </main>
            </div>

            {/* Bottom Nav for Mobile */}
            <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around">
                 {navItems.map(item => (
                    <BottomNavItem
                        key={item.view}
                        {...item}
                        isActive={currentView === item.view}
                        onClick={() => onNavigate(item.view)}
                    />
                ))}
            </footer>
             {/* FAB for New Invoice on Mobile */}
            <div className="md:hidden fixed bottom-20 right-5 z-20">
                 <button
                    onClick={onNewInvoice}
                    className="w-16 h-16 flex items-center justify-center bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition transform hover:scale-105"
                    aria-label="New Invoice"
                >
                    <Icon name="plus" className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

const NavItem: React.FC<{ label: string; icon: any; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
            isActive 
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
    >
        <Icon name={icon} className="w-6 h-6" />
        <span>{label}</span>
    </a>
);

const BottomNavItem: React.FC<{ label: string; icon: any; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
     <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
        }`}
    >
        <Icon name={icon} className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{label}</span>
    </a>
);