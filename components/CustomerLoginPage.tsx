import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Customer } from '../types';

interface CustomerLoginPageProps {
  customers: Customer[];
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({ customers }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const { customerLogin } = useAuth();

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        // Check if customer exists
        const customerExists = customers.some(c => c.phone === phone);
        if (!customerExists) {
            setError('This phone number is not registered with us.');
            return;
        }
        // In a real app, you would send an OTP here.
        setOtpSent(true);
        // For simulation, we can log the OTP
        console.log("Simulated OTP for", phone, "is 1234");
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = customerLogin(phone, otp);
        if (!success) {
            setError('Invalid OTP. Please try again.');
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
                        <p className="text-slate-600 dark:text-slate-400">Customer Portal</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
                    {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                             <h3 className="text-lg font-semibold text-center text-slate-800 dark:text-slate-100">Sign in with your phone</h3>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md" />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <button type="submit" className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white rounded-lg">Send OTP</button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <h3 className="text-lg font-semibold text-center text-slate-800 dark:text-slate-100">Enter OTP</h3>
                            <p className="text-sm text-center text-slate-500">An OTP has been sent to {phone}. (Hint: use 1234)</p>
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300">OTP</label>
                                <input id="otp" type="tel" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={4} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md" />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <button type="submit" className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white rounded-lg">Sign In</button>
                        </form>
                    )}
                     <div className="mt-4 text-center">
                        <button onClick={goBack} className="text-sm text-slate-500 hover:text-indigo-600">Back to role selection</button>
                    </div>
                </div>
            </div>
        </div>
    );
};