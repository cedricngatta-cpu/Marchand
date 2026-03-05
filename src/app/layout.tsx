import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Inclusion Marchand",
  description: "Assistant digital pour commerçants informels",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Inclusion",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

import { ConditionalAssistant } from "@/components/ConditionalAssistant";
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
import { ConnectivityIndicator } from "@/components/ConnectivityIndicator";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-emerald-100 italic-none`}>
        <AuthProvider>
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
                            <ConditionalAssistant />
                          </CartProvider>
                        </HistoryProvider>
                      </StockProvider>
                    </SyncProvider>
                  </NotificationProvider>
                </VoiceProvider>
              </ProductProvider>
            </ProfileProvider>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
