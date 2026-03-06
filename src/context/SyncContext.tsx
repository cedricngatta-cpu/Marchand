'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    syncPendingCount: number;
    lastSyncError: string | null;
    syncAll: (forceRetry?: boolean) => Promise<void>;
    triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const isSyncingRef = useRef(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncPendingCount, setSyncPendingCount] = useState(0);
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);

    const updatePendingCount = useCallback(async () => {
        const count = await db.syncQueue.count();
        setSyncPendingCount(count);
    }, []);

    const processQueue = useCallback(async (forceRetry: boolean = false) => {
        if (!navigator.onLine || isSyncingRef.current) return;

        // Traiter PENDING et retenter les ERROR
        // Si forceRetry est vrai, on inclut aussi les FAILED
        const statusFilter = forceRetry ? ['PENDING', 'ERROR', 'FAILED'] : ['PENDING', 'ERROR'];

        const pending = await db.syncQueue
            .where('status')
            .anyOf(statusFilter)
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

                        // 1. Récupérer la quantité actuelle pour faire un calcul relatif
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

                        // 2. Utiliser un ID unique composé pour éviter les erreurs de contraintes
                        // Format: [store_id]_[product_id]
                        const compositeId = `${store_id}_${product_id}`;

                        const { error: sError } = await supabase
                            .from('stock')
                            .upsert(
                                {
                                    id: compositeId,
                                    product_id,
                                    store_id,
                                    quantity: newQty
                                }
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
                        const { id, store_id, name, price, color, icon_color, audio_name, image_url, barcode, category } = item.payload;
                        const { error: apError } = await supabase
                            .from('products')
                            .insert([{
                                id,
                                store_id,
                                name,
                                price,
                                color,
                                icon_color,
                                audio_name,
                                image_url,
                                barcode,
                                category
                            }]);
                        if (!apError || apError.code === '23505') success = true;
                        else errorDetails = apError;
                        break;
                    }
                    case 'UPDATE_PRODUCT': {
                        const { id: upid, ...updates } = item.payload;
                        // Mapper camelCase vers snake_case pour les mises à jour
                        const mappedUpdates: any = {};
                        if (updates.name) mappedUpdates.name = updates.name;
                        if (updates.price) mappedUpdates.price = updates.price;
                        if (updates.audioName) mappedUpdates.audio_name = updates.audioName;
                        if (updates.imageUrl) mappedUpdates.image_url = updates.imageUrl;
                        if (updates.barcode) mappedUpdates.barcode = updates.barcode;
                        if (updates.color) mappedUpdates.color = updates.color;
                        if (updates.iconColor) mappedUpdates.icon_color = updates.iconColor;
                        if (updates.category) mappedUpdates.category = updates.category;

                        const { error: upError } = await supabase
                            .from('products')
                            .update(mappedUpdates)
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
                    setLastSyncError(null);
                } else {
                    const msg = errorDetails?.message || JSON.stringify(errorDetails) || "Erreur inconnue";
                    console.error(`[Sync] Action ${item.action} failed:`, msg);
                    setLastSyncError(`[${item.action}] ${msg}`);

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
            lastSyncError,
            syncAll: (retry?: boolean) => processQueue(retry),
            triggerSync: () => processQueue(false)
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
