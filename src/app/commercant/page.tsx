'use client';

import React, { useState } from 'react';
import {
    PlusCircle,
    ShoppingBag,
    User,
    Bell,
    TrendingUp,
    Package,
    Scan,
    Store,
    BookOpen,
    PieChart,
    PlayCircle,
    Landmark,
    BrainCircuit
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationModal } from '@/components/NotificationModal';
import AdviceModal from '@/components/AdviceModal';
import { useHistory } from '@/hooks/useHistory';
import { useAssistant } from '@/hooks/useAssistant';
import { useVoice } from '@/hooks/useVoice';
import { useSync } from '@/context/SyncContext';
import { WifiOff } from 'lucide-react';

export default function CommercantDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { speak } = useVoice();
    const { balance } = useHistory();
    const { unreadCount } = useNotifications();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isAdviceOpen, setIsAdviceOpen] = useState(false);
    const { isOnline } = useSync();

    const menuItems = [
        { id: 'vendre', name: 'Vendre', icon: ShoppingBag, color: 'bg-emerald-500', path: '/vendre' },
        { id: 'marche', name: 'Marché', icon: Store, color: 'bg-indigo-500', path: '/approvisionnement' },
        { id: 'acheter', name: 'Ajouter', icon: PlusCircle, color: 'bg-blue-500', path: '/acheter' },
        { id: 'carnet', name: 'Carnet', icon: BookOpen, color: 'bg-rose-500', path: '/carnet' },
        { id: 'stock', name: 'Stock', icon: Package, color: 'bg-amber-500', path: '/stock' },
        { id: 'bilan', name: 'Bilan', icon: PieChart, color: 'bg-purple-500', path: '/bilan' },
        { id: 'finance', name: 'Crédit', icon: Landmark, color: 'bg-violet-600', path: '/finance' },
        { id: 'conseils', name: 'Conseils IA', icon: BrainCircuit, color: 'bg-indigo-600', path: '/conseils' },
        { id: 'formation', name: 'Aide', icon: PlayCircle, color: 'bg-cyan-500', path: '/formation' },
    ];

    const toggleNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            speak(`Kouamé, tu as ${unreadCount} nouveaux messages.`);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 md:pb-32 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 md:mb-8 pt-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/profil')}
                        className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-transform shrink-0"
                    >
                        <Store size={24} className="md:w-7 md:h-7" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none truncate">{user?.name || 'KOUAMÉ'}</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 italic">Boutique Ouverte</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button
                        onClick={() => setIsAdviceOpen(true)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
                    >
                        <TrendingUp size={20} className="md:w-6 md:h-6" />
                    </button>
                    <button
                        onClick={toggleNotifications}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 relative transition-transform active:scale-95"
                    >
                        <Bell size={20} className="md:w-6 md:h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-rose-500 text-white text-[9px] md:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Carte Caisse */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => speak(`Tu as ${balance} francs dans ta caisse.`)}
                className="bg-emerald-600 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-xl shadow-emerald-100 dark:shadow-none mb-8 md:mb-10 relative overflow-hidden cursor-pointer"
            >
                <div className="relative z-10">
                    <span className="text-emerald-100 font-black text-xs md:text-sm uppercase tracking-widest">Ma Caisse Aujourd'hui</span>
                    <div className="text-4xl md:text-7xl font-black tracking-tighter mt-1">{balance} <span className="text-xl md:text-2xl opacity-80">F</span></div>
                </div>
                <TrendingUp size={120} className="md:w-[160px] md:h-[160px] absolute -right-6 -bottom-6 md:-right-8 md:-bottom-8 text-white/10 rotate-12" />
            </motion.section>

            {/* Grille Menu */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {menuItems.map((item) => {
                    const requiresOnline = ['marche', 'conseils'].includes(item.id);
                    const isDisabled = requiresOnline && !isOnline;

                    return (
                        <motion.button
                            key={item.id}
                            whileTap={isDisabled ? {} : { scale: 0.95 }}
                            onClick={() => {
                                if (isDisabled) {
                                    speak(`${item.name} nécessite une connexion internet.`);
                                    return;
                                }
                                router.push(item.path);
                            }}
                            className={`${isDisabled ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed' : item.color} p-5 md:p-8 rounded-[28px] md:rounded-[35px] text-white flex flex-col items-center justify-center gap-3 md:gap-4 shadow-xl shadow-slate-200 dark:shadow-none transition-all border-b-4 border-black/10 min-h-[140px] md:min-h-[180px] relative`}
                        >
                            {!isOnline && requiresOnline && (
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-slate-900/40 p-1.5 rounded-full text-white/80">
                                    <WifiOff size={14} />
                                </div>
                            )}
                            <div className={`${isDisabled ? 'bg-slate-400/20 text-slate-400' : 'bg-white/20'} p-3 md:p-4 rounded-xl md:rounded-2xl`}>
                                <item.icon size={28} className="md:w-9 md:h-9 md:scale-125" />
                            </div>
                            <span className={`font-black uppercase tracking-widest text-[11px] md:text-lg text-center leading-tight ${isDisabled ? 'text-slate-400' : 'text-white'}`}>{item.name}</span>
                        </motion.button>
                    );
                })}

                {/* Scanner - Full width on small screens if odd items, but here we have 9 items so keep grid consistent */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/scanner')}
                    className="col-span-2 md:col-span-1 bg-slate-900 p-5 md:p-8 rounded-[28px] md:rounded-[35px] text-white flex sm:flex-col items-center justify-center gap-4 md:gap-6 shadow-xl min-h-[80px] sm:min-h-[140px] md:min-h-[180px]"
                >
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl">
                        <Scan size={28} className="md:w-9 md:h-9 md:scale-125" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm md:text-lg">Scanner</span>
                </motion.button>
            </div>

            {/* Section Conseil IA */}
            <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`rounded-[32px] md:rounded-[40px] p-8 md:p-12 border-2 shadow-sm relative overflow-hidden mb-8 transition-colors ${!isOnline ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
            >
                <div className="relative z-10 max-w-2xl text-center sm:text-left">
                    <div className={`flex items-center justify-center sm:justify-start gap-3 mb-4`}>
                        <div className={`p-2 rounded-xl ${!isOnline ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                            {isOnline ? <TrendingUp size={24} /> : <WifiOff size={24} />}
                        </div>
                        <h2 className="font-black uppercase text-slate-400 tracking-widest text-[10px] md:text-xs">Conseil du Coach</h2>
                    </div>
                    <p className={`text-lg md:text-3xl font-bold leading-tight mb-6 md:mb-8 ${!isOnline ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                        {isOnline ? '"Kouamé, j\'ai analysé tes ventes. Tu as un conseil pour booster ton commerce !"' : '"Kouamé, reconnecte-toi à internet pour recevoir ton analyse quotidienne."'}
                    </p>
                    <button
                        onClick={() => {
                            if (!isOnline) {
                                speak("Les conseils IA nécessitent une connexion internet.");
                                return;
                            }
                            setIsAdviceOpen(true);
                        }}
                        disabled={!isOnline}
                        className={`w-full sm:w-auto px-8 py-4 md:py-5 rounded-2xl md:rounded-[25px] font-black uppercase text-xs md:text-sm tracking-widest transition-all border-b-4 ${!isOnline ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 border-slate-400 dark:border-slate-700 cursor-not-allowed' : 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20 active:scale-95 border-amber-600'}`}
                    >
                        {isOnline ? 'Voir le conseil' : 'Hors-ligne'}
                    </button>
                </div>
                {isOnline && <TrendingUp size={160} className="md:w-[200px] md:h-[200px] absolute -right-8 -bottom-8 md:-right-12 md:-bottom-12 text-slate-50 dark:text-slate-800/50 rotate-12 hidden sm:block" />}
            </motion.section>


            <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
            <AdviceModal isOpen={isAdviceOpen} onClose={() => setIsAdviceOpen(false)} />
        </main>
    );
}
