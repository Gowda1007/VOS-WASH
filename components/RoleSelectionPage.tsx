import React from 'react';
import { Logo } from './Common';

interface RoleSelectionPageProps {
  onSelectRole: () => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelectRole }) => {
    
    const handleSelect = (role: 'admin' | 'customer') => {
        localStorage.setItem('selectedRole', role);
        onSelectRole();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-sm text-center">
                <div className="flex items-center justify-center space-x-3 mb-8">
                    <Logo className="w-16 h-16 text-blue-700 dark:text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">VOS WASH</h1>
                        <p className="text-slate-600 dark:text-slate-400">Welcome!</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-6">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Who are you?</h2>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => handleSelect('admin')}
                            className="w-full py-4 px-4 text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                        >
                            I am an Admin
                        </button>
                        <button
                            onClick={() => handleSelect('customer')}
                            className="w-full py-4 px-4 text-lg font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg shadow-sm transition"
                        >
                            I am a Customer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};