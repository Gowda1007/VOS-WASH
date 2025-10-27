import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User } from '../types';
import * as apiService from '../services/apiService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    adminLogin: (password: string) => Promise<boolean>;
    customerLogin: (phone: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserSession = async () => {
            setLoading(true);
            try {
                const sessionUser = await apiService.getCurrentUser();
                if (sessionUser) {
                    setUser(sessionUser);
                }
            } catch (error) {
                console.error("Failed to get user session", error);
            } finally {
                setLoading(false);
            }
        };
        checkUserSession();
    }, []);

    const authContextValue = useMemo(() => ({
        user,
        loading,
        adminLogin: async (password: string): Promise<boolean> => {
            const adminUser = await apiService.adminLogin(password);
            if (adminUser) {
                setUser(adminUser);
                return true;
            }
            return false;
        },
        customerLogin: async (phone: string): Promise<boolean> => {
            const customerUser = await apiService.customerLogin(phone);
            if (customerUser) {
                setUser(customerUser);
                return true;
            }
            return false;
        },
        logout: () => {
            apiService.logout();
            setUser(null);
            // Full page reload to reset all state cleanly.
            window.location.reload();
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