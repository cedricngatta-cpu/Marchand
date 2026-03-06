'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    syncPendingCount: number;
    syncAll: () => Promise<void>;
    triggerSync: () => Promise<void>;
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

        // Traiter PENDING et retenter les ERROR (ceux qui n'ont pas encore échoué définitivement)
        const pending = await db.syncQueue
            .where('status')
            .anyOf(['PENDING', 'ERROR'])
            .toArray();

        if (pending.length === 0) {
            updatePendingCount();
            return;
        }

        isSyncingRef.current = true;
        setIsSyncing(true);
        console.log(`[Sync] Processing ${pending.length} pending/error actions...`);

        for (const item of pending) {
            try {
                let success = false;
                let errorDetails = null;

                switch (item.action) {
                    case 'ADD_TRANSACTION': {
                        const { error: tError } = await supabase.from('transactions').insert([item.payload]);
                        if (!tError || tError.code === '23505') success = true;
                        else errorDetails = tError;
                        break;
                    }
                    case 'UPDATE_STOCK': {
                        const { product_id, quantity, store_id } = item.payload;
                        const { data: currentStock, error: fetchError } = await supabase
                            .from('stock')
                            .select('quantity')
                            .eq('product_id', product_id)
                            .eq('store_id', store_id)
                            .maybeSingle();

                        if (fetchError) {
                            errorDetails = fetchError;
                            break;
                        }

                        const newQty = Math.max(0, (currentStock?.quantity || 0) + quantity);
                        const { error: sError } = await supabase
                            .from('stock')
                            .upsert(
                                { product_id, store_id, quantity: newQty },
                                { onConflict: 'product_id,store_id' }
                            );

                        if (!sError) success = true;
                        else errorDetails = sError;
                        break;
                    }
                    case 'MARK_PAID': {
                        const { id: tid } = item.payload;
                        const { error: pError } = await supabase
                            .from('transactions')
                            .update({ status: 'PAYÉ' })
                            .eq('id', tid);
                        if (!pError) success = true;
                        else errorDetails = pError;
                        break;
                    }
                    case 'ADD_PRODUCT': {
                        const { error: apError } = await supabase
                            .from('products')
                            .insert([item.payload]);
                        if (!apError || apError.code === '23505') success = true;
                        else errorDetails = apError;
                        break;
                    }
                    case 'UPDATE_PRODUCT': {
                        const { id: upid, ...productUpdates } = item.payload;
                        const { error: upError } = await supabase
                            .from('products')
                            .update(productUpdates)
                            .eq('id', upid);
                        if (!upError) success = true;
                        else errorDetails = upError;
                        break;
                    }
                    case 'DELETE_PRODUCT': {
                        const { id: dpid } = item.payload;
                        const { error: dpError } = await supabase
                            .from('products')
                            .delete()
                            .eq('id', dpid);
                        if (!dpError) success = true;
                        else errorDetails = dpError;
                        break;
                    }
                }

                if (success) {
                    await db.syncQueue.delete(item.id!);
                    updatePendingCount();
                } else {
                    console.error(`[Sync] Action ${item.action} failed:`, errorDetails);
                    const nextRetry = (item.retry_count || 0) + 1;
                    if (nextRetry >= 3) {
                        await db.syncQueue.update(item.id!, {
                            status: 'FAILED',
                            retry_count: nextRetry
                        });
                    } else {
                        await db.syncQueue.update(item.id!, {
                            status: 'ERROR',
                            retry_count: nextRetry
                        });
                    }
                }
            } catch (err) {
                console.error("[Sync] Fatal error processing item:", err);
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

        // Initial sync: process queue immediately on startup
        updatePendingCount();
        if (navigator.onLine) {
            processQueue();
        }

        // More frequent periodic sync (every 10s)
        const interval = setInterval(() => {
            if (navigator.onLine) processQueue();
        }, 10000);

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
            syncAll: processQueue,
            triggerSync: processQueue
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
