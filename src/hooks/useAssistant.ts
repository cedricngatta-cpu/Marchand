import { useCallback, useEffect } from 'react';
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
    const { speak, listen, isSpeaking, isListening, transcript, clearTranscript, stopSpeaking } = useVoice();
    const { updateStock, getStockLevel } = useStock();
    const { history, addTransaction, markAsPaid, markAllAsPaid } = useHistory();
    const { items, addItem, removeItem } = useCart();

    const userName = user?.name?.split(' ')[0] || 'Marchand';
    const userRole = user?.role || 'MERCHANT';

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
        const lowerText = text.toLowerCase();

        // Pre-processing : Corriger les erreurs de transcription courantes (French quirks)
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        let processedText = lowerText
            .replace(/\bvingt[\s-]deux\s+rue\b/g, 'vend 2 riz')
            .replace(/\bvingt[\s-]deux\b/g, 'vend 2')
            .replace(/\bvingt[\s-]trois\b/g, 'vend 3')
            .replace(/\b22\s+rue\b/g, 'vend 2 riz')
            .replace(/\b23\s+riz\b/g, 'vend 3 riz')
            .replace(/\b22\b/g, 'vend 2')
            .replace(/\b23\b/g, 'vend 3')
            .replace(/\brue\b/g, 'riz'); // Par précaution, rue est souvent entendu pour riz

        const lowerTextProcessed = processedText;
        const normText = normalize(lowerTextProcessed);

        if (products.length === 0) {
            speak(`Mon catalogue est encore vide ${userName}. Va dans ton profil pour le mettre à jour.`);
            return;
        }

        // --- SECTION 1: INTENTIONS GLOBALES (STOCK, PANIER, ETC.) ---
        if (normText.includes('stock') || normText.includes('inventaire') || normText.includes('reste') || normText.includes('bilan')) {
            const inStock = products.filter(p => getStockLevel(p.id) > 0);
            if (inStock.length > 0) {
                const list = inStock.slice(0, 3).map(p => p.audioName || p.name).join(', ');
                const totalItems = inStock.length;
                speak(`Tu as du stock pour ${totalItems} produits, comme le ${list}. Pour lequel veux-tu le détail ?`, true);
            } else {
                speak(`${userName}, ton stock est vide. Tu dois ajouter des produits.`);
            }
            return;
        }

        if ((normText.includes('panier') || normText.includes('commande')) && (normText.includes('quoi') || normText.includes('voir') || normText.includes('liste'))) {
            if (pathname === '/vendre' && items.length > 0) {
                const list = items.slice(0, 3).map(item => item.name).join(', ');
                speak(`Dans ton panier, il y a : ${list}.`);
            } else if (pathname === '/vendre') {
                speak(`Ton panier est vide ${userName}.`);
            } else {
                speak(`Je peux t'aider avec tes ventes, ${userName}. Est-ce que tu veux vendre quelque chose ?`, true);
            }
            return;
        }

        // --- SECTION 2: GESTION DES DETTES ---
        if (normText.includes('paye') || normText.includes('payer') || normText.includes('regle') || normText.includes('donne')) {
            // "Fatou a payé" ou "Fatou a tout payé" ou "Fatou a réglé"
            let clientMatch = lowerTextProcessed.match(/([a-zA-Záàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+)\s+(?:a|me)\s+(?:tout\s+|enfin\s+)?(?:payé|payer|paye|réglé)/i);

            // "Payé sa dette pour Fatou" ou "Payé à Fatou"
            if (!clientMatch) {
                clientMatch = lowerTextProcessed.match(/(?:payé|payer|paye|réglé|donne)\s+(?:sa\s+dette\s+)?(?:à|pour|a)\s+([a-zA-Záàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+)/i);
            }

            const clientName = clientMatch ? (clientMatch[1]).trim() : undefined;

            if (clientName && clientName.toLowerCase() !== 'dette' && clientName.toLowerCase() !== 'sa') {
                const clientDebts = history.filter(t => t.status === 'DETTE' && t.clientName?.toLowerCase() === clientName.toLowerCase());
                if (clientDebts.length > 0) {
                    const totalPaid = clientDebts.reduce((acc, t) => acc + t.price, 0);
                    markAllAsPaid(clientName);
                    speak(`C'est fait ${userName}. J'ai marqué que ${clientName} a tout payé, soit ${totalPaid} francs.`);
                    return;
                } else {
                    speak(`${userName}, je ne trouve pas de dette pour ${clientName}.`);
                    return;
                }
            } else if (lowerTextProcessed.includes('payé') || lowerTextProcessed.includes('paye')) {
                speak("Je n'ai pas compris qui a payé sa dette.");
                return;
            }
        }

        if (products.length === 0) {
            speak(`Mon catalogue est encore vide ${userName}. Va dans ton profil pour le mettre à jour.`);
            return;
        }

        // 2. Identifier le produit (Détection ultra-flexible avec phonétique)
        const genericWords = ['sac', 'paquet', 'boite', 'boîte', 'bidon', 'litre', 'unité', 'morceau', 'kilo', 'gramme', 'de', 'le', 'la', 'les', 'des', 'un', 'une'];
        const phonetics: Record<string, string[]> = {
            'riz': ['rz', 'ri', 'ry', 'rise', 'ris', 'rue', 'roue'],
            'huile': ['uil', 'oile', 'huil'],
            'sucre': ['suc', 'suk', 'sucre'],
            'biscuit': ['biscui', 'biscuite', 'biski'],
            'attieke': ['atieke', 'adjeke', 'ateke']
        };

        const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

        const product = sortedProducts.find(p => {
            const nName = normalize(p.name);
            const nAudio = normalize(p.audioName || p.name).replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');

            const wordsInText = normText.split(/[\s']+/);
            const pKeywords = nName.split(/[\s']+/).filter(w => w.length >= 2 && !genericWords.includes(w));
            const aKeywords = nAudio.split(/[\s']+/).filter(w => w.length >= 2 && !genericWords.includes(w));
            const allKeywords = [...new Set([...pKeywords, ...aKeywords])];

            // 1. Match Direct ou Complet
            if (normText.includes(nName) || normText.includes(nAudio)) return true;

            // 2. Match par mots-clés et racines (Gestion des pluriels et fautes)
            return wordsInText.some(word => {
                // Check direct match or startsWith
                if (allKeywords.some(kw => word.startsWith(kw) || kw.startsWith(word))) return true;

                // Gestion générique des terminaisons (s, x, t, e muets)
                const cleanWord = word.replace(/[sxte]$/, '');
                if (cleanWord.length >= 3 && allKeywords.some(kw => kw.startsWith(cleanWord) || cleanWord.startsWith(kw.replace(/[sxte]$/, '')))) return true;

                // Check phonetic aliases
                return allKeywords.some(kw => {
                    const aliases = phonetics[kw] || [];
                    return aliases.some(alias => word.includes(alias) || alias.includes(word));
                });
            });
        });

        if (!product) {
            speak(`Désolé ${userName}, je n'ai pas trouvé ce produit dans ton catalogue. J'ai entendu "${text}".`, true);
            return;
        }

        // 3. Identifier la quantité et le prix
        const numberMap: Record<string, number> = {
            'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
            'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10
        };

        let quantity = 1;
        let customPrice: number | undefined = undefined;

        // Tenter de trouver des chiffres
        const allDigits = Array.from(normText.matchAll(/(\d+)/g)).map(m => parseInt(m[1]));

        // Tenter de trouver des nombres en lettres
        const words = normText.split(/[\s']+/);
        const letterNumber = words.find(w => numberMap[w]) ? numberMap[words.find(w => numberMap[w])!] : null;

        if (allDigits.length > 0) {
            if (allDigits.length === 1) {
                if (allDigits[0] >= 50) customPrice = allDigits[0];
                else quantity = allDigits[0];
            } else {
                // Si on a 2 nombres, le premier est souvent la quantité, le 2ème le prix (ou inversement si 1er > 50)
                if (allDigits[0] < 50) {
                    quantity = allDigits[0];
                    if (allDigits[1] >= 50) customPrice = allDigits[1];
                } else {
                    customPrice = allDigits[0];
                    if (allDigits[1] < 50) quantity = allDigits[1];
                }
            }
        } else if (letterNumber) {
            quantity = letterNumber;
        }

        const priceMatch = lowerTextProcessed.match(/(?:à|pour|f|francs|cfa|prix)?\s*(\d{2,}(?:[.,]\d+)?)\s*(?:francs|f|cfa|balle|mille)?/i);
        if (priceMatch) {
            const parsedPrice = parseInt(priceMatch[1].replace(/[,.]/g, ''));
            if (parsedPrice >= 50) customPrice = parsedPrice;
        }

        const finalProduct = { ...product };
        if (customPrice !== undefined) {
            finalProduct.price = customPrice;
        }

        // 4. Identifier l'action produit
        if (lowerTextProcessed.includes('ajoute') || lowerTextProcessed.includes('reçu') || lowerTextProcessed.includes('livré') || lowerTextProcessed.includes('prend')) {
            if (pathname === '/vendre') {
                addItem(finalProduct, quantity);
                speak(`${formatSpeech(finalProduct.audioName, quantity)} ajouté au panier.`);
            } else {
                updateStock(finalProduct.id, quantity);
                addTransaction({
                    type: 'LIVRAISON',
                    productId: finalProduct.id,
                    productName: finalProduct.name,
                    quantity: quantity,
                    price: finalProduct.price * quantity
                });
                speak(`${formatSpeech(finalProduct.audioName, quantity)} ajouté au stock.`);
            }
        }
        else if (lowerTextProcessed.includes('vendu') || lowerTextProcessed.includes('vend')) {
            const isDebtCommand = lowerTextProcessed.includes('crédit') || lowerTextProcessed.includes('dette');

            // Extraire le nom du client (après à, a, pour) en ignorant "crédit" et "dette"
            const clientMatches = Array.from(lowerTextProcessed.matchAll(/(?:à|pour|a)\s+([a-zA-Záàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+)/gi));
            let clientName = undefined;

            for (const match of clientMatches) {
                const name = match[1].trim();
                const lowerName = name.toLowerCase();
                if (lowerName !== 'crédit' && lowerName !== 'dette' && lowerName !== 'panier') {
                    clientName = name;
                    break;
                }
            }

            if (pathname === '/vendre') {
                addItem(finalProduct, quantity);

                let feedback = formatSpeech(finalProduct.audioName, quantity);
                if (customPrice !== undefined) feedback += ` à ${customPrice} francs`;
                if (clientName) feedback += ` pour ${clientName}`;
                if (isDebtCommand) feedback += ` en dette`;
                speak(`${feedback} ajouté au panier.`);

                window.dispatchEvent(new CustomEvent('assistant-set-client', {
                    detail: {
                        name: clientName,
                        status: isDebtCommand ? 'DETTE' : 'PAYÉ'
                    }
                }));

                // Déclencher la validation automatique UNIQUEMENT sur ordre explicite de fin
                if (lowerTextProcessed.includes('termine') || lowerTextProcessed.includes('fini') || lowerTextProcessed.includes('confirme')) {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('assistant-finish-sale'));
                    }, 1500);
                }
            } else {
                const currentStock = getStockLevel(finalProduct.id);
                if (currentStock < quantity) {
                    speak(`Attention ${userName}, tu n'as pas assez de ${finalProduct.audioName} en stock pour en vendre autant.`);
                    return;
                }
                updateStock(finalProduct.id, -quantity);
                addTransaction({
                    type: 'VENTE',
                    productId: finalProduct.id,
                    productName: finalProduct.name,
                    quantity: quantity,
                    price: finalProduct.price * quantity,
                    clientName: clientName,
                    status: isDebtCommand ? 'DETTE' : 'PAYÉ'
                });

                if (clientName) {
                    speak(`${formatSpeech(finalProduct.audioName, quantity)} vendu ${customPrice !== undefined ? `à ${customPrice} francs ` : ''}${isDebtCommand ? 'à crédit ' : ''}à ${clientName} !`);
                } else {
                    speak(`${formatSpeech(finalProduct.audioName, quantity)} vendu ${customPrice !== undefined ? `à ${customPrice} francs ` : ''}${isDebtCommand ? 'à crédit ' : ''}!`);
                }
            }
        }
        else if (lowerTextProcessed.includes('retire') || lowerTextProcessed.includes('enlève') || lowerTextProcessed.includes('supprime')) {
            if (pathname === '/vendre') {
                removeItem(finalProduct.id);
                speak(`${finalProduct.audioName} retiré du panier.`);
            } else {
                updateStock(finalProduct.id, -quantity);
                addTransaction({
                    type: 'RETRAIT',
                    productId: finalProduct.id,
                    productName: finalProduct.name,
                    quantity: quantity,
                    price: finalProduct.price * quantity
                });
                speak(`${formatSpeech(finalProduct.audioName, quantity)} retiré du stock.`);
            }
        }
        else {
            // Par défaut : Information sur le produit (Stock et Prix)
            const currentStock = getStockLevel(finalProduct.id);
            speak(`Pour le ${finalProduct.audioName}, tu en as ${currentStock} en stock et le prix est de ${finalProduct.price} francs.`);
        }
    }, [speak, updateStock, getStockLevel, addTransaction, markAsPaid, addItem, removeItem, pathname, history, products, userName, items]);

    useEffect(() => {
        stopSpeaking();

        const greetings: Record<string, string> = {
            '/': `Bienvenue ${userName}. Appuie sur le gros bouton en bas pour me parler.`,
            '/commercant': `Bonjour ${userName}. Prêt pour tes ventes de la journée ?`,
            '/producteur': `Bonjour ${userName}. Voici l'état de ta production et de tes stocks.`,
            '/cooperative': `Bonjour ${userName}. Prêt pour piloter ta coopérative ?`,
            '/vendre': `Enregistre tes ventes ici, ${userName}. Choisis tes produits.`,
            '/stock': `C'est ton stock, ${userName}. Regarde ce qu'il te reste en boutique.`,
            '/bilan': `Voici ton bilan, ${user?.name?.split(' ')[0] || 'Marchand'}. Regarde ton argent et tes ventes.`,
            '/acheter': `Ici ${user?.name?.split(' ')[0] || 'Marchand'}, tu peux noter ce que les livreurs t'apportent.`,
            '/carnet': `C'est ton carnet de dettes, ${user?.name?.split(' ')[0] || 'Marchand'}. Voici ceux qui ne t'ont pas encore payé.`
        };

        const timer = setTimeout(() => {
            if (greetings[pathname]) {
                speak(greetings[pathname]);
            }
        }, 800);

        return () => {
            clearTimeout(timer);
            stopSpeaking();
        };
    }, [pathname, speak, stopSpeaking]);

    useEffect(() => {
        if (transcript && !isListening) {
            processCommand(transcript);
            clearTranscript();
        }
    }, [transcript, isListening, processCommand, clearTranscript]);

    return { speak, listen, isSpeaking, isListening, stopSpeaking, handleAction };
};
