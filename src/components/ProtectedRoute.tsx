'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { SecurityLock } from './SecurityLock';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user, isLocked } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicPath = pathname === '/' || pathname === '/login' || pathname === '/signup';

    useEffect(() => {
        if (!isAuthenticated && !isPublicPath) {
            router.push('/login');
        }
    }, [isAuthenticated, isPublicPath, router]);

    if (!isAuthenticated && !isPublicPath) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <>
            <SecurityLock />
            {children}
        </>
    );
};
