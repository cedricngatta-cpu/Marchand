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
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Agent Terrain</h1>
                    <p className="text-cyan-600 font-bold mt-1 uppercase tracking-widest text-xs">Militant de l'inclusion : {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-rose-500 hover:bg-rose-50 transition-colors">
                    <LogOut size={24} />
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/enrolement')}
                    className="bg-cyan-500 p-8 rounded-[32px] text-white flex flex-col items-center gap-4 shadow-xl shadow-cyan-200 dark:shadow-none relative overflow-hidden"
                >
                    <UserPlus size={48} />
                    <span className="font-black uppercase tracking-widest text-xl">Nouveau Marchand</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/secteur')}
                    className="bg-emerald-500 p-8 rounded-[32px] text-white flex flex-col items-center gap-4 shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden"
                >
                    <MapPin size={48} />
                    <span className="font-black uppercase tracking-widest text-xl">Mon Secteur</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/activites')}
                    className="bg-rose-500 p-8 rounded-[32px] text-white flex flex-col items-center gap-4 shadow-xl shadow-rose-200 dark:shadow-none relative overflow-hidden"
                >
                    <Activity size={48} />
                    <span className="font-black uppercase tracking-widest text-xl">Activités</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/agent/conformite')}
                    className="bg-amber-500 p-8 rounded-[32px] text-white flex flex-col items-center gap-4 shadow-xl shadow-amber-200 dark:shadow-none relative overflow-hidden"
                >
                    <ShieldCheck size={48} />
                    <span className="font-black uppercase tracking-widest text-xl">Conformité</span>
                </motion.button>
            </div>
        </main>
    );
}
