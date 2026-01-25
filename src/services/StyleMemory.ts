import type { ClosetItem } from './ClosetService';

export interface StyleProfile {
    // The "Soul" of the item
    formality: number; // 1 (Gym) to 10 (Black Tie)
    vibes: Vibe[];
    isUserUpload: boolean;
}

export type Vibe = 'Sporty' | 'Casual' | 'Streetwear' | 'Smart Casual' | 'Old Money' | 'Business' | 'Formal' | 'Party';

export const StyleMemory = {
    /**
     * The Brain: Instantly analyzes an item to figure out its style.
     * In a real app, this would use AI Vision. Here, we use a smart keyword heuristic.
     */
    analyzeItem(item: ClosetItem): StyleProfile {
        const text = ((item.image || '') + ' ' + (item.category || '')).toLowerCase();
        const isUserUpload = item.image.includes('supabase') || item.image.includes('base64') || item.image.startsWith('blob:') || item.image.includes('processed-image');

        // Default Profile
        let profile: StyleProfile = {
            formality: 5,
            vibes: ['Casual'],
            isUserUpload
        };

        // --- 1. DETECT FORMALITY & VIBE ---

        // SPORTY / ATHLEISURE (Formality 1-3)
        if (checkKeywords(text, ['hoodie', 'sweat', 'tech', 'track', 'jogger', 'running', 'gym', 'athletic', 'short', 'accessoriesshoes', 'trainer', 'sneaker', 'active'])) {
            profile.formality = 2;
            profile.vibes = ['Sporty', 'Streetwear']; // Hoodies can be both
        }

        // STREETWEAR (Formality 3-4)
        if (checkKeywords(text, ['graphic', 'tee', 't-shirt', 'oversize', 'cargo', 'baggy', 'denim', 'jordan', 'dunk', 'cap'])) {
            profile.formality = 3;
            // T-Shirts are allowed in Gym (Sporty) AND Streetwear
            profile.vibes = ['Streetwear', 'Casual', 'Sporty'];
        }

        // CASUAL / ESSENTIALS (Formality 4-5)
        if (checkKeywords(text, ['plain', 'basic', 'cotton', 'jeans', 'blue', 'white'])) {
            profile.formality = 4;
            if (!profile.vibes.includes('Sporty')) profile.vibes.push('Casual');
        }

        // SMART CASUAL / OLD MONEY (Formality 6-8)
        // Removed generic 'shirt' to avoid matching 't-shirt' or 'sweatshirt'
        if (checkKeywords(text, ['polo', 'linen', 'chino', 'beige', 'khaki', 'loafer', 'boat', 'knit', 'sweater', 'button', 'collar', 'dress shirt', 'oxford'])) {
            profile.formality = 7;
            profile.vibes = ['Old Money', 'Smart Casual'];
        }

        // BUSINESS / FORMAL (Formality 8-10)
        // Removed 'dress' generic word if it matches 'dress-down', but 'dress' usually implies formal in category.
        if (checkKeywords(text, ['suit', 'blazer', 'trouser', 'tuxedo', 'leather', 'tie', 'formal', 'watch'])) {
            profile.formality = 9;
            profile.vibes = ['Business', 'Formal', 'Old Money']; // Overlap with Old Money
        }

        // WATCH SPECIAL CASE
        if (checkKeywords(text, ['watch', 'rolex', 'timex', 'seiko'])) {
            // Watches are usually dressy unless explicitly 'sport watch' (which we assume strict 'watch' keyword implies generic/dressy in this mock)
            profile.formality = 8;
            profile.vibes = ['Old Money', 'Business'];
        }

        // USER UPLOAD OVERRIDE (Chameleon Mode)
        // If it's a User Upload (blob/base64/processed) and we haven't detected a specific strong vibe (still just Casual),
        // we assume it is versatile. We give it the benefit of the doubt so it works in Sport/Streetwear.
        // We do NOT give it 'Formal' or 'Business' to avoid Blazers in the Gym, but we allow 'Sporty'.
        if (isUserUpload) {
            // If we didn't detect a specific HIGH formality (like Suit) or LOW formality (Sport), just broaden the vibes
            // so it passes the "Strict Sport" check.
            if (profile.formality >= 4 && profile.formality <= 6) {
                if (!profile.vibes.includes('Sporty')) profile.vibes.push('Sporty');
                if (!profile.vibes.includes('Streetwear')) profile.vibes.push('Streetwear');
                if (!profile.vibes.includes('Smart Casual')) profile.vibes.push('Smart Casual');
            }
        }

        return profile;
    },

    /**
     * The Gatekeeper: Decides if an item belongs in a specific Occasion.
     */
    isCompatible(item: ClosetItem, occasion: string): boolean {
        const profile = StyleMemory.analyzeItem(item);
        const target = getOccasionRules(occasion);

        // 1. FORMALITY CHECK
        // Item must be within range (e.g. Can't wear Formality 9 to Formality 2 event)
        // We allow +/- 3 range for user uploads, stricter for mocks.
        // Sport requires Formality <= 4
        if (target.strictSport && profile.formality > 6 && !profile.isUserUpload) return false;

        // 2. VIBE MATCH
        // Item must share at least one vibe with the target
        const hasMatchingVibe = profile.vibes.some(v => target.vibes.includes(v));

        // 3. EXPLICIT BANS
        // E.g. No 'Business' items in 'Sport'
        const isBanned = profile.vibes.some(v => target.bannedVibes.includes(v));

        if (isBanned) return false;

        // If it's a User Upload, be slightly more lenient IF not banned
        if (profile.isUserUpload && !isBanned) {
            return true; // Chameleon Mode active
        }

        return hasMatchingVibe;
    }
};

// --- HELPER: Define what each Occasion expects ---
function getOccasionRules(occasion: string) {
    switch (occasion) {
        case 'Sport':
        case 'Athleisure':
            return {
                targetFormality: 2,
                vibes: ['Sporty'],
                bannedVibes: ['Business', 'Formal', 'Old Money', 'Smart Casual'], // STRICT BAN on Watch/Loafers
                strictSport: true
            };
        case 'Dinner':
        case 'Date':
        case 'Old Money':
            return {
                targetFormality: 8,
                vibes: ['Old Money', 'Smart Casual', 'Business', 'Formal'],
                bannedVibes: ['Sporty', 'Streetwear'], // No Hoodies
                strictSport: false
            };
        case 'Work':
            return {
                targetFormality: 9,
                vibes: ['Business', 'Smart Casual'],
                bannedVibes: ['Sporty'],
                strictSport: false
            };
        case 'Party':
            return {
                targetFormality: 5,
                vibes: ['Streetwear', 'Casual', 'Smart Casual'], // Flexible
                bannedVibes: ['Sporty'], // Usually no gym clothes at parties
                strictSport: false
            };
        default: // Casual
            return {
                targetFormality: 4,
                vibes: ['Casual', 'Streetwear'],
                bannedVibes: ['Formal'], // No Tuxedos
                strictSport: false
            };
    }
}

function checkKeywords(text: string, keywords: string[]) {
    return keywords.some(k => text.includes(k));
}
