import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { Icon, Logo, Button } from './Common';
import { useLanguage } from '../hooks/useLanguage';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: View;
    pageTitle: string;
    onNavigate: (view: View) => void;
    onNewInvoice: () => void;
    onTakeOrder: () => void;
}

const navItems: { view: View; labelKey: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { view: 'dashboard', labelKey: 'dashboard', icon: 'chart-pie' },
    { view: 'invoices', labelKey: 'invoices', icon: 'document-text' },
    { view: 'customers', labelKey: 'customers', icon: 'users' },
    { view: 'day-book', labelKey: 'day-book', icon: 'calendar-days' },
    { view: 'reports', labelKey: 'reports', icon: 'chart-bar-square' },
    { view: 'settings', labelKey: 'settings', icon: 'cog-6-tooth' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, pageTitle, onNavigate, onNewInvoice, onTakeOrder }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

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
                    <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">{t('app-name')}</h1>
                </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <NavItem
                        key={item.view}
                        label={t(item.labelKey, item.labelKey)}
                        icon={item.icon}
                        isActive={currentView === item.view}
                        onClick={() => handleNavItemClick(item.view)}
                    />
                ))}
            </nav>
            <div className="px-4 py-4 space-y-4">
                <LanguageToggle />
                <div className="space-y-2">
                    {/* Fix: Replace 'fullWidth' prop with 'w-full' class in className */}
                    <Button onClick={onTakeOrder} variant="secondary" className="w-full !bg-teal-500 hover:!bg-teal-600 !text-white">
                        <Icon name="clipboard-document-list" className="w-6 h-6" />
                        {t('take-order', 'Take Order')}
                    </Button>
                    {/* Fix: Replace 'fullWidth' prop with 'w-full' class in className */}
                    <Button onClick={onNewInvoice} className="w-full">
                        <Icon name="plus-circle" className="w-6 h-6" />
                        {t('new-invoice', 'New Invoice')}
                    </Button>
                </div>
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
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 no-scrollbar">
                    {children}
                </main>
            </div>
            
            {/* --- FAB for New Invoice on Mobile --- */}
            <div className="lg:hidden fixed bottom-6 right-6 z-30 flex flex-col gap-4">
                <button
                    onClick={onTakeOrder}
                    className="w-14 h-14 flex items-center justify-center bg-teal-500 text-white rounded-full shadow-xl hover:bg-teal-600 transition transform hover:scale-105"
                    aria-label="Take Order"
                >
                    <Icon name="clipboard-document-list" className="w-7 h-7" />
                </button>
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

const LanguageToggle: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    
    const languageOptions = [
        { name: 'English', value: 'en', label: 'En' },
        { name: 'Kannada', value: 'kn', label: 'ಕ' },
    ] as const;

    return (
         <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            {languageOptions.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => setLanguage(opt.value)}
                    className={`flex-1 flex justify-center items-center gap-2 p-2 text-sm rounded-md transition-colors ${language === opt.value ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500'}`}
                    aria-label={`Switch to ${opt.name} language`}
                >
                    <span className="font-bold text-base">{opt.label}</span>
                </button>
            ))}
        </div>
    );
};