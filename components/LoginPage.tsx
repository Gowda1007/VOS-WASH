import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from './Common';

export const LoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { adminLogin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const success = await adminLogin(password);
        if (!success) {
            setError('Invalid password. Please try again.');
        }
        setIsLoading(false);
    };
    
    const goBack = () => {
        localStorage.removeItem('selectedRole');
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center space-x-3 mb-8">
                    <Logo className="w-16 h-16 text-blue-700 dark:text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">VOS WASH</h1>
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
                                    className="block w-full px-4 py-3 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition disabled:opacity-50"
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
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