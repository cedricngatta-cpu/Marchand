'use client';

import React from 'react';
import { Home, History, User, BookOpen } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export const BottomNav = () => {
    const router = useRouter();
    const pathname = usePathname();

    const hideOnPaths = ['/login', '/signup', '/auth', '/', '/commercant'];
    if (hideOnPaths.includes(pathname)) return null;

    const tabs = [
        { id: 'home', label: 'Accueil', icon: Home, path: '/commercant' },
        { id: 'journal', label: 'Journal', icon: History, path: '/bilan' },
        { id: 'carnet', label: 'Carnet', icon: BookOpen, path: '/carnet' },
        { id: 'profil', label: 'Profil', icon: User, path: '/profil' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-[90] pb-safe md:max-w-2xl md:mx-auto md:mb-6 md:rounded-[32px] md:shadow-2xl md:border-2">
            {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                    <button
                        key={tab.id}
                        onClick={() => router.push(tab.path)}
                        className="flex flex-col items-center gap-1 relative focus:outline-none"
                    >
                        <div className={`p-1.5 md:p-2 rounded-2xl transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <tab.icon size={24} className="md:w-7 md:h-7" strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-tighter ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {tab.label}
                        </span>

                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute -top-3 w-1.5 h-1.5 bg-emerald-600 rounded-full"
                            />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};
