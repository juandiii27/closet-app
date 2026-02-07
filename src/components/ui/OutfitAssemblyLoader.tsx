
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ClosetItem } from '../../services/ClosetService';
import { Sparkles, Shirt } from 'lucide-react';

interface OutfitAssemblyLoaderProps {
    items: ClosetItem[];
    occasion: string;
}

export function OutfitAssemblyLoader({ items, occasion }: OutfitAssemblyLoaderProps) {
    // Flatten all items into one big list for the "Big Stream"
    // Filter out items without images if possible, though we handle onError below
    const allItems = [...items];

    // If we don't have enough items for a smooth loop, duplicate them
    const displayItems = allItems.length > 0 ? [...allItems, ...allItems, ...allItems, ...allItems] : [];
    // Ensure we have a minimum set to scroll
    const renderList = displayItems.length < 10 ? [...displayItems, ...displayItems] : displayItems;

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-white relative">

            {/* Header Text */}
            <div className="absolute top-24 z-20 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-900">Styling for {occasion}</h2>
                </div>
                <p className="text-gray-400 font-medium">Scanning your closet...</p>
            </div>

            {/* SINGLE BIG STREAM LAYER */}
            <div className="w-full h-[500px] flex items-center relative">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

                {renderList.length > 0 ? (
                    <motion.div
                        className="flex gap-16 min-w-max px-12"
                        animate={{ x: [-100, -2000] }} // Adjust logic for infinite loop
                        transition={{
                            duration: 20,
                            ease: "linear",
                            repeat: Infinity
                        }}
                    >
                        {renderList.map((item, idx) => (
                            <ItemCard key={`${item.id}-${idx}`} item={item} />
                        ))}
                    </motion.div>
                ) : (
                    // Fallback if truly 0 items exist
                    <div className="w-full text-center text-gray-300">
                        <p>No items found inside closet.</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-12 text-center">
                <p className="text-xs text-purple-400 font-medium animate-bounce">
                    Analyzing fits...
                </p>
            </div>
        </div>
    );
}

function ItemCard({ item }: { item: ClosetItem }) {
    const [error, setError] = useState(false);

    return (
        <div className="w-[300px] h-[400px] flex-shrink-0 flex items-center justify-center relative bg-white rounded-3xl border border-gray-100 shadow-md p-8 overflow-hidden">
            {!error ? (
                <img
                    src={item.image}
                    alt="Closet item"
                    className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                    onError={() => setError(true)}
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 opacity-50">
                    <Shirt className="w-32 h-32 mb-4" />
                    <span className="text-sm font-medium uppercase tracking-widest">Image Unavailable</span>
                </div>
            )}
        </div>
    );
}
