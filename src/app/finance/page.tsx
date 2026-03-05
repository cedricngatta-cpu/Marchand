'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, ShieldCheck, TrendingUp, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export default function FinancePage() {
    const services = [
        {
            title: "Microcrédit",
            description: "Financement pour votre stock",
            icon: Landmark,
            color: "bg-purple-100 text-purple-600",
            status: "Bientôt disponible",
            accent: "border-purple-200"
        },
        {
            title: "Assurance",
            description: "Protection santé et boutique",
            icon: ShieldCheck,
            color: "bg-blue-100 text-blue-600",
            status: "En cours d'étude",
            accent: "border-blue-200"
        },
        {
            title: "Score de Crédit",
            description: "Basé sur votre activité",
            icon: TrendingUp,
            color: "bg-emerald-100 text-emerald-600",
            status: "Calcul automatique",
            accent: "border-emerald-200"
        }
    ];

    return (
        <main className="min-h-screen bg-slate-50 pb-16 max-w-5xl mx-auto">
            <div className="bg-emerald-600 text-white p-4 md:p-10 rounded-b-[2rem] md:rounded-b-[4rem] shadow-lg">
                <Link href="/commercant" className="mb-2 md:mb-6 inline-block">
                    <ArrowLeft className="w-5 h-5 md:w-8 md:h-8 active:scale-90 transition-transform" />
                </Link>
                <h1 className="text-xl md:text-4xl font-black mb-0.5 md:mb-2 uppercase tracking-tighter">Services Financiers</h1>
                <p className="opacity-90 font-bold text-[9px] md:text-sm uppercase tracking-widest">Développez votre activité avec nos partenaires</p>
            </div>

            <div className="px-4 md:px-8 -mt-6 md:-mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-sm border-2 ${service.accent} flex flex-row items-center gap-3 hover:shadow-md transition-shadow cursor-pointer`}
                        >
                            <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl ${service.color} flex items-center justify-center`}>
                                <service.icon className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm md:text-xl font-black text-slate-800 uppercase leading-none mb-1 truncate">{service.title}</h3>
                                <p className="text-slate-500 text-[9px] md:text-xs font-bold mb-1.5 md:mb-3 uppercase tracking-wider truncate">{service.description}</p>
                                <div className="inline-flex items-center gap-1.5 md:gap-2 bg-slate-100 px-2 py-0.5 md:px-3 py-1 md:py-1.5 rounded-full">
                                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-[7px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                        {service.status}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-emerald-100/50 border-2 border-emerald-200 p-6 md:p-8 rounded-[24px] md:rounded-3xl">
                    <h4 className="font-black text-emerald-800 mb-2 md:mb-3 uppercase text-sm md:text-base tracking-widest">Pourquoi ces services ?</h4>
                    <p className="text-emerald-700 text-xs md:text-sm font-bold leading-relaxed">
                        Plus vous enregistrez vos ventes sur l'application, plus votre <span className="text-emerald-900 bg-emerald-200 px-1 rounded">score de confiance</span> augmente.
                        C'est ce score qui vous permettra d'accéder aux financements sans paperasse.
                    </p>
                </div>
            </div>
        </main>
    );
}
