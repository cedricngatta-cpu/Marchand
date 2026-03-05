'use client';

import { useHistoryContext } from '../context/HistoryContext';

export const useHistory = () => {
    return useHistoryContext();
};
