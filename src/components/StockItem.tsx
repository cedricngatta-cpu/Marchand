'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Plus } from 'lucide-react';

interface StockItemProps {
    name: string;
    icon: LucideIcon;
    quantity: number;
    color: string;
    iconColor: string;
    onAdd: () => void;
    onRemove: () => void;
    onViewDetails: () => void;
    onSpeak: () => void;
}

export const StockItem: React.FC<StockItemProps> = ({
    name,
    icon: Icon,
    quantity,
    color,
    iconColor,
    onAdd,
    onRemove,
    onViewDetails,
    onSpeak
}) => {
    const percentage = Math.min(100, (quantity / 20) * 100);

    let barColor = 'bg-emerald-500';
    if (percentage < 25) barColor = 'bg-red-500';
    else if (percentage < 50) barColor = 'bg-amber-500';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] md:rounded-[32px] p-5 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3 md:gap-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={onViewDetails}
                    className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${color} ${iconColor} active:scale-95 transition-transform`}
                >
                    <Icon size={28} className="md:w-8 md:h-8" />
                </button>
                <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Reste</span>
                    <div className={`px-3 md:px-4 py-1 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl flex items-center justify-center min-w-[50px] md:min-w-[60px] ${quantity < 5
                        ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                        }`}>
                        {quantity}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase text-slate-400">
                    <span onClick={onSpeak} className="cursor-pointer font-black text-slate-900 dark:text-white text-xs md:text-sm truncate pr-2">{name}</span>
                    <span className="shrink-0">{Math.round(percentage)}%</span>
                </div>
                <div className="w-full h-3 md:h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full ${barColor} shadow-inner`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-1 md:mt-2">
                <button
                    onClick={onRemove}
                    className="h-12 md:h-16 bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-95 transition-all border-2 border-slate-200 dark:border-slate-700"
                >
                    <span className="text-3xl md:text-4xl font-black leading-none">-</span>
                </button>
                <button
                    onClick={onAdd}
                    className="h-12 md:h-16 bg-slate-900 dark:bg-emerald-600 rounded-xl md:rounded-2xl text-white flex items-center justify-center active:scale-95 transition-all shadow-lg dark:shadow-none"
                >
                    <span className="text-3xl md:text-4xl font-black leading-none">+</span>
                </button>
            </div>
        </div>
    );
};
