import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useVoice } from './useVoice';
import { useStock } from './useStock';
import { useHistory } from './useHistory';
import { useCart } from './useCart';
import { useProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

export const useAssistant = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const { products } = useProductContext();
    const { speak, speakIfNecessary, listen, isSpeaking, isListening, transcript, clearTranscript, stopSpeaking } = useVoice();
    const { updateStock, getStockLevel } = useStock();
    const { history, addTransaction, markAllAsPaid } = useHistory();
    const { items, addItem, removeItem } = useCart();

    // Refs stables pour éviter les cycles de re-renders dans l'effet de salutation
    const speakRef = useRef(speakIfNecessary);
    const stopSpeakingRef = useRef(stopSpeaking);
    useEffect(() => { speakRef.current = speakIfNecessary; }, [speakIfNecessary]);
    useEffect(() => { stopSpeakingRef.current = stopSpeaking; }, [stopSpeaking]);

    const userName = user?.name?.split(' ')[0] || 'Marchand';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 5) return 'Bonsoir';
        return 'Bonjour';
    };

    const formatSpeech = (audioName: string, quantity: number) => {
        const shortName = audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
        if (quantity === 1) return `un ${shortName}`;
        return `${quantity} ${shortName}${shortName.endsWith('s') || shortName.endsWith('x') ? '' : 's'}`;
    };

    const handleAction = useCallback(() => {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            listen();
        }
    }, [isSpeaking, stopSpeaking, listen]);

    const processCommand = useCallback((text: string) => {
        console.log('🎙️ Assistant RAW transcript:', text);
        const lowerText = text.toLowerCase().trim();

        // 1. Normalisation et nettoyage
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        // Helper pour ignorer les pluriels (supprime le 's' ou 'x' en fin de mot)
        const stripPlural = (str: string) => str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).map(w => w.replace(/[sx]$/i, '')).join(' ');

        // --- SMART NUMBER MAPPER (0-100) ---
        const numberWords: Record<string, number> = {
            'zero': 0, 'un': 1, 'une': 1, 'deux': 2, 'de': 2, 'des': 2, 'trois': 3, 'troi': 3, 'quatre': 4, 'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9,
            'dix': 10, 'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15, 'seize': 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19,
            'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50, 'soixante': 60, 'soixante-dix': 70, 'quatre-vingt': 80, 'quatre-vingts': 80, 'quatre-vingt-dix': 90, 'cent': 100
        };

        let textWithDigits = lowerText;

        // 1. Nombres composés (ex: vingt trois, vingt-trois, vingt et un)
        const tens = { 'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50, 'soixante': 60 };
        const ones = { 'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9 };

        Object.entries(tens).forEach(([word, val]) => {
            // Dizaines "et un"
            textWithDigits = textWithDigits.replace(new RegExp(`\\b${word}\\s+et\\s+un\\b`, 'g'), (val + 1).toString());
            // Dizaines - unités
            Object.entries(ones).forEach(([oWord, oVal]) => {
                textWithDigits = textWithDigits.replace(new RegExp(`\\b${word}[-\\s]${oWord}\\b`, 'g'), (val + oVal).toString());
            });
        });

        // Cas spéciaux 70-79 et 90-99
        for (let i = 11; i <= 19; i++) {
            const word = Object.keys(numberWords).find(k => numberWords[k] === i);
            if (word) {
                textWithDigits = textWithDigits.replace(new RegExp(`\\bsoixante[-\\s]${word}\\b`, 'g'), (60 + i).toString());
                textWithDigits = textWithDigits.replace(new RegExp(`\\bquatre-vingt(s)?\\s+${word}\\b`, 'g'), (80 + i).toString());
            }
        }

        // 2. Chiffres simples (les plus longs d'abord)
        Object.keys(numberWords).sort((a, b) => b.length - a.length).forEach(word => {
            textWithDigits = textWithDigits.replace(new RegExp(`\\b${word}\\b`, 'g'), numberWords[word].toString());
        });

        console.log('🔢 Text after Number Mapping:', textWithDigits);

        // 3. Corrections phonétiques ciblées
        const corrections: Record<string, string> = {
            'vends de': 'vend 2',
            'vend de': 'vend 2',
            'vends des': 'vend 2',
            'vend des': 'vend 2',
            'vendes': 'vend',
            'vendent': 'vend',
            'ven': 'vend',
            'vente de': 'vend',
            'vent de': 'vend',
            'rue': 'riz',
            'vent': 'vend'
        };

        let processedText = textWithDigits;
        Object.entries(corrections).forEach(([error, fix]) => {
            const regex = new RegExp(`\\b${error}\\b`, 'g');
            processedText = processedText.replace(regex, fix);
        });

        const normText = normalize(processedText);

        if (products.length === 0) {
            speakIfNecessary(`Mon catalogue est encore vide.`, 'NORMAL');
            return;
        }

        // --- SMART PARSER ---

        // A. Extraction de l'Intention
        let intent: 'SALE' | 'ADD_STOCK' | 'REMOVE_STOCK' | 'CHECK_STOCK' | 'PAY_DEBT' | 'UNKNOWN' = 'UNKNOWN';
        if (normText.includes('vend') || normText.includes('vendre') || normText.includes('donne')) intent = 'SALE';
        else if (normText.includes('ajoute') || normText.includes('recu') || normText.includes('livre')) intent = 'ADD_STOCK';
        else if (normText.includes('retire') || normText.includes('enleve') || normText.includes('supprime')) intent = 'REMOVE_STOCK';
        else if (normText.includes('combien') || normText.includes('reste') || normText.includes('stock') || normText.includes('inventaire')) intent = 'CHECK_STOCK';
        else if (normText.includes('paye') || normText.includes('regle') || normText.includes('dette') || normText.includes('credit')) {
            if (normText.includes('paye') || normText.includes('regle')) intent = 'PAY_DEBT';
            else intent = 'CHECK_STOCK';
        }

        // B. Extraction du Moyen de Paiement
        let paymentMethod: 'CASH' | 'CREDIT' | 'MOMO' = 'CASH';
        if (normText.includes('credit') || normText.includes('dette') || normText.includes('a credit')) paymentMethod = 'CREDIT';
        else if (normText.includes('momo') || normText.includes('mobile money')) paymentMethod = 'MOMO';

        // C. Extraction Quantité Robuste
        let quantity = 1;
        // On cherche le PREMIER nombre dans le texte traité
        const digitMatch = processedText.match(/(\d+)/);
        if (digitMatch) {
            quantity = parseInt(digitMatch[1]);
        }

        // D. Extraction du Client (Harden keywords to stop name capture)
        const clientMatch = processedText.match(/(?:à|pour|a)\s+([a-zA-Z\s]+?)(?:\s+(?:en|sur|avec|pour|à|a|termine|fini|confirme|biscuit|riz|savon|sucre|dette|credit|momo|espece|payer|vendre|vends)|$)/i);
        let customerName = undefined;
        if (clientMatch) {
            const rawName = clientMatch[1].trim();
            const normalizedName = normalize(rawName).toLowerCase();
            const badNames = ['credit', 'dette', 'cash', 'espece', 'especes', 'momo', 'mobile money', 'un', 'une', 'deux', 'des'];
            if (rawName.length > 2 && !badNames.includes(normalizedName)) {
                customerName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            }
        }

        // E. Identification du Produit (Détection flexible)
        const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
        const voiceSingular = stripPlural(normText);
        const voiceKeywords = voiceSingular.split(/\s+/).filter(w => w.length >= 2);

        const product = sortedProducts.find(p => {
            const nName = normalize(p.name);
            const nNameSingular = stripPlural(nName);
            const nAudio = normalize(p.audioName || p.name).replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
            const nAudioSingular = stripPlural(nAudio);

            if (voiceSingular.includes(nNameSingular) || voiceSingular.includes(nAudioSingular)) return true;
            if (nNameSingular.includes(voiceSingular) || nAudioSingular.includes(voiceSingular)) return true;

            const stopWords = ['vend', 'vendre', 'donne', 'ajoute', 'recu', 'livre', 'retire', 'enleve', 'supprime', 'combien', 'reste', 'stock', 'de', 'le', 'la', 'les', 'un', 'une', 'des', 'au', 'aux', 'pour', 'avec', 'dans', 'sur', 'plus', 'moins', quantity.toString()];
            const searchKeywords = voiceKeywords.filter(w => !stopWords.includes(w));

            return searchKeywords.some(keyword =>
                nNameSingular.includes(keyword) ||
                nAudioSingular.includes(keyword)
            );
        });

        if (product) {
            console.log(`✅ Produit trouvé: ${product.name} (Matché via: ${normText})`);
        } else {
            const count = products.length;
            console.warn(`❌ Aucun produit matché dans le catalogue (${count} produits) pour: ${normText}`);
        }

        const structuredCommand = { intent, product: product?.name, quantity, paymentMethod, customerName };
        console.log('🎯 Intent Parsed:', structuredCommand);

        // --- EXÉCUTION ---
        if (intent === 'PAY_DEBT' && customerName) {
            const clientDebts = history.filter(t => t.status === 'DETTE' && t.clientName?.toLowerCase() === customerName.toLowerCase());
            if (clientDebts.length > 0) {
                const totalPaid = clientDebts.reduce((acc, t) => acc + t.price, 0);
                markAllAsPaid(customerName);
                speakIfNecessary(`C'est fait ${userName}. ${customerName} a réglé sa dette de ${totalPaid} francs.`, 'NORMAL');
                return;
            }
        }

        if (!product) {
            if (intent !== 'CHECK_STOCK' && intent !== 'UNKNOWN') {
                const count = products.length;
                speakIfNecessary(`Je n'ai pas trouvé le produit parmi les ${count} de ton catalogue. Peux-tu répéter ?`, 'HIGH', true);
            } else if (intent === 'CHECK_STOCK') {
                const totalVal = products.reduce((acc, p) => acc + (p.price * getStockLevel(p.id)), 0);
                speakIfNecessary(`Ton capital marchand actuel est de ${totalVal} francs.`, 'NORMAL');
            }
            return;
        }

        const finalProduct = { ...product };
        const feedback = formatSpeech(finalProduct.audioName, quantity);

        switch (intent) {
            case 'ADD_STOCK':
                if (pathname === '/vendre') {
                    addItem(finalProduct, quantity);
                    speakIfNecessary(`${feedback} ajouté au panier.`, 'LOW');
                } else {
                    updateStock(finalProduct.id, quantity);
                    speakIfNecessary(`${feedback} ajouté au stock.`, 'LOW');
                }
                break;

            case 'SALE':
                if (pathname === '/vendre') {
                    addItem(finalProduct, quantity);
                    let saleFeedback = `${feedback} pour ${customerName || 'le client'}`;
                    if (paymentMethod === 'CREDIT') saleFeedback += " en dette";

                    speakIfNecessary(`${saleFeedback}.`, 'LOW');

                    window.dispatchEvent(new CustomEvent('assistant-set-client', {
                        detail: { name: customerName, status: paymentMethod === 'CREDIT' ? 'DETTE' : 'PAYÉ' }
                    }));

                    if (customerName || normText.includes('confirme')) {
                        setTimeout(() => window.dispatchEvent(new Event('assistant-finish-sale')), 1500);
                    }
                } else {
                    const stock = getStockLevel(finalProduct.id);
                    if (stock < quantity) {
                        speakIfNecessary(`Attention, il ne te reste que ${stock} de ${finalProduct.name}.`, 'HIGH');
                    } else {
                        updateStock(finalProduct.id, -quantity);
                        addTransaction({
                            type: 'VENTE',
                            productId: finalProduct.id,
                            productName: finalProduct.name,
                            quantity: quantity,
                            price: finalProduct.price * quantity,
                            clientName: customerName,
                            status: paymentMethod === 'CREDIT' ? 'DETTE' : 'PAYÉ'
                        });
                        speakIfNecessary(`${feedback} vendu ${customerName ? `à ${customerName}` : ''}${paymentMethod === 'CREDIT' ? ' à crédit' : ''}.`, 'LOW');
                    }
                }
                break;

            case 'REMOVE_STOCK':
                if (pathname === '/vendre') {
                    removeItem(finalProduct.id);
                    speakIfNecessary(`${finalProduct.name} retiré du panier.`, 'LOW');
                } else {
                    updateStock(finalProduct.id, -quantity);
                    speakIfNecessary(`${feedback} retiré du stock.`, 'LOW');
                }
                break;

            case 'CHECK_STOCK':
                const currentStock = getStockLevel(finalProduct.id);
                speakIfNecessary(`Il te reste ${currentStock} de ${finalProduct.audioName}.`, 'NORMAL');
                break;

            default:
                speakIfNecessary(`Je ne suis pas sûr d'avoir compris. Tu veux vendre ou ajouter du ${product.name} ?`, 'NORMAL', true);
        }
    }, [speakIfNecessary, updateStock, getStockLevel, addTransaction, markAllAsPaid, addItem, removeItem, pathname, history, products, userName, items]);

    // Mission 1: Suppression des salutations automatiques au changement de route
    useEffect(() => {
        stopSpeakingRef.current();
        // On ne fait plus de speakRef.current(...) ici pour garder le silence
        return () => {
            stopSpeakingRef.current();
        };
    }, [pathname]);

    useEffect(() => {
        if (transcript && !isListening) {
            processCommand(transcript);
            clearTranscript();
        }
    }, [transcript, isListening, processCommand, clearTranscript]);

    return { speak, speakIfNecessary, listen, isSpeaking, isListening, stopSpeaking, handleAction };
};
