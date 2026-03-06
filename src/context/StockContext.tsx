'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useProductContext } from './ProductContext';
import { useProfileContext } from './ProfileContext';
import { db } from '@/lib/db';
import { useSync } from './SyncContext';

interface StockLevels {
    [productId: string]: number;
}

interface StockContextType {
    stock: StockLevels;
    updateStock: (productId: string, amount: number) => Promise<void>;
    getStockLevel: (productId: string) => number;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeProfile } = useProfileContext();
    const { triggerSync } = useSync();
    const [stock, setStock] = useState<StockLevels>({});

    const fetchStock = useCallback(async () => {
        if (!activeProfile) return;

        try {
            // 1. Lire depuis IndexedDB
            const localStocks = await db.stocks.where('store_id').equals(activeProfile.id).toArray();
            const levels: StockLevels = {};
            localStocks.forEach(s => {
                levels[s.product_id] = s.quantity;
            });
            setStock(levels);

            // 2. Refresh depuis Supabase si online
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                const { data, error } = await supabase
                    .from('stock')
                    .select('*')
                    .eq('store_id', activeProfile.id);

                if (data) {
                    for (const s of data) {
                        try {
                            await db.stocks.put({
                                id: `${activeProfile.id}_${s.product_id}`,
                                product_id: s.product_id,
                                quantity: s.quantity,
                                store_id: activeProfile.id,
                                synced: 1
                            });
                            levels[s.product_id] = s.quantity;
                        } catch (e) {
                            console.error("[StockContext] Error putting stock:", e);
                        }
                    }
                    setStock({ ...levels });
                }
            }
        } catch (err) {
            console.error("[StockContext] fetchStock error:", err);
        }
    }, [activeProfile]);

    useEffect(() => {
        let isMounted = true;
        let subscription: ReturnType<typeof supabase.channel> | null = null;

        if (activeProfile) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchStock();

            // Real-time subscription to stock changes - FILTERED by store_id
            subscription = supabase
                .channel(`stock_changes_${activeProfile.id}`)
                .on(
                    'postgres_changes' as any,
                    {
                        event: '*',
                        table: 'stock',
                        schema: 'public',
                        filter: `store_id=eq.${activeProfile.id}`
                    },
                    (payload) => {
                        if (isMounted) {
                            console.log("[StockContext] Realtime update recived:", payload);
                            fetchStock();
                        }
                    }
                )
                .subscribe();

        } else {
            setStock({});
        }

        return () => {
            isMounted = false;
            if (subscription) {
                // Async cleanup to prevent UI blocking and ensure socket is properly destroyed
                supabase.removeChannel(subscription).catch(console.error);
            }
        };
    }, [activeProfile, fetchStock]);

    const updateStock = useCallback(async (productId: string, amount: number) => {
        if (!activeProfile) return;

        try {
            // Optimistic update
            const currentQty = stock[productId] || 0;
            const newQty = Math.max(0, currentQty + amount);

            setStock(current => ({
                ...current,
                [productId]: newQty
            }));

            // 1. Sauvegarde locale
            await db.stocks.put({
                id: `${activeProfile.id}_${productId}`,
                product_id: productId,
                quantity: newQty,
                store_id: activeProfile.id,
                synced: 0
            });

            // 2. File de synchro
            await db.syncQueue.add({
                action: 'UPDATE_STOCK',
                payload: {
                    product_id: productId,
                    quantity: amount,
                    store_id: activeProfile.id
                },
                status: 'PENDING',
                retry_count: 0,
                created_at: Date.now()
            });

            // Forcer synchro si en ligne
            if (navigator.onLine) {
                triggerSync();
            }
        } catch (err) {
            console.error("[StockContext] updateStock error:", err);
        }
    }, [activeProfile, stock, triggerSync]);

    const getStockLevel = useCallback((productId: string) => stock[productId] || 0, [stock]);

    return (
        <StockContext.Provider value={{ stock, updateStock, getStockLevel }}>
            {children}
        </StockContext.Provider>
    );
};

export const useStockContext = () => {
    const context = useContext(StockContext);
    if (!context) {
        throw new Error('useStockContext must be used within a StockProvider');
    }
    return context;
};
