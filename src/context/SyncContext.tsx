'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    syncPendingCount: number;
    syncAll: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const isSyncingRef = useRef(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncPendingCount, setSyncPendingCount] = useState(0);

    const updatePendingCount = useCallback(async () => {
        const count = await db.syncQueue.count();
        setSyncPendingCount(count);
    }, []);

    const processQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncingRef.current) return;

        const pending = await db.syncQueue.where('status').equals('PENDING').toArray();
        if (pending.length === 0) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        console.log(`[Sync] Processing ${pending.length} pending actions...`);

        for (const item of pending) {
            try {
                let success = false;

                switch (item.action) {
                    case 'ADD_TRANSACTION':
                        const { error: tError } = await supabase.from('transactions').insert([item.payload]);
                        if (!tError) success = true;
                        break;
                    case 'UPDATE_STOCK':
                        const { product_id, quantity, store_id } = item.payload;
                        // For stock updates, we might need a more complex strategy (summing up)
                        // but for now, we just push the increment/decrement
                        const { data: currentStock } = await supabase
                            .from('stocks')
                            .select('quantity')
                            .eq('product_id', product_id)
                            .eq('store_id', store_id)
                            .single();

                        const newQty = (currentStock?.quantity || 0) + quantity;
                        const { error: sError } = await supabase
                            .from('stocks')
                            .upsert({ product_id, store_id, quantity: newQty });

                        if (!sError) success = true;
                        break;
                    case 'MARK_PAID':
                        const { id: tid } = item.payload;
                        const { error: pError } = await supabase
                            .from('transactions')
                            .update({ status: 'PAYÉ' })
                            .eq('id', tid);
                        if (!pError) success = true;
                        break;
                    case 'ADD_PRODUCT':
                        const { error: apError } = await supabase
                            .from('products')
                            .insert([item.payload]);
                        if (!apError) success = true;
                        break;
                    case 'UPDATE_PRODUCT':
                        const { id: upid, ...productUpdates } = item.payload;
                        const { error: upError } = await supabase
                            .from('products')
                            .update(productUpdates)
                            .eq('id', upid);
                        if (!upError) success = true;
                        break;
                    case 'DELETE_PRODUCT':
                        const { id: dpid } = item.payload;
                        const { error: dpError } = await supabase
                            .from('products')
                            .delete()
                            .eq('id', dpid);
                        if (!dpError) success = true;
                        break;
                }

                if (success) {
                    await db.syncQueue.delete(item.id!);
                } else {
                    await db.syncQueue.update(item.id!, { status: 'ERROR' });
                }
            } catch (err) {
                console.error("[Sync] Error processing item:", err);
            }
        }

        isSyncingRef.current = false;
        setIsSyncing(false);
        updatePendingCount();
    }, [updatePendingCount]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        updatePendingCount();

        // periodic sync if online
        const interval = setInterval(() => {
            if (navigator.onLine) processQueue();
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [processQueue, updatePendingCount]);

    return (
        <SyncContext.Provider value={{
            isOnline,
            isSyncing,
            syncPendingCount,
            syncAll: processQueue
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within SyncProvider');
    return context;
};
