'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 m-4 bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-200 dark:border-rose-800 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Erreur Inattendue</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-6 max-w-sm">
                        {this.props.fallbackMessage || "Un problème est survenu lors du chargement de cette section. Nos équipes ont été alertées."}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200"
                    >
                        <RefreshCcw size={18} /> Recharger
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
