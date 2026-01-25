import type { ClosetItem } from './ClosetService';
import { StyleMemory } from './StyleMemory';

/**
 * A Moodboard represents a specific visual aesthetic within a broad style.
 * E.g. "Old Money" is the Style, but "Riviera Summer" is the Moodboard (Navy/White/Linen).
 */
export interface Moodboard {
    id: string;
    name: string;
    description: string;
    styleCategory: string; // 'Old Money', 'Athleisure', etc.

    // VISUAL RULES
    colors: string[]; // Keywords: 'navy', 'white', 'beige', 'black'
    fabrics: string[]; // 'linen', 'cotton', 'tech', 'leather'

    // ITEM RULES
    requiredItems: string[]; // e.g., 'polo' AND 'chino'
    bannedItems: string[]; // e.g., 'hoodie'
}

export const StyleReferenceService = {
    // --- THE REFERENCE LIBRARY (Pinterest-inspired clusters) ---
    getMoodboardsForOccasion(occasion: string): Moodboard[] {
        const boards: Moodboard[] = [];

        // 1. DINNER / OLD MONEY BOARDS
        if (['Dinner', 'Date', 'Old Money'].includes(occasion)) {
            boards.push({
                id: 'om-riviera',
                name: 'Riviera Evening',
                description: 'Mediterranean luxury. Navy, White, Beige. Linen textues.',
                styleCategory: 'Old Money',
                colors: ['navy', 'white', 'cream', 'beige', 'blue', 'brown'],
                fabrics: ['linen', 'cotton'],
                requiredItems: ['shirt', 'polo', 'chino', 'loafer'],
                bannedItems: ['hoodie', 'sneaker', 'graphic', 'nylon']
            });
            boards.push({
                id: 'om-city',
                name: 'City Gentleman',
                description: 'Sharp urban dinner. Grey, Black, Crisp White.',
                styleCategory: 'Old Money',
                colors: ['grey', 'black', 'white', 'charcoal'],
                fabrics: ['wool', 'cotton'],
                requiredItems: ['blazer', 'trouser', 'shirt', 'boot', 'watch'],
                bannedItems: ['sneaker', 'short']
            });
        }

        // 2. SPORT / ATHLEISURE BOARDS
        if (['Sport', 'Athleisure'].includes(occasion)) {
            boards.push({
                id: 'sport-stealth',
                name: 'Stealth Tech',
                description: 'All black/grey technical gear. Sleek and modern.',
                styleCategory: 'Athleisure',
                colors: ['black', 'grey', 'charcoal', 'navy'],
                fabrics: ['tech', 'nylon', 'spandex'],
                requiredItems: ['hoodie', 'jogger', 'sneaker'],
                bannedItems: ['jeans', 'chino', 'watch', 'leather']
            });
            boards.push({
                id: 'sport-runner',
                name: 'Morning Run',
                description: 'Practical running gear. Shorts and Tees.',
                styleCategory: 'Athleisure',
                colors: ['blue', 'green', 'grey', 'white'],
                fabrics: ['mesh', 'tech'],
                requiredItems: ['short', 'tee', 'runner'],
                bannedItems: ['blazer', 'loafer']
            });
        }

        // 3. CASUAL / STREETWEAR
        if (['Casual', 'Streetwear'].includes(occasion)) {
            boards.push({
                id: 'street-essentials',
                name: 'Modern Essentials',
                description: 'Clean lines, neutral tones, high quality basics.',
                styleCategory: 'Casual',
                colors: ['black', 'white', 'grey', 'denim', 'olive'],
                fabrics: ['cotton', 'denim'],
                requiredItems: ['tee', 'jeans', 'sneaker', 'hoodie'],
                bannedItems: ['suit', 'tuxedo']
            });
        }

        return boards;
    },

    /**
     * Checks if an item visually fits the moodboard.
     * Uses keyword analysis on the item text to detect color/fabric.
     */
    matchesMoodboard(item: ClosetItem, board: Moodboard): number {
        const text = ((item.image || '') + ' ' + (item.category || '')).toLowerCase();

        // 1. HARD BAN CHECK
        if (board.bannedItems.some(ban => text.includes(ban))) return -100;

        // 2. USER UPLOAD EXCEPTION (The "Chameleon" Rule from StyleMemory)
        // If it's a user upload, we assume it matches color/fabric broadly unless banned
        const isUserUpload = item.image.includes('supabase') || item.image.includes('base64') || item.image.startsWith('blob:') || item.image.includes('processed-image');
        if (isUserUpload) return 100; // ALWAYS ALLOW USER UPLOADS. We cannot read their keywords, so we trust them.

        let score = 0;

        // 3. COLOR MATCH
        if (board.colors.some(c => text.includes(c))) score += 3;

        // 4. FABRIC/VIBE MATCH
        if (board.fabrics.some(f => text.includes(f))) score += 2;

        // 5. ITEM TYPE MATCH
        // Naive match: if board wants 'polo' and item is 'polo'
        if (board.requiredItems.length > 0) {
            // If the item matches ANY of the required types for the board
            if (board.requiredItems.some(req => text.includes(req))) score += 5;
        }

        return score;
    }
};
