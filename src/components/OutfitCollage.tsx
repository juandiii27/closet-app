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
    // For this specific look: Sweater (Layer) + T-shirt (Base)
    const layer = tops.length > 1 ? tops[1] : null;
    const baseTop = tops.length > 0 ? tops[0] : null;

    const ItemWrapper = ({ item, className, children }: { item: ClosetItem, className?: string, children: React.ReactNode }) => {
        if (!onItemClick) return <div className={className}>{children}</div>;

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                }}
                className={clsx(className, "relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-95")}
            >
                {children}
                {/* Edit Icon Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm border border-black/5">
                        <Edit2 className="w-3 h-3 text-black" />
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="relative w-full h-full bg-[#f6f5f2] overflow-hidden p-6">
            {/* Grid Container for Flat Lay */}
            <div className="relative w-full h-full">

                {/* 1. HAT (Top Left / Top Center) */}
                {headwear && (
                    <div className="absolute top-[2%] left-[15%] w-[25%] h-[15%] z-20 rotate-[-15deg]">
                        <ItemWrapper item={headwear} className="w-full h-full flex items-center justify-center">
                            <img src={headwear.image} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" alt="Hat" />
                        </ItemWrapper>
                    </div>
                )}

                {/* 2. LAYER / SWEATER (Center Left) - Prominent */}
                {/* Use baseTop as main if no layer exists */}
                {(layer || baseTop) && (
                    <div className="absolute top-[18%] left-[5%] w-[55%] h-[45%] z-10 transition-all">
                        <ItemWrapper item={layer || baseTop!} className="w-full h-full flex items-center justify-center">
                            <img src={(layer || baseTop!).image} className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl" alt="Layer" />
                        </ItemWrapper>
                    </div>
                )}

                {/* 3. BASE TOP / T-SHIRT (Center Right) - Peek out or side by side */}
                {/* Only show if we have BOTH layer and base, otherwise 2 takes precedence */}
                {layer && baseTop && (
                    <div className="absolute top-[15%] right-[5%] w-[45%] h-[45%] z-0 rotate-[5deg]">
                        <ItemWrapper item={baseTop} className="w-full h-full flex items-center justify-center">
                            <img src={baseTop.image} className="w-full h-full object-contain mix-blend-multiply opacity-95" alt="Base Top" />
                        </ItemWrapper>
                    </div>
                )}

                {/* 4. BOTTOMS / JEANS (Bottom Right) - Heavy vertical align */}
                {bottom && (
                    <div className="absolute bottom-[2%] right-[5%] w-[40%] h-[55%] z-10">
                        <ItemWrapper item={bottom} className="w-full h-full flex items-start justify-center">
                            <img src={bottom.image} className="w-full h-full object-contain mix-blend-multiply drop-shadow-lg" alt="Bottoms" />
                        </ItemWrapper>
                    </div>
                )}

                {/* 5. SHOES (Bottom Left) - Walking into frame */}
                {shoes && (
                    <div className="absolute bottom-[5%] left-[5%] w-[45%] h-[25%] z-20">
                        <ItemWrapper item={shoes} className="w-full h-full flex items-center justify-center">
                            <img src={shoes.image} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md -rotate-3" alt="Shoes" />
                        </ItemWrapper>
                    </div>
                )}

                {/* 6. ACCESSORIES / WATCH (Floating Middle Gap) */}
                {otherAccessories.length > 0 && (
                    <div className="absolute bottom-[25%] left-[45%] w-[15%] h-[15%] z-30">
                        <ItemWrapper item={otherAccessories[0]} className="w-full h-full flex items-center justify-center">
                            <img src={otherAccessories[0].image} className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm rotate-[10deg]" alt="Accessory" />
                        </ItemWrapper>
                    </div>
                )}

            </div>
        </div>
    );
}

