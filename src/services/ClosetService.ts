import { supabase } from '../lib/supabase';
import type { Category } from '../context/ClosetContext';

export type Gender = 'Mens' | 'Womens' | 'Unisex';

export interface ClosetItem {
    id: string;
    image: string; // URL
    category: Category;
    gender: Gender;
    user_id: string;
    created_at: string;
}

const LOCAL_STORAGE_KEY = 'closet-items';

export const ClosetService = {
    async getItems(userId: string): Promise<ClosetItem[]> {
        if (!supabase) {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            const items: ClosetItem[] = stored ? JSON.parse(stored) : [];
            // Filter by mock user ID if we wanted to be strict, but for local mock we show all
            return items;
        }

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addItem(item: Omit<ClosetItem, 'id' | 'created_at'>): Promise<ClosetItem> {
        if (!supabase) {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            const items: ClosetItem[] = stored ? JSON.parse(stored) : [];

            const newItem: ClosetItem = {
                ...item,
                id: crypto.randomUUID(), // Generate ID for mock
                created_at: new Date().toISOString()
            };

            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newItem, ...items]));
            return newItem;
        }

        // Debug logging
        const { data: { user } } = await supabase.auth.getUser();
        console.log("DEBUG: Supabase Auth ID:", user?.id);
        console.log("DEBUG: Item Payload User ID:", item.user_id);

        const { data, error } = await supabase
            .from('items')
            .insert([item]) // Supabase generates ID
            .select()
            .single();

        if (error) {
            console.error("DEBUG: Insert Error Details:", error);
            throw error;
        }
        return data;
    },

    async deleteItem(id: string): Promise<void> {
        if (!supabase) {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                const items: ClosetItem[] = JSON.parse(stored);
                const filtered = items.filter(i => i.id !== id);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
            }
            return;
        }

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getPublicItems(userId: string): Promise<ClosetItem[]> {
        // In a real app, this would fetch from Supabase with RLS policies allowing public read
        console.log(`Fetching public items for user: ${userId}`);

        // Mock Response: A curated "public" closet
        return [
            { id: '1', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=500', category: 'Tops', gender: 'Unisex', user_id: userId, created_at: new Date().toISOString() },
            { id: '2', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=500', category: 'Bottoms', gender: 'Unisex', user_id: userId, created_at: new Date().toISOString() },
            { id: '3', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500', category: 'Shoes', gender: 'Unisex', user_id: userId, created_at: new Date().toISOString() },
            { id: '4', image: 'https://images.unsplash.com/photo-1576186726580-a816e8b12896?auto=format&fit=crop&q=80&w=500', category: 'Accessories', gender: 'Unisex', user_id: userId, created_at: new Date().toISOString() },
            { id: '5', image: 'https://images.unsplash.com/photo-1551028919-ac6635f0e5c9?auto=format&fit=crop&q=80&w=500', category: 'Tops', gender: 'Womens', user_id: userId, created_at: new Date().toISOString() },
        ];
    }
};
