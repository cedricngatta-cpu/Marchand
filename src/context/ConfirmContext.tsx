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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl border-2 border-slate-100 dark:border-slate-800"
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-6 ${dialog.dangerMode ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                <AlertTriangle size={32} />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center uppercase tracking-tight mb-3">
                                {dialog.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center leading-relaxed mb-8">
                                {dialog.message}
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleResponse(false)}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
                                >
                                    <X size={16} /> Annuler
                                </button>
                                <button
                                    onClick={() => handleResponse(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all text-white shadow-lg ${dialog.dangerMode ? 'bg-rose-600 shadow-rose-200' : 'bg-emerald-600 shadow-emerald-200'}`}
                                >
                                    <Check size={16} /> {dialog.confirmLabel || 'Confirmer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
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
