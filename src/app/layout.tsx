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
import { AppProviders } from '@/components/AppProviders';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-emerald-100 italic-none`}>
        <AppProviders>
          <ErrorBoundary>
            {children}
            <ConditionalAssistant />
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
