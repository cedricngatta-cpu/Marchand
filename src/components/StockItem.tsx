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
        <div className="bg-white dark:bg-slate-900 rounded-[20px] md:rounded-[24px] p-3 md:p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-2 md:gap-3">
            <div className="flex items-center justify-between">
                <button
                    onClick={onViewDetails}
                    className={`p-2 md:p-3 rounded-lg md:rounded-xl ${color} ${iconColor} active:scale-95 transition-transform`}
                >
                    <Icon size={20} className="md:w-6 md:h-6" />
                </button>
                <div className="text-right flex flex-col items-end">
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Reste</span>
                    <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl font-black text-sm md:text-lg flex items-center justify-center min-w-[40px] md:min-w-[50px] ${quantity < 5
                        ? 'bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none animate-pulse'
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

            <div className="grid grid-cols-2 gap-2 md:gap-3 mt-1">
                <button
                    onClick={onRemove}
                    className="h-10 md:h-12 bg-slate-100 dark:bg-slate-800 rounded-lg md:rounded-xl text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
                >
                    <span className="text-2xl md:text-3xl font-black leading-none">-</span>
                </button>
                <button
                    onClick={onAdd}
                    className="h-10 md:h-12 bg-slate-900 dark:bg-emerald-600 rounded-lg md:rounded-xl text-white flex items-center justify-center active:scale-95 transition-all shadow-md dark:shadow-none"
                >
                    <span className="text-2xl md:text-3xl font-black leading-none">+</span>
                </button>
            </div>
        </div>
    );
};
