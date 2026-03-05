'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Package, ShoppingCart, TrendingUp, Truck, PlusSquare, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProducteurDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-5xl mx-auto pb-32 md:pb-48">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pt-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Espace Producteur</h1>
                    <p className="text-amber-600 font-bold mt-2 sm:mt-1 uppercase tracking-widest text-[10px] sm:text-xs">Bienvenue, {user?.name}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => router.push('/profil')}
                        className="flex-1 sm:flex-none p-3 h-12 md:h-14 bg-white dark:bg-slate-900 rounded-2xl md:rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center"
                    >
                        <User size={24} />
                        <span className="sm:hidden ml-2 font-black uppercase text-xs">Profil</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 sm:flex-none p-3 h-12 md:h-14 bg-white dark:bg-slate-900 rounded-2xl md:rounded-full shadow-sm text-rose-500 hover:bg-rose-50 transition-colors border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center"
                    >
                        <LogOut size={24} />
                        <span className="sm:hidden ml-2 font-black uppercase text-xs">Quitter</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/stock')}
                    className="bg-amber-500 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 md:gap-4 shadow-xl shadow-amber-200 dark:shadow-none relative overflow-hidden min-h-[140px] md:min-h-[180px]"
                >
                    <Package className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="font-black uppercase tracking-widest text-xs md:text-xl text-center">Mon Stock</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/commandes')}
                    className="bg-blue-500 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 md:gap-4 shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden min-h-[140px] md:min-h-[180px]"
                >
                    <ShoppingCart className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="font-black uppercase tracking-widest text-xs md:text-xl text-center">Commandes</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/livraisons')}
                    className="bg-emerald-500 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 md:gap-4 shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden min-h-[140px] md:min-h-[180px]"
                >
                    <Truck className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="font-black uppercase tracking-widest text-xs md:text-xl text-center">Livraisons</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/revenus')}
                    className="bg-purple-500 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 md:gap-4 shadow-xl shadow-purple-200 dark:shadow-none relative overflow-hidden min-h-[140px] md:min-h-[180px]"
                >
                    <TrendingUp className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="font-black uppercase tracking-widest text-xs md:text-xl text-center">Revenus</span>
                </motion.button>
            </div>

            {/* Nouveau : Publier un produit */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/producteur/publier')}
                className="w-full bg-slate-900 dark:bg-emerald-600 text-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] flex items-center justify-center gap-4 md:gap-6 shadow-2xl active:scale-95 transition-all"
            >
                <div className="bg-white/20 p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0">
                    <PlusSquare className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div className="text-left">
                    <span className="block font-black uppercase tracking-widest text-lg md:text-2xl leading-none">Publier un Produit</span>
                    <span className="text-[10px] md:text-xs font-bold opacity-60 uppercase tracking-widest italic mt-1 block">Vendre ma récolte</span>
                </div>
            </motion.button>
        </main>
    );
}
