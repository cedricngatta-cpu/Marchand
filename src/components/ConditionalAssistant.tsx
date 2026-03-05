'use client';

import { usePathname } from 'next/navigation';
import { VoiceAssistant } from './VoiceAssistant';

export const ConditionalAssistant = () => {
    const pathname = usePathname();

    // On affiche l'assistant sur les dashboards principaux
    const allowedSubstrings = ['/commercant', '/producteur', '/cooperative'];
    const isAllowed = allowedSubstrings.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (!isAllowed) return null;

    return <VoiceAssistant />;
};
