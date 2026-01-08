import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const STYLES = [
    { id: 'minimalist', label: 'Minimalist', color: 'bg-stone-100' },
    { id: 'streetwear', label: 'Streetwear', color: 'bg-zinc-900 text-white' },
    { id: 'vintage', label: 'Vintage', color: 'bg-amber-100' },
    { id: 'y2k', label: 'Y2K', color: 'bg-pink-100' },
    { id: 'old_money', label: 'Old Money', color: 'bg-blue-50' },
    { id: 'boho', label: 'Boho', color: 'bg-orange-50' },
    { id: 'casual', label: 'Casual', color: 'bg-gray-100' },
    { id: 'formal', label: 'Formal', color: 'bg-slate-900 text-white' },
];

interface StyleSelectorProps {
    selectedStyles: string[];
    onChange: (styles: string[]) => void;
}

export function StyleSelector({ selectedStyles, onChange }: StyleSelectorProps) {

    const toggleStyle = (id: string) => {
        if (selectedStyles.includes(id)) {
            onChange(selectedStyles.filter(s => s !== id));
        } else {
            // Limit to 3 for better focus, or allow unlimited. Let's allowing 5 max.
            if (selectedStyles.length >= 5) return;
            onChange([...selectedStyles, id]);
        }
    };

    return (
        <div className="w-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">What's your vibe? (Pick up to 5)</h3>
            <div className="flex flex-wrap gap-3">
                {STYLES.map((style) => {
                    const isSelected = selectedStyles.includes(style.id);
                    return (
                        <motion.button
                            key={style.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleStyle(style.id)}
                            className={`
                                relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                                ${isSelected ? 'ring-2 ring-offset-1 ring-black border-transparent' : 'border-gray-200 hover:border-gray-300'}
                                ${style.color}
                                ${(!isSelected && (style.id === 'streetwear' || style.id === 'formal')) ? 'text-white' : 'text-gray-900'}
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {style.label}
                                {isSelected && <Check className="w-3 h-3" />}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
