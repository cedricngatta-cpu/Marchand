'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from '@/context/ProfileContext';
import { db, LocalTransaction } from '@/lib/db';

export type TransactionType = 'VENTE' | 'LIVRAISON' | 'RETRAIT';

export interface Transaction {
    id: string;
    type: TransactionType;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    timestamp: number;
    clientName?: string;
    clientId?: string;
    status?: 'PAYÉ' | 'DETTE' | 'MOMO';
}

interface HistoryContextType {
    history: Transaction[];
    balance: number;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
    markAsPaid: (transactionId: string) => Promise<void>;
    markAllAsPaid: (clientName: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    getProductHistory: (productId: string) => Transaction[];
    getTodayTransactions: () => Transaction[];
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeProfile } = useProfileContext();
    const [history, setHistory] = useState<Transaction[]>([]);

    const fetchHistory = async () => {
        if (!activeProfile) return;

        // 1. Lire d'abord depuis IndexedDB pour un affichage instantané
        const localData = await db.transactions
            .where('store_id')
            .equals(activeProfile.id)
            .reverse()
            .sortBy('created_at')
            .then(data => data.slice(0, 1000)); // Limite augmentée pour une meilleure balance

        if (localData.length > 0) {
            const mapped: Transaction[] = localData.map(t => ({
                id: t.id,
                type: t.type,
                productId: t.product_id,
                productName: t.product_name,
                quantity: t.quantity,
                price: t.price,
                timestamp: new Date(t.created_at).getTime(),
                clientName: t.client_name,
                status: t.status
            }));
            setHistory(mapped);
        }

        // 2. Tenter de rafraîchir depuis Supabase si en ligne
        if (navigator.onLine) {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('store_id', activeProfile.id)
                .order('created_at', { ascending: false })
                .limit(1000);

            if (data && data.length > 0) {
                // Mettre à jour la base locale avec les données du cloud
                for (const t of data) {
                    await db.transactions.put({
                        id: t.id,
                        type: t.type,
                        product_id: t.product_id,
                        product_name: t.product_name,
                        quantity: t.quantity,
                        price: t.price,
                        client_name: t.client_name,
                        status: t.status,
                        store_id: t.store_id,
                        created_at: t.created_at,
                        synced: 1
                    });
                }

                // Re-lire localement après la mise à jour pour garantir l'ordre
                const updatedLocal = await db.transactions
                    .where('store_id')
                    .equals(activeProfile.id)
                    .reverse()
                    .sortBy('created_at')
                    .then(data => data.slice(0, 1000));

                const mapped: Transaction[] = updatedLocal.map(t => ({
                    id: t.id,
                    type: t.type,
                    productId: t.product_id,
                    productName: t.product_name,
                    quantity: t.quantity,
                    price: t.price,
                    timestamp: new Date(t.created_at).getTime(),
                    clientName: t.client_name,
                    status: t.status
                }));
                setHistory(mapped);
            }
        }
    };

    useEffect(() => {
        if (!activeProfile) {
            setHistory([]);
            return;
        }

        fetchHistory();

        // Subscription temps-réel pour recevoir les changements depuis n'importe quel appareil
        const subscription = supabase
            .channel('transactions_changes')
            .on('postgres_changes' as any, {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `store_id=eq.${activeProfile.id}`
            }, () => {
                fetchHistory();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [activeProfile]);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
        if (!activeProfile) return;

        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const localRecord: LocalTransaction = {
            id,
            store_id: activeProfile.id,
            type: transaction.type,
            product_id: transaction.productId,
            product_name: transaction.productName,
            quantity: transaction.quantity,
            price: transaction.price,
            client_name: transaction.clientName,
            status: transaction.status || 'PAYÉ',
            created_at: createdAt,
            synced: 0
        };

        // 1. Sauvegarder localement IMMEDIATEMENT
        await db.transactions.add(localRecord);

        // 2. Ajouter à la file de synchro
        await db.syncQueue.add({
            action: 'ADD_TRANSACTION',
            payload: {
                id,
                store_id: activeProfile.id,
                type: transaction.type,
                product_id: transaction.productId,
                product_name: transaction.productName,
                quantity: transaction.quantity,
                price: transaction.price,
                client_name: transaction.clientName,
                status: transaction.status || 'PAYÉ',
                created_at: createdAt
            },
            status: 'PENDING',
            retry_count: 0,
            created_at: Date.now()
        });

        // 3. Mettre à jour l'UI
        await fetchHistory();

        // Optionnel: Déclencher un événement online manuel si on veut forcer
        if (navigator.onLine) {
            window.dispatchEvent(new Event('online'));
        }
    };

    const markAsPaid = async (transactionId: string) => {
        // 1. Update local
        await db.transactions.update(transactionId, { status: 'PAYÉ', synced: 0 });

        // 2. Queue sync
        await db.syncQueue.add({
            action: 'MARK_PAID',
            payload: { id: transactionId },
            status: 'PENDING',
            retry_count: 0,
            created_at: Date.now()
        });

        await fetchHistory();
    };

    const markAllAsPaid = async (clientName: string) => {
        // 1. Update local
        const toUpdate = await db.transactions
            .where('client_name')
            .equals(clientName)
            .and(t => t.status === 'DETTE')
            .toArray();

        for (const t of toUpdate) {
            await markAsPaid(t.id);
        }
    };

    const clearHistory = async () => {
        if (!activeProfile) return;
        await db.transactions.where('store_id').equals(activeProfile.id).delete();
        await fetchHistory();
    };

    const getProductHistory = (productId: string) => {
        return history.filter(t => t.productId === productId);
    };

    const getTodayTransactions = () => {
        const today = new Date().setHours(0, 0, 0, 0);
        return history.filter(t => t.timestamp >= today);
    };

    const balance = useMemo(() => history.reduce((acc, t) => {
        if (t.type === 'VENTE' && t.status !== 'DETTE') {
            return acc + t.price;
        }
        if (t.type === 'RETRAIT') {
            return acc - t.price;
        }
        return acc;
    }, 0), [history]);

    return (
        <HistoryContext.Provider value={{
            history,
            balance,
            addTransaction,
            markAsPaid,
            markAllAsPaid,
            clearHistory,
            getProductHistory,
            getTodayTransactions
        }}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistoryContext = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistoryContext must be used within a HistoryProvider');
    }
    return context;
};
