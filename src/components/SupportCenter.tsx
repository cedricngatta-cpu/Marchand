'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MessageCircle,
    ChevronRight,
    ShieldAlert,
    Smartphone,
    Send,
    Bot,
    User,
    CheckCircle2
} from 'lucide-react';

interface SupportCenterProps {
    isOpen: boolean;
    onClose: () => void;
    merchantName: string;
}

export const SupportCenter: React.FC<SupportCenterProps> = ({ isOpen, onClose, merchantName }) => {
    const [view, setView] = useState<'OPTIONS' | 'CHAT'>('OPTIONS');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [messages, setMessages] = useState<{ sender: 'BOT' | 'USER', text: string }[]>([]);

    const startChat = (topic: string) => {
        setSelectedTopic(topic);
        setView('CHAT');
        setMessages([
            { sender: 'BOT', text: `Bonjour ${merchantName}, je suis l'assistant de sécurité. J'ai bien reçu votre demande concernant : ${topic}.` },
            {
                sender: 'BOT', text: topic === 'CLOSURE'
                    ? "La fermeture d'un compte commerçant est une action définitive. Un administrateur doit valider votre demande par téléphone pour sécuriser vos fonds. Voulez-vous être contacté ?"
                    : "Comment puis-je vous aider aujourd'hui ?"
            }
        ]);
    };

    const handleWhatsAppRedirect = () => {
        const text = encodeURIComponent(`Bonjour l'équipe support, je suis ${merchantName} et je souhaite ${selectedTopic === 'CLOSURE' ? 'fermer mon compte' : 'poser une question'}.`);
        window.open(`https://wa.me/2250000000000?text=${text}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-6"
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-[85vh] md:h-[700px] shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                    {/* Header Style WhatsApp */}
                    <header className="bg-primary p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2.5 rounded-xl">
                                <MessageCircle size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold tracking-tight text-xl leading-none">Assistance Directe</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Support en ligne</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950/50">
                        {view === 'OPTIONS' ? (
                            <>
                                <div className="text-center space-y-2 mb-8 mt-4">
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Choisissez un sujet</h4>
                                    <p className="text-slate-400 font-medium text-xs">Comment pouvons-nous vous aider ?</p>
                                </div>

                                <div className="space-y-4">
                                    <OptionButton
                                        icon={Smartphone}
                                        label="Problème avec l'application"
                                        onClick={() => startChat('TECH')}
                                    />
                                    <OptionButton
                                        icon={CheckCircle2}
                                        label="Question sur mes ventes"
                                        onClick={() => startChat('SALES')}
                                    />
                                    <OptionButton
                                        icon={ShieldAlert}
                                        label="Fermeture de mon compte"
                                        color="text-rose-500"
                                        onClick={() => startChat('CLOSURE')}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 space-y-4">
                                    {messages.map((m, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: m.sender === 'BOT' ? -10 : 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex ${m.sender === 'BOT' ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div className={`max-w-[80%] p-5 rounded-[28px] font-bold text-sm leading-relaxed shadow-sm ${m.sender === 'BOT' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100' : 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-100'}`}>
                                                {m.text}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-8 space-y-4">
                                    <button
                                        onClick={handleWhatsAppRedirect}
                                        className="w-full bg-[#25D366] text-white p-5 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 shadow-md transition-all active:scale-[0.98]"
                                    >
                                        <MessageCircle size={20} /> Continuer sur WhatsApp
                                    </button>
                                    <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wider px-8">
                                        C'est le moyen le plus rapide de parler à un administrateur.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

function OptionButton({ icon: Icon, label, onClick, color = "text-primary" }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:bg-slate-50 transition-all"
        >
            <div className="flex items-center gap-4">
                <div className={`bg-slate-50 dark:bg-slate-800 p-3 rounded-xl ${color}`}>
                    <Icon size={20} />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{label}</span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-all" />
        </button>
    );
}
