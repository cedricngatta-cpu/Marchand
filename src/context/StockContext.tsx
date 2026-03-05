'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProductContext } from './ProductContext';
import { useProfileContext } from './ProfileContext';
import { db } from '@/lib/db';

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
    const [stock, setStock] = useState<StockLevels>({});

    const fetchStock = async () => {
        if (!activeProfile) return;

        // 1. Lire depuis IndexedDB
        const localStocks = await db.stocks.where('store_id').equals(activeProfile.id).toArray();
        const levels: StockLevels = {};
        localStocks.forEach(s => {
            levels[s.product_id] = s.quantity;
        });
        setStock(levels);

        // 2. Refresh depuis Supabase si online
        if (navigator.onLine) {
            const { data, error } = await supabase
                .from('stock') // Nom de la table Supabase
                .select('*');

            if (data) {
                for (const s of data) {
                    await db.stocks.put({
                        id: `${activeProfile.id}_${s.product_id}`,
                        product_id: s.product_id,
                        quantity: s.quantity,
                        store_id: activeProfile.id,
                        synced: 1
                    });
                    levels[s.product_id] = s.quantity;
                }
                setStock({ ...levels });
            }
        }
    };

    useEffect(() => {
        if (activeProfile) {
            fetchStock();

            // Real-time subscription to stock changes
            const subscription = supabase
                .channel('stock_changes')
                .on('postgres_changes' as any, { event: '*', table: 'stock', schema: 'public' }, () => {
                    fetchStock();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        } else {
            setStock({});
        }
    }, [activeProfile]);

    const updateStock = useCallback(async (productId: string, amount: number) => {
        if (!activeProfile) return;

        // Optimistic update
        const newQty = Math.max(0, (stock[productId] || 0) + amount);
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
                quantity: amount, // On envoie l'incrément pour éviter les écrasements si possible
                store_id: activeProfile.id
            },
            status: 'PENDING',
            created_at: Date.now()
        });

        // Forcer synchro si en ligne
        if (navigator.onLine) {
            window.dispatchEvent(new Event('online'));
        }
    }, [activeProfile, stock]);

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
