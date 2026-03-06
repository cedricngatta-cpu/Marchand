'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts } from '../data/products';
import { Package, LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from './ProfileContext';
import { db, LocalProduct } from '@/lib/db';

export interface Product {
    id: string;
    name: string;
    icon: LucideIcon;
    imageUrl?: string;
    barcode?: string;
    price: number;
    color: string;
    iconColor: string;
    status?: string;
    audioName: string;
    category?: string;
}

interface ProductContextType {
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>, storeId?: string) => Promise<void>;
    syncGlobalCatalog: () => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    resetProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeProfile } = useProfileContext();
    const [products, setProducts] = useState<Product[]>([]);

    const fetchProducts = async () => {
        if (!activeProfile) return;

        // 1. Lire d'abord depuis IndexedDB (store-specific + GLOBAL)
        const localProducts = await db.products
            .where('store_id')
            .anyOf([activeProfile.id, 'GLOBAL'])
            .toArray();

        if (localProducts.length > 0) {
            const mapped: Product[] = localProducts.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                imageUrl: p.image_url,
                barcode: p.barcode,
                color: p.color,
                iconColor: p.icon_color,
                audioName: p.audio_name,
                category: p.category,
                icon: initialProducts.find(ip => ip.name === p.name)?.icon || Package
            }));
            setProducts(mapped);
        }

        // 2. Refresh depuis Supabase si online
        if (navigator.onLine) {
            try {
                // Récupérer les produits du store + les produits GLOBAL
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .or(`store_id.eq.${activeProfile.id},store_id.eq.GLOBAL`);

                if (error) {
                    console.warn('[ProductContext] Supabase fetch error:', error.message);
                    return;
                }

                if (data && data.length > 0) {
                    for (const p of data) {
                        await db.products.put({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image_url: p.image_url,
                            barcode: p.barcode,
                            color: p.color || '#F1F5F9',
                            icon_color: p.icon_color || '#64748B',
                            audio_name: p.audio_name || p.name,
                            store_id: p.store_id,
                            category: p.category || 'OTHER',
                            synced: 1
                        });
                    }

                    // Re-fetch local data after update (store + GLOBAL)
                    const updatedLocal = await db.products
                        .where('store_id')
                        .anyOf([activeProfile.id, 'GLOBAL'])
                        .toArray();

                    const mapped: Product[] = updatedLocal.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        imageUrl: p.image_url,
                        barcode: p.barcode,
                        color: p.color,
                        iconColor: p.icon_color,
                        audioName: p.audio_name,
                        category: p.category,
                        icon: initialProducts.find(ip => ip.name === p.name)?.icon || Package
                    }));
                    setProducts(mapped);
                } else if (data && data.length === 0 && localProducts.length === 0) {
                    await seedCatalog();
                }
            } catch (err) {
                console.error('[ProductContext] Fetch error:', err);
            }
        }
    };

    const seedCatalog = async () => {
        if (!activeProfile) return;

        const standardProducts = initialProducts
            .filter(p => p.id !== 'other') // On ignore l'item 'autre' pour le catalogue réel
            .map(p => ({
                store_id: activeProfile.id,
                name: p.name,
                price: p.price,
                image_url: p.imageUrl,
                color: p.color,
                icon_color: 'text-slate-600', // valeur par défaut
                audio_name: p.audioName
            }));

        const { error } = await supabase.from('products').insert(standardProducts);

        if (error) {
            console.error("seedCatalog error details:", error);
            // Si l'erreur est liée à une colonne manquante (comme image_url ou barcode),
            // on pourrait essayer une version dégradée, mais le SQL doit être à jour.
        } else {
            console.log("seedCatalog success!");

            // Refetch une seule fois pour mettre à jour l'UI
            const { data } = await supabase.from('products').select('*').or(`store_id.eq.${activeProfile.id},store_id.eq.GLOBAL`);
            if (data && data.length > 0) {
                const mapped = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    imageUrl: p.image_url,
                    barcode: p.barcode,
                    color: p.color || '#F1F5F9',
                    iconColor: p.icon_color || '#64748B',
                    audioName: p.audio_name || p.name,
                    category: p.category || 'OTHER',
                    icon: initialProducts.find(ip => ip.name === p.name)?.icon || Package
                }));
                setProducts(mapped);
            }
        }
    };

    useEffect(() => {
        if (activeProfile) {
            fetchProducts();
        } else {
            setProducts([]);
        }
    }, [activeProfile]);

    const syncGlobalCatalog = async () => {
        if (!navigator.onLine) return;

        // On récupère les IDs déjà présents en GLOBAL pour éviter les doublons
        const { data: existingGlobal } = await supabase
            .from('products')
            .select('name')
            .eq('store_id', 'GLOBAL');

        const existingNames = new Set(existingGlobal?.map(p => p.name) || []);

        const globalProducts = initialProducts
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
            if (!error) {
                console.log("Global catalog updated!");
                await fetchProducts();
            }
        }
    };

    const addProduct = async (product: Omit<Product, 'id'>, storeId?: string) => {
        if (!activeProfile && !storeId) return;

        const targetStoreId = storeId || activeProfile!.id;
        const id = crypto.randomUUID();
        const localRecord: LocalProduct = {
            id,
            name: product.name,
            price: product.price,
            audio_name: product.audioName,
            category: 'OTHER',
            barcode: product.barcode,
            image_url: product.imageUrl,
            color: product.color,
            icon_color: product.iconColor,
            store_id: targetStoreId,
            synced: 0
        };

        // 1. Sauvegarde locale
        await db.products.add(localRecord);

        // 2. Queue sync
        await db.syncQueue.add({
            action: 'ADD_PRODUCT',
            payload: {
                id,
                store_id: targetStoreId,
                name: product.name,
                price: product.price,
                color: product.color,
                icon_color: product.iconColor,
                audio_name: product.audioName,
                image_url: product.imageUrl,
                barcode: product.barcode,
                category: product.category || 'OTHER'
            },
            status: 'PENDING',
            created_at: Date.now()
        });

        await fetchProducts();

        if (navigator.onLine) {
            window.dispatchEvent(new Event('online'));
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        // En vrai: update local + queue
        await db.products.update(id, {
            name: updates.name,
            price: updates.price,
            audio_name: updates.audioName,
            barcode: updates.barcode,
            image_url: updates.imageUrl,
            color: updates.color,
            icon_color: updates.iconColor,
            synced: 0
        });

        await db.syncQueue.add({
            action: 'UPDATE_PRODUCT',
            payload: { id, ...updates },
            status: 'PENDING',
            created_at: Date.now()
        });

        await fetchProducts();
    };

    const deleteProduct = async (id: string) => {
        await db.products.delete(id);
        await db.syncQueue.add({
            action: 'DELETE_PRODUCT',
            payload: { id },
            status: 'PENDING',
            created_at: Date.now()
        });
        await fetchProducts();
    };

    const resetProducts = async () => {
        if (!activeProfile) return;
        await db.products.where('store_id').equals(activeProfile.id).delete();
        await fetchProducts();
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            syncGlobalCatalog,
            updateProduct,
            deleteProduct,
            resetProducts
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProductContext = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProductContext must be used within a ProductProvider');
    }
    return context;
};
