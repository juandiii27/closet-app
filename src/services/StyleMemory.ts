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
            formality: isUserUpload ? 6 : 5, // User uploads get a slight bump if mystery
            vibes: ['Casual'],
            isUserUpload
        };

        // --------------------
        // TOP TYPE DETECTION
        // --------------------
        const isTop = item.category === 'Tops';

        const hasFormalMarkers = checkKeywords(text, [
            'button', 'collar', 'oxford', 'linen', 'dress-shirt'
        ]);

        const isDressShirt =
            isTop &&
            hasFormalMarkers;

        const isTee =
            isTop &&
            !isDressShirt &&
            (
                // Standard detection: Not a formal item
                (!isUserUpload && !checkKeywords(text, ['polo', 'knit', 'sweater', 'button', 'collar', 'oxford', 'linen'])) ||
                // Upload detection: MUST have explicit tee keywords to be a tee
                (isUserUpload && checkKeywords(text, ['t-shirt', 'tee', 'tank', 'graphic']))
            );



        // --------------------
        // ATHLETIC DETECTION (FIXED SHORTS LOGIC)
        // --------------------
        const isAthleticShort = checkKeywords(text, [
            'gym short',
            'training short',
            'running short',
            'basketball short',
            'mesh short'
        ]);

        const hasAthleticKeywords =
            checkKeywords(text, [
                'tech', 'track', 'running', 'gym', 'athletic', 'mesh',
                'dry-fit', 'performance', 'active', 'sweat', 'jogger', 'hoodie'
            ]) || isAthleticShort;

        // AMBIGUITY CLAUSE — USER UPLOAD WILDCARD
        if (
            isUserUpload &&
            (item.category === 'Tops' || item.category === 'Bottoms') &&
            !hasAthleticKeywords &&
            !hasFormalMarkers &&
            !isTee
        ) {
            profile.formality = 5; // Neutral midpoint
            profile.vibes = ['Casual']; // Neutral, NOT Sporty, NOT Formal
            (profile as any).isAmbiguous = true; // internal flag
        }

        // 🔒 HARD LOCK — ATHLETIC NEVER EVOLVES
        if (hasAthleticKeywords && !isDressShirt && !(profile as any).isAmbiguous) {
            return {
                formality: 2,
                vibes: ['Sporty'],
                isUserUpload
            };
        }

        // --------------------
        // TOP CLASSIFICATION
        // --------------------
        if (isDressShirt) {
            profile.formality = 7;
            profile.vibes = ['Smart Casual', 'Old Money'];
        }
        else if (isTee) {
            profile.formality = 3;
            profile.vibes = ['Casual', 'Streetwear'];
        }

        // --------------------
        // SNEAKER LOGIC (REFINED)
        // --------------------
        if (checkKeywords(text, ['sneaker', 'trainer', 'jordan', 'dunk'])) {
            const isCleanSneaker = checkKeywords(text, ['leather', 'minimal', 'white']);

            profile.formality = isCleanSneaker ? 4 : 2;
            profile.vibes = isCleanSneaker
                ? ['Casual', 'Smart Casual']
                : ['Sporty', 'Streetwear'];
        }

        // --------------------
        // CASUAL ESSENTIALS (NO TEE PROMOTION)
        // --------------------
        if (
            !isTee &&
            checkKeywords(text, ['plain', 'basic', 'cotton', 'jeans', 'straw', 'hat', 'cap'])
        ) {
            profile.formality = isUserUpload ? 5 : 4;
            if (!profile.vibes.includes('Casual')) profile.vibes.push('Casual');
        }

        // POLOS ("T-Shirts with Buttons") - Formality 5.5
        // They are cleaner than tees (3) but less formal than dress shirts (7)
        if (checkKeywords(text, ['polo'])) {
            profile.formality = 5.5;
            profile.vibes = ['Old Money', 'Smart Casual'];
        }

        // SMART CASUAL / OLD MONEY (Formality 7-8)
        if (checkKeywords(text, ['linen', 'chino', 'beige', 'khaki', 'knit', 'sweater', 'button', 'collar', 'oxford', 'loafer', 'boat'])) {
            profile.formality = 7;
            profile.vibes = ['Old Money', 'Smart Casual'];
        }

        // FORMAL (Formality 8-10)
        if (checkKeywords(text, ['suit', 'blazer', 'trouser', 'tuxedo', 'leather', 'tie', 'formal', 'dress shirt', 'button down'])) {
            profile.formality = 9;
            profile.vibes = ['Formal', 'Business', 'Old Money'];
        }

        // --- 2. ISOLATION: SHIRT VS T-SHIRT ---
        // (Old block removed as isTee is now defined earlier and stronger)

        // RE-CHECK GENERIC "SHIRT" - Only promote if it's actually FORMAL
        if (text.includes('shirt') && hasFormalMarkers) {
            if (profile.formality < 7) {
                profile.formality = 7;
                profile.vibes = ['Old Money', 'Smart Casual'];
            }
        }

        // --------------------
        // WATCHES (SUPPORTIVE, NOT DOMINANT)
        // --------------------
        if (checkKeywords(text, ['watch', 'rolex', 'timex', 'seiko'])) {
            profile.formality = Math.max(profile.formality, 7);
            profile.vibes = Array.from(
                new Set([...profile.vibes, 'Old Money'])
            );
        }

        return profile;
    },

    /**
     * The Gatekeeper: Decides if an item belongs in a specific Occasion.
     * ACCURACY > OUTPUT: One fail = No outfit.
     * NOW: Uses strict Vibe & Formality checks from the optimized "Brain" (analyzeItem).
     * No more text re-parsing here.
     */
    isCompatible(item: ClosetItem, occasion: string): boolean {
        const profile = StyleMemory.analyzeItem(item);
        const text = ((item.image || '') + ' ' + (item.category || '')).toLowerCase();

        // 🇩🇴 DOMINICAN REPUBLIC STYLE RULES (Vibe-Based)
        switch (occasion) {
            case 'Sport':
            case 'Athleisure':
                if ((profile as any).isAmbiguous) return true;
                // 🇩🇴 SPORT RULES: Pure function.
                // MUST have Sporty vibe.
                // ABSOLUTELY NO Dress Pants/Jeans
                if (checkKeywords(text, ['pant', 'trouser', 'jeans', 'legging', 'chino', 'slack'])) return false;
                // ABSOLUTELY NO: Business, Formal, Old Money (Polos/Chinos are detected as these).
                if (profile.vibes.includes('Business') || profile.vibes.includes('Formal') || profile.vibes.includes('Old Money')) {
                    return false;
                }
                return profile.vibes.includes('Sporty');

            case 'Dinner':
            case 'Old Money':
                if (
                    profile.vibes.includes('Sporty') ||
                    profile.vibes.includes('Streetwear') ||
                    (profile.vibes.includes('Casual') && !profile.vibes.includes('Old Money'))
                ) {
                    return false;
                }
                return profile.formality >= 5.5;

            case 'Date':
                // 🇩🇴 DATE RULES: Effort + Confidence.
                // ABSOLUTELY NO: Sporty (Gym wear).
                if (profile.vibes.includes('Sporty')) {
                    return false;
                }
                // Formality check: 5+ (Allow nice Casual + Smart Casual)
                return profile.formality >= 5;

            case 'Party':
                // 🇩🇴 PARTY RULES: Stylish.
                // ABSOLUTELY NO: Sporty (Gym shorts).
                if (profile.vibes.includes('Sporty')) {
                    return false;
                }
                // Flexible formality, but usually not strict Business (unless stylish)
                return profile.vibes.includes('Streetwear') || profile.vibes.includes('Casual') || profile.vibes.includes('Smart Casual') || profile.vibes.includes('Party');

            case 'Work':
                // 🇩🇴 WORK RULES: Professional.
                if ((profile as any).isAmbiguous) return false;
                if (profile.vibes.includes('Sporty') || profile.vibes.includes('Streetwear')) {
                    return false;
                }
                return profile.vibes.includes('Business') || profile.vibes.includes('Smart Casual') || profile.vibes.includes('Formal');

            default: // Casual
                // 🇩🇴 CASUAL RULES: Relaxed.
                // ABSOLUTELY NO: Formal (Tuxedos).
                if (profile.vibes.includes('Formal') || profile.vibes.includes('Business')) {
                    return false;
                }
                return true;
        }
    }
};



function checkKeywords(text: string, keywords: string[]) {
    return keywords.some(k => text.includes(k));
}
