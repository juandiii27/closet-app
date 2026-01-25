import type { ClosetItem } from './ClosetService';
import { StyleMemory } from './StyleMemory';
import { StyleReferenceService } from './StyleReference';

export interface Outfit {
    id: string;
    items: ClosetItem[];
    title?: string;
    score?: number;
    styleTag?: string;
    isFallback?: boolean;
    missingCategoryWarning?: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const StylistService = {
    // Map Occasions to specific "Styles" or "Vibes"
    getStyleForOccasion(occasion: string): string {
        const STYLE_RULES: Record<string, string> = {
            'Casual': 'Streetwear & Comfort',
            'Work': 'Business Casual',
            'Party': 'Glam & Chic',
            'Date': 'Romantic & Elegant',
            'Dinner': 'Old Money',
            'Sport': 'Athleisure'
        };
        return STYLE_RULES[occasion] || 'Smart Casual';
    },

    async generateOutfits(items: ClosetItem[], occasion: string = 'Casual'): Promise<Outfit[]> {
        const styleTheme = StylistService.getStyleForOccasion(occasion);
        console.log(`Generating outfits for ${occasion} (Theme: ${styleTheme})`);

        if (!OPENAI_API_KEY) {
            console.log('Mock Mode: Generating Outfits (Tiered Strategy)');
            if (items.length === 0) return [];

            const outfits: Outfit[] = [];

            // --- TIER 1: STRICT VISUAL MOODBOARDS ---
            // Tries to create "Pinterest Perfect" looks
            const moodboards = StyleReferenceService.getMoodboardsForOccasion(occasion);
            const shuffledBoards = moodboards.sort(() => 0.5 - Math.random());

            for (const board of shuffledBoards) {
                if (outfits.length >= 3) break; // Limit strict ones

                const boardCandidates = items.filter(item => {
                    // 1. Is it allowed? (The Logic)
                    const compatible = StyleMemory.isCompatible(item, occasion);
                    // 2. Does it fit the visual theme? (The Vibe)
                    // Note: User Uploads score 100 here via StyleReference updates
                    const visualScore = StyleReferenceService.matchesMoodboard(item, board);
                    return compatible && visualScore > 0;
                });

                const generated = generateFromPool(boardCandidates, board.name, board.description);
                outfits.push(...generated);
            }

            // --- TIER 2: LOGIC ONLY (The "Safe" Zone) ---
            // If Tier 1 didn't fill the deck (e.g. strict visuals failed), use just the StyleMemory logic
            // This catches User Uploads that might have failed strict color checks but are technically allowed
            if (outfits.length < 5) {
                console.log('Tier 2: Fallback to StyleMemory Logic');
                const logicCandidates = items.filter(item => StyleMemory.isCompatible(item, occasion));

                const generated = generateFromPool(logicCandidates, `${occasion} Essential`, `${styleTheme}`);

                // Filter out duplicates
                for (const fit of generated) {
                    const id = fit.items.map(k => k.id).sort().join('-');
                    // @ts-ignore
                    if (!outfits.some(o => o.items.map(k => k.id).sort().join('-') === id)) {
                        outfits.push(fit);
                    }
                }
            }

            // --- TIER 3: EMERGENCY FALLBACK (Anything Goes) ---
            // If literally nothing matched (e.g. user has only 1 item or total mismatches), just return SOMETHING.
            if (outfits.length === 0) {
                console.log('Tier 3: Emergency Fallback');
                const generated = generateFromPool(items, 'Mixed Style', 'Experimental fallback');

                // Tag these as Fallbacks so the UI can warn the user
                generated.forEach(g => {
                    g.isFallback = true;
                    g.missingCategoryWarning = `We couldn't find items matching "${occasion}" rules. Showing mixed options instead.`;
                });

                outfits.push(...generated);
            }

            return outfits.sort((a, b) => (b.score || 0) - (a.score || 0));
        }

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

// Helper to assemble outfits from a specific filtered pool
function generateFromPool(pool: ClosetItem[], title: string, styleTag: string): Outfit[] {
    const tops = pool.filter(i => i.category === 'Tops');
    const bottoms = pool.filter(i => i.category === 'Bottoms');
    const shoes = pool.filter(i => i.category === 'Shoes');
    const accessories = pool.filter(i => i.category === 'Accessories');

    if (tops.length === 0 || bottoms.length === 0) return [];

    const results: Outfit[] = [];
    const ATTEMPTS = 10;

    for (let i = 0; i < ATTEMPTS; i++) {
        if (results.length >= 2) break;

        const top = tops[Math.floor(Math.random() * tops.length)];
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];

        const items = [top, bottom];
        if (shoes.length > 0) items.push(shoes[Math.floor(Math.random() * shoes.length)]);
        if (accessories.length > 0) items.push(accessories[Math.floor(Math.random() * accessories.length)]);

        // Dedup check (simple)
        const id = items.map(k => k.id).sort().join('-');
        // @ts-ignore
        if (!results.some(r => r.items.map(k => k.id).sort().join('-') === id)) {
            const hasUserItem = items.some(it => it.image.includes('supabase') || it.image.includes('blob:'));
            results.push({
                id: crypto.randomUUID(),
                items,
                title,
                styleTag,
                score: 0.9 + (hasUserItem ? 0.1 : 0)
            });
        }
    }
    return results;
}

export interface PlannedOutfit {
    id: string;
    date: string;
    outfit: Outfit;
}
