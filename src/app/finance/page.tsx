'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, ShieldCheck, TrendingUp, ChevronLeft, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FinancePage() {
    const services = [
        {
            title: "Microcrédit",
            description: "Financement pour votre stock",
            icon: Landmark,
            color: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300",
            status: "Bientôt disponible",
        },
        {
            title: "Assurance",
            description: "Protection santé et boutique",
            icon: ShieldCheck,
            color: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
            status: "En cours d'étude",
        },
        {
            title: "Score de Crédit",
            description: "Basé sur votre activité",
            icon: TrendingUp,
            color: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300",
            status: "Calcul automatique",
        }
    ];

    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-36">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex items-center gap-4 max-w-lg mx-auto mb-6">
                    <button onClick={() => router.push('/commercant')} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Services Financiers</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Développez votre activité</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-60px] relative z-10 px-4 max-w-lg mx-auto space-y-4">
                <div className="grid grid-cols-1 gap-4 mb-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl flex flex-row items-center gap-4 border border-slate-100 dark:border-slate-800 transition-shadow active:scale-[0.98] cursor-pointer"
                        >
                            <div className={`w-14 h-14 shrink-0 rounded-[18px] ${service.color} flex items-center justify-center`}>
                                <service.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none mb-1.5 truncate">{service.title}</h3>
                                <p className="text-slate-400 text-[10px] font-bold mb-2.5 uppercase tracking-wider truncate">{service.description}</p>
                                <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <Lock size={12} className="text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        {service.status}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-100 dark:border-emerald-800 p-6 rounded-[24px] mt-6">
                    <h4 className="font-black text-emerald-800 dark:text-emerald-400 mb-3 uppercase text-xs tracking-widest">Pourquoi ces services ?</h4>
                    <p className="text-emerald-700 dark:text-emerald-300 text-xs font-bold leading-relaxed">
                        Plus vous enregistrez vos ventes sur l'application, plus votre <span className="text-emerald-900 dark:text-emerald-100 bg-emerald-200 dark:bg-emerald-700 px-1.5 py-0.5 rounded-md">score de confiance</span> augmente.
                        C'est ce score qui vous permettra d'accéder aux financements sans paperasse.
                    </p>
                </div>
            </main>
        </div>
    );
}
