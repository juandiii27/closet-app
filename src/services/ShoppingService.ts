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
        itemName: 'Cashmere Cable Knit',
        description: 'Soft, luxurious, and perfectly preppy.',
        reason: 'The ultimate Old Money staple',
        price: '$250',
        category: 'Tops',
        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format',
        styleTags: ['old_money', 'vintage', 'formal']
    },
    {
        itemName: 'Y2K Baby Tee',
        description: 'Cropped graphic tee with rhinestone details.',
        reason: 'Trending Y2K piece',
        price: '$35',
        category: 'Tops',
        imageUrl: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format',
        styleTags: ['y2k', 'streetwear', 'casual']
    },
    {
        itemName: 'Baggy Cargo Pants',
        description: 'Wide-leg utility pants with multiple pockets.',
        reason: 'Essential for the Y2K silhouette',
        price: '$75',
        category: 'Bottoms',
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format',
        styleTags: ['y2k', 'streetwear', 'grunge']
    },
    {
        itemName: 'Flowy Maxi Dress',
        description: 'Floral print dress for effortless vibes.',
        reason: 'Classic Boho Chic',
        price: '$89',
        category: 'Dresses', // New category implies we might need to handle it in filtering
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format',
        styleTags: ['boho', 'vintage', 'casual']
    },
    {
        itemName: 'Fringe Suede Bag',
        description: 'Add texture and movement to your outfit.',
        reason: 'Completes the Boho look',
        price: '$110',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format',
        styleTags: ['boho', 'vintage', 'casual']
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
        styleTags: ['streetwear', 'y2k', 'grunge'] // Removed 'y2k' from here? No kept it.
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
            // Relaxed filtering to ensure items show up
            if (rec.category === 'Shoes' && hasShoes && Math.random() > 0.5) return false; // Only filter 50% of the time if they have shoes
            // if (rec.itemName.includes('Belt') && !hasBottoms) return false; // Remove this rule
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
