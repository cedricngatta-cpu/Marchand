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
import { ErrorProvider } from '@/context/ErrorContext';
import { ErrorToast } from './ErrorToast';

export function AppProviders({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <ErrorProvider>
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
                                                        <ErrorToast />
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
        </ErrorProvider>
    );
}
