import { useAuth } from '../context/AuthContext';
import { LogOut, User, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StyleSelector } from '../components/StyleSelector';

export default function ProfileSettings() {
    const { user, profile, signOut, updateProfile } = useAuth(); // Import profile

    return (
        <div className="min-h-screen bg-gray-50 text-black font-sans">
            <header className="px-6 py-8 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
                <Link to="/" className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-serif font-bold">Profile & Settings</h1>
            </header>

            <div className="p-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-gray-900">{profile?.gender ? (profile.gender === 'Mens' ? 'He/Him' : profile.gender === 'Womens' ? 'She/Her' : 'They/Them') : 'User'}</h2>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Style Preferences Section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">Your Style Profile</h3>
                        <StyleSelector
                            selectedStyles={profile?.stylePreferences || []}
                            onChange={(styles) => {
                                if (profile && user) {
                                    updateProfile({ stylePreferences: styles });
                                }
                            }}
                        />
                        <p className="text-xs text-gray-400 mt-4">We use these to personalize your shop recommendations.</p>
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-2">Account</h3>

                    <button
                        onClick={signOut}
                        className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-red-500 font-medium shadow-sm border border-gray-100 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-300 text-xs">Version 1.0.0</p>
                </div>
            </div>
        </div>
    );
}
