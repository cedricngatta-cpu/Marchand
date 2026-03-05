'use client';

import { useVoiceContext } from '../context/VoiceContext';

export const useVoice = () => {
    return useVoiceContext();
};
