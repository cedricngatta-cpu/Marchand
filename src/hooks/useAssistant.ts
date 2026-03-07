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
        const lowerText = text.toLowerCase();

        // 1. Normalisation et nettoyage phonétique
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        // Helper pour ignorer les pluriels (supprime le 's' ou 'x' en fin de mot)
        const stripPlural = (str: string) => str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).map(w => w.replace(/[sx]$/i, '')).join(' ');

        // Dictionnaire de corrections pour les erreurs phonétiques et homophones
        const corrections: Record<string, string> = {
            '22': 'vend 2',
            'vingt deux': 'vend 2',
            'vingt-deux': 'vend 2',
            'vente de': 'vend',
            'vent de': 'vend',
            'vends de': 'vend',
            'rue': 'riz',
            'vent': 'vend'
        };

        let processedText = lowerText;
        Object.entries(corrections).forEach(([error, fix]) => {
            // Utiliser une Regex pour remplacer les mots entiers (\b) uniquement
            const regex = new RegExp(`\\b${error}\\b`, 'g');
            processedText = processedText.replace(regex, fix);
        });

        const normText = normalize(processedText);

        if (products.length === 0) {
            speakIfNecessary(`Mon catalogue est encore vide.`, 'NORMAL');
            return;
        }

        // --- SMART PARSER (Mission 2) ---

        // A. Extraction de l'Intention
        let intent: 'SALE' | 'ADD_STOCK' | 'REMOVE_STOCK' | 'CHECK_STOCK' | 'PAY_DEBT' | 'UNKNOWN' = 'UNKNOWN';
        if (normText.includes('vend') || normText.includes('vendre') || normText.includes('donne')) intent = 'SALE';
        else if (normText.includes('ajoute') || normText.includes('recu') || normText.includes('livre')) intent = 'ADD_STOCK';
        else if (normText.includes('retire') || normText.includes('enleve') || normText.includes('supprime')) intent = 'REMOVE_STOCK';
        else if (normText.includes('combien') || normText.includes('reste') || normText.includes('stock') || normText.includes('inventaire')) intent = 'CHECK_STOCK';
        else if (normText.includes('paye') || normText.includes('regle') || normText.includes('dette') || normText.includes('credit')) {
            if (normText.includes('paye') || normText.includes('regle')) intent = 'PAY_DEBT';
            else intent = 'CHECK_STOCK'; // "quelle est ma dette" -> CHECK_STOCK/BALANCE
        }

        // B. Extraction du Moyen de Paiement
        let paymentMethod: 'CASH' | 'CREDIT' | 'MOMO' = 'CASH';
        if (normText.includes('credit') || normText.includes('dette')) paymentMethod = 'CREDIT';
        else if (normText.includes('momo') || normText.includes('mobile money')) paymentMethod = 'MOMO';

        // C. Extraction du Client (NLP simple)
        // Cherche ce qui vient après "à" ou "pour"
        const clientMatch = processedText.match(/(?:à|pour|a)\s+([a-zA-Z\s]+?)(?:\s+(?:en|sur|avec|pour|à|a|termine|fini|confirme|biscuit|riz|savon|sucre)|$)/i);
        let customerName = undefined;
        if (clientMatch) {
            const rawName = clientMatch[1].trim();
            // Filtrer les faux positifs (mots de paiement ou de quantité)
            if (!['credit', 'dette', 'cash', 'espece', 'un', 'une', 'deux', 'des'].includes(normalize(rawName))) {
                customerName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            }
        }

        // D. Identification du Produit (Détection flexible)
        // On trie par longueur décroissante pour privilégier les noms longs (ex: "Biscuits Chocolat" avant "Biscuits")
        const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

        // Nettoyage de la voix pour la recherche
        const voiceSingular = stripPlural(normText);
        // Mots clés de la voix (on garde les mots de 2 lettres et plus, certains produits sont courts comme "Riz" ou "Sel")
        const voiceKeywords = voiceSingular.split(/\s+/).filter(w => w.length >= 2);

        const product = sortedProducts.find(p => {
            const nName = normalize(p.name);
            const nNameSingular = stripPlural(nName);
            const nAudio = normalize(p.audioName || p.name).replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
            const nAudioSingular = stripPlural(nAudio);

            // 1. Match par inclusion globale (ex: "vends biscuits" contient "biscuit")
            if (voiceSingular.includes(nNameSingular) || voiceSingular.includes(nAudioSingular)) return true;
            if (nNameSingular.includes(voiceSingular) || nAudioSingular.includes(voiceSingular)) return true;

            // 2. Match par mots-clés (si un mot clé essentiel est présent dans le nom du produit)
            // On exclut les mots d'intention et les mots de liaison courants
            const stopWords = ['vend', 'vendre', 'donne', 'ajoute', 'recu', 'livre', 'retire', 'enleve', 'supprime', 'combien', 'reste', 'stock', 'de', 'le', 'la', 'les', 'un', 'une', 'des', 'au', 'aux', 'pour', 'avec', 'dans', 'sur', 'plus', 'moins'];
            const searchKeywords = voiceKeywords.filter(w => !stopWords.includes(w));

            return searchKeywords.some(keyword =>
                nNameSingular.includes(keyword) ||
                nAudioSingular.includes(keyword)
            );
        });

        if (product) {
            console.log(`✅ Produit trouvé: ${product.name} (Matché via: ${normText})`);
        } else {
            console.warn(`❌ Aucun produit matché dans le catalogue (${products.length} produits) pour: ${normText}`);
        }

        // E. Extraction Quantité
        const numberMap: Record<string, number> = { 'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5 };
        let quantity = 1;
        const digitMatch = normText.match(/(\d+)/);
        if (digitMatch) quantity = parseInt(digitMatch[1]);
        else {
            const letterMatch = Object.keys(numberMap).find(k => normText.includes(k));
            if (letterMatch) quantity = numberMap[letterMatch];
        }

        const structuredCommand = { intent, product: product?.name, quantity, paymentMethod, customerName };
        console.log('🎯 Intent Parsed:', structuredCommand);

        // --- EXÉCUTION DE L'ACTION ---

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
                console.warn(`[Voice] No product match for: "${normText}" in catalog of ${count} items.`);
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
