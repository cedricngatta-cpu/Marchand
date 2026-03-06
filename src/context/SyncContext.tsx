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
                        const { product_id, quantity } = item.payload;

                        // 1. Récupérer la quantité actuelle pour faire un calcul relatif
                        // Note: store_id n'existe pas dans la table stock sur Supabase
                        const { data: currentStock, error: fetchError } = await supabase
                            .from('stock')
                            .select('quantity')
                            .eq('product_id', product_id)
                            .maybeSingle();

                        if (fetchError) {
                            errorDetails = fetchError;
                            break;
                        }

                        const newQty = Math.max(0, (currentStock?.quantity || 0) + quantity);

                        // 2. Mise à jour via upsert sur product_id (clé primaire attendue)
                        const { error: sError } = await supabase
                            .from('stock')
                            .upsert(
                                {
                                    product_id,
                                    quantity: newQty
                                }
                            );

                        if (!sError) {
                            success = true;
                        } else if (sError.code === '23503') {
                            // Violation de clé étrangère ! Le produit manque probablement dans Supabase.
                            console.warn(`[Sync] Product ${product_id} missing in Supabase. Attempting auto-fix...`);

                            const localProd = await db.products.get(product_id);
                            if (localProd) {
                                // Tenter d'insérer le produit manquant proprement
                                const payload: {
                                    id: string;
                                    store_id: string;
                                    name: string;
                                    price: number;
                                    color: string;
                                    icon_color: string;
                                    audio_name: string;
                                    image_url?: string;
                                    barcode?: string;
                                    category?: string;
                                } = {
                                    id: localProd.id,
                                    store_id: localProd.store_id,
                                    name: localProd.name,
                                    price: localProd.price,
                                    color: localProd.color,
                                    icon_color: localProd.icon_color,
                                    audio_name: localProd.audio_name
                                };
                                if (localProd.image_url) payload.image_url = localProd.image_url;
                                if (localProd.barcode) payload.barcode = localProd.barcode;
                                if (localProd.category) payload.category = localProd.category;

                                const { error: prodError } = await supabase
                                    .from('products')
                                    .insert([payload]);

                                if (!prodError || prodError.code === '23505') {
                                    // Succès ou déjà présent, on retente l'upsert du stock
                                    const { error: retryError } = await supabase
                                        .from('stock')
                                        .upsert({ product_id, quantity: newQty });

                                    if (!retryError) success = true;
                                    else errorDetails = retryError;
                                } else if (prodError.message.includes('barcode')) {
                                    // Deuxième tentative sans barcode si la colonne manque vraiment
                                    const retryPayload = { ...payload };
                                    delete retryPayload.barcode;
                                    const { error: retryProd } = await supabase.from('products').insert([retryPayload]);
                                    if (!retryProd || retryProd.code === '23505') {
                                        const { error: retryStock } = await supabase.from('stock').upsert({ product_id, quantity: newQty });
                                        if (!retryStock) success = true;
                                        else errorDetails = retryStock;
                                    } else {
                                        errorDetails = retryProd;
                                    }
                                } else {
                                    errorDetails = prodError;
                                }
                            } else {
                                errorDetails = sError;
                            }
                        } else {
                            errorDetails = sError;
                        }
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

                        // Construire le payload de manière robuste
                        const payload: {
                            id: string;
                            store_id: string;
                            name: string;
                            price: number;
                            color: string;
                            icon_color: string;
                            audio_name: string;
                            category?: string;
                            image_url?: string;
                            barcode?: string;
                        } = {
                            id,
                            store_id,
                            name,
                            price,
                            color: color || '#F1F5F9',
                            icon_color: icon_color || '#64748B',
                            audio_name: audio_name || name
                        };

                        // Ajouter les colonnes optionnelles seulement si elles existent dans le payload
                        // et on va les protéger pour éviter les erreurs de schéma cloud
                        if (category) payload.category = category;
                        if (image_url) payload.image_url = image_url;
                        if (barcode) payload.barcode = barcode;

                        const { error: apError } = await supabase
                            .from('products')
                            .insert([payload]);

                        if (!apError || apError.code === '23505') success = true;
                        else if (apError.message.includes('barcode') || apError.message.includes('image_url')) {
                            // Si l'erreur mentionne spécifiquement barcode ou image_url, on retente sans eux
                            console.warn(`[Sync] Retrying ADD_PRODUCT without optional columns due to schema mismatch...`);
                            const retryPayload = { ...payload };
                            delete retryPayload.barcode;
                            delete retryPayload.image_url;
                            const { error: retryError } = await supabase.from('products').insert([retryPayload]);
                            if (!retryError || retryError.code === '23505') success = true;
                            else errorDetails = retryError;
                        } else {
                            errorDetails = apError;
                        }
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
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            processQueue();
        }

        // More frequent periodic sync (every 10s)
        const interval = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) processQueue();
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
