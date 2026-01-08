import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Assuming framer-motion is installed as we used it in Shop.tsx
import { X, Heart, Check } from 'lucide-react';

const STYLES = [
    { id: 'streetwear', name: 'Streetwear', image: 'https://i.pinimg.com/736x/2f/74/82/2f7482e50ce55cbf9cdb04b221f596e4.jpg' }, // Outfit Grid
    { id: 'minimalist', name: 'Minimalist', image: 'https://i.pinimg.com/originals/df/70/dd/df70ddba61185b085c871f43d07d779f.jpg' }, // Outfit Grid
    { id: 'vintage', name: 'Vintage', image: 'https://i.pinimg.com/originals/16/6a/26/166a26e12c60e08457b02278cbd2108e.jpg' }, // Outfit Grid
    { id: 'old_money', name: 'Old Money', image: 'https://i.pinimg.com/736x/4f/98/86/4f9886cae933b901614d7249aab8b1c5.jpg' }, // Outfit Grid
    { id: 'y2k', name: 'Y2K', image: 'https://i.pinimg.com/736x/6b/8b/5f/6b8b5fa84424338a0881298063c299b9.jpg' }, // Outfit Grid
    { id: 'boho', name: 'Boho', image: 'https://i.pinimg.com/736x/de/6b/d5/de6bd5cdbd9d9955eb38a36c2b86fe05.jpg' }, // Outfit Grid
    { id: 'casual', name: 'Casual', image: 'https://i.pinimg.com/originals/82/4c/69/824c693d1806d231bb7f1a81bf6b71d9.jpg' }, // Outfit Grid
    { id: 'formal', name: 'Formal', image: 'https://i.pinimg.com/originals/c8/0c/76/c80c762e855a2f0926768fd4bb0f3702.jpg' }, // Outfit Grid
];

interface StyleSwipeProps {
    onComplete: (selectedStyles: string[]) => void;
}

export function StyleSwipe({ onComplete }: StyleSwipeProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);

    const currentStyle = STYLES[currentIndex];

    const handleVote = (liked: boolean) => {
        setDirection(liked ? 'right' : 'left');

        // Small delay for animation
        setTimeout(() => {
            if (liked) {
                setSelectedStyles(prev => [...prev, currentStyle.name]); // Save the readable name
            }

            if (currentIndex < STYLES.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setDirection(null);
            } else {
                // Done
                const finalSelection = liked ? [...selectedStyles, currentStyle.name] : selectedStyles;
                onComplete(finalSelection);
            }
        }, 300);
    };

    if (currentIndex >= STYLES.length) {
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
        <div className="flex flex-col items-center w-full max-w-sm mx-auto h-[600px]">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-100 rounded-full mb-6 relative overflow-hidden">
                <div
                    className="absolute h-full bg-black transition-all duration-300"
                    style={{ width: `${((currentIndex) / STYLES.length) * 100}%` }}
                />
            </div>

            <div className="relative w-full flex-1 mb-8">
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
                        exit={{ scale: 0.95, opacity: 0 }} // Don't animate exit to keep it snappy or we need absolute positioning overlap
                        className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
                    >
                        <img
                            src={currentStyle.image}
                            alt={currentStyle.name}
                            className="w-full h-[75%] object-cover"
                        />
                        <div className="h-[25%] flex flex-col items-center justify-center p-4 bg-white">
                            <h3 className="text-2xl font-serif font-bold text-gray-900">{currentStyle.name}</h3>
                            <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">Style Collection</p>
                        </div>

                        {/* Overlay Indicators for Swipe feedback */}
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
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 mb-4">
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

            <p className="text-gray-400 text-xs text-center pb-4">Swipe or click buttons to decide</p>
        </div>
    );
}
