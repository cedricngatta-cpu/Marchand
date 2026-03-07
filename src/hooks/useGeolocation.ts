'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    loading: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lng: null,
        error: null,
        loading: false,
    });

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: 'La géolocalisation n\'est pas supportée par ce navigateur.' }));
            return;
        }

        setState(s => ({ ...s, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    error: null,
                    loading: false,
                });
            },
            (err) => {
                const messages: Record<number, string> = {
                    1: 'Permission de localisation refusée.',
                    2: 'Position introuvable.',
                    3: 'Délai de localisation dépassé.',
                };
                setState({
                    lat: null,
                    lng: null,
                    error: messages[err.code] ?? 'Erreur de localisation.',
                    loading: false,
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    return { ...state, requestLocation };
}
