import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Customer } from '../types';
import { Logo } from './Common';

interface CustomerLoginPageProps {
  customers: Customer[];
}

// FEATURE IMPLEMENTATION: Simplified customer login without OTP.
export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({ customers }) => {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const { customerLogin } = useAuth();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        // Check if customer exists in the database.
        const customerExists = customers.some(c => c.phone === phone);
        if (!customerExists) {
            setError('This phone number is not registered with us. Please contact VOS WASH.');
            return;
        }
        
        // If customer exists, log them in directly.
        const success = customerLogin(phone);
        if (!success) {
            // This case should ideally not happen if the logic is sound
            setError('An unexpected error occurred during login.');
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
                    <Logo className="w-16 h-16 text-blue-700 dark:text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">VOS WASH</h1>
                        <p className="text-slate-600 dark:text-slate-400">Customer Portal</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleLogin} className="space-y-6">
                         <h3 className="text-lg font-semibold text-center text-slate-800 dark:text-slate-100">Sign in with your phone</h3>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Registered Phone Number</label>
                            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} required className="mt-1 block w-full px-4 py-3 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <button type="submit" className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white rounded-lg">
                            Login
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <button onClick={goBack} className="text-sm text-slate-500 hover:text-indigo-600">Not a Customer?</button>
                    </div>
                </div>
            </div>
        </div>
    );
};