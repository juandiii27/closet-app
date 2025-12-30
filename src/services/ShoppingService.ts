import { StoreService } from './StoreService';
import { type ClosetItem } from './ClosetService'; // Import directly from service

export interface Recommendation {
    id: string;
    itemName: string;
    description: string;
    reason: string;
    price: string;
    storeId: string;
    storeName: string; // denormalized for ease
    category: string;
    imageUrl: string;
    styleTags?: string[]; // Added: Styles this item fits (e.g. ['streetwear', 'casual'])
}

const MOCK_RECOMMENDATIONS = [
    {
        itemName: 'Classic Leather Belt',
        description: 'A timeless accessory to elevate your denim look.',
        reason: 'Matches well with your Jeans',
        price: '$45',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1624223034555-9b2f278eb084?auto=format',
        styleTags: ['minimalist', 'old_money', 'casual']
    },
    {
        itemName: 'White Minimalist Sneakers',
        description: 'Clean, versatile sneakers for everyday wear.',
        reason: 'You are missing casual footwear',
        price: '$120',
        category: 'Shoes',
        imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format',
        styleTags: ['minimalist', 'streetwear', 'casual']
    },
    {
        itemName: 'Oversized Beige Blazer',
        description: 'Perfect for layering over t-shirts.',
        reason: 'Trending item for your style',
        price: '$180',
        category: 'Outerwear',
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format',
        styleTags: ['old_money', 'chic', 'formal']
    },
    {
        itemName: 'Silk Scarf',
        description: 'Add a pop of pattern to neutral outfits.',
        reason: 'Complements your black top',
        price: '$65',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?auto=format',
        styleTags: ['vintage', 'boho', 'chic']
    },
    {
        itemName: 'Vintage Denim Jacket',
        description: 'Distressed classic for cool evenings.',
        reason: 'Matches your vibe',
        price: '$95',
        category: 'Outerwear',
        imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format',
        styleTags: ['vintage', 'streetwear', 'casual']
    },
    {
        itemName: 'Chunky Boots',
        description: 'Statement footwear that lasts.',
        reason: 'Trending',
        price: '$150',
        category: 'Shoes',
        imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format',
        styleTags: ['streetwear', 'y2k', 'grunge']
    }
];

export const ShoppingService = {
    getRecommendations: async (userCloset: ClosetItem[], userStyles: string[] = []): Promise<Recommendation[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Analyze Closet
        const hasShoes = userCloset.some(item => item.category === 'Shoes');
        const hasBottoms = userCloset.some(item => item.category === 'Bottoms');
        const hasOuterwear = userCloset.some(item => item.category === 'Outerwear');

        // Filter/Prioritize recommendations
        let personalizedRecs = MOCK_RECOMMENDATIONS.filter(rec => {
            if (rec.category === 'Shoes' && hasShoes) return false; // Don't suggest shoes if they have them (simple logic)
            if (rec.itemName.includes('Belt') && !hasBottoms) return false; // Don't suggest belt if no pants
            return true;
        });

        // Boost logic: Move styled items to top if they match user preference
        if (userStyles.length > 0) {
            personalizedRecs = personalizedRecs.sort((a, b) => {
                const aMatch = a.styleTags?.some(tag => userStyles.includes(tag)) ? 1 : 0;
                const bMatch = b.styleTags?.some(tag => userStyles.includes(tag)) ? 1 : 0;
                return bMatch - aMatch; // Descending order (match first)
            });
        }

        // If we filtered everything, fall back to some defaults or show 'Trending'
        const finalRecs = personalizedRecs.length > 0 ? personalizedRecs : MOCK_RECOMMENDATIONS.slice(0, 2);

        // Get stores to link to
        const center = await StoreService.getUserLocation();
        const stores = await StoreService.getNearbyStores(center.lat, center.lng);

        return finalRecs.map((rec, i) => {
            const randomStore = stores[Math.floor(Math.random() * stores.length)];

            // Dynamic Reason
            let reason = rec.reason;
            const matchesStyle = rec.styleTags?.find(tag => userStyles.includes(tag));

            if (matchesStyle) {
                // Formatting: capitalize first letter of style
                const styleName = matchesStyle.charAt(0).toUpperCase() + matchesStyle.slice(1);
                reason = `Matches your ${styleName} vibe`;
            } else {
                if (rec.category === 'Shoes' && !hasShoes) reason = 'You are missing casual footwear';
                if (rec.category === 'Outerwear' && !hasOuterwear) reason = 'Complete your look with a layer';
            }

            return {
                id: `rec-${i}`,
                ...rec,
                reason,
                storeId: randomStore.id,
                storeName: randomStore.name
            };
        });
    }
};
