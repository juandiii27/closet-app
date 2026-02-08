import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shirt, Plus, Sparkles, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function Layout() {
    const { pathname } = useLocation();

    // Auth context used for route protection in App.tsx

    const navItems = [
        { icon: Shirt, label: 'Closet', path: '/' },
        { icon: Sparkles, label: 'Outfits', path: '/outfits' },
        { icon: Plus, label: 'Upload', path: '/upload', isPrimary: true },
        { icon: ShoppingBag, label: 'Shop', path: '/shop' },
        { icon: Shirt, label: '', path: '', isSpacer: true }, // Dummy item to balance the grid
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans mx-auto max-w-md relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
            <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-800 px-2 py-2 grid grid-cols-5 justify-items-center items-center z-50 max-w-md mx-auto transition-colors duration-300">
                {navItems.map((item, idx) => {
                    if (item.isSpacer) {
                        return <div key={`spacer-${idx}`} className="w-full" />;
                    }

                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        return (
                            <Link key={item.path} to={item.path}>
                                <div className="relative -top-5">
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg shadow-gray-200 dark:shadow-zinc-900 border-4 border-gray-50 dark:border-black transition-colors duration-300"
                                    >
                                        <Icon className="text-white dark:text-black w-8 h-8" />
                                    </motion.div>
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 transition-colors duration-300",
                                isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
