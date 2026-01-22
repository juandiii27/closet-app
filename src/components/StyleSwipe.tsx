import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Assuming framer-motion is installed as we used it in Shop.tsx
import { X, Heart, Check } from 'lucide-react';

const WOMENS_STYLES = [
    { id: 'streetwear', name: 'Streetwear', image: 'https://ibb.co/35n095GR' }, // Flat lay
    { id: 'minimalist', name: 'Minimalist', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'vintage', name: 'Vintage', image: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'old_money', name: 'Old Money', image: 'https://www.pinterest.com/pin/2814818511309010/' }, // Flat lay
    { id: 'y2k', name: 'Y2K', image: 'https://images.unsplash.com/photo-1601924994987-69e2c8e6f75c?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'boho', name: 'Boho', image: 'https://images.unsplash.com/photo-1520591799316-6b30425429aa?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'casual', name: 'Casual', image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'formal', name: 'Formal', image: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600&auto=format&fit=crop&q=60' }, // Flat lay
];

const MENS_STYLES = [
    { id: 'streetwear', name: 'Streetwear', image: 'https://images.unsplash.com/photo-1516257984-b1b4d8c92306?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'minimalist', name: 'Minimalist', image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'vintage', name: 'Vintage', image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'old_money', name: 'Old Money', image: 'https://image2url.com/r2/default/images/1769096193589-462e6cb7-068e-4506-8418-a9f91fd81f0a.jpeg' }, // Flat lay
    { id: 'casual', name: 'Casual', image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&auto=format&fit=crop&q=60' }, // Flat lay
    { id: 'formal', name: 'Formal', image: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=600&auto=format&fit=crop&q=60' }, // Flat lay
];

interface StyleSwipeProps {
    onComplete: (selectedStyles: string[]) => void;
    gender?: 'Mens' | 'Womens' | 'Unisex';
}

export function StyleSwipe({ onComplete, gender }: StyleSwipeProps) {
    // Select styles based on gender
    // Default to Womens if not specified or Unisex (can be adjusted later)
    const currentStyleList = gender === 'Mens' ? MENS_STYLES : WOMENS_STYLES;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);

    const currentStyle = currentStyleList[currentIndex];

    const handleVote = (liked: boolean) => {
        setDirection(liked ? 'right' : 'left');

        // Small delay for animation
        setTimeout(() => {
            if (liked) {
                setSelectedStyles(prev => [...prev, currentStyle.name]); // Save the readable name
            }

            if (currentIndex < currentStyleList.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setDirection(null);
            } else {
                // Done
                const finalSelection = liked ? [...selectedStyles, currentStyle.name] : selectedStyles;
                onComplete(finalSelection);
            }
        }, 300);
    };

    if (currentIndex >= currentStyleList.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                    <Check className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Style Profile Created!</h3>
                <p className="text-gray-500 mb-6">We've learned what you like.</p>
                {/* Fallback loader until onComplete redirects */}
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto h-[700px]">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-100 rounded-full mb-6 relative overflow-hidden">
                <div
                    className="absolute h-full bg-black transition-all duration-300"
                    style={{ width: `${((currentIndex) / currentStyleList.length) * 100}%` }}
                />
            </div>

            <div className="relative w-full flex-1 mb-6">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentStyle.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
                            rotate: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
                            transition: { duration: 0.3 }
                        }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col"
                    >
                        {/* Image takes up FULL space now */}
                        <div className="relative h-full w-full">
                            <img
                                src={currentStyle.image}
                                alt={currentStyle.name}
                                className="w-full h-full object-cover"
                            />

                            {/* Text Overlay with Gradient */}
                            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                                <h3 className="text-3xl font-serif font-bold text-white">{currentStyle.name}</h3>
                                <p className="text-sm text-gray-200 mt-1 uppercase tracking-widest font-medium">Style Collection</p>
                            </div>

                            {/* Overlay Indicators */}
                            {direction === 'right' && (
                                <div className="absolute top-8 left-8 border-4 border-green-500 text-green-500 rounded-lg px-4 py-2 text-2xl font-bold uppercase transform -rotate-12 bg-white/80">
                                    LIKE
                                </div>
                            )}
                            {direction === 'left' && (
                                <div className="absolute top-8 right-8 border-4 border-red-500 text-red-500 rounded-lg px-4 py-2 text-2xl font-bold uppercase transform rotate-12 bg-white/80">
                                    NOPE
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-12 mt-4">
                <button
                    onClick={() => handleVote(false)}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-105 transition-all"
                >
                    <X className="w-8 h-8" />
                </button>
                <button
                    onClick={() => handleVote(true)}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-green-500 hover:bg-green-50 hover:scale-110 transition-all font-bold"
                >
                    <Heart className="w-8 h-8 fill-current" />
                </button>
            </div>
        </div>
    );
}
