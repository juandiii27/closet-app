import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ClosetItem } from '../services/ClosetService';
import type { Category } from '../context/ClosetContext';

interface ItemSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: ClosetItem) => void;
    category: Category;
    items: ClosetItem[]; // All closet items, component will filter
}

export function ItemSelector({ isOpen, onClose, onSelect, category, items }: ItemSelectorProps) {
    // Filter items by the requested category
    const filteredItems = items.filter(item => item.category === category);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
                    >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Swap {category}</h3>
                            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 flex-1">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    No other items found in this category.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {filteredItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => onSelect(item)}
                                            className="aspect-square rounded-xl overflow-hidden border border-gray-100 relative group active:scale-95 transition-transform"
                                        >
                                            <div className="absolute inset-0 bg-gray-50 -z-10" />
                                            <img
                                                src={item.image}
                                                alt="Closet item"
                                                className="w-full h-full object-contain p-2 mix-blend-multiply"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
