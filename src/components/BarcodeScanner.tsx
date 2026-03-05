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
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader", {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ],
            verbose: false
        });
        scannerRef.current = scanner;

        let isMounted = true;

        const startScanner = async () => {
            setIsStarting(true);
            setScanError(null);
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
                        if (isMounted) onScan(decodedText);
                    },
                    (error: any) => {
                        // Ignore frame errors, but log others if needed
                        if (error && typeof error === 'object' && error.message && !error.message.includes("NotFound")) {
                            console.log("Scanner warning:", error);
                        } else if (typeof error === 'string' && !error.includes("NotFound")) {
                            console.log("Scanner warning:", error);
                        }
                    }
                );
            } catch (err: any) {
                console.error("Erreur de démarrage du scanner", err);
                if (isMounted) setScanError(err.message || "Erreur d'accès à la caméra.");
            } finally {
                if (isMounted) setIsStarting(false);
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop()
                    .then(() => scannerRef.current?.clear())
                    .catch(console.error);
            }
        };
    }, [facingMode, onScan]);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/5 rounded-[40px] overflow-hidden">
            {/* Absolute controls if not handled by parent */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                    onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                    className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                    <RefreshCcw size={18} />
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Container for the scanner stream */}
            <div className="relative w-full aspect-square md:aspect-video bg-black overflow-hidden flex items-center justify-center rounded-3xl">
                {scanError ? (
                    <div className="text-rose-500 font-bold text-center px-4 uppercase text-xs">
                        <Camera size={32} className="mx-auto mb-2 opacity-50" />
                        {scanError}
                        <button onClick={() => window.location.reload()} className="block mx-auto mt-4 px-4 py-2 bg-rose-500 text-white rounded-full">Réessayer</button>
                    </div>
                ) : (
                    <>
                        <div id="reader" className="w-full h-full object-cover"></div>

                        {/* Scanning Animation Overlay */}
                        {!isStarting && !scanError && (
                            <div className="absolute inset-0 pointer-events-none z-10">
                                <div className="w-full h-full border-[10px] border-amber-500/30"></div>
                                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)] animate-scan-line"></div>
                            </div>
                        )}
                    </>
                )}

                {isStarting && !scanError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scanLine 2.5s ease-in-out infinite;
                }
                
                /* Hide HTML5 QR Code default UI elements if possible */
                #reader__dashboard_section_csr span,
                #reader__dashboard_section_swaplink {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};
