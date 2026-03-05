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
                    className="fixed bottom-[72px] md:bottom-24 left-0 right-0 z-[100] mx-4 md:max-w-md md:mx-auto"
                >
                    <div className="bg-rose-600 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border-4 border-rose-500/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <WifiOff size={24} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight text-sm leading-none">Mode Hors-Ligne</h4>
                                <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest mt-0.5">Ventes et Stock 100% locaux</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {isOnline && (isSyncing || syncPendingCount > 0) && (
                <motion.div
                    key="sync-status"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed bottom-[90px] md:bottom-32 right-6 md:right-8 z-[100] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
                >
                    <RefreshCw size={14} className={`text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isSyncing ? 'Synchro...' : `${syncPendingCount} en attente`}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
