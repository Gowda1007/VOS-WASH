import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { Icon, Logo } from './Common';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

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
    { view: 'orders', label: 'Orders', icon: 'shopping-cart' },
    { view: 'products', label: 'Products', icon: 'tag' },
    { view: 'reports', label: 'Reports', icon: 'chart-bar-square' },
    { view: 'settings', label: 'Settings', icon: 'cog-6-tooth' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate, onNewInvoice }) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // --- Mobile Nav Items ---
    const mainMobileNav: View[] = ['dashboard', 'invoices', 'customers'];
    const mainNavItems = navItems.filter(item => mainMobileNav.includes(item.view));
    const moreNavItems = navItems.filter(item => !mainMobileNav.includes(item.view));

    return (
        <>
            <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {/* Sidebar for Desktop */}
                <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-center h-20 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-2">
                            <Logo className="w-12 h-12 text-blue-700 dark:text-blue-400" />
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
                    <div className="px-4 py-4 space-y-4">
                        <UserMenu />
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
                <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around z-30">
                    {mainNavItems.map(item => (
                        <BottomNavItem
                            key={item.view}
                            {...item}
                            isActive={currentView === item.view}
                            onClick={() => onNavigate(item.view)}
                        />
                    ))}
                    <BottomNavItem
                        label="More"
                        icon="ellipsis-vertical"
                        isActive={isMoreMenuOpen}
                        onClick={() => setIsMoreMenuOpen(true)}
                    />
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
            
            {/* "More" menu panel for mobile */}
            {isMoreMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMoreMenuOpen(false)}>
                    <div 
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl p-4 pb-6 shadow-lg animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-600 mb-4"></div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {moreNavItems.map(item => (
                                <BottomNavItem
                                    key={item.view}
                                    {...item}
                                    isActive={currentView === item.view}
                                    onClick={() => {
                                        onNavigate(item.view);
                                        setIsMoreMenuOpen(false);
                                    }}
                                />
                            ))}
                        </div>
                        <div className="px-2">
                             <UserMenu />
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
        </>
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
        className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition text-center rounded-lg ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
    >
        <Icon name={icon} className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{label}</span>
    </a>
);

const UserMenu: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const themeOptions = [
        { name: 'Light', value: 'light', icon: 'sun' },
        { name: 'Dark', value: 'dark', icon: 'moon' },
        { name: 'System', value: 'system', icon: 'computer-desktop' },
    ] as const;

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
                <div className="flex items-center gap-2">
                    <Icon name="cog-6-tooth" className="w-5 h-5" />
                    <span className="text-sm font-medium">Options</span>
                </div>
                <Icon name="arrow-left" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`}/>
            </button>
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-10">
                     <p className="px-3 py-1 text-xs text-slate-400 dark:text-slate-500">Theme</p>
                    {themeOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setTheme(opt.value); setIsOpen(false); }}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === opt.value ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}`}
                        >
                            <Icon name={opt.icon} className="w-5 h-5" />
                            {opt.name}
                        </button>
                    ))}
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                     <button
                        onClick={logout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    >
                        <Icon name="logout" className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};