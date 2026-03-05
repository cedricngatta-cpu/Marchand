'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LogOut, UserPlus, MapPin, Activity, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgentDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-6 sm:mb-8 pt-2">
                <div>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Agent Terrain</h1>
                    <p className="text-cyan-600 font-bold mt-1 uppercase tracking-widest text-[10px] sm:text-xs truncate max-w-[200px] sm:max-w-none">Militant : {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
                    <LogOut size={20} className="sm:w-6 sm:h-6" />
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/enrolement')}
                    className="bg-cyan-500 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[120px] sm:min-h-[180px]"
                >
                    <UserPlus size={32} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Enrôlement</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/secteur')}
                    className="bg-emerald-500 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[120px] sm:min-h-[180px]"
                >
                    <MapPin size={32} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Secteur</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/activites')}
                    className="bg-rose-500 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[120px] sm:min-h-[180px]"
                >
                    <Activity size={32} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Activités</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/conformite')}
                    className="bg-amber-500 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] text-white flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-xl active:scale-95 transition-all min-h-[120px] sm:min-h-[180px]"
                >
                    <ShieldCheck size={32} className="sm:w-12 sm:h-12" />
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xl text-center">Conformité</span>
                </motion.button>
            </div>
        </main>
    );
}
