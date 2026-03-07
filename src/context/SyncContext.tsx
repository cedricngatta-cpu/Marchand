'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from './ProfileContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    syncPendingCount: number;
    lastSyncError: string | null;
    syncAll: (forceRetry?: boolean) => Promise<void>;
    triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SyncProvider({ children }: { children: React.ReactNode }) {

    // ProfileProvider wraps SyncProvider → useProfileContext() est toujours disponible ici.
    const { activeProfile } = useProfileContext();

    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const isSyncingRef = useRef(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncPendingCount, setSyncPendingCount] = useState(0);
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);

    // ── Compteur de la file d'attente ─────────────────────────────────────────

    const updatePendingCount = useCallback(async () => {
        const count = await db.syncQueue.count();
        setSyncPendingCount(count);
    }, []);

    // ── Traitement de la file (Auto-Push) ─────────────────────────────────────

    const processQueue = useCallback(async (forceRetry: boolean = false) => {
        if (!navigator.onLine || isSyncingRef.current) return;

        const statusFilter = forceRetry ? ['PENDING', 'ERROR', 'FAILED'] : ['PENDING', 'ERROR'];

        const pending = await db.syncQueue
            .where('status')
            .anyOf(statusFilter)
            .toArray();

        if (pending.length === 0) {
            updatePendingCount();
            return;
        }

        // Tri de la file : ADD_PRODUCT doit précéder toutes les autres opérations (contraintes FK)
        pending.sort((a, b) => {
            if (a.action === 'ADD_PRODUCT' && b.action !== 'ADD_PRODUCT') return -1;
            if (a.action !== 'ADD_PRODUCT' && b.action === 'ADD_PRODUCT') return 1;
            return (a.created_at || 0) - (b.created_at || 0);
        });

        isSyncingRef.current = true;
        setIsSyncing(true);
        console.log(`[Sync] Processing ${pending.length} actions...`);

        for (const item of pending) {
            try {
                let success = false;

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
                        const { id, store_id, name, price, delivery_price, color, icon_color, audio_name, image_url, barcode, category } = item.payload;

                        if (!id) throw new Error("[SYNC_ERROR] ADD_PRODUCT: Payload manquant l'ID UUID.");

                        const payload: any = {
                            id, store_id, name, price,
                            color: color || '#F1F5F9',
                            icon_color: icon_color || '#64748B',
                            audio_name: audio_name || name
                        };

                        if (category) payload.category = category;
                        if (image_url) payload.image_url = image_url;
                        if (barcode) payload.barcode = barcode;
                        if (delivery_price) payload.delivery_price = delivery_price;

                        const { error: apError } = await supabase.from('products').insert([payload]);

                        if (apError) {
                            if (apError.code === '23505') {
                                success = true;
                            } else if (apError.message.includes('barcode') || apError.message.includes('image_url') || apError.message.includes('category')) {
                                console.warn(`[Sync] Fallback ADD_PRODUCT sans colonnes optionnelles...`);
                                const { error: retryError } = await supabase.from('products').insert([{
                                    id: payload.id, store_id: payload.store_id, name: payload.name,
                                    price: payload.price, color: payload.color,
                                    icon_color: payload.icon_color, audio_name: payload.audio_name
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
                            .from('products').update(mappedUpdates).eq('id', upid);

                        if (upError) throw new Error(`[SUPABASE_ERROR] UPDATE_PRODUCT: ${upError.message}`);
                        success = true;
                        break;
                    }
                    case 'DELETE_PRODUCT': {
                        const { id: dpid } = item.payload;

                        // Supprimer le stock associé d'abord (contrainte FK inverse)
                        await supabase.from('stock').delete().eq('product_id', dpid);

                        const { error: dpError } = await supabase
                            .from('products').delete().eq('id', dpid);

                        // 42501 = RLS deny (produit déjà supprimé ou non propriétaire) → on ignore
                        if (dpError && dpError.code !== '42501' && dpError.code !== 'PGRST116') {
                            throw new Error(`[SUPABASE_ERROR] DELETE_PRODUCT: ${dpError.message}`);
                        }
                        success = true;
                        break;
                    }

                    // ── Flux B2B Producteur ↔ Marchand ────────────────────────────────────

                    case 'CREATE_ORDER': {
                        const {
                            id, buyer_store_id, seller_store_id, product_id,
                            product_name, quantity, unit_price, total_amount,
                            buyer_name, seller_name, notes, created_at, updated_at,
                        } = item.payload;

                        if (!id) throw new Error("[SYNC_ERROR] CREATE_ORDER: Payload manquant l'ID UUID.");

                        const { error: coError } = await supabase.from('orders').insert([{
                            id, buyer_store_id, seller_store_id, product_id,
                            product_name, quantity, unit_price, total_amount,
                            status: 'PENDING',
                            buyer_name: buyer_name ?? null,
                            seller_name: seller_name ?? null,
                            notes: notes ?? null,
                            created_at, updated_at,
                        }]);

                        if (coError) {
                            if (coError.code === '23505') { success = true; break; }
                            if (coError.code === '23503') {
                                throw new Error(`[FOREIGN_KEY_ERROR] CREATE_ORDER: store_id ou product_id introuvable. ${coError.message}`);
                            }
                            throw new Error(`[SUPABASE_ERROR] CREATE_ORDER: ${coError.message} (Code: ${coError.code})`);
                        }
                        success = true;
                        break;
                    }
                    case 'ACCEPT_ORDER': {
                        const { id, updated_at } = item.payload;
                        const { error: aoError } = await supabase
                            .from('orders').update({ status: 'ACCEPTED', updated_at }).eq('id', id);
                        if (aoError) throw new Error(`[SUPABASE_ERROR] ACCEPT_ORDER: ${aoError.message}`);
                        success = true;
                        break;
                    }
                    case 'CANCEL_ORDER': {
                        const { id, updated_at } = item.payload;
                        const { error: cancelError } = await supabase
                            .from('orders').update({ status: 'CANCELLED', updated_at }).eq('id', id);
                        if (cancelError) throw new Error(`[SUPABASE_ERROR] CANCEL_ORDER: ${cancelError.message}`);
                        success = true;
                        break;
                    }
                    case 'SHIP_ORDER': {
                        const { id, updated_at } = item.payload;
                        const { error: shipError } = await supabase
                            .from('orders').update({ status: 'SHIPPED', updated_at }).eq('id', id);
                        if (shipError) throw new Error(`[SUPABASE_ERROR] SHIP_ORDER: ${shipError.message}`);
                        success = true;
                        break;
                    }
                    case 'DELIVER_ORDER': {
                        const {
                            id, transaction_id, payment_mode, buyer_store_id,
                            product_id, product_name, quantity, unit_price, updated_at,
                        } = item.payload;

                        if (!transaction_id) throw new Error("[SYNC_ERROR] DELIVER_ORDER: transaction_id manquant.");

                        const { error: deliverError } = await supabase
                            .from('orders')
                            .update({ status: 'DELIVERED', payment_mode, updated_at })
                            .eq('id', id);

                        if (deliverError) throw new Error(`[SUPABASE_ERROR] DELIVER_ORDER (update): ${deliverError.message}`);

                        const txStatus = payment_mode === 'CASH' ? 'PAYÉ' : payment_mode === 'MOMO' ? 'MOMO' : 'DETTE';

                        const { error: txError } = await supabase.from('transactions').insert([{
                            id: transaction_id,
                            type: 'LIVRAISON',
                            product_id, product_name, quantity,
                            price: unit_price,
                            status: txStatus,
                            store_id: buyer_store_id,
                            created_at: updated_at,
                        }]);

                        if (txError && txError.code !== '23505') {
                            throw new Error(`[SUPABASE_ERROR] DELIVER_ORDER (transaction): ${txError.message}`);
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

                console.warn('[Sync] Loop stopped to maintain data integrity.');
                break;
            }
        }

        isSyncingRef.current = false;
        setIsSyncing(false);
        updatePendingCount();

        // Drain : si de nouveaux items sont arrivés pendant ce cycle, relancer immédiatement
        const remaining = await db.syncQueue.where('status').anyOf(['PENDING', 'ERROR']).count();
        if (remaining > 0 && navigator.onLine) {
            setTimeout(() => {
                if (!isSyncingRef.current) processQueue();
            }, 200);
        }
    }, [updatePendingCount]);

    // ── Pilier 1 : Auto-Push — réseau + intervalle ────────────────────────────

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log('[Sync] Network restored — flushing queue...');
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        updatePendingCount();
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            processQueue();
        }

        const interval = setInterval(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) processQueue();
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [processQueue, updatePendingCount]);

    // ── Pilier 2 : Auto-Pull — Supabase Realtime (serveur → Dexie) ───────────

    useEffect(() => {
        if (!activeProfile?.id) return;
        const profileId = activeProfile.id;

        // ── Handler orders ──
        // Anti-boucle : put() UNIQUEMENT — jamais de syncQueue.add().
        // Les useLiveQuery existants réagissent automatiquement à db.put().
        const handleOrderChange = async (payload: any) => {
            if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;
            try {
                // Mappe le row Supabase vers LocalOrder (synced: 1 = confirmé côté serveur)
                const row = payload.new;
                await db.orders.put({
                    id:               row.id,
                    buyer_store_id:   row.buyer_store_id,
                    seller_store_id:  row.seller_store_id,
                    product_id:       row.product_id,
                    product_name:     row.product_name,
                    quantity:         row.quantity,
                    unit_price:       row.unit_price,
                    total_amount:     row.total_amount,
                    status:           row.status,
                    payment_mode:     row.payment_mode ?? undefined,
                    buyer_name:       row.buyer_name ?? undefined,
                    seller_name:      row.seller_name ?? undefined,
                    notes:            row.notes ?? undefined,
                    created_at:       row.created_at,
                    updated_at:       row.updated_at,
                    synced:           1,
                });
                console.log(`[Realtime] ✓ Order ${row.id.slice(0, 8)} → ${row.status}`);
            } catch (err) {
                console.error('[Realtime] Failed to update order in Dexie:', err);
            }
        };

        // ── Handler transactions ──
        const handleTransactionChange = async (payload: any) => {
            if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;
            try {
                const row = payload.new;
                await db.transactions.put({
                    id:           row.id,
                    type:         row.type,
                    product_id:   row.product_id,
                    product_name: row.product_name,
                    quantity:     row.quantity,
                    price:        row.price,
                    status:       row.status,
                    store_id:     row.store_id,
                    created_at:   row.created_at,
                    client_name:  row.client_name ?? undefined,
                    synced:       1,
                });
                console.log(`[Realtime] ✓ Transaction ${row.id.slice(0, 8)} upserted`);
            } catch (err) {
                console.error('[Realtime] Failed to update transaction in Dexie:', err);
            }
        };

        // ── Création du channel Supabase ──
        // Un seul channel par profil, 3 filtres postgres_changes :
        //   1. orders WHERE buyer_store_id  = profileId  (marchand voit ses commandes)
        //   2. orders WHERE seller_store_id = profileId  (producteur voit ses commandes)
        //   3. transactions WHERE store_id  = profileId  (les deux voient leurs transactions)
        const channel = supabase
            .channel(`realtime-${profileId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `buyer_store_id=eq.${profileId}` },
                handleOrderChange,
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `seller_store_id=eq.${profileId}` },
                handleOrderChange,
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `store_id=eq.${profileId}` },
                handleTransactionChange,
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] ✓ Channel actif — profil ${profileId.slice(0, 8)}`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] Channel error:', err);
                }
            });

        return () => {
            supabase.removeChannel(channel);
            console.log(`[Realtime] Channel fermé — profil ${profileId.slice(0, 8)}`);
        };
    }, [activeProfile?.id]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <SyncContext.Provider value={{
            isOnline,
            isSyncing,
            syncPendingCount,
            lastSyncError,
            syncAll: (retry?: boolean) => processQueue(retry),
            triggerSync: () => processQueue(false),
        }}>
            {children}
        </SyncContext.Provider>
    );
}

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within SyncProvider');
    return context;
};
