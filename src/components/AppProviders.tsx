'use client';

import React from 'react';
import { ConnectivityIndicator } from "@/components/ConnectivityIndicator";
import { StockProvider } from "@/context/StockContext";
import { CartProvider } from "@/context/CartContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { ProductProvider } from "@/context/ProductContext";
import { ProfileProvider } from '@/context/ProfileContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NotificationProvider } from "@/context/NotificationContext";
import { SyncProvider } from "@/context/SyncContext";
import { ConfirmProvider } from '@/context/ConfirmContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ConfirmProvider>
                <ProtectedRoute>
                    <ProfileProvider>
                        <ProductProvider>
                            <VoiceProvider>
                                <NotificationProvider>
                                    <SyncProvider>
                                        <ConnectivityIndicator />
                                        <StockProvider>
                                            <HistoryProvider>
                                                <CartProvider>
                                                    {children}
                                                </CartProvider>
                                            </HistoryProvider>
                                        </StockProvider>
                                    </SyncProvider>
                                </NotificationProvider>
                            </VoiceProvider>
                        </ProductProvider>
                    </ProfileProvider>
                </ProtectedRoute>
            </ConfirmProvider>
        </AuthProvider>
    );
}
