import Dexie, { Table } from 'dexie';

// ─── Shared Types ─────────────────────────────────────────────────────────────

/** Type d'entité commerciale. Utilisé sur la table `stores` en Supabase. */
export type StoreType = 'RETAILER' | 'PRODUCER' | 'WHOLESALER';

// ─── Interfaces (source de vérité locale — Dexie/IndexedDB) ──────────────────

export interface LocalTransaction {
    id: string; // uuid
    type: 'VENTE' | 'LIVRAISON' | 'RETRAIT';
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    client_name?: string;
    status: 'PAYÉ' | 'DETTE' | 'MOMO';
    store_id: string;
    created_at: string;
    synced: number; // 0 = non, 1 = oui
}

export interface LocalProduct {
    id: string;
    name: string;
    price: number;
    delivery_price?: number;
    audio_name: string;
    category: string;
    barcode?: string;
    image_url?: string;
    color: string;
    icon_color: string;
    store_id: string;
    synced: number;
}

export interface LocalStock {
    id: string;
    product_id: string;
    quantity: number;
    store_id: string;
    synced: number;
}

/**
 * Commande B2B : un marchand (buyer) commande à un producteur (seller).
 *
 * Cycle de vie du statut :
 *   PENDING → ACCEPTED → SHIPPED → DELIVERED | CANCELLED
 *
 * À DELIVERED + paiement CASH  → génère une LocalTransaction type LIVRAISON / statut PAYÉ
 * À DELIVERED + paiement DETTE → génère une LocalTransaction type LIVRAISON / statut DETTE
 */
export interface LocalOrder {
    id: string;                      // uuid
    buyer_store_id: string;          // store_id du marchand (RETAILER)
    seller_store_id: string;         // store_id du producteur (PRODUCER)
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;            // quantity * unit_price
    status: 'PENDING' | 'ACCEPTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    payment_mode?: 'CASH' | 'DETTE' | 'MOMO'; // renseigné à DELIVERED
    buyer_name?: string;
    seller_name?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    synced: number;                  // 0 = non, 1 = oui
}

export interface SyncQueue {
    id?: number;
    action: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    status: 'PENDING' | 'ERROR' | 'FAILED';
    retry_count: number;
    created_at: number;
}

// ─── Dexie Database ───────────────────────────────────────────────────────────

export class InclusionDB extends Dexie {
    transactions!: Table<LocalTransaction, string>;
    products!: Table<LocalProduct, string>;
    stocks!: Table<LocalStock, string>;
    orders!: Table<LocalOrder, string>;
    syncQueue!: Table<SyncQueue, number>;

    constructor() {
        super('InclusionDatabase');

        // Version 2 : schéma marchand initial (ne pas modifier)
        this.version(2).stores({
            transactions: 'id, store_id, product_id, type, status, created_at, synced',
            products: 'id, store_id, category, barcode, synced',
            stocks: 'id, store_id, product_id, synced',
            syncQueue: '++id, action, status, retry_count, created_at'
        });

        // Version 3 : ajout de la table orders pour le flux B2B Producteur ↔ Marchand
        this.version(3).stores({
            orders: 'id, seller_store_id, buyer_store_id, product_id, status, created_at, synced'
        });
    }
}

export const db = new InclusionDB();
