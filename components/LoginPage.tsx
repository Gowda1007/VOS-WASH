import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { adminLogin } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = adminLogin(password);
        if (!success) {
            setError('Invalid password. Please try again.');
        }
    };
    
    const goBack = () => {
        localStorage.removeItem('selectedRole');
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center space-x-3 mb-8">
                    <img src="/logo-sm.png" alt="VOS WASH Logo" className="w-16 h-16" />
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">VOS WASH Pro</h1>
                        <p className="text-slate-600 dark:text-slate-400">Admin Login</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                    <div className="mt-4 text-center">
                        <button onClick={goBack} className="text-sm text-slate-500 hover:text-indigo-600">Not an Admin?</button>
                    </div>
                </div>
            </div>
        </div>
    );
};