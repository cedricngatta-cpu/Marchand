'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { useSync } from '@/context/SyncContext';
import { usePathname } from 'next/navigation';

export const ConnectivityIndicator: React.FC = () => {
    const { isOnline, isSyncing, syncPendingCount } = useSync();
    const pathname = usePathname();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const hiddenPaths = ['/', '/login', '/signup'];

    if (!mounted || hiddenPaths.includes(pathname)) return null;

    return (
        <AnimatePresence mode="wait">
            {!isOnline && (
                <motion.div
                    key="offline-banner"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-0 right-0 z-[100] mx-4 max-w-lg md:mx-auto"
                >
                    <div className="bg-rose-600 text-white p-5 rounded-[28px] shadow-2xl flex items-center justify-between border-2 border-rose-500">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2.5 rounded-2xl shadow-inner">
                                <WifiOff size={24} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tighter text-sm leading-none">Mode Hors-Ligne</h4>
                                <p className="text-[9px] font-bold text-rose-100 uppercase tracking-widest mt-1.5 opacity-80">Ventes et Stock 100% locaux (Sauvegarde locale)</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
