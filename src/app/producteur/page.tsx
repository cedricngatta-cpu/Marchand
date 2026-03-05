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
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 max-w-5xl mx-auto pb-24 sm:pb-48">
            <header className="flex flex-row justify-between items-center gap-4 mb-6 sm:mb-8 pt-2 sm:pt-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none truncate">Espace Producteur</h1>
                    <p className="text-amber-600 font-bold mt-1 uppercase tracking-widest text-[9px] sm:text-xs truncate">Salut, {user?.name}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                        onClick={() => router.push('/profil')}
                        className="p-2.5 sm:p-3 h-10 sm:h-14 bg-white dark:bg-slate-900 rounded-xl sm:rounded-full shadow-sm text-slate-600 dark:text-slate-300 active:scale-95 transition-all border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0"
                    >
                        <User size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 sm:p-3 h-10 sm:h-14 bg-white dark:bg-slate-900 rounded-xl sm:rounded-full shadow-sm text-rose-500 active:scale-95 transition-all border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0"
                    >
                        <LogOut size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/stock')}
                    className="bg-amber-500 p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[110px] sm:min-h-[180px]"
                >
                    <Package size={28} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Stock</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/commandes')}
                    className="bg-blue-500 p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[110px] sm:min-h-[180px]"
                >
                    <ShoppingCart size={28} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Commandes</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/livraisons')}
                    className="bg-emerald-500 p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[110px] sm:min-h-[180px]"
                >
                    <Truck size={28} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Livraisons</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/revenus')}
                    className="bg-purple-500 p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[110px] sm:min-h-[180px]"
                >
                    <TrendingUp size={28} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Revenus</span>
                </motion.button>
            </div>

            {/* Nouveau : Publier un produit */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/producteur/publier')}
                className="w-full bg-slate-900 dark:bg-emerald-600 text-white p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] flex items-center justify-center gap-4 sm:gap-6 shadow-xl active:scale-95 transition-all"
            >
                <div className="bg-white/20 p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shrink-0">
                    <PlusSquare className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
                <div className="text-left">
                    <span className="block font-black uppercase tracking-widest text-sm sm:text-2xl leading-none">Publier un Produit</span>
                    <span className="text-[8px] sm:text-xs font-bold opacity-60 uppercase tracking-widest italic mt-1 block">Vendre ma récolte</span>
                </div>
            </motion.button>
        </main>
    );
}
