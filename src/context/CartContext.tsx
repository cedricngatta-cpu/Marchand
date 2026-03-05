'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CartItem {
    id: string;
    name: string;
    imageUrl?: string;
    price: number;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: { id: string; name: string; price: number; imageUrl?: string }, quantity?: number) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    const addItem = useCallback((product: { id: string; name: string; price: number; imageUrl?: string }, quantity: number = 1) => {
        setItems(current => {
            const existing = current.find(i => i.id === product.id);
            if (existing) {
                return current.map(i =>
                    i.id === product.id ? { ...i, quantity: i.quantity + quantity, price: product.price } : i
                );
            }
            return [...current, { ...product, quantity }];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(current => current.filter(i => i.id !== id));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
};
