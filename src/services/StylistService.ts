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
            console.log('Mock Mode: Generating CURATED outfits');
            if (items.length === 0) return [];

            // Helper to score item fit for a style
            const scoreItemForStyle = (item: ClosetItem, style: string): number => {
                // Use 'image' URL/filename as a proxy for description in this mock environment
                // (Real app would use AI vision tags or user input text)
                const text = ((item.image || '') + ' ' + (item.category || '')).toLowerCase();

                // 1. OLD MONEY / DINNER
                if (style.includes('Old Money') || style.includes('Smart Casual') || style.includes('Business')) {
                    if (['shirt', 'polo', 'button', 'linen', 'blazer', 'suit', 'jacket'].some(k => text.includes(k))) return 2;
                    if (['chino', 'slack', 'trouser', 'dress pant'].some(k => text.includes(k))) return 2;
                    if (['loafer', 'boot', 'dress shoe', 'leather', 'oxford'].some(k => text.includes(k))) return 2;
                    if (['watch', 'belt', 'leather'].some(k => text.includes(k))) return 1.5;
                    // Penalty for mismatched items
                    if (['hoodie', 'sweat', 'jogger', 'graphic', 'running', 'gym'].some(k => text.includes(k))) return -10;
                }

                // 2. ATHLEISURE / SPORT
                if (style.includes('Athleisure') || style.includes('Sport')) {
                    if (['hoodie', 'sweat', 'tech', 'zip', 'track'].some(k => text.includes(k))) return 2;
                    if (['jogger', 'short', 'running', 'legging'].some(k => text.includes(k))) return 2;
                    if (['sneaker', 'trainer', 'runner', 'sport'].some(k => text.includes(k))) return 2;
                    // Penalty
                    if (['blazer', 'loafer', 'dress', 'shirt', 'button'].some(k => text.includes(k))) return -10;
                }

                // 3. STREETWEAR / CASUAL
                if (style.includes('Streetwear') || style.includes('Casual')) {
                    if (['tee', 't-shirt', 'graphic', 'hoodie', 'oversize'].some(k => text.includes(k))) return 2;
                    if (['cargo', 'jeans', 'denim', 'baggy'].some(k => text.includes(k))) return 2;
                    if (['sneaker', 'jordan', 'nike', 'dunk'].some(k => text.includes(k))) return 2;
                    // Penalty
                    if (['suit', 'tuxedo', 'oxford'].some(k => text.includes(k))) return -5;
                }

                // Default neutral score if no strong match, but no penalty
                return 0.5;
            };

            const fitsStyle = (item: ClosetItem) => scoreItemForStyle(item, styleTheme) > 0;

            // Filter closet by the requested theme
            const relevantTops = items.filter(i => i.category === 'Tops' && fitsStyle(i));
            const relevantBottoms = items.filter(i => i.category === 'Bottoms' && fitsStyle(i));
            const relevantShoes = items.filter(i => i.category === 'Shoes' && fitsStyle(i));
            const relevantAcc = items.filter(i => i.category === 'Accessories' && fitsStyle(i));

            // Fallback: If strict filtering returns nothing, use generic items (but warn)
            const safeTops = relevantTops.length > 0 ? relevantTops : items.filter(i => i.category === 'Tops');
            const safeBottoms = relevantBottoms.length > 0 ? relevantBottoms : items.filter(i => i.category === 'Bottoms');
            const safeShoes = relevantShoes.length > 0 ? relevantShoes : items.filter(i => i.category === 'Shoes');

            const outfits: Outfit[] = [];

            // Generate outfits from the FILTERED compatible pools
            for (const top of safeTops) {
                // Try to find a bottom that matches this specific top's vibe
                // (Simple randomization within the filtered set is 'safe enough' because the set itself is filtered)
                const bottom = safeBottoms[Math.floor(Math.random() * safeBottoms.length)];

                if (bottom) {
                    const outfitItems = [top, bottom];

                    if (safeShoes.length > 0) {
                        const shoe = safeShoes[Math.floor(Math.random() * safeShoes.length)];
                        outfitItems.push(shoe);
                    }

                    // Add accessories (Smart logic: Watch for formal, Hat for street)
                    if (relevantAcc.length > 0) {
                        // Try to pick acc with positive score
                        const bestAcc = relevantAcc.sort((a, b) => scoreItemForStyle(b, styleTheme) - scoreItemForStyle(a, styleTheme))[0];
                        if (bestAcc) outfitItems.push(bestAcc);
                    }

                    outfits.push({
                        id: crypto.randomUUID(),
                        items: outfitItems,
                        title: `${occasion} Look`,
                        score: 0.95,
                        styleTag: styleTheme
                    });
                }
            }

            // Shuffle and return
            return outfits.sort(() => 0.5 - Math.random()).slice(0, 5);
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
