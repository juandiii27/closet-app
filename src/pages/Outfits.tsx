import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Sparkles, X, Heart, RefreshCw, Share2, Calendar, Trash2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCloset } from '../hooks/useCloset';
import { StylistService, type Outfit, type PlannedOutfit } from '../services/StylistService';
import { OutfitCollage } from '../components/OutfitCollage';
import { ItemSelector } from '../components/ItemSelector';
import type { ClosetItem } from '../services/ClosetService';

export default function Outfits() {
    const { items } = useCloset();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [plannedOutfits, setPlannedOutfits] = useState<PlannedOutfit[]>([]);
    const [loading, setLoading] = useState(false);

    // Swap State
    const [swappingItem, setSwappingItem] = useState<ClosetItem | null>(null);

    // Calendar State
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    // Q&A State
    const [step, setStep] = useState<'setup' | 'results'>('setup');
    const [occasion, setOccasion] = useState('Casual');
    const [weather, setWeather] = useState('Sunny');

    // Added 'Dinner' as requested by user
    const OCCASIONS = ['Casual', 'Work', 'Party', 'Date', 'Dinner', 'Sport'];
    const WEATHERS = ['Sunny', 'Rainy', 'Cold', 'Hot'];

    // Load planned outfits on mount
    useEffect(() => {
        setPlannedOutfits(StylistService.getPlannedOutfits());
    }, []);

    const handleGenerate = async () => {
        setStep('results');
        setLoading(true);
        try {
            // Ideally pass context here
            const results = await StylistService.generateOutfits(items as any, occasion);
            setOutfits(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-100, 100], [-10, 10]);
    const bg = useTransform(x, [-100, 0, 100], ['#ef4444', '#ffffff', '#22c55e']);

    // Lifted hooks to prevent conditional rendering violation
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const [activeCards, setActiveCards] = useState<Outfit[]>([]);

    useEffect(() => {
        if (outfits.length > 0) {
            setActiveCards(outfits);
        }
    }, [outfits]);

    const currentCard = activeCards[0] ? activeCards[0] : null;

    const handleSwipe = () => {
        setTimeout(() => {
            setActiveCards((prev) => prev.slice(1));
            x.set(0);
        }, 200);
    };

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            handleSwipe();
        } else if (info.offset.x < -100) {
            handleSwipe();
        }
    };

    const handleSwapItem = (newItem: ClosetItem) => {
        if (!currentCard || !swappingItem) return;

        // Create a new updated list of items by swapping the old one for the new one
        const updatedItems = currentCard.items.map(i => i.id === swappingItem.id ? newItem : i);

        // Update the activeCards state instantly
        setActiveCards(prev => {
            const newCards = [...prev];
            newCards[0] = { ...newCards[0], items: updatedItems };
            return newCards;
        });

        setSwappingItem(null);
    };

    const handleSaveToCalendar = () => {
        if (!selectedDate || !currentCard) return;

        // Reconstruct basic outfit object from currentCard
        const outfitToSave: Outfit = {
            id: currentCard.id,
            items: currentCard.items,
            title: currentCard.title
        };

        StylistService.savePlannedOutfit(outfitToSave, selectedDate);
        setPlannedOutfits(StylistService.getPlannedOutfits()); // Refresh
        setShowCalendar(false);
        setSelectedDate('');
        alert('Outfit saved to calendar!');
    };

    const handleDeletePlanned = (id: string) => {
        StylistService.deletePlannedOutfit(id);
        setPlannedOutfits(StylistService.getPlannedOutfits());
    };

    if (step === 'setup') {
        return (
            <div className="h-full flex flex-col p-6 bg-white overflow-y-auto pb-24">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        AI Stylist <Sparkles className="w-5 h-5 text-black" />
                    </h1>
                    <p className="text-gray-500">Let's find the perfect look for you.</p>
                </header>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">What's the occasion?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {OCCASIONS.map(occ => (
                                <button
                                    key={occ}
                                    onClick={() => setOccasion(occ)}
                                    className={`p-3 rounded-xl border text-left transition-all ${occasion === occ
                                        ? 'border-black bg-black text-white font-medium'
                                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                        }`}
                                >
                                    {occ}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">How's the weather?</label>
                        <div className="flex flex-wrap gap-2">
                            {WEATHERS.map(w => (
                                <button
                                    key={w}
                                    onClick={() => setWeather(w)}
                                    className={`px-4 py-2 rounded-full border text-sm transition-all ${weather === w
                                        ? 'border-black bg-black text-white font-medium'
                                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                        }`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Looks Section */}
                    {plannedOutfits.length > 0 && (
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Upcoming Looks
                            </h3>
                            <div className="space-y-3">
                                {plannedOutfits.map((plan) => (
                                    <div key={plan.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                            <OutfitCollage items={plan.outfit.items} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">
                                                {new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {plan.outfit.items.slice(0, 4).map((item, i) => (
                                                    <img key={i} src={item.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-white" alt="" />
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeletePlanned(plan.id)} className="text-gray-400 hover:text-red-500 p-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <Button size="lg" className="w-full h-12 text-lg" onClick={handleGenerate}>
                        Generate Outfits <Sparkles className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-black blur-xl opacity-10 animate-pulse rounded-full" />
                    <Sparkles className="w-12 h-12 text-black animate-spin relative z-10" />
                </div>
                <h2 className="text-xl font-semibold">Designing your look...</h2>
                <p className="text-gray-500">Choosing items for {occasion} ({weather})</p>
            </div>
        );
    }

    if (!currentCard) {
        const isFormal = ['Dinner', 'Date', 'Work'].includes(occasion);

        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                    {isFormal ? (
                        <X className="w-12 h-12 text-red-500" />
                    ) : (
                        <RefreshCw className="w-12 h-12 text-black" />
                    )}
                </div>
                <h2 className="text-xl font-bold mb-2">
                    {isFormal ? "Accuracy Over Output" : "All Caught Up"}
                </h2>
                <p className="text-gray-500 mb-8 max-w-[280px]">
                    {isFormal
                        ? `Not enough suitable items for a ${occasion} (Old Money) outfit. Please add formal or smart-casual pieces.`
                        : "Come back later for more recommendations."}
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button onClick={() => setStep('setup')}>
                        Start Over
                    </Button>
                    {isFormal && (
                        <Link to="/upload" className="text-black font-medium hover:underline text-sm">
                            Add Formal Items
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 pt-8 bg-gray-50/50">
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        For {occasion} <Sparkles className="w-4 h-4 text-black" />
                    </h1>
                    <p className="text-gray-500 text-xs">{weather} • {items.length} Items</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('setup')}>
                    Change
                </Button>
            </header>

            {/* Warning Banner for Fallback Outfits */}
            {currentCard.missingCategoryWarning && (
                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <p className="text-xs text-amber-800 font-medium leading-tight pt-1">
                        {currentCard.missingCategoryWarning}
                        <br />
                        <span className="opacity-75 font-normal">Try uploading more items (e.g. {occasion === 'Dinner' ? 'chinos, shirts' : 'items'}) for better matches.</span>
                    </p>
                </div>
            )}

            <div className="flex-1 relative flex items-center justify-center px-4 w-full h-full mb-32">
                {/* Centered Deck Wrapper - Explicit Height to prevent collapse */}
                <div className="relative w-full max-w-md h-[68vh]">
                    <AnimatePresence>
                        <motion.div
                            key={currentCard.id}
                            style={{ x, rotate, backgroundColor: bg }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={handleDragEnd}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x: 0, rotate: 0, backgroundColor: '#ffffff' }}
                            exit={{ scale: 1.05, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="w-full h-full rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100 z-10 bg-white absolute inset-0"
                        >
                            <div id="outfit-collage-container" className="relative h-full w-full flex flex-col bg-white overflow-hidden rounded-3xl">
                                {/* FULL HEIGHT COLLAGE (Background Layer) */}
                                <div className="absolute inset-0 w-full h-full z-0">
                                    <OutfitCollage
                                        items={currentCard.items}
                                        onItemClick={setSwappingItem}
                                    />
                                </div>

                                {/* Text Overlay (Bottom Layer) */}
                                <div className="absolute bottom-0 left-0 w-full z-10 pt-24 pb-6 px-6 bg-gradient-to-t from-[#d4d4d8] via-[#d4d4d8]/90 to-transparent pointer-events-none">
                                    <div className="flex flex-col justify-end text-left">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-1 font-serif leading-tight drop-shadow-sm">{currentCard.title}</h2>
                                        <p className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1 opacity-90">{currentCard.styleTag}</p>
                                        <p className="text-xs text-gray-600 font-medium">Tap an item to swap</p>
                                    </div>
                                </div>
                            </div>

                            {/* Swipe Indicators Overlay */}
                            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-green-500 text-green-500 font-bold text-3xl px-4 py-2 rounded-lg -rotate-12 bg-white/10 backdrop-blur-sm">
                                LIKE
                            </motion.div>
                            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-red-500 text-red-500 font-bold text-3xl px-4 py-2 rounded-lg rotate-12 bg-white/10 backdrop-blur-sm">
                                NOPE
                            </motion.div>

                        </motion.div>
                    </AnimatePresence>

                    {/* Background Card for Depth */}
                    <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-lg border border-gray-100 scale-95 translate-y-4 -z-10 opacity-50" />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto flex justify-center gap-6 px-6 pointer-events-none z-20">
                <button
                    className="w-14 h-14 bg-white rounded-full shadow-lg text-red-500 flex items-center justify-center hover:bg-gray-50 transition-transform active:scale-95 pointer-events-auto border border-gray-100"
                    onClick={() => handleSwipe()}
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Calendar Button */}
                <button
                    className="w-12 h-12 bg-white rounded-full shadow-lg text-black flex items-center justify-center hover:bg-gray-50 transition-transform active:scale-95 pointer-events-auto border border-gray-100 translate-y-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowCalendar(true);
                    }}
                >
                    <Calendar className="w-5 h-5" />
                </button>

                {/* Share Button */}
                <button
                    className="w-12 h-12 bg-white rounded-full shadow-lg text-black flex items-center justify-center hover:bg-gray-50 transition-transform active:scale-95 pointer-events-auto border border-gray-100 translate-y-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        import('../utils/sharing').then(mod => mod.downloadElementAsImage('outfit-collage-container', `outfit-${currentCard.id}.png`));
                    }}
                >
                    <Share2 className="w-5 h-5" />
                </button>

                <button
                    className="w-14 h-14 bg-white rounded-full shadow-lg text-green-500 flex items-center justify-center hover:bg-gray-50 transition-transform active:scale-95 pointer-events-auto border border-gray-100"
                    onClick={() => handleSwipe()}
                >
                    <Heart className="w-6 h-6 fill-current" />
                </button>
            </div>

            {/* Swap Modal */}
            {swappingItem && (
                <ItemSelector
                    isOpen={!!swappingItem}
                    onClose={() => setSwappingItem(null)}
                    onSelect={handleSwapItem}
                    category={swappingItem.category}
                    items={items as any} // Cast because context type might mismatch slightly with mock data
                />
            )}

            {/* Calendar Modal */}
            {showCalendar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 w-full max-w-xs relative z-10 shadow-xl"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Plan for Date</h3>
                        <input
                            type="date"
                            className="w-full p-3 border rounded-xl mb-6"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowCalendar(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleSaveToCalendar} disabled={!selectedDate}>Save</Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
