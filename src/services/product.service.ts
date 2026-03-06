// src/services/product.service.ts
import { supabase } from '@/lib/supabase';
import { db, LocalProduct } from '@/lib/db';
import { products as initialProductsData } from '@/data/products';
import { Product } from '@/context/ProductContext'; // On garde l'interface pour le moment
import { Package } from 'lucide-react';

/**
 * Mappe un enregistrement de la base de données (local ou distant) vers l'objet Product de l'UI.
 * @param record L'enregistrement de la base de données.
 * @returns L'objet Product formaté pour l'UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecordToProduct(record: any): Product {
    return {
        id: record.id,
        name: record.name,
        price: record.price,
        imageUrl: record.image_url,
        barcode: record.barcode,
        color: record.color,
        iconColor: record.icon_color,
        audioName: record.audio_name,
        category: record.category,
        icon: initialProductsData.find(ip => ip.name === record.name)?.icon || Package
    };
}

/**
 * Récupère les produits pour un profil donné.
 * Gère la logique offline-first : lit depuis IndexedDB, puis rafraîchit depuis Supabase si en ligne.
 * @param profileId L'ID du profil actif.
 * @returns Une liste de produits pour l'UI.
 */
export async function getProductsForProfile(profileId: string): Promise<Product[]> {
    // 1. Lire d'abord depuis IndexedDB (store-specific + GLOBAL)
    const localProducts = await db.products
        .where('store_id')
        .anyOf([profileId, 'GLOBAL'])
        .toArray();

    // 2. Si on est hors ligne, on retourne directement les données locales
    if (!navigator.onLine) {
        return localProducts.map(mapRecordToProduct);
    }

    // 3. Si on est en ligne, on tente de rafraîchir depuis Supabase
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`store_id.eq.${profileId},store_id.eq.GLOBAL`);

        if (error) {
            console.warn('[ProductService] Supabase fetch error:', error.message);
            // En cas d'erreur réseau, on se rabat sur les données locales
            return localProducts.map(mapRecordToProduct);
        }

        if (data && data.length > 0) {
            // Met à jour notre cache local (IndexedDB) avec les données fraîches
            const updatePromises = data.map(p => db.products.put({
                ...p,
                synced: 1
            }));
            await Promise.all(updatePromises);

            // Retourne les données fraîches mappées
            return data.map(mapRecordToProduct);
        }

        // Si aucune donnée sur Supabase, on retourne quand même le local
        return localProducts.map(mapRecordToProduct);

    } catch (err) {
        console.error('[ProductService] Fetch error:', err);
        // En cas d'erreur critique, on se rabat sur les données locales
        return localProducts.map(mapRecordToProduct);
    }
}

/**
 * Ajoute un nouveau produit.
 * Le sauvegarde localement et l'ajoute à la file de synchronisation.
 * @param productData Les données du produit à ajouter.
 * @param storeId L'ID du magasin.
 * @returns L'enregistrement local du produit créé.
 */
export async function addProduct(productData: Omit<Product, 'id'>, storeId: string): Promise<LocalProduct> {
    try {
        const id = crypto.randomUUID();
        const localRecord: LocalProduct = {
            id,
            name: productData.name,
            price: productData.price,
            audio_name: productData.audioName,
            category: productData.category || 'OTHER',
            barcode: productData.barcode,
            image_url: productData.imageUrl,
            color: productData.color,
            icon_color: productData.iconColor,
            store_id: storeId,
            synced: 0
        };

        await db.products.add(localRecord);
        await db.syncQueue.add({
            action: 'ADD_PRODUCT',
            payload: { ...localRecord },
            status: 'PENDING',
            retry_count: 0,
            created_at: Date.now()
        });

        window.dispatchEvent(new Event('online'));
        return localRecord;
    } catch (error) {
        console.error('[ProductService] Error adding product:', error);
        throw new Error("Erreur lors de l'ajout du produit.");
    }
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    try {
        await db.products.update(id, { ...updates, synced: 0 });
        await db.syncQueue.add({
            action: 'UPDATE_PRODUCT',
            payload: { id, ...updates },
            status: 'PENDING',
            retry_count: 0,
            created_at: Date.now()
        });
        window.dispatchEvent(new Event('online'));
    } catch (error) {
        console.error('[ProductService] Error updating product:', error);
        throw new Error("Erreur lors de la mise à jour du produit.");
    }
}

export async function deleteProduct(id: string) {
    try {
        await db.products.delete(id);
        await db.syncQueue.add({
            action: 'DELETE_PRODUCT',
            payload: { id },
            status: 'PENDING',
            retry_count: 0,
            created_at: Date.now()
        });
        window.dispatchEvent(new Event('online'));
    } catch (error) {
        console.error('[ProductService] Error deleting product:', error);
        throw new Error("Erreur lors de la suppression du produit.");
    }
}

export async function resetProductsStore(storeId: string) {
    try {
        await db.products.where('store_id').equals(storeId).delete();
    } catch (error) {
        console.error('[ProductService] Error resetting store:', error);
        throw new Error("Erreur lors de la réinitialisation du stock.");
    }
}

export async function syncGlobalCatalog() {
    if (!navigator.onLine) return;

    try {
        const { data: existingGlobal } = await supabase
            .from('products')
            .select('name')
            .eq('store_id', 'GLOBAL');

        const existingNames = new Set(existingGlobal?.map(p => p.name) || []);

        const globalProducts = initialProductsData
            .filter(p => p.id !== 'other' && !existingNames.has(p.name))
            .map(p => ({
                store_id: 'GLOBAL',
                name: p.name,
                price: p.price,
                image_url: p.imageUrl,
                color: p.color,
                icon_color: 'text-slate-600',
                audio_name: p.audioName
            }));

        if (globalProducts.length > 0) {
            const { error } = await supabase.from('products').insert(globalProducts);
            if (error) {
                throw new Error(error.message);
            }
        }
    } catch (error) {
        console.error('[ProductService] Error syncing global catalog:', error);
        throw new Error("Erreur lors de la synchronisation du catalogue global.");
    }
}

/**
 * Traite un événement temps-réel de Supabase et met à jour la base de données locale.
 * @param payload Le payload de l'événement Supabase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processRealtimeEvent(payload: any) {
    const { eventType, new: newRecord, old: oldRecord, table } = payload;
    if (table !== 'products') return;

    console.log(`[ProductService] Processing RT event: ${eventType}`);

    switch (eventType) {
        case 'INSERT':
            await db.products.put({ ...newRecord, synced: 1 });
            break;
        case 'UPDATE':
            await db.products.update(newRecord.id, { ...newRecord, synced: 1 });
            break;
        case 'DELETE':
            // L'ID est dans `old` pour un delete
            if (oldRecord && oldRecord.id) {
                await db.products.delete(oldRecord.id);
            }
            break;
        default:
            console.warn('[ProductService] Unknown realtime event type.');
            break;
    }
}
