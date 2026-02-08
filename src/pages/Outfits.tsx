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
import { OutfitAssemblyLoader } from '../components/ui/OutfitAssemblyLoader';

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
    const [setupStep, setSetupStep] = useState(0); // 0=Occasion, 1=Weather, 2=Time
    const [occasion, setOccasion] = useState('Coro');
    const [weather, setWeather] = useState('Sunny');
    const [timeOfDay, setTimeOfDay] = useState('Noon');

    // Added 'Dinner' as requested by user
    const OCCASIONS = ['Coro', 'Cena', 'Party', 'Playa', 'Piscina', 'Ejercicio'];
    const WEATHERS = ['Sunny', 'Rainy', 'Cold', 'Hot'];
    const TIMES = ['Morning', 'Noon', 'Night'];

    // Load planned outfits on mount
    useEffect(() => {
        setPlannedOutfits(StylistService.getPlannedOutfits());
    }, []);



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
        const handleNext = () => {
            if (setupStep < 2) {
                setSetupStep(s => s + 1);
            } else {
                setStep('results');
                setLoading(true);
                StylistService.generateOutfits(items as any, occasion, timeOfDay).then(res => {
                    setOutfits(res);
                    setLoading(false);
                });
            }
        };

        return (
            <div className="h-full flex flex-col bg-white dark:bg-black relative transition-colors duration-300">
                <header className="px-6 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        {setupStep > 0 ? (
                            <Button variant="ghost" size="sm" onClick={() => setSetupStep(s => s - 1)} className="-ml-3 text-gray-400 font-normal hover:bg-gray-50 dark:hover:bg-zinc-900">
                                ← Back
                            </Button>
                        ) : (
                            <div /> /* Spacer */
                        )}
                        <div className="text-xs font-bold text-gray-300 dark:text-zinc-700 uppercase tracking-widest">
                            Step {setupStep + 1} / 3
                        </div>
                    </div>
                    <motion.h1
                        key={setupStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight"
                    >
                        {setupStep === 0 && "What's the vibe?"}
                        {setupStep === 1 && "How's the weather?"}
                        {setupStep === 2 && "Time of day?"}
                    </motion.h1>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
                    <AnimatePresence mode="wait">
                        {setupStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {OCCASIONS.map(occ => (
                                        <button
                                            key={occ}
                                            onClick={() => setOccasion(occ)}
                                            className={`relative p-4 rounded-2xl text-left transition-all duration-200 h-28 flex flex-col justify-end group overflow-hidden border ${occasion === occ
                                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-black'
                                                : 'bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 border-transparent'
                                                }`}
                                        >
                                            {/* Stylized background decoration */}
                                            {occasion === occ && <div className="absolute top-0 right-0 p-3"><Sparkles className="w-5 h-5 text-white/50 dark:text-black/50" /></div>}
                                            <span className="text-lg font-bold tracking-tight">{occ}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Upcoming Looks (Only on Step 0) */}
                                {plannedOutfits.length > 0 && (
                                    <div className="pt-8 border-t border-gray-100 dark:border-zinc-800">
                                        <h3 className="text-sm font-bold text-gray-400 dark:text-zinc-600 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                            <Calendar className="w-4 h-4" /> Upcoming
                                        </h3>
                                        <div className="space-y-3">
                                            {plannedOutfits.map((plan) => (
                                                <div key={plan.id} className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shrink-0">
                                                        <OutfitCollage items={plan.outfit.items} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-1">
                                                            {new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </p>
                                                        <div className="flex -space-x-2 overflow-hidden">
                                                            {plan.outfit.items.slice(0, 4).map((item, i) => (
                                                                <img key={i} src={item.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-black object-cover bg-white" alt="" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeletePlanned(plan.id)} className="text-gray-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 p-2">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {setupStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-wrap gap-3 content-start"
                            >
                                {WEATHERS.map(w => (
                                    <button
                                        key={w}
                                        onClick={() => setWeather(w)}
                                        className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${weather === w
                                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-black scale-105'
                                            : 'bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border-transparent'
                                            }`}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {setupStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-wrap gap-3 content-start"
                            >
                                {TIMES.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeOfDay(t)}
                                        className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${timeOfDay === t
                                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-black scale-105'
                                            : 'bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border-transparent'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-gray-100 dark:border-zinc-800 z-20 transition-colors duration-300">
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg rounded-full shadow-xl shadow-black/10 dark:shadow-white/5 transition-all hover:scale-[1.02] active:scale-[0.98] bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200"
                        onClick={handleNext}
                    >
                        {setupStep === 2 ? (
                            <>Generate Outfits <Sparkles className="ml-2 w-5 h-5" /></>
                        ) : (
                            "Continue"
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <OutfitAssemblyLoader items={items} occasion={occasion} />;
    }

    if (!currentCard) {
        const isFormal = ['Dinner', 'Date', 'Work'].includes(occasion);

        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
                <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-full mb-6 transition-colors duration-300">
                    {isFormal ? (
                        <X className="w-12 h-12 text-red-500" />
                    ) : (
                        <RefreshCw className="w-12 h-12 text-black dark:text-white" />
                    )}
                </div>
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    {isFormal ? "Accuracy Over Output" : "All Caught Up"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-[280px]">
                    {isFormal
                        ? `Not enough suitable items for a ${occasion} (Old Money) outfit. Please add formal or smart-casual pieces.`
                        : "Come back later for more recommendations."}
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button onClick={() => { setStep('setup'); setSetupStep(0); }}>
                        Start Over
                    </Button>
                    {isFormal && (
                        <Link to="/upload" className="text-black dark:text-white font-medium hover:underline text-sm">
                            Add Formal Items
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 pt-8 bg-gray-50/50 dark:bg-black transition-colors duration-300">
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        For {occasion} <Sparkles className="w-4 h-4 text-black dark:text-white" />
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{timeOfDay} • {weather} • {items.length} Items</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStep('setup'); setSetupStep(0); }}>
                    Change
                </Button>
            </header>

            {/* Warning Banner for Fallback Outfits */}
            {currentCard.missingCategoryWarning && (
                <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                    <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-tight pt-1">
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
                            className="w-full h-full rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100 dark:border-zinc-800 z-10 bg-white dark:bg-zinc-900 absolute inset-0 transition-colors duration-300"
                        >
                            <div id="outfit-collage-container" className="relative h-full w-full flex flex-col bg-white dark:bg-zinc-900 overflow-hidden rounded-3xl transition-colors duration-300">
                                {/* FULL HEIGHT COLLAGE (Background Layer) */}
                                <div className="absolute inset-0 w-full h-full z-0">
                                    <OutfitCollage
                                        items={currentCard.items}
                                        onItemClick={setSwappingItem}
                                    />
                                </div>

                                {/* Text Overlay (Bottom Layer) */}
                                <div className="absolute bottom-0 left-0 w-full z-10 pt-24 pb-6 px-6 bg-gradient-to-t from-[#d4d4d8] dark:from-zinc-950 via-[#d4d4d8]/90 dark:via-zinc-950/90 to-transparent pointer-events-none transition-colors duration-300">
                                    <div className="flex flex-col justify-end text-left">
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-serif leading-tight drop-shadow-sm">{currentCard.title}</h2>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wide mb-1 opacity-90">{currentCard.styleTag}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Tap an item to swap</p>
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
                    <div className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-800 rounded-3xl shadow-lg border border-gray-100 dark:border-zinc-700 scale-95 translate-y-4 -z-10 opacity-50 transition-colors duration-300" />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto flex justify-center gap-6 px-6 pointer-events-none z-20">
                <button
                    className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-full shadow-lg text-red-500 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-transform active:scale-95 pointer-events-auto border border-gray-100 dark:border-zinc-700"
                    onClick={() => handleSwipe()}
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Calendar Button */}
                <button
                    className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-lg text-black dark:text-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-transform active:scale-95 pointer-events-auto border border-gray-100 dark:border-zinc-700 translate-y-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowCalendar(true);
                    }}
                >
                    <Calendar className="w-5 h-5" />
                </button>

                {/* Share Button */}
                <button
                    className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-lg text-black dark:text-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-transform active:scale-95 pointer-events-auto border border-gray-100 dark:border-zinc-700 translate-y-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        import('../utils/sharing').then(mod => mod.downloadElementAsImage('outfit-collage-container', `outfit-${currentCard.id}.png`));
                    }}
                >
                    <Share2 className="w-5 h-5" />
                </button>

                <button
                    className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-full shadow-lg text-green-500 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-transform active:scale-95 pointer-events-auto border border-gray-100 dark:border-zinc-700"
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
                    items={items as any}
                />
            )}

            {/* Calendar Modal */}
            {showCalendar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-xs relative z-10 shadow-xl"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Plan for Date</h3>
                        <input
                            type="date"
                            className="w-full p-3 border dark:border-zinc-700 rounded-xl mb-6 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 dark:text-gray-300" onClick={() => setShowCalendar(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleSaveToCalendar} disabled={!selectedDate}>Save</Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
