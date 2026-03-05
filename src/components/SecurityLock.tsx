'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const SecurityLock: React.FC = () => {
    const { isLocked, unlock, logout, user } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    // Sécurité: vider le PIN au montage
    React.useEffect(() => {
        if (isLocked) setPin('');
    }, [isLocked]);

    const handlePinPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handleUnlock(newPin);
            }
        }
    };

    const handleUnlock = async (finalPin: string) => {
        const success = await unlock(finalPin);
        if (!success) {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 500);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPin(prev => prev.slice(0, -1));
    };

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
            {/* Design Premium / Organic Bold */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="w-full max-w-xs relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-emerald-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-emerald-100 mb-6"
                >
                    <Lock size={28} className="text-white" />
                </motion.div>

                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1 text-center leading-tight">
                    Application<br />Vérrouillée
                </h2>
                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.25em] mb-10 text-center">
                    Pin de <span className="text-slate-900 dark:text-white font-black">{user?.name}</span>
                </p>

                {/* PIN Dots with shake effect on error */}
                <motion.div
                    animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                    className="flex gap-6 mb-12"
                >
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-6 h-6 rounded-full border-4 transition-all duration-100 ${pin.length > i ? 'bg-emerald-600 border-emerald-600 scale-125' : 'bg-transparent border-slate-200'}`}
                        />
                    ))}
                </motion.div>

                {/* Wave-style Number Pad */}
                <div className="grid grid-cols-3 gap-5 w-full max-w-[280px] mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handlePinPress(num.toString())}
                            className="aspect-square bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] flex items-center justify-center text-2xl font-black text-slate-900 dark:text-white shadow-sm active:scale-90 active:bg-emerald-50 transition-all cursor-pointer touch-none"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={() => logout()}
                        className="aspect-square flex flex-col items-center justify-center text-rose-300 hover:text-rose-500 transition-colors gap-1 active:scale-95"
                    >
                        <LogOut size={20} />
                        <span className="text-[7px] font-black uppercase tracking-widest">Sortir</span>
                    </button>
                    <button
                        onClick={() => handlePinPress('0')}
                        className="aspect-square bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] flex items-center justify-center text-2xl font-black text-slate-900 dark:text-white shadow-sm active:scale-90 active:bg-emerald-50 transition-all cursor-pointer touch-none"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="aspect-square flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors active:scale-90"
                    >
                        <Delete size={28} />
                    </button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 bg-rose-50 p-4 rounded-2xl text-rose-600 font-bold text-xs uppercase tracking-widest border border-rose-100"
                    >
                        <ShieldAlert size={18} /> Code PIN incorrect
                    </motion.div>
                )}
            </div>
        </div>
    );
};
