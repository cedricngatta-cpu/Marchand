'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCcw, Camera } from 'lucide-react';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [isStarting, setIsStarting] = useState(true);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader", {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ]
        });
        scannerRef.current = scanner;

        const startScanner = async () => {
            setIsStarting(true);
            try {
                if (scanner.isScanning) {
                    await scanner.stop();
                }
                await scanner.start(
                    { facingMode },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 }
                    },
                    (decodedText) => {
                        onScan(decodedText);
                        if (scanner.isScanning) {
                            scanner.stop().then(() => {
                                scanner.clear();
                                onClose();
                            }).catch(console.error);
                        }
                    },
                    () => {
                        // Ignore frame errors
                    }
                );
            } catch (err) {
                console.error("Erreur de démarrage du scanner", err);
            } finally {
                setIsStarting(false);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop()
                    .then(() => scannerRef.current?.clear())
                    .catch(console.error);
            }
        };
    }, [facingMode]);

    return (
        <div className="fixed inset-0 z-[200] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[40px] overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                        className="w-12 h-12 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-slate-900 transition-colors"
                        title="Basculer la caméra"
                    >
                        <RefreshCcw size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-slate-900 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Scanner Code-barres</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-6">Place le code dans le cadre</p>

                    <div id="reader" className="w-full rounded-2xl overflow-hidden border-4 border-slate-50"></div>
                </div>
            </div>

            <p className="mt-8 text-white/60 font-black uppercase text-xs tracking-widest italic animate-pulse">
                Accès caméra requis...
            </p>
        </div>
    );
};
