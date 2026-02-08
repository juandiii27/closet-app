import { motion } from 'framer-motion';
import { Shirt } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
    const [stage, setStage] = useState<'spinning' | 'reveal'>('spinning');

    useEffect(() => {
        const timer = setTimeout(() => {
            setStage('reveal');
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
            <div className="relative flex items-center">
                <motion.div
                    initial={{ rotate: 0 }}
                    animate={
                        stage === 'spinning'
                            ? { rotate: 360 }
                            : { rotate: 0, x: -40 }
                    }
                    transition={
                        stage === 'spinning'
                            ? { duration: 1, repeat: Infinity, ease: "linear" }
                            : { duration: 0.8, type: "spring", stiffness: 200 }
                    }
                >
                    <Shirt className="w-16 h-16 text-black dark:text-white fill-current/10" strokeWidth={1.5} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={
                        stage === 'reveal'
                            ? { opacity: 1, x: -20, width: 'auto' }
                            : { opacity: 0, x: 20, width: 0 }
                    }
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <h1 className="text-4xl font-bold tracking-tighter text-black dark:text-white font-serif">
                        Closet
                    </h1>
                </motion.div>
            </div>
        </div>
    );
}
