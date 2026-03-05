'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ChevronRight, UserPlus, AlertCircle, CheckCircle2, Delete } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'PHONE' | 'PIN'>('PHONE');

    const getDashboardPath = (role: string | undefined) => {
        switch (role) {
            case 'SUPERVISOR': return '/admin';
            case 'PRODUCER': return '/producteur';
            case 'COOPERATIVE': return '/cooperative';
            case 'FIELD_AGENT': return '/agent';
            case 'MERCHANT':
            default: return '/commercant';
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(getDashboardPath(user.role));
        }
    }, [isAuthenticated, user, router]);

    // Handle Hardware Back Button
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (step === 'PIN') {
                e.preventDefault();
                setStep('PHONE');
                setPin('');
                // Stay on the same page but change step
                window.history.pushState(null, '', window.location.pathname);
            }
        };

        if (step === 'PIN') {
            window.history.pushState(null, '', window.location.pathname);
            window.addEventListener('popstate', handlePopState);
        }

        return () => window.removeEventListener('popstate', handlePopState);
    }, [step]);

    if (isAuthenticated) return null;

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneNumber.length >= 8) {
            setStep('PIN');
            setError('');
        } else {
            setError('Numéro de téléphone invalide');
        }
    };

    const handlePinPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handleLogin(newPin);
            }
        }
    };

    const handleLogin = async (finalPin: string) => {
        const success = await login(phoneNumber, finalPin);
        if (success) {
            // Success handled by useEffect
        } else {
            setError('PIN incorrect ou compte inexistant');
            setPin('');
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col p-3 items-center justify-center relative overflow-hidden">
            {/* Background Accents (Merchant Style) */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo / Header */}
                <header className="text-center mb-4 sm:mb-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-14 h-14 sm:w-24 sm:h-24 bg-emerald-600 rounded-2xl sm:rounded-[32px] mx-auto mb-3 sm:mb-6 flex items-center justify-center shadow-xl sm:shadow-2xl shadow-emerald-100"
                    >
                        <Lock size={28} className="text-white sm:w-12 sm:h-12" />
                    </motion.div>
                    <h1 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bienvenue</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-xs mt-1 sm:mt-2">Connectez-vous pour continuer</p>
                </header>

                <AnimatePresence mode="wait">
                    {step === 'PHONE' ? (
                        <motion.form
                            key="phone-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handlePhoneSubmit}
                            className="space-y-6"
                        >
                            <div className="relative">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-5 mb-1 block">Numéro de Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        autoFocus
                                        type="tel"
                                        placeholder="0102030405"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-[3px] border-slate-100 dark:border-slate-800 rounded-[24px] p-5 pl-14 font-black text-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 bg-rose-50 p-4 rounded-2xl text-rose-600 font-bold text-sm">
                                    <AlertCircle size={20} /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-slate-900 dark:bg-emerald-600 text-white p-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                Suivant <ChevronRight size={24} />
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/signup')}
                                className="w-full py-2 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-emerald-600 transition-colors"
                            >
                                Créer un nouveau compte
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="pin-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col items-center w-full"
                        >
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 sm:mb-8">Entrez votre PIN secret</label>

                            {/* PIN Display Dots */}
                            <div className="flex gap-4 sm:gap-6 mb-8 sm:mb-12">
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border-[3px] sm:border-4 transition-all duration-100 ${pin.length > i ? 'bg-emerald-600 border-emerald-600 scale-125' : 'bg-transparent border-slate-200'}`}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="mb-8 flex items-center gap-3 bg-rose-50 p-4 rounded-2xl text-rose-600 font-bold text-sm w-full">
                                    <AlertCircle size={20} /> {error}
                                </div>
                            )}

                            {/* Wave-style Number Pad */}
                            <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-[280px] sm:max-w-[320px]">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinPress(num.toString())}
                                        className="aspect-square bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[18px] sm:rounded-[24px] flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-900 dark:text-white shadow-sm sm:shadow-lg active:scale-90 active:bg-emerald-50 transition-all hover:border-emerald-200"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setStep('PHONE')}
                                    className="aspect-square flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <ArrowBackIcon />
                                </button>
                                <button
                                    onClick={() => handlePinPress('0')}
                                    className="aspect-square bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[18px] sm:rounded-[24px] flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-900 dark:text-white shadow-sm sm:shadow-lg active:scale-90 active:bg-emerald-50 transition-all hover:border-emerald-200"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setPin(prev => prev.slice(0, -1))}
                                    className="aspect-square flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    <Delete size={28} className="sm:w-8 sm:h-8" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

function ArrowBackIcon() {
    return (
        <motion.div whileHover={{ x: -2 }} className="flex items-center gap-1 font-black uppercase text-[10px] tracking-widest text-slate-300">
            <ChevronRight className="rotate-180" size={20} />
        </motion.div>
    );
}
