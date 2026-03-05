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
    const { addItem, removeItem } = useCart();

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

        if (lowerText.includes('payé') || lowerText.includes('payer') || lowerText.includes('paye') || lowerText.includes('réglé') || lowerText.includes('donne')) {
            // "Fatou a payé" ou "Fatou a tout payé" ou "Fatou a réglé"
            let clientMatch = lowerText.match(/([a-zA-Záàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+)\s+(?:a|me)\s+(?:tout\s+|enfin\s+)?(?:payé|payer|paye|réglé)/i);

            // "Payé sa dette pour Fatou" ou "Payé à Fatou"
            if (!clientMatch) {
                clientMatch = lowerText.match(/(?:payé|payer|paye|réglé|donne)\s+(?:sa\s+dette\s+)?(?:à|pour|a)\s+([a-zA-Záàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+)/i);
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
            } else if (lowerText.includes('payé') || lowerText.includes('paye')) {
                speak("Je n'ai pas compris qui a payé sa dette.");
                return;
            }
        }

        // 2. Identifier le produit
        const product = products.find(p => {
            const name = p.name.toLowerCase();
            const audioName = p.audioName.toLowerCase().replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
            return lowerText.includes(name) || lowerText.includes(audioName);
        });

        if (!product) {
            speak(`Désolé ${userName}, je n'ai pas compris de quel produit tu parles.`);
            return;
        }

        // 3. Identifier la quantité et le prix (Ex: "Vend 2 tomates 3000")
        let quantity = 1;
        let customPrice: number | undefined = undefined;

        const allNumbers = Array.from(lowerText.matchAll(/(\d+)/g)).map(m => parseInt(m[1]));

        if (allNumbers.length === 1) {
            if (allNumbers[0] >= 50) {
                customPrice = allNumbers[0];
            } else {
                quantity = allNumbers[0];
            }
        } else if (allNumbers.length >= 2) {
            if (allNumbers[0] < 50 && allNumbers[1] >= 50) {
                quantity = allNumbers[0];
                customPrice = allNumbers[1];
            } else if (allNumbers[0] >= 50 && allNumbers[1] < 50) {
                customPrice = allNumbers[0];
                quantity = allNumbers[1];
            } else {
                quantity = allNumbers[0];
            }
        }

        const priceMatch = lowerText.match(/(?:à|pour|f|francs|cfa|prix)?\s*(\d{2,}(?:[.,]\d+)?)\s*(?:francs|f|cfa|balle|mille)?/i);
        if (priceMatch) {
            const parsedPrice = parseInt(priceMatch[1].replace(/[,.]/g, ''));
            if (parsedPrice >= 50) customPrice = parsedPrice;
        }

        const finalProduct = { ...product };
        if (customPrice !== undefined) {
            finalProduct.price = customPrice;
        }

        // 4. Identifier l'action produit
        if (lowerText.includes('ajoute') || lowerText.includes('reçu') || lowerText.includes('livré') || lowerText.includes('prend')) {
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
        else if (lowerText.includes('vendu') || lowerText.includes('vend')) {
            const isDebtCommand = lowerText.includes('crédit') || lowerText.includes('dette');

            // Extraire le nom du client (après à, a, pour) en ignorant "crédit" et "dette"
            const clientMatches = Array.from(lowerText.matchAll(/(?:à|pour|a)\s+([a-zA-Záàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+)/gi));
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
        else if (lowerText.includes('retire') || lowerText.includes('enlève') || lowerText.includes('supprime')) {
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
            speak("Je n'ai pas compris ce que tu veux faire avec ce produit.");
        }
    }, [speak, updateStock, getStockLevel, addTransaction, markAsPaid, addItem, removeItem, pathname, history]);

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
