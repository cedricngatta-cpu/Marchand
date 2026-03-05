'use client';

import { useStockContext } from '../context/StockContext';

export const useStock = () => {
    return useStockContext();
};
