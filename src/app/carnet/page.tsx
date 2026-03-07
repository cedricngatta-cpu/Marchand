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
    const { speakIfNecessary, handleAction, isSpeaking, isListening } = useAssistant();
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
        speakIfNecessary(`C'est noté ${name}. ${clientName} a payé ${amount} francs. C'est ajouté à ta caisse.`, 'LOW');
    };

    const totalGlobalDette = Object.values(debtsByClient).reduce((acc, c) => acc + c.total, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-36">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex items-center gap-4 mb-6 max-w-lg mx-auto">
                    <button onClick={() => router.push('/')} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Mon Carnet</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Crédits & Dettes</p>
                    </div>
                </div>

                {/* Sommaire Dette intégré au header */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={16} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">Argent Dehors</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-5xl font-bold tracking-tight text-white">{totalGlobalDette}</span>
                        <span className="text-2xl font-semibold text-emerald-100">F</span>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-40px] relative z-10 px-4 max-w-lg mx-auto space-y-6">

                {/* Barre de Recherche */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Chercher un client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 bg-white dark:bg-slate-900 rounded-[20px] pl-12 pr-4 font-semibold text-sm text-slate-800 dark:text-white shadow-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:border-rose-500 transition-all"
                    />
                </div>

                {/* Liste des Clients */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{clientKeys.length} PERSONNES DOIVENT</span>
                    </div>

                    {clientKeys.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <p className="font-bold text-slate-300 dark:text-slate-700 uppercase italic text-lg">Tout le monde a payé !</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {clientKeys.map(key => {
                                const client = debtsByClient[key];
                                return (
                                    <motion.div
                                        key={key}
                                        layout
                                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4 w-full">
                                                <div className={`w-12 h-12 shrink-0 rounded-[14px] flex items-center justify-center ${client.name === 'CLIENT INCONNU' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400'}`}>
                                                    <User size={24} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-base leading-none truncate">{client.name}</h3>
                                                    <p className="text-rose-600 font-bold text-sm mt-1">Doit {client.total} F</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    markAllAsPaid(client.name);
                                                    speakIfNecessary(`Parfait ${name}. ${client.name} a tout réglé, soit ${client.total} francs.`, 'LOW');
                                                }}
                                                className="flex-1 bg-emerald-600 text-white px-2 py-3 rounded-xl font-bold text-[10px] uppercase shadow-md active:scale-[0.98] transition-all text-center"
                                            >
                                                Tout Régler
                                            </button>
                                            <button
                                                onClick={() => setSelectedClient(selectedClient === key ? null : key)}
                                                className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-3 rounded-xl font-bold text-[10px] uppercase active:bg-slate-100 transition-all shrink-0 border border-slate-100 dark:border-slate-700"
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
                                                    <div className="space-y-3">
                                                        {client.transactions.map(t => (
                                                            <div key={t.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl gap-3 border border-slate-100 dark:border-slate-700">
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-slate-800 dark:text-white text-xs truncate">{t.productName}</p>
                                                                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">
                                                                        {new Date(t.timestamp).toLocaleDateString()} • {t.quantity} un.
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-4 shrink-0">
                                                                    <span className="font-bold text-rose-600 text-base whitespace-nowrap">{t.price} F</span>
                                                                    <button
                                                                        onClick={() => handleSettle(t.id, client.name, t.price)}
                                                                        className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-md active:scale-90 transition-transform"
                                                                    >
                                                                        <CheckCircle2 size={18} />
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

            </main>

            {/* Assistant Vocal (Centré et Fixé) */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none z-50">
                <button
                    onClick={handleAction}
                    className={`h-16 px-6 rounded-2xl shadow-xl text-white flex items-center gap-4 w-auto pointer-events-auto transition-all ${isListening ? 'bg-rose-500' : 'bg-slate-900'}`}
                >
                    <div className={`p-2 bg-slate-800 dark:bg-slate-700 text-white rounded-full transition-all shrink-0`}>
                        <Mic size={20} fill={isSpeaking || isListening ? "currentColor" : "none"} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold uppercase tracking-widest">{isListening ? "ÉCOUTE..." : "PARLER"}</span>
                        <span className="text-[9px] font-medium opacity-60 italic">Dis "Fatou a payé"</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
