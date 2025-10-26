import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User } from '../types';

const AUTH_KEY = 'vosWashProUser';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    adminLogin: (password: string) => boolean;
    customerLogin: (phone: string, otp: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(AUTH_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const authContextValue = useMemo(() => ({
        user,
        loading,
        adminLogin: (password: string): boolean => {
            if (password === 'admin') {
                const adminUser: User = { role: 'admin' };
                localStorage.setItem(AUTH_KEY, JSON.stringify(adminUser));
                setUser(adminUser);
                return true;
            }
            return false;
        },
        customerLogin: (phone: string, otp: string): boolean => {
            // This is a simulated OTP check. In a real app, you'd verify the OTP.
            // For now, any 4-digit OTP is considered valid for an existing customer.
            if (otp.length === 4) {
                const customerUser: User = { role: 'customer', phone };
                localStorage.setItem(AUTH_KEY, JSON.stringify(customerUser));
                setUser(customerUser);
                return true;
            }
            return false;
        },
        logout: () => {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem('selectedRole');
            setUser(null);
        }
    }), [user, loading]);

    return React.createElement(AuthContext.Provider, { value: authContextValue }, children);
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};