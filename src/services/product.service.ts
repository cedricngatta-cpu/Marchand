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
    // C'est notre source de vérité.
    const localProducts = await db.products
        .where('store_id')
        .anyOf([profileId, 'GLOBAL'])
        .toArray();

    return localProducts.map(mapRecordToProduct);
}

/**
 * Mappe un enregistrement Supabase brut vers un enregistrement propre pour LocalProduct (IndexedDB).
 * Gère spécifiquement le problème de Supabase renvoyant `null` pour les champs optionnels
 * que IndexedDB déteste s'ils sont indexés (ex: barcode).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseToLocalProduct(p: any): LocalProduct {
    const localP: LocalProduct = {
        id: p.id,
        name: p.name,
        price: p.price,
        audio_name: p.audio_name || '',
        category: p.category || 'OTHER',
        color: p.color || 'bg-blue-500',
        icon_color: p.icon_color || 'text-white',
        store_id: p.store_id,
        synced: 1
    };

    // IMPORTANT: IndexedDB refuse la valeur "null" pour un champ indexé (ex: barcode).
    if (p.barcode) localP.barcode = p.barcode;
    if (p.image_url) localP.image_url = p.image_url;

    return localP;
}

/**
 * Synchronise les produits depuis Supabase vers IndexedDB (Catch-up Sync).
 * À appeler à l'initialisation de l'app ou au retour en ligne.
 */
export async function syncProductsFromServer(profileId: string): Promise<void> {
    if (!navigator.onLine) return;

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`store_id.eq.${profileId},store_id.eq.GLOBAL`);

        if (error) {
            console.warn('[ProductService] syncProductsFromServer error:', error.message);
            return;
        }

        if (data && data.length > 0) {
            const localProductsToPut: LocalProduct[] = data.map(mapSupabaseToLocalProduct);

            // Utiliser bulkPut pour des performances maximales et une mise à jour d'un coup
            await db.products.bulkPut(localProductsToPut);
            console.log(`[ProductService] Sycnhronisation réussie: ${data.length} produits mis à jour.`);
        }
    } catch (err) {
        console.error('[ProductService] Critical error during syncProductsFromServer:', err);
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
        // 1. Génération d'un UUID v4 robuste côté client
        const id = crypto.randomUUID();
        if (!id || id.length < 36) throw new Error("Erreur fatale: Impossible de générer un ID unique.");

        const localRecord: LocalProduct = {
            id,
            name: productData.name,
            price: productData.price,
            audio_name: productData.audioName,
            category: productData.category || 'OTHER',
            color: productData.color,
            icon_color: productData.iconColor,
            store_id: storeId,
            synced: 0
        };

        if (productData.barcode) localRecord.barcode = productData.barcode;
        if (productData.imageUrl) localRecord.image_url = productData.imageUrl;

        await db.products.add(localRecord);
        await db.syncQueue.add({
            action: 'ADD_PRODUCT',
            payload: { ...localRecord },
            status: 'PENDING',
            retry_count: 0,
            created_at: Date.now()
        });

        console.log(`[Product] Produit créé localement avec ID UUID: ${id}`);

        window.dispatchEvent(new Event('online'));
        return localRecord;
    } catch (error) {
        console.error('[ProductService] Error adding product:', error);
        throw new Error("Erreur lors de l'ajout du produit.");
    }
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    try {
        // Formater les updates pour eviter undefined/null si possible ou les mapper
        // Ceci dit l'update Dexie supporte un partial de l'objet
        const localUpdates: Partial<LocalProduct> = { synced: 0 };
        if (updates.name !== undefined) localUpdates.name = updates.name;
        if (updates.price !== undefined) localUpdates.price = updates.price;
        if (updates.audioName !== undefined) localUpdates.audio_name = updates.audioName;
        if (updates.category !== undefined) localUpdates.category = updates.category;
        if (updates.barcode !== undefined) localUpdates.barcode = updates.barcode || undefined;
        if (updates.imageUrl !== undefined) localUpdates.image_url = updates.imageUrl || undefined;
        if (updates.color !== undefined) localUpdates.color = updates.color;
        if (updates.iconColor !== undefined) localUpdates.icon_color = updates.iconColor;

        await db.products.update(id, localUpdates);
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
        case 'UPDATE':
            const localP = mapSupabaseToLocalProduct(newRecord);
            await db.products.put(localP);
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
