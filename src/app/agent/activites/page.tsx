'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgentActivities() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col">
            <header className="flex items-center gap-4 mb-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Activités</h1>
                    <p className="text-rose-600 font-bold text-[10px] uppercase tracking-widest mt-1">Historique des actions</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="p-10 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full">
                    <Activity size={64} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Bientôt disponible</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cette section est en cours de développement.</p>
                </div>
            </div>
        </main>
    );
}
