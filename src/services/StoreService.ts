export interface Store {
    id: string;
    name: string;
    address: string;
    type: 'Boutique' | 'Mall' | 'Vintage' | 'Designer';
    lat: number;
    lng: number;
    rating: number;
    isOpen: boolean;
    logoUrl: string;
    fallbackUrl?: string;
}

// Mocking a location centered around a demo city (e.g., SoHo, NYC)
// const CENTER_LAT = 40.7233;
// const CENTER_LNG = -74.0030;

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Helper to get initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const CATEGORY_MAP: Record<string, Store['type']> = {
    'clothes': 'Boutique',
    'department_store': 'Mall',
    'boutique': 'Boutique',
    'shoes': 'Boutique',
    'jewelry': 'Designer',
    'fashion': 'Designer',
    'second_hand': 'Vintage',
    'charity': 'Vintage'
};

const BACKGROUND_COLORS = ['18181b', 'dc2626', '0284c7', '7c3aed', 'b45309', 'd97706'];

export const StoreService = {
    getNearbyStores: async (centerLat: number, centerLng: number, itemCategories: string[] = []): Promise<Store[]> => {
        try {
            // Map internal categories to OSM shop tags
            let shopTags: string[] = [];

            if (itemCategories.length === 0) {
                // Default if no closet data: broad search
                shopTags = ["clothes", "department_store", "boutique", "jewelry", "second_hand"];
            } else {
                if (itemCategories.includes('Tops') || itemCategories.includes('Bottoms')) {
                    shopTags.push("clothes", "boutique", "department_store");
                }
                if (itemCategories.includes('Shoes')) {
                    shopTags.push("shoes");
                }
                if (itemCategories.includes('Accessories')) {
                    shopTags.push("jewelry", "fashion", "bag");
                }
                if (itemCategories.includes('Outerwear')) {
                    shopTags.push("clothes", "outdoor");
                }
            }

            // Deduplicate
            shopTags = [...new Set(shopTags)];
            const tagString = shopTags.join('|');

            console.log(`Fetching stores for tags: ${tagString}`);

            // Overpass QL query
            const query = `
                [out:json][timeout:25];
                (
                  node["shop"~"${tagString}"](around:3000,${centerLat},${centerLng});
                  way["shop"~"${tagString}"](around:3000,${centerLat},${centerLng});
                );
                out center;
            `;

            const response = await fetch(OVERPASS_API_URL, {
                method: 'POST',
                body: "data=" + encodeURIComponent(query)
            });

            if (!response.ok) {
                console.error("Overpass API Error:", response.statusText);
                throw new Error("Failed to fetch stores");
            }

            const data = await response.json();

            if (!data.elements || data.elements.length === 0) {
                return [];
            }

            return data.elements.map((element: any) => {
                const tags = element.tags || {};
                const name = tags.name || "Unknown Store";
                const type = CATEGORY_MAP[tags.shop] || 'Boutique';
                const lat = element.lat || element.center?.lat || centerLat;
                const lng = element.lon || element.center?.lon || centerLng;

                // Get deterministic color based on name length
                const bgColor = BACKGROUND_COLORS[name.length % BACKGROUND_COLORS.length];
                const initials = getInitials(name) || 'ST';

                return {
                    id: String(element.id),
                    name: name,
                    address: tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}` : "Address unavailable",
                    type: type,
                    lat: lat,
                    lng: lng,
                    rating: 4.0 + (name.length % 10) / 10, // Pseudo-random real-ish rating
                    isOpen: true, // Assuming open for MVP
                    logoUrl: `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=128&bold=true`
                };
            }).filter((store: Store) => store.name !== "Unknown Store");

        } catch (error) {
            console.error("Failed to fetch real stores, falling back to mock:", error);
            // Fallback to empty or previous mock logic if critical failure
            return [];
        }
    },

    getUserLocation: (): Promise<{ lat: number, lng: number }> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                // Fallback to NYC if geolocation is not supported
                resolve({ lat: 40.7233, lng: -74.0030 });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation denied or failed, using default', error);
                    resolve({ lat: 40.7233, lng: -74.0030 });
                }
            );
        });
    }
};
