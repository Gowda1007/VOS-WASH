import React, { createContext, useContext, useState, useMemo } from 'react';

const AUTH_KEY = 'vosWashProAuth';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem(AUTH_KEY) === 'true';
    });

    const authContextValue = useMemo(() => ({
        isAuthenticated,
        login: (password: string): boolean => {
            // In a real app, this would be a call to a server.
            // For this demo, we'll use a simple hardcoded password.
            if (password === 'admin') {
                localStorage.setItem(AUTH_KEY, 'true');
                setIsAuthenticated(true);
                return true;
            }
            return false;
        },
        logout: () => {
            localStorage.removeItem(AUTH_KEY);
            setIsAuthenticated(false);
        }
    }), [isAuthenticated]);

    // FIX: Replaced JSX with React.createElement to avoid parsing errors in a .ts file.
    return React.createElement(AuthContext.Provider, { value: authContextValue }, children);
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};