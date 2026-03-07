import { LucideIcon } from 'lucide-react';

export interface Product {
    id: string;
    name: string;
    icon: LucideIcon;
    imageUrl?: string;
    barcode?: string;
    price: number;
    color: string;
    iconColor: string;
    status?: string;
    audioName: string;
    category?: string;
}
