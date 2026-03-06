import Dexie, { Table } from 'dexie';

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

export interface SyncQueue {
    id?: number;
    action: string;
    payload: any;
    status: 'PENDING' | 'ERROR' | 'FAILED';
    retry_count: number;
    created_at: number;
}

export class InclusionDB extends Dexie {
    transactions!: Table<LocalTransaction, string>;
    products!: Table<LocalProduct, string>;
    stocks!: Table<LocalStock, string>;
    syncQueue!: Table<SyncQueue, number>;

    constructor() {
        super('InclusionDatabase');
        this.version(1).stores({
            transactions: 'id, store_id, product_id, type, status, created_at, synced',
            products: 'id, store_id, category, barcode, synced',
            stocks: 'id, store_id, product_id, synced',
            syncQueue: '++id, action, status, created_at'
        });
    }
}

export const db = new InclusionDB();
