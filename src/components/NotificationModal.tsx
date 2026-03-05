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
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] md:rounded-[48px] overflow-hidden flex flex-col h-[85vh] md:h-[600px] shadow-2xl"
                >
                    <header className="bg-rose-600 p-8 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl">
                                <Bell size={32} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-2xl leading-none">Notifications</h3>
                                <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Messages de l'administration</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                            <X size={24} />
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
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border-2 transition-all ${n.is_read ? 'border-transparent opacity-60' : 'border-rose-100 dark:border-rose-900/30 shadow-rose-100/50'}`}
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {!n.is_read && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
                                            <span className="font-black text-slate-900 dark:text-white uppercase text-base tracking-tight leading-none">{n.title}</span>
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
                                                className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 size={14} /> Lu
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
