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

                const generated = generateFromPool(boardCandidates, board.name, board.description, occasion);

                // CRITICAL: Tier 1 (Moodboards) should only show COMPLETE fits.
                // If the board doesn't have enough pieces to make a full Top + Bottom look, skip it.
                // This prevents "Sneaker only" Stealth Tech outfits.
                const completeFits = generated.filter(g => g.items.some(i => i.category === 'Tops') && g.items.some(i => i.category === 'Bottoms'));

                outfits.push(...completeFits);
            }

            // --- TIER 2: LOGIC ONLY (The "Safe" Zone) ---
            // If Tier 1 didn't fill the deck (e.g. strict visuals failed), use just the StyleMemory logic.
            // Tier 2 should ALSO focus on COMPLETE outfits to provide quality over partials.
            if (outfits.length < 5) {
                console.log('Tier 2: Fallback to StyleMemory Logic (Complete Fit Priority)');
                const logicCandidates = items.filter(item => StyleMemory.isCompatible(item, occasion));

                const generated = generateFromPool(logicCandidates, `${occasion} Essential`, `${styleTheme}`, occasion);

                // Only take complete fits from Tier 2 to prioritize quality.
                const completeFits = generated.filter(g => g.items.some(i => i.category === 'Tops') && g.items.some(i => i.category === 'Bottoms'));

                // Filter out duplicates
                for (const fit of completeFits) {
                    const id = fit.items.map(k => k.id).sort().join('-');
                    if (!outfits.some(o => o.items.map(m => m.id).sort().join('-') === id)) {
                        outfits.push(fit);
                    }
                }
            }

            // --- TIER 3: EMERGENCY FALLBACK / PARTIALS (Graceful Degradation) ---
            // This is the ONLY place where partial outfits are allowed, and only if we still have nothing.
            if (outfits.length === 0) {
                console.log('Tier 3: Graceful Degradation (Allowing Partials)');

                // Disable fallback for Formal if NO items match at all (preventing sheer randomness)
                const filteredPool = items.filter(item => StyleMemory.isCompatible(item, occasion));

                if (filteredPool.length === 0 && ['Dinner', 'Date', 'Work'].includes(occasion)) {
                    console.log(`No compatible items at all for formal occasion: ${occasion}`);
                    return [];
                }

                // Generate from compatible pool, letting generateFromPool handle partials.
                const generated = generateFromPool(filteredPool, `${occasion} Essential`, 'Partial fallback', occasion);

                generated.forEach(g => {
                    g.isFallback = true;
                    // Note: generateFromPool already sets the specific missingCategoryWarning
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
function generateFromPool(pool: ClosetItem[], title: string, styleTag: string, occasion: string): Outfit[] {
    const tops = pool.filter(i => i.category === 'Tops');
    const bottoms = pool.filter(i => i.category === 'Bottoms');
    const shoes = pool.filter(i => i.category === 'Shoes');
    const accessories = pool.filter(i => i.category === 'Accessories');

    // --- GRACEFUL DEGRADATION ---
    // At least one item is required. We no longer force Top + Bottom for a valid result.
    if (pool.length === 0) return [];

    const results: Outfit[] = [];
    const ATTEMPTS = 10;

    for (let i = 0; i < ATTEMPTS; i++) {
        if (results.length >= 2) break;

        const items: ClosetItem[] = [];
        const top = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null;
        const bottom = bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : null;
        const shoe = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;
        const accessory = accessories.length > 0 ? accessories[Math.floor(Math.random() * accessories.length)] : null;

        if (top) items.push(top);
        if (bottom) items.push(bottom);
        if (shoe) items.push(shoe);
        if (accessory) items.push(accessory);

        if (items.length === 0) continue;

        // --- ZERO EXCEPTION VALIDATION ---
        // Every single item must pass the style enforcement gatekeeper.
        const isAllCompatible = items.every(item => StyleMemory.isCompatible(item, occasion));
        if (!isAllCompatible) {
            console.log(`[STRICT] Rejected assembled outfit for ${title} due to item incompatibility.`);
            continue;
        }

        // Dedup check (simple)
        const id = items.map(k => k.id).sort().join('-');
        if (!results.some(r => r.items.map(m => m.id).sort().join('-') === id)) {
            const hasUserItem = items.some(it => it.image.includes('supabase') || it.image.includes('blob:'));

            // Check for completeness
            let warning = '';
            if (!top || !bottom) {
                warning = `Wardrobe limitation: Missing compatible ${!top ? 'tops' : 'bottoms'} for a full ${occasion} look.`;
            }

            results.push({
                id: crypto.randomUUID(),
                items,
                title,
                styleTag,
                score: 0.9 + (hasUserItem ? 0.1 : 0),
                missingCategoryWarning: warning
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
