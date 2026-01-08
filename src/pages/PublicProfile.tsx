import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type ClosetItem, ClosetService } from '../services/ClosetService';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicProfile() {
    const { userId } = useParams<{ userId: string }>();
    const [items, setItems] = useState<ClosetItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            ClosetService.getPublicItems(userId).then(data => {
                setItems(data);
                setLoading(false);
            });
        }
    }, [userId]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <header className="mb-6">
                <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back to App
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-black font-bold text-2xl">
                        {userId?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User's Public Closet</h1>
                        <p className="text-gray-500">{items.length} Items Shared</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        This user hasn't shared anything yet.
                    </div>
                ) : (
                    items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 aspect-square relative group"
                        >
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.category}
                                    className="max-w-full max-h-full object-contain mix-blend-multiply"
                                />
                            </div>
                            <div className="absolute top-2 right-2 bg-black/5 text-black/50 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                {item.category}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
