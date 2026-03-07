'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { StoreType } from '@/lib/db';

export interface StoreProfile {
    id: string;
    name: string;
    merchantName: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: number;
    logo?: string;
    ownerRole?: string;
    /** Type d'entité : RETAILER (marchand), PRODUCER (producteur), WHOLESALER (grossiste) */
    store_type: StoreType;
}

interface ProfileContextType {
    profiles: StoreProfile[];
    activeProfile: StoreProfile | null;
    addProfile: (profile: Omit<StoreProfile, 'id' | 'createdAt'>) => Promise<void>;
    updateProfile: (id: string, updates: Partial<StoreProfile>) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    setActiveProfile: (id: string) => void;
    refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [profiles, setProfiles] = useState<StoreProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

    const refreshProfiles = useCallback(async function refresh() {
        if (!user) return;

        let query = supabase.from('stores').select('*, profiles:owner_id(full_name, role)');

        if (user.role !== 'SUPERVISOR') {
            query = query.eq('owner_id', user.id);
        }

        const { data, error } = await query;

        if (data && data.length === 0 && (user.role === 'MERCHANT' || user.role === 'PRODUCER') && navigator.onLine) {
            // Rétrocompatibilité : auto-création pour les anciens comptes
            const defaultName = user.role === 'PRODUCER' ? 'Ma Ferme' : 'Ma Boutique';
            const defaultType = user.role === 'PRODUCER' ? 'PRODUCER' : 'RETAILER';
            console.log(`[ProfileContext] No store found, creating default store for ${user.role}...`);
            const { error: insertError } = await supabase.from('stores').insert([{
                owner_id: user.id,
                name: defaultName,
                store_type: defaultType,
                status: 'ACTIVE'
            }]);

            if (insertError) {
                console.error('[ProfileContext] Failed to create default store:', insertError.message);
                return;
            }

            // Relancer la récupération après création
            await refresh();
            return;
        }

        if (data && data.length > 0) {
            const mapped: StoreProfile[] = data.map(s => ({
                id: s.id,
                name: s.name,
                merchantName: (s.profiles as unknown as { full_name: string })?.full_name || 'Inconnu',
                ownerRole: (s.profiles as unknown as { role: string })?.role || 'MERCHANT',
                status: s.status || 'ACTIVE',
                createdAt: new Date(s.created_at).getTime(),
                logo: s.logo_url,
                store_type: (s.store_type as StoreType) || 'RETAILER',
            }));
            setProfiles(mapped);

            const savedActiveId = localStorage.getItem('active_profile_id');
            if (savedActiveId && mapped.some(p => p.id === savedActiveId)) {
                setActiveProfileId(savedActiveId);
            } else if (mapped.length > 0) {
                setActiveProfileId(mapped[0].id);
            }
        }
    }, [user]);

    useEffect(() => {
        if (isAuthenticated && user) {
            refreshProfiles();
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProfiles([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveProfileId(null);
        }
    }, [isAuthenticated, user, refreshProfiles]);

    const addProfile = async (profileData: Omit<StoreProfile, 'id' | 'createdAt'>) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('stores')
            .insert([
                {
                    name: profileData.name,
                    owner_id: user.id,
                    status: profileData.status
                }
            ])
            .select()
            .single();

        if (data) {
            await refreshProfiles();
        }
    };

    const updateProfile = async (id: string, updates: Partial<StoreProfile>) => {
        const { error } = await supabase
            .from('stores')
            .update({
                name: updates.name,
                status: updates.status,
                logo_url: updates.logo
            })
            .eq('id', id);

        if (!error) {
            await refreshProfiles();
        }
    };

    const deleteProfile = async (id: string) => {
        const { error } = await supabase
            .from('stores')
            .delete()
            .eq('id', id);

        if (!error) {
            await refreshProfiles();
        }
    };

    const setActiveProfile = (id: string) => {
        setActiveProfileId(id);
        localStorage.setItem('active_profile_id', id);
    };

    const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

    return (
        <ProfileContext.Provider value={{
            profiles,
            activeProfile,
            addProfile,
            updateProfile,
            deleteProfile,
            setActiveProfile,
            refreshProfiles
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfileContext must be used within a ProfileProvider');
    }
    return context;
};
