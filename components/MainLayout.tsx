import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { Icon, Logo } from './Common';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: View;
    pageTitle: string;
    onNavigate: (view: View) => void;
    onNewInvoice: () => void;
}

const navItems: { view: View; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: 'chart-pie' },
    { view: 'invoices', label: 'Invoices', icon: 'document-text' },
    { view: 'customers', label: 'Customers', icon: 'users' },
    { view: 'day-book', label: 'Day Book', icon: 'calendar-days' },
    { view: 'orders', label: 'Orders', icon: 'shopping-cart' },
    { view: 'products', label: 'Products', icon: 'tag' },
    { view: 'reports', label: 'Reports', icon: 'chart-bar-square' },
    { view: 'settings', label: 'Settings', icon: 'cog-6-tooth' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, pageTitle, onNavigate, onNewInvoice }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsDrawerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavItemClick = (view: View) => {
        onNavigate(view);
        setIsDrawerOpen(false);
    };
    
    const SidebarContent = () => (
         <div className="flex flex-col h-full bg-white dark:bg-slate-800">
            <div className="flex items-center justify-center h-20 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                    <Logo className="w-10 h-10 text-blue-700 dark:text-blue-400" />
                    <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">VOS WASH Pro</h1>
                </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <NavItem
                        key={item.view}
                        {...item}
                        isActive={currentView === item.view}
                        onClick={() => handleNavItemClick(item.view)}
                    />
                ))}
            </nav>
            <div className="px-4 py-4 space-y-4">
                <UserMenu />
                <Button fullWidth onClick={onNewInvoice}>
                    <Icon name="plus-circle" className="w-6 h-6" />
                    New Invoice
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* --- Desktop Sidebar --- */}
            <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700">
                <SidebarContent />
            </aside>
            
            {/* --- Mobile Drawer --- */}
            <div 
                ref={drawerRef}
                className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <SidebarContent />
            </div>
            {isDrawerOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsDrawerOpen(false)}></div>}

            {/* --- Main Content Area --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* --- Top Header for Mobile/Tablet --- */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button onClick={() => setIsDrawerOpen(true)} className="p-2 -ml-2">
                        <Icon name="bars-3" className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">{pageTitle}</h1>
                    <div className="w-6"></div> {/* Spacer */}
                </header>
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
                    {children}
                </main>
            </div>
            
            {/* --- FAB for New Invoice on Mobile --- */}
            <div className="lg:hidden fixed bottom-6 right-6 z-30">
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

const Button: React.FC<{ 
    onClick?: () => void;
    children: React.ReactNode;
    fullWidth?: boolean;
}> = ({ onClick, children, fullWidth }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition ${fullWidth ? 'w-full' : ''}`}
    >
        {children}
    </button>
);