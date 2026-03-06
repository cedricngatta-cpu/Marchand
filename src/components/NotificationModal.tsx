'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle2, Trash2, Clock } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, deleteNotification } = useNotifications();

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
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-[85vh] md:h-[600px] shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                    <header className="bg-primary p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2.5 rounded-xl">
                                <Bell size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold tracking-tight text-xl leading-none">Notifications</h3>
                                <p className="text-emerald-50 text-[10px] font-semibold uppercase tracking-wider mt-1 opacity-80">Messages et alertes</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-full text-slate-200">
                                    <Bell size={48} />
                                </div>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">Aucun nouveau message pour le moment</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border transition-all ${n.is_read ? 'border-slate-100 dark:border-slate-800 opacity-60' : 'border-emerald-100 dark:border-emerald-900/30'}`}
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {!n.is_read && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                                            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">{n.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase">
                                            <Clock size={12} />
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{n.message}</p>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {!n.is_read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                className="text-[10px] font-bold text-primary tracking-wider flex items-center gap-1.5 p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                            >
                                                <CheckCircle2 size={14} /> Marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
