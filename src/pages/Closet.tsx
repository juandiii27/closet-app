import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import { useCloset } from '../hooks/useCloset';
import { useAuth } from '../context/AuthContext';
import type { Category } from '../context/ClosetContext';
import { Link } from 'react-router-dom';

const CATEGORIES: (Category | 'All')[] = ['All', 'Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories'];

export default function Closet() {
    const { items, deleteItem } = useCloset();
    const { profile } = useAuth(); // Import useAuth
    const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');

    const filteredItems = activeCategory === 'All'
        ? items
        : items.filter(item => item.category === activeCategory);

    return (
        <div className="p-4 pt-8 min-h-full bg-gray-50/50">
            <header className="mb-6 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Closet</h1>
                        <p className="text-gray-500 text-sm font-medium">{items.length} items</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/settings" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-600 hover:text-black transition-colors">
                            <span className="sr-only">Settings</span>
                            <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs text-gray-500">?</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                        {/* <button className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-600 hover:text-indigo-600 transition-colors">
                            <Search className="w-5 h-5" />
                        </button> */}
                    </div>
                </div>

                {/* Categories Scroller */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                                activeCategory === cat
                                    ? "bg-black text-white shadow-md shadow-gray-300"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Grid */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No items yet</h3>
                    <p className="text-gray-500 mb-6 max-w-[200px]">Add your first item to start building your closet.</p>
                    <Link to="/upload" className="text-black font-medium hover:underline">
                        Add New Item
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 pb-20">
                    {filteredItems.map((item) => (
                        <Card
                            key={item.id}
                            className="group relative aspect-[3/4] border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden bg-white"
                        >
                            <img
                                src={item.image}
                                alt={item.category}
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x600?text=Image+Error';
                                }}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                <div className="flex justify-between items-end w-full">
                                    <span className="text-white font-medium text-sm translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        {item.category}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteItem(item.id);
                                        }}
                                        className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500 hover:text-white transition-colors translate-y-2 group-hover:translate-y-0 duration-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
