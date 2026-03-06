'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
    id: string;
    phoneNumber: string;
    role: 'MERCHANT' | 'SUPERVISOR' | 'PRODUCER' | 'COOPERATIVE' | 'FIELD_AGENT';
    name: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLocked: boolean;
    login: (phoneNumber: string, pin: string) => Promise<boolean>;
    signup: (name: string, phoneNumber: string, pin: string, role: User['role']) => Promise<boolean>;
    unlock: (pin: string) => Promise<boolean>;
    logout: () => void;
    setLocked: (locked: boolean) => void;
    updatePin: (newPin: string) => Promise<boolean>;
    updateLanguage: (lang: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLocked, setIsLocked] = useState<boolean>(false);

    useEffect(() => {
        const checkUser = async () => {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser) as User;
                setUser(parsed);
                setIsAuthenticated(true);

                // Fetch latest profile from DB to keep role synced
                try {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('phone_number', parsed.phoneNumber)
                        .single();

                    if (data) {
                        const updatedUser: User = {
                            id: data.id,
                            phoneNumber: data.phone_number,
                            role: data.role,
                            name: data.full_name
                        };
                        setUser(updatedUser);
                        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
                    }
                } catch (err) {
                    console.error('Failed to sync user profile:', err);
                }

                // On vérifie si l'app était déjà verrouillée
                const wasLocked = localStorage.getItem('app_locked') === 'true';
                setIsLocked(wasLocked);
            }
        };
        checkUser();
    }, []);

    useEffect(() => {
        let lockTimeout: NodeJS.Timeout;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isAuthenticated) {
                lockTimeout = setTimeout(() => {
                    setIsLocked(true);
                    localStorage.setItem('app_locked', 'true');
                }, 60000); // 60 secondes
            } else if (document.visibilityState === 'visible') {
                if (lockTimeout) clearTimeout(lockTimeout);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (lockTimeout) clearTimeout(lockTimeout);
        };
    }, [isAuthenticated]);

    const login = async (phoneNumber: string, pin: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('phone_number', phoneNumber)
                .eq('pin', pin)
                .single();

            if (error || !data) {
                // Mode démo UNIQUEMENT en développement
                if (process.env.NODE_ENV === 'development' && phoneNumber === '0000' && pin === '0000') {
                    const demoUser: User = { id: 'admin-001', phoneNumber: '0000', role: 'SUPERVISOR', name: 'Superviseur' };
                    handleAuthSuccess(demoUser);
                    return true;
                }
                return false;
            }

            const userData: User = {
                id: data.id,
                phoneNumber: data.phone_number,
                role: data.role,
                name: data.full_name
            };

            handleAuthSuccess(userData);
            return true;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const handleAuthSuccess = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsLocked(false);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('app_locked', 'false');
    };

    const signup = async (name: string, phoneNumber: string, pin: string, role: User['role']): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert([
                    {
                        full_name: name,
                        phone_number: phoneNumber,
                        pin: pin,
                        role: role
                    }
                ])
                .select()
                .single();

            if (data && role === 'MERCHANT') {
                // Auto-création d'une boutique pour le marchand
                await supabase.from('stores').insert([
                    {
                        owner_id: data.id,
                        name: 'Ma Boutique',
                        status: 'ACTIVE'
                    }
                ]);
            }

            return login(phoneNumber, pin);
        } catch (err: any) {
            console.error('Signup exception:', err.message);
            return false;
        }
    };

    const unlock = async (pin: string): Promise<boolean> => {
        if (!user) return false;

        // Mode démo
        if (user.phoneNumber === '0000' && pin === '0000') {
            setIsLocked(false);
            localStorage.setItem('app_locked', 'false');
            return true;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone_number', user.phoneNumber)
                .eq('pin', pin)
                .single();

            if (data) {
                setIsLocked(false);
                localStorage.setItem('app_locked', 'false');
                return true;
            }
        } catch (err) {
            console.error('Unlock error:', err);
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setIsLocked(false);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('app_locked');
    };

    const updatePin = async (newPin: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ pin: newPin })
                .eq('id', user.id);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Update PIN error:', err);
            return false;
        }
    };

    const updateLanguage = async (lang: string): Promise<boolean> => {
        if (!user) return false;
        try {
            // Ici on pourrait sauver en DB si une colonne 'language' existait
            // Pour l'instant on persiste localement pour l'assistant
            localStorage.setItem('assistant_language', lang);
            return true;
        } catch (err) {
            console.error('Update Language error:', err);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLocked,
            login,
            signup,
            unlock,
            logout,
            setLocked: setIsLocked,
            updatePin,
            updateLanguage
        }}>
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
