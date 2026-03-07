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

export function SyncProvider({ children }: { children: React.ReactNode }) {
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

        // --- TRI DE LA FILE : Priorité absolue à la création des produits ---
        pending.sort((a, b) => {
            // ADD_PRODUCT doit passer avant TOUTE autre opération pour respecter les contraintes SQL
            if (a.action === 'ADD_PRODUCT' && b.action !== 'ADD_PRODUCT') return -1;
            if (a.action !== 'ADD_PRODUCT' && b.action === 'ADD_PRODUCT') return 1;

            // Pour toutes les autres actions (UPDATE_STOCK, ADD_TRANSACTION, etc.), 
            // on respecte l'ordre chronologique de création
            return (a.created_at || 0) - (b.created_at || 0);
        });

        isSyncingRef.current = true;
        setIsSyncing(true);
        console.log(`[Sync] Processing ${pending.length} actions with ADD_PRODUCT priority...`);

        for (const item of pending) {
            try {
                let success = false;
                let errorDetails = null;

                // Stop processing if another sync process claimed the queue during loop
                if (!navigator.onLine) break;

                switch (item.action) {
                    case 'ADD_TRANSACTION': {
                        const { error: tError } = await supabase.from('transactions').insert([item.payload]);
                        if (tError && tError.code !== '23505') {
                            throw new Error(`[SUPABASE_ERROR] ADD_TRANSACTION: ${tError.message} (Code: ${tError.code})`);
                        }
                        success = true;
                        break;
                    }
                    case 'UPDATE_STOCK': {
                        const { product_id, quantity } = item.payload;

                        const { data: currentStock, error: fetchError } = await supabase
                            .from('stock')
                            .select('quantity')
                            .eq('product_id', product_id)
                            .maybeSingle();

                        if (fetchError) {
                            throw new Error(`[SUPABASE_ERROR] UPDATE_STOCK_FETCH: ${fetchError.message}`);
                        }

                        const newQty = Math.max(0, (currentStock?.quantity || 0) + quantity);

                        const { error: sError } = await supabase
                            .from('stock')
                            .upsert({ product_id, quantity: newQty });

                        if (sError) {
                            if (sError.code === '23503') {
                                throw new Error(`[FOREIGN_KEY_ERROR] UPDATE_STOCK: Le produit ${product_id} n'existe pas dans Supabase.`);
                            }
                            throw new Error(`[SUPABASE_ERROR] UPDATE_STOCK_UPSERT: ${sError.message} (Code: ${sError.code})`);
                        }
                        success = true;
                        break;
                    }
                    case 'MARK_PAID': {
                        const { id: tid } = item.payload;
                        const { error: pError } = await supabase
                            .from('transactions')
                            .update({ status: 'PAYÉ' })
                            .eq('id', tid);

                        if (pError) {
                            throw new Error(`[SUPABASE_ERROR] MARK_PAID: ${pError.message}`);
                        }
                        success = true;
                        break;
                    }
                    case 'ADD_PRODUCT': {
                        const { id, store_id, name, price, color, icon_color, audio_name, image_url, barcode, category } = item.payload;

                        if (!id) throw new Error("[SYNC_ERROR] ADD_PRODUCT: Payload manquant l'ID UUID.");

                        const payload: any = {
                            id,
                            store_id,
                            name,
                            price,
                            color: color || '#F1F5F9',
                            icon_color: icon_color || '#64748B',
                            audio_name: audio_name || name
                        };

                        if (category) payload.category = category;
                        if (image_url) payload.image_url = image_url;
                        if (barcode) payload.barcode = barcode;

                        const { error: apError } = await supabase
                            .from('products')
                            .insert([payload]);

                        if (apError) {
                            if (apError.code === '23505') {
                                success = true;
                            } else if (apError.message.includes('barcode') || apError.message.includes('image_url') || apError.message.includes('category')) {
                                console.warn(`[Sync] Fallback ADD_PRODUCT sans colonnes optionnelles...`);
                                const { error: retryError } = await supabase.from('products').insert([{
                                    id: payload.id,
                                    store_id: payload.store_id,
                                    name: payload.name,
                                    price: payload.price,
                                    color: payload.color,
                                    icon_color: payload.icon_color,
                                    audio_name: payload.audio_name
                                }]);
                                if (!retryError || retryError.code === '23505') success = true;
                                else throw new Error(`[SUPABASE_ERROR] ADD_PRODUCT_FALLBACK: ${retryError.message}`);
                            } else {
                                throw new Error(`[SUPABASE_ERROR] ADD_PRODUCT: ${apError.message} (Code: ${apError.code})`);
                            }
                        } else {
                            success = true;
                        }
                        break;
                    }
                    case 'UPDATE_PRODUCT': {
                        const { id: upid, ...updates } = item.payload;
                        const mappedUpdates: Record<string, any> = {};
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

                        if (upError) {
                            throw new Error(`[SUPABASE_ERROR] UPDATE_PRODUCT: ${upError.message}`);
                        }
                        success = true;
                        break;
                    }
                    case 'DELETE_PRODUCT': {
                        const { id: dpid } = item.payload;
                        const { error: dpError } = await supabase
                            .from('products')
                            .delete()
                            .eq('id', dpid);

                        if (dpError) {
                            throw new Error(`[SUPABASE_ERROR] DELETE_PRODUCT: ${dpError.message}`);
                        }
                        success = true;
                        break;
                    }
                }

                if (success) {
                    await db.syncQueue.delete(item.id!);
                    updatePendingCount();
                    setLastSyncError(null);
                }
            } catch (err: any) {
                const errorMsg = err.message || JSON.stringify(err);
                console.error(`[Sync] CRITICAL FAILURE on ${item.action}:`, errorMsg);
                setLastSyncError(`[${item.action}] ${errorMsg}`);

                const nextRetry = (item.retry_count || 0) + 1;
                await db.syncQueue.update(item.id!, {
                    status: nextRetry >= 3 ? 'FAILED' : 'ERROR',
                    retry_count: nextRetry
                });

                // On arrête tout traitement de la file si une erreur survient (principe de précaution)
                console.warn("[Sync] Loop stopped due to error to maintain data integrity.");
                break;
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        updatePendingCount();
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            processQueue();
        }

        // More frequent periodic sync (every 30s) - reduced from 10s to improve battery/CPU
        const interval = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) processQueue();
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
