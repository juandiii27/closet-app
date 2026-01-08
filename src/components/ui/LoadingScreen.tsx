import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function LoadingScreen({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="relative mb-4">
                <div className="absolute inset-0 bg-black blur-xl opacity-10 animate-pulse rounded-full" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-12 h-12 text-black relative z-10" />
                </motion.div>
            </div>
            <p className="text-gray-500 font-medium animate-pulse">{text}</p>
        </div>
    );
}
