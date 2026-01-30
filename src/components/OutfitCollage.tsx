import type { ClosetItem } from '../services/ClosetService';
import { Edit2 } from 'lucide-react';
import { clsx } from 'clsx';

interface OutfitCollageProps {
    items: ClosetItem[];
    onItemClick?: (item: ClosetItem) => void;
}

export function OutfitCollage({ items, onItemClick }: OutfitCollageProps) {
    // Categorize items
    const tops = items.filter(i => i.category === 'Tops');
    const bottom = items.find(i => i.category === 'Bottoms');
    const shoes = items.find(i => i.category === 'Shoes');
    const accessories = items.filter(i => i.category === 'Accessories');

    // Slot Logic
    const headwear = accessories.find(i => i.image.toLowerCase().includes('hat') || i.image.toLowerCase().includes('cap'));
    const otherAccessories = accessories.filter(i => i !== headwear);

    // Logic to distinguish Layer vs Base Top (Naive: First top is base, second is layer, or random)
    const layer = tops.length > 1 ? tops[1] : null;
    const baseTop = tops.length > 0 ? tops[0] : null; // Main top (Sweater/Shirt)

    const ItemWrapper = ({ item, className, children }: { item: ClosetItem, className?: string, children: React.ReactNode }) => {
        if (!onItemClick) return <div className={className}>{children}</div>;

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                }}
                className={clsx(className, "relative group cursor-pointer transition-transform duration-500 ease-out hover:scale-[1.03] active:scale-95")}
            >
                {children}
                {/* Edit Icon Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-black/5">
                        <Edit2 className="w-4 h-4 text-black" />
                    </div>
                </div>
            </button>
        );
    };

    // --- VARIANT 0: SINGLE ITEM SPOTLIGHT ---
    if (items.length === 1) {
        const item = items[0];
        return (
            <div className="relative w-full h-full bg-white overflow-hidden p-8 flex items-center justify-center">
                <ItemWrapper item={item} className="w-full h-full flex items-center justify-center">
                    <img
                        src={item.image}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl"
                        alt="Spotlight Item"
                    />
                </ItemWrapper>
            </div>
        );
    }

    // --- VARIANT 4: "CLUSTERED" AESTHETIC STUDIO LAYOUT (Un-centered Top) ---
    // Background: Studio Spotlight + Noise.
    // Spec: Shirt 50% (Left aligned), Shoes 25%.

    // Simple noise texture (base64)
    const noisePattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

    return (
        <div
            className="relative w-full h-full overflow-hidden p-0 transition-colors duration-500"
            style={{
                background: `radial-gradient(circle at 60% 40%, #f4f4f5 0%, #e4e4e7 60%, #d4d4d8 100%)`
            }}
        >
            {/* Noise Overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply opacity-40"
                style={{ backgroundImage: noisePattern }}
            />

            {/* 1. LAYER (Undershirt) - Peeking from Top Right */}
            {layer && (
                <div className="absolute top-[5%] right-[10%] w-[35%] h-[30%] flex items-center justify-center z-10 opacity-90">
                    <ItemWrapper item={layer} className="w-full h-full flex items-center justify-center rotate-6 scale-95 opacity-90 blur-[0.5px]">
                        <img src={layer.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-sm" alt="Layer" />
                    </ItemWrapper>
                </div>
            )}

            {/* 2. BOTTOMS - The Foundation. */}
            {/* Keeping at 70% width, Left 20% (Centered-ish). */}
            {bottom && (
                <div className="absolute top-[30%] left-[25%] w-[70%] h-[60%] flex items-start justify-center z-10">
                    <ItemWrapper item={bottom} className="w-full h-full flex items-start justify-center">
                        <img src={bottom.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-[0_20px_40px_rgba(0,0,0,0.12)]" alt="Bottom" />
                    </ItemWrapper>
                </div>
            )}

            {/* 3. MAIN TOP - The Hero. */}
            {/* REQUEST: Higher. Changed top-5% -> top-0%. */}
            {(baseTop) && (
                <div className="absolute top-[0%] left-[2%] w-[50%] h-[55%] flex items-center justify-center z-30">
                    <ItemWrapper item={baseTop} className="w-full h-full flex items-center justify-center">
                        <img src={baseTop.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]" alt="Top" />
                    </ItemWrapper>
                </div>
            )}

            {/* 4. SHOES - Bottom Left. */}
            {/* REQUEST: 25% Width. */}
            {shoes && (
                <div className="absolute bottom-[20%] left-[5%] w-[25%] h-[25%] flex items-center justify-center z-40">
                    <ItemWrapper item={shoes} className="w-full h-full flex items-center justify-center">
                        <img src={shoes.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-xl -rotate-12" alt="Shoes" />
                    </ItemWrapper>
                </div>
            )}

            {/* --- ACCESSORIES --- */}

            {/* Hat - Top Left (Adjusted for new Top position) */}
            {headwear && (
                <div className="absolute top-[2%] right-[5%] w-[20%] h-[15%] flex items-center justify-center z-40">
                    <ItemWrapper item={headwear} className="w-full h-full flex items-center justify-center">
                        <img src={headwear.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-lg rotate-12" alt="Hat" />
                    </ItemWrapper>
                </div>
            )}

            {/* Watch - Right Mid */}
            {otherAccessories[0] && (
                <div className="absolute top-[45%] right-[5%] w-[20%] h-[18%] flex items-center justify-center z-40">
                    <ItemWrapper item={otherAccessories[0]} className="w-full h-full flex items-center justify-center">
                        <img src={otherAccessories[0].image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-md" alt="Acc 1" />
                    </ItemWrapper>
                </div>
            )}

            {/* Wallet - Bottom Right */}
            {otherAccessories[1] && (
                <div className="absolute bottom-[18%] right-[5%] w-[20%] h-[15%] flex items-center justify-center z-40">
                    <ItemWrapper item={otherAccessories[1]} className="w-full h-full flex items-center justify-center">
                        <img src={otherAccessories[1].image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-md rotate-6" alt="Acc 2" />
                    </ItemWrapper>
                </div>
            )}

        </div>
    );
}
