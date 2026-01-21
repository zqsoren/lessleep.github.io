import React, { createContext, useContext, useState, useEffect } from 'react';

// API 地址配置：使用环境变量，生产环境使用 .env.production
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (username: string, email: string, password: string, verificationCode: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    sendVerificationCode: (email: string) => Promise<{ success: boolean; code?: string; error?: string }>;
    apiRequest: <T = any>(url: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            verifyToken(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('auth_token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('auth_token', data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: '网络错误' };
        }
    };

    const register = async (username: string, email: string, password: string, verificationCode: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, verificationCode })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('auth_token', data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: '网络错误' };
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    const sendVerificationCode = async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/send-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, code: data.code };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: '网络错误' };
        }
    };

    const apiRequest = async <T = any,>(url: string, options: RequestInit = {}): Promise<T> => {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                sendVerificationCode,
                apiRequest
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
