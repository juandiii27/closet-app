import type { ClosetItem } from './ClosetService';

export interface Outfit {
    id: string;
    items: ClosetItem[];
    title?: string;
    score?: number;
    styleTag?: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const StylistService = {
    // Map Occasions to specific "Styles" or "Vibes"
    getStyleForOccasion(occasion: string): string {
        const STYLE_RULES: Record<string, string> = {
            'Casual': 'Streetwear & Comfort',
            'Work': 'Business Casual',
            'Party': 'Glam & Chic',
            'Date': 'Romantic & Elegant', // Or "Old Money" if user specifically wants that mapping
            'Dinner': 'Old Money',        // Specific user request
            'Sport': 'Athleisure'
        };
        return STYLE_RULES[occasion] || 'Smart Casual';
    },

    async generateOutfits(items: ClosetItem[], occasion: string = 'Casual'): Promise<Outfit[]> {
        const styleTheme = StylistService.getStyleForOccasion(occasion);
        console.log(`Generating outfits for ${occasion} (Theme: ${styleTheme})`);

        if (!OPENAI_API_KEY) {
            console.log('Mock Mode: Generating random outfits');
            if (items.length === 0) return [];

            const tops = items.filter(i => i.category === 'Tops');
            const bottoms = items.filter(i => i.category === 'Bottoms');
            const shoes = items.filter(i => i.category === 'Shoes');
            const accessories = items.filter(i => i.category === 'Accessories');

            // If few items OR missing categories, simplify logic
            if (items.length < 3) {
                return items.map(item => ({
                    id: crypto.randomUUID(),
                    items: [item], // Just one item
                    title: `Spotlight: ${item.category}`,
                    score: 0.9,
                    styleTag: styleTheme // Pass the theme to the UI
                }));
            }

            const outfits: Outfit[] = [];

            // Generate outfits: Top + Bottom + (Optional Shoes) + (Optional Accessories)
            for (const top of tops) {
                const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
                if (bottom) {
                    const outfitItems = [top, bottom];

                    // Add random shoes if available
                    if (shoes.length > 0) {
                        const shoe = shoes[Math.floor(Math.random() * shoes.length)];
                        outfitItems.push(shoe);
                    }

                    // Add random accessory if available
                    if (accessories.length > 0) {
                        const acc = accessories[Math.floor(Math.random() * accessories.length)];
                        outfitItems.push(acc);
                    }

                    outfits.push({
                        id: crypto.randomUUID(),
                        items: outfitItems,
                        title: `${occasion} Look`,
                        score: Math.random(),
                        styleTag: styleTheme // Pass the theme to the UI
                    });
                }
            }

            return outfits.slice(0, 5); // Limit to 5 for now
        }

        // Real AI implementation would go here (call OpenAI with image URLs)
        // For now, we stub it.
        throw new Error("AI Stylist not fully implemented yet");
    },

    savePlannedOutfit(outfit: Outfit, date: string): void {
        const planned: PlannedOutfit = {
            id: crypto.randomUUID(),
            date,
            outfit
        };
        const existing = StylistService.getPlannedOutfits();
        existing.push(planned);
        // Sort by date
        existing.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        localStorage.setItem('closet_planned_outfits', JSON.stringify(existing));
    },

    getPlannedOutfits(): PlannedOutfit[] {
        const stored = localStorage.getItem('closet_planned_outfits');
        return stored ? JSON.parse(stored) : [];
    },

    deletePlannedOutfit(id: string): void {
        const existing = StylistService.getPlannedOutfits();
        const updated = existing.filter(p => p.id !== id);
        localStorage.setItem('closet_planned_outfits', JSON.stringify(updated));
    }
};

export interface PlannedOutfit {
    id: string;
    date: string;
    outfit: Outfit;
}
