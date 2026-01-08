import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Store, StoreService } from '../services/StoreService';
import { Navigation, Star } from 'lucide-react';

// Custom Marker Icon Logic
const createCustomIcon = (logoUrl: string, fallbackUrl?: string) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `
        <div class="relative group">
            <div class="w-12 h-12 rounded-full overflow-hidden border-[3px] border-white shadow-lg bg-white relative z-10 transition-transform duration-300 hover:scale-110">
                <img 
                    src="${logoUrl}" 
                    alt="" 
                    class="w-full h-full object-cover" 
                    onerror="this.onerror=null; this.src='${fallbackUrl || logoUrl}';"
                />
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-sm z-0"></div>
        </div>
        `,
        iconSize: [48, 54], // Slightly taller for pointer
        iconAnchor: [24, 54], // Anchor at bottom tip
        popupAnchor: [0, -54],
    });
};

// User Location Icon
const userIcon = L.divIcon({
    className: 'user-location',
    html: `
    <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-full h-full bg-blue-500/30 rounded-full animate-ping"></div>
        <div class="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md"></div>
    </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

import { useCloset } from '../hooks/useCloset';

export default function StoreMap() {
    const { items } = useCloset();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<{ lat: number, lng: number } | null>(null);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    // Derive active categories from closet
    // Derive active categories from closet (Gap Analysis)
    const presentCategories = new Set(items.map(i => i.category));
    const allCategories = ['Tops', 'Bottoms', 'Shoes', 'Accessories'];

    // Find what the user is MISSING
    let targetCategories = allCategories.filter(c => !presentCategories.has(c as any));

    // If user has everything (or nothing yet to judge), just show everything/trends
    if (targetCategories.length === 0) {
        targetCategories = allCategories;
    }

    const loadingMessage = `Scouting stores for what you need (${targetCategories.slice(0, 2).join(' & ')})...`;

    useEffect(() => {
        StoreService.getUserLocation().then(location => {
            setCenter(location);
            // Pass MISSING categories to filter stores
            StoreService.getNearbyStores(location.lat, location.lng, targetCategories).then(data => {
                setStores(data);
                setLoading(false);
            });
        });
    }, [items.length]); // Re-fetch if items change meaningfully



    if (loading || !center) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center flex-col">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
                <p className="text-sm text-gray-500">{loadingMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col relative z-0 h-[calc(100vh-80px)] w-full">
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={14}
                className="w-full h-full"
                zoomControl={false}
                attributionControl={false} // Clean look
            >
                {/* Apple Maps Style Layer (Esri World Street Map) */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                />

                {/* User Location */}
                <Marker position={[center.lat, center.lng]} icon={userIcon} />

                {/* Store Markers */}
                {stores.map(store => (
                    <Marker
                        key={store.id}
                        position={[store.lat, store.lng]}
                        icon={createCustomIcon(store.logoUrl, store.fallbackUrl)}
                        eventHandlers={{
                            click: () => setSelectedStore(store),
                        }}
                    />
                ))}
            </MapContainer>

            {/* Selected Store Popup (Custom Overlay) */}
            {selectedStore && (
                <div className="absolute bottom-6 left-4 right-4 z-[400] bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedStore.name}</h3>
                            <p className="text-gray-500 text-sm">{selectedStore.address}</p>
                        </div>
                        <button onClick={() => setSelectedStore(null)} className="text-gray-400 hover:text-black">
                            ✕
                        </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-yellow-500 text-sm font-bold gap-1">
                            <Star className="w-4 h-4 fill-current" /> {selectedStore.rating}
                        </div>
                        <button className="text-sm bg-black text-white px-4 py-2 rounded-full flex items-center gap-2">
                            <Navigation className="w-3 h-3" /> Directions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
