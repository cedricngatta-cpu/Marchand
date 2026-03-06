'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    dangerMode?: boolean;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialog(options);
            setResolver(() => resolve);
        });
    }, []);

    const handleResponse = (value: boolean) => {
        resolver?.(value);
        setDialog(null);
        setResolver(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {dialog && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-6">
                        {/* Overlay pour fermer en cliquant à côté */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleResponse(false)}
                            className="absolute inset-0 cursor-pointer"
                        />

                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[48px] p-8 sm:p-12 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] sm:shadow-2xl border-t sm:border-2 border-slate-100 dark:border-slate-800 relative z-10"
                        >
                            {/* Handle pour mobile */}
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 sm:hidden" />

                            <div className="flex flex-col items-center">
                                {/* Icon Section */}
                                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-xl ${dialog.dangerMode
                                        ? 'bg-rose-50 text-rose-600 shadow-rose-100 dark:bg-rose-900/20'
                                        : 'bg-emerald-50 text-emerald-600 shadow-emerald-100 dark:bg-emerald-900/20'
                                    }`}>
                                    <AlertTriangle size={48} strokeWidth={1.5} />
                                </div>

                                {/* Text Section */}
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white text-center uppercase tracking-tighter leading-none mb-4">
                                    {dialog.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-center leading-relaxed mb-10 max-w-xs">
                                    {dialog.message}
                                </p>

                                {/* Buttons Section */}
                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    <button
                                        onClick={() => handleResponse(true)}
                                        className={`flex-1 flex items-center justify-center gap-3 py-6 rounded-[28px] font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all text-white shadow-xl order-1 sm:order-2 ${dialog.dangerMode
                                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none'
                                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
                                            }`}
                                    >
                                        <Check size={20} /> {dialog.confirmLabel || 'Confirmer'}
                                    </button>
                                    <button
                                        onClick={() => handleResponse(false)}
                                        className="flex-1 flex items-center justify-center gap-3 py-6 rounded-[28px] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border-2 border-transparent hover:border-slate-200 order-2 sm:order-1"
                                    >
                                        <X size={20} /> Annuler
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
    return context.confirm;
};
