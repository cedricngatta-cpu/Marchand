'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCcw, Camera, Zap, ZapOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [isStarting, setIsStarting] = useState(true);
    const [scanError, setScanError] = useState<string | null>(null);
    const [flashOn, setFlashOn] = useState(false);

    // Fonction pour tenter d'allumer le flash
    const toggleFlash = async () => {
        try {
            if (scannerRef.current && scannerRef.current.getState() === 2) { // 2 = SCANNING
                await scannerRef.current.applyVideoConstraints({
                    advanced: [{ torch: !flashOn } as any]
                });
                setFlashOn(!flashOn);
            }
        } catch (err) {
            console.log("Torch non supportée ou erreur", err);
            // On toggle state anyway to give UI feedback, though device may not have flash
            setFlashOn(!flashOn);
        }
    };

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
                    await scanner.stop().catch(() => { });
                    scanner.clear();
                }

                await new Promise(resolve => setTimeout(resolve, 100));

                await scanner.start(
                    { facingMode },
                    {
                        fps: 10
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
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop()
                        .then(() => {
                            scannerRef.current?.clear();
                        })
                        .catch(console.error);
                } else {
                    scannerRef.current.clear();
                }
            }
        };
    }, [facingMode, onScan]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[200] flex flex-col bg-black overflow-hidden"
        >
            {/* Header / Contrôles (Haut) */}
            <div className="absolute top-0 inset-x-0 z-30 flex justify-between items-start p-6 pt-10">
                <button
                    onClick={onClose}
                    className="p-2 text-white active:opacity-70 transition-opacity bg-black/20 rounded-full"
                >
                    <X size={26} strokeWidth={2.5} />
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={toggleFlash}
                        className="p-2 text-white active:opacity-70 transition-opacity bg-black/20 rounded-full"
                    >
                        {flashOn ? <Zap size={26} className="fill-white" strokeWidth={2} /> : <ZapOff size={26} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            {/* Container for the scanner stream */}
            <div className="relative flex-1 w-full bg-black flex items-center justify-center mt-[-10vh]">
                {scanError ? (
                    <div className="text-rose-500 font-bold text-center px-4 uppercase text-xs z-20">
                        <Camera size={32} className="mx-auto mb-2 opacity-50" />
                        {scanError}
                        <button onClick={() => window.location.reload()} className="block mx-auto mt-4 px-4 py-2 bg-rose-500 text-white rounded-full">Réessayer</button>
                    </div>
                ) : (
                    <>
                        {/* Le conteneur vidéo HMTL5 QR Code rendu 100% de la div */}
                        <div id="reader" className="w-full h-full object-cover"></div>

                        {/* Scanner UI Overlay (Targeting Frame) */}
                        {!isStarting && !scanError && (
                            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                                {/* Zone transparente centrale style POS Scanner (Horizontal avec coins) */}
                                <div className="relative w-80 h-48 sm:w-[400px] sm:h-56 shadow-[0_0_0_4000px_rgba(0,0,0,0.65)] rounded-2xl">
                                    {/* Les 4 coins (Brackets blancs épais) */}
                                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-[6px] border-l-[6px] border-white rounded-tl-2xl"></div>
                                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-[6px] border-r-[6px] border-white rounded-tr-2xl"></div>
                                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-[6px] border-l-[6px] border-white rounded-bl-2xl"></div>
                                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-[6px] border-r-[6px] border-white rounded-br-2xl"></div>

                                    {/* Conteneur pour clipser l'animation */}
                                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                                        {/* Ligne animée de Scan (Haut en bas) */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 shadow-[0_0_20px_#f43f5e] animate-scan-line"></div>
                                    </div>
                                </div>
                                {/* Le texte en dessous */}
                                <div className="w-80 mt-6 text-center">
                                    <p className="text-white text-[17px] font-medium leading-tight">
                                        Scanner un code-barres pour ajouter le produit
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {isStarting && !scanError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Pas de boutons inférieurs pour la vente (Focus sur le scan) */}

            <style jsx>{`
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    50% { top: calc(100% - 4px); opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 0%; opacity: 0; }
                }

                .animate-scan-line {
                    animation: scanLine 2.5s ease-in-out infinite;
                }

                /* Hide HTML5 QR Code default UI elements forcefully */
                #reader__dashboard_section_csr span,
                #reader__dashboard_section_swaplink,
                #reader__dashboard_section_csr div,
                #reader img,
                #reader__scan_region img {
                    display: none !important;
                }
                
                #reader {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                    position: absolute;
                    inset: 0;
                }
                
                #reader__scan_region {
                    width: 100% !important;
                    height: 100% !important;
                    background: black;
                }
                
                #reader__scan_region video {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                
                #reader__scan_region canvas {
                    display: none !important;
                }
            `}</style>
        </motion.div>
    );
};
