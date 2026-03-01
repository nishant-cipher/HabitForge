import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

interface User {
    id: string;
    username: string;
    email: string;
    xp: number;
    level: number;
    notificationPrefs?: {
        dailyReminders: boolean;
        streakAlerts: boolean;
        clubActivity: boolean;
    };
}

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => Promise<void>;
    updateUser: (partial: Partial<User>) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Hydrate user from localStorage on mount (non-sensitive — token is in HttpOnly cookie)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newUser: User) => {
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    const updateUser = (partial: Partial<User>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...partial };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = async () => {
        try {
            // Ask the server to clear the HttpOnly cookies
            await api.post('/auth/logout');
        } catch {
            // Ignore errors — clear client state regardless
        } finally {
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                updateUser,
                isAuthenticated: !!user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
