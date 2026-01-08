import { useEffect, useState } from 'react';
import { ShoppingService, type Recommendation } from '../services/ShoppingService';
import { useCloset } from '../context/ClosetContext';
import { useAuth } from '../context/AuthContext';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Shop() {
    const { items } = useCloset();
    const { profile } = useAuth(); // Get user profile
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Pass style preferences
        ShoppingService.getRecommendations(items, profile?.stylePreferences).then(data => {
            setRecommendations(data);
            setLoading(false);
        });
    }, [items, profile?.stylePreferences]); // Re-run when profile styles change

    const handleLocateStore = (_storeId: string) => {
        // In the future, we could pass state to center the map on this store
        navigate('/map');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
                <p className="text-gray-400 text-xs tracking-widest uppercase">Curating Selection...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 text-black">
            <header className="px-6 py-8 sticky top-0 z-10 bg-white/95 backdrop-blur-md">
                <h1 className="text-3xl font-serif text-black mb-1">Shop</h1>
                <p className="text-gray-400 text-xs tracking-wide uppercase">Curated by AI for your closet</p>
            </header>

            <div className="px-6 grid gap-12">
                {recommendations.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                    >
                        {/* Image Section */}
                        <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-50">
                            <img
                                src={item.imageUrl}
                                alt={item.itemName}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 tracking-wider uppercase">
                                    {item.category}
                                </span>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-serif text-lg text-black leading-snug">{item.itemName}</h3>
                                <span className="font-medium text-sm text-gray-900">{item.price}</span>
                            </div>

                            <p className="text-gray-500 text-sm mb-3 font-light leading-relaxed">{item.description}</p>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-[10px] uppercase tracking-widest text-gray-400">
                                    Why: {item.reason}
                                </div>
                                <button
                                    onClick={() => handleLocateStore(item.storeId)}
                                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black hover:underline"
                                >
                                    <MapPin className="w-3 h-3" />
                                    <span>{item.storeName}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="py-12 text-center">
                <p className="text-gray-300 text-[10px] tracking-[0.2em] uppercase">End of Collection</p>
            </div>
        </div>
    );
}
