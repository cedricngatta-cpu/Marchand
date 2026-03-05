'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, User, Phone, DollarSign, CheckCircle2, Mic, Volume2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAssistant } from '@/hooks/useAssistant';
import { useHistory } from '@/hooks/useHistory';
import { Transaction } from '@/context/HistoryContext';
import { useAuth } from '@/context/AuthContext';

export default function CarnetPage() {
    const router = useRouter();
    const { speak, handleAction, isSpeaking, isListening } = useAssistant();
    const { history, markAsPaid, markAllAsPaid } = useHistory();
    const { user } = useAuth();
    const name = user?.name?.split(' ')[0] || 'Marchand';
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<string | null>(null);

    // Grouper les dettes par client
    const debtsByClient = history.reduce((acc, t) => {
        if (t.status === 'DETTE') {
            const name = t.clientName || 'CLIENT INCONNU';
            const key = name.toUpperCase();
            if (!acc[key]) acc[key] = { name: name, total: 0, transactions: [] };
            acc[key].total += t.price;
            acc[key].transactions.push(t);
        }
        return acc;
    }, {} as Record<string, { name: string, total: number, transactions: Transaction[] }>);

    const clientKeys = Object.keys(debtsByClient).filter(key =>
        debtsByClient[key].name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSettle = (transactionId: string, clientName: string, amount: number) => {
        markAsPaid(transactionId);
        speak(`C'est noté ${name}. ${clientName} a payé ${amount} francs. C'est ajouté à ta caisse.`);
    };

    const totalGlobalDette = Object.values(debtsByClient).reduce((acc, c) => acc + c.total, 0);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 pb-32 md:pb-64 lg:pb-48 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8 pt-2">
                <button
                    onClick={() => router.push('/')}
                    className="w-9 h-9 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform shrink-0"
                >
                    <ChevronLeft size={20} className="md:w-8 md:h-8" />
                </button>
                <h1 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">Mon Carnet</h1>
            </header>

            {/* Sommaire Dette */}
            <section className="bg-rose-600 text-white rounded-[20px] md:rounded-[28px] p-4 md:p-6 mb-3 md:mb-6 shadow-xl shadow-rose-100 dark:shadow-rose-900/20 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="font-black uppercase tracking-widest text-rose-100 text-[9px] md:text-xs">Argent Dehors</span>
                    <div className="text-4xl md:text-6xl font-black tracking-tighter leading-none mt-1">{totalGlobalDette} <span className="text-lg md:text-3xl">F</span></div>
                    <p className="mt-1 font-bold text-rose-100 text-[9px] md:text-xs max-w-sm">C'est l'argent que tes clients te doivent encore.</p>
                </div>
                <User size={120} className="absolute -right-8 -bottom-8 text-white/10 rotate-12 hidden md:block" />
                <User size={64} className="absolute -right-2 -bottom-2 text-white/10 rotate-12 md:hidden" />
            </section>

            {/* Barre de Recherche */}
            <div className="relative mb-4 md:mb-6 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                    type="text"
                    placeholder="CHERCHER..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 md:h-12 bg-white dark:bg-slate-900 rounded-[12px] md:rounded-[16px] pl-10 md:pl-12 pr-4 font-black text-xs md:text-sm text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800 focus:outline-none focus:border-rose-500 transition-all uppercase"
                />
            </div>

            {/* Liste des Clients */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center px-2 md:px-4">
                    <span className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest">{clientKeys.length} PERSONNES DOIVENT</span>
                </div>

                {clientKeys.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] p-10 md:p-16 text-center border-[3px] md:border-4 border-dashed border-slate-100 dark:border-slate-800">
                        <p className="font-black text-slate-300 dark:text-slate-700 uppercase italic text-lg md:text-xl">Tout le monde a payé !</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {clientKeys.map(key => {
                            const client = debtsByClient[key];
                            return (
                                <motion.div
                                    key={key}
                                    layout
                                    className="bg-white dark:bg-slate-900 rounded-[20px] md:rounded-[24px] p-3 md:p-5 shadow-sm border border-slate-100 dark:border-slate-800"
                                >
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <div className="flex items-center gap-2 md:gap-3 w-full">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center ${client.name === 'CLIENT INCONNU' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                                <User size={20} className="md:w-6 md:h-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm md:text-lg leading-none truncate">{client.name}</h3>
                                                <p className="text-rose-600 font-black text-xs md:text-sm mt-0.5">Doit {client.total} F</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                markAllAsPaid(client.name);
                                                speak(`Parfait ${name}. ${client.name} a tout réglé, soit ${client.total} francs.`);
                                            }}
                                            className="flex-1 bg-emerald-600 text-white px-2 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase shadow-md shadow-emerald-100 dark:shadow-none active:scale-95 transition-all text-center"
                                        >
                                            Tout Régler
                                        </button>
                                        <button
                                            onClick={() => setSelectedClient(selectedClient === key ? null : key)}
                                            className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase active:scale-95 transition-all shrink-0 border border-slate-100 dark:border-slate-700"
                                        >
                                            {selectedClient === key ? 'Fermer' : 'Détails'}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {selectedClient === key && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden border-t-2 border-slate-50 dark:border-slate-800 mt-4 md:mt-6 pt-4 md:pt-6"
                                            >
                                                <div className="space-y-3 md:space-y-4">
                                                    {client.transactions.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 md:p-5 rounded-xl md:rounded-2xl gap-2">
                                                            <div className="min-w-0">
                                                                <p className="font-black text-slate-800 dark:text-white uppercase text-xs md:text-sm truncate">{t.productName}</p>
                                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-0.5 md:mt-1">
                                                                    {new Date(t.timestamp).toLocaleDateString()} • {t.quantity} un.
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                                                <span className="font-black text-rose-600 text-sm md:text-lg whitespace-nowrap">{t.price} F</span>
                                                                <button
                                                                    onClick={() => handleSettle(t.id, client.name, t.price)}
                                                                    className="bg-emerald-500 text-white p-2.5 md:p-3 rounded-xl shadow-md active:scale-90 transition-transform"
                                                                >
                                                                    <CheckCircle2 size={18} className="md:w-6 md:h-6" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Assistant Vocal (Centré et Responsive) */}
            <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 md:px-6 pointer-events-none z-50">
                <motion.button
                    onClick={handleAction}
                    whileTap={{ scale: 0.95 }}
                    className={`h-14 w-auto px-4 md:h-20 md:px-8 rounded-[20px] md:rounded-[28px] shadow-xl text-white flex items-center justify-center gap-3 md:gap-4 pointer-events-auto border-[3px] border-white dark:border-slate-900 transition-all ${isListening ? 'bg-red-500 scale-105 animate-pulse' : 'bg-rose-600 active:bg-rose-700'}`}
                >
                    <div className={`p-2 bg-white/20 text-white rounded-full ${isSpeaking || isListening ? 'bg-white text-rose-600' : 'bg-white/20 text-white'} transition-all duration-300 shrink-0`}>
                        <Mic size={20} className="md:w-6 md:h-6" fill={isSpeaking || isListening ? "currentColor" : "none"} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col items-start pr-1 md:pr-2 text-left min-w-0">
                        <span className="text-sm md:text-lg font-black leading-none uppercase truncate">{isListening ? "J'ÉCOUTE..." : "PARLER"}</span>
                        <span className="text-[8px] md:text-[9px] font-bold opacity-80 italic tracking-tighter truncate">Dis "Fatou a payé"</span>
                    </div>
                </motion.button>
            </div>
        </main>
    );
}
