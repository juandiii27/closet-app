import type { ReactNode } from 'react';
import { createContext, useEffect, useState, useContext } from 'react';
import { ClosetService, type ClosetItem, type Gender } from '../services/ClosetService';
import { useAuth } from './AuthContext';

export type Category = 'Tops' | 'Bottoms' | 'Shoes' | 'Outerwear' | 'Accessories' | 'Other';
export type { Gender };

// Re-exporting for compatibility, though ideally we use ClosetItem from service
export interface ClosetItemContextType extends Omit<ClosetItem, 'user_id' | 'created_at'> {
    createdAt?: number; // Legacy support if needed, or we map it
}

interface ClosetContextType {
    items: ClosetItem[];
    addItem: (item: { image: string; category: Category; gender: Gender }) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    loading: boolean;
}

export const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

export function useCloset() {
    const context = useContext(ClosetContext);
    if (context === undefined) {
        throw new Error('useCloset must be used within a ClosetProvider');
    }
    return context;
}

export function ClosetProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<ClosetItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadItems() {
            if (!user) {
                setItems([]);
                setLoading(false);
                return;
            }
            try {
                const data = await ClosetService.getItems(user.id);
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadItems();
    }, [user]);

    const addItem = async (newItem: { image: string; category: Category; gender: Gender }) => {
        if (!user) return; // Should be protected anyway

        // Optimistic update (optional) or wait for server
        try {
            const savedItem = await ClosetService.addItem({
                image: newItem.image,
                category: newItem.category,
                gender: newItem.gender,
                user_id: user.id
            });
            setItems(prev => [savedItem, ...prev]);
        } catch (error) {
            console.error("Failed to add item", error);
            throw error;
        }
    };

    const deleteItem = async (id: string) => {
        try {
            await ClosetService.deleteItem(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    return (
        <ClosetContext.Provider value={{ items, addItem, deleteItem, loading }}>
            {children}
        </ClosetContext.Provider>
    );
}
