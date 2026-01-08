import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shirt, Plus, Sparkles, Map, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function Layout() {
    const { pathname } = useLocation();

    // Auth context used for route protection in App.tsx

    const navItems = [
        { icon: Shirt, label: 'Closet', path: '/' },
        { icon: Sparkles, label: 'Outfits', path: '/outfits' },
        { icon: Plus, label: 'Upload', path: '/upload', isPrimary: true },
        { icon: Map, label: 'Map', path: '/map' },
        { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans mx-auto max-w-md relative shadow-2xl overflow-hidden flex flex-col">
            <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        return (
                            <Link key={item.path} to={item.path}>
                                <div className="relative -top-5">
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-lg shadow-gray-200 border-4 border-gray-50"
                                    >
                                        <Icon className="text-white w-8 h-8" />
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
                                "flex flex-col items-center gap-1 p-2 transition-colors",
                                isActive ? "text-black" : "text-gray-400 hover:text-gray-600"
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
