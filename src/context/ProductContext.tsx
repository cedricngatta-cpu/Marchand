'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { products as initialProducts } from '../data/products';
import { Package, LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from './ProfileContext';
import { useError } from './ErrorContext';
import {
    getProductsForProfile,
    syncProductsFromServer,
    addProduct as addProductService,
    updateProduct as updateProductService,
    deleteProduct as deleteProductService,
    resetProductsStore,
    processRealtimeEvent,
    mapRecordToProduct
} from '@/services/product.service';
import { Product } from '@/types/product';

interface ProductContextType {
    products: Product[];
    isLoading: boolean;
    addProduct: (product: Omit<Product, 'id'>, storeId?: string) => Promise<boolean>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
    deleteProduct: (id: string) => Promise<boolean>;
    resetProducts: () => Promise<boolean>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { activeProfile } = useProfileContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addError } = useError();


    const fetchProducts = useCallback(async () => {
        if (!activeProfile) return;
        setIsLoading(true);
        try {
            // 1. Synchronisation Catch-up avec Supabase (insère proprement dans IndexedDB)
            await syncProductsFromServer(activeProfile.id);

            // 2. Affiche à partir de la source de vérité locale qui vient d'être mise à jour
            const productsFromService = await getProductsForProfile(activeProfile.id);
            setProducts(productsFromService);
        } catch {
            addError("Impossible de charger les produits.");
        } finally {
            setIsLoading(false);
        }
    }, [activeProfile, addError]);

    useEffect(() => {
        if (!activeProfile) {
            setProducts([]);
            return;
        }

        fetchProducts();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRealtimeUpdate = async (payload: any) => {
            await processRealtimeEvent(payload);
            const { eventType, new: newRecord, old: oldRecord } = payload;
            switch (eventType) {
                case 'INSERT':
                    setProducts(prev => [...prev.filter(p => p.id !== newRecord.id), mapRecordToProduct(newRecord)]);
                    break;
                case 'UPDATE':
                    setProducts(prev => prev.map(p => p.id === newRecord.id ? mapRecordToProduct(newRecord) : p));
                    break;
                case 'DELETE':
                    if (oldRecord && oldRecord.id) {
                        setProducts(prev => prev.filter(p => p.id !== oldRecord.id));
                    }
                    break;
                default:
                    fetchProducts();
                    break;
            }
        };

        const subscription = supabase
            .channel(`product_changes_${activeProfile.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=in.(${activeProfile.id},GLOBAL)` }, handleRealtimeUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription).catch(console.error);
        };
    }, [activeProfile, fetchProducts, mapRecordToProduct]);

    const addProduct = async (product: Omit<Product, 'id'>, storeId?: string): Promise<boolean> => {
        if (!activeProfile && !storeId) return false;
        const targetStoreId = storeId || activeProfile!.id;
        const tempId = crypto.randomUUID();
        const newProductForUI: Product = { id: tempId, ...product, icon: initialProducts.find(ip => ip.name === product.name)?.icon || Package };
        setProducts(prev => [...prev, newProductForUI]);
        try {
            await addProductService(product, targetStoreId);
            return true;
        } catch (error) {
            addError((error as Error).message || "Impossible d'ajouter le produit.");
            setProducts(prev => prev.filter(p => p.id !== tempId));
            return false;
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
        const originalProducts = products;
        const productToUpdate = originalProducts.find(p => p.id === id);
        if (!productToUpdate) return false;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        try {
            await updateProductService(id, updates);
            return true;
        } catch (error) {
            addError((error as Error).message || "Impossible de mettre à jour le produit.");
            setProducts(originalProducts);
            return false;
        }
    };

    const deleteProduct = async (id: string): Promise<boolean> => {
        const originalProducts = products;
        setProducts(prev => prev.filter(p => p.id !== id));
        try {
            await deleteProductService(id);
            return true;
        } catch (error) {
            addError((error as Error).message || "Impossible de supprimer le produit.");
            setProducts(originalProducts);
            return false;
        }
    };

    const resetProducts = async (): Promise<boolean> => {
        if (!activeProfile) return false;
        const originalProducts = products;
        setProducts(products.filter(p => p.category === 'GLOBAL'));
        try {
            await resetProductsStore(activeProfile.id);
            return true;
        } catch (error) {
            addError((error as Error).message || "La réinitialisation a échoué.");
            setProducts(originalProducts);
            return false;
        }
    };

    return (
        <ProductContext.Provider value={{ products, isLoading, addProduct, updateProduct, deleteProduct, resetProducts }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProductContext = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProductContext must be used within a ProductProvider');
    }
    return context;
};
