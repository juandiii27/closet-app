import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Login() {
    const { signInWithEmail, signInWithGoogle, signUp, user } = useAuth(); // Ensure signUp is available
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState<'Mens' | 'Womens' | 'Unisex'>('Unisex');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'login' | 'signup'>('login');

    // Redirect if already logged in
    if (user) {
        navigate('/');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (view === 'login') {
                // For login, we'll stick to Magic Link for now unless password provided? 
                // Actually, let's allow password login if they typed one in (though I'm only showing password field in Signup? 
                // Wait, usually if you sign up with password, you need password to log in. 
                // I will add Password field to Login view as well for consistency, but make it optional if we want fallback to magic link? 
                // Let's keep Login simple: Email only (Magic Link) as per previous design unless user asks.
                // BUT, user asked for "password" in sign up. If they sign up with password, they MUST be able to login with it.
                // So I will eventually need to add password to login. 
                // For THIS step, I will only add the requested fields to SIGN UP view as explicitly requested.
                await signInWithEmail(email);
                alert('Check your email for the login link!');
            } else {
                // Sign Up
                await signUp({ email, password, username, gender });
                alert('Account created! Please check email or you are logged in.');
            }
        } catch (error: any) {
            console.error(error);
            // Show specific error from Supabase (e.g., "User already registered", "Password should be at least 6 characters")
            alert(error.message || 'Error during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 space-y-8 bg-white shadow-xl rounded-2xl border-none">
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setView('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setView('signup')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === 'signup' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {view === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {view === 'login' ? 'Sign in with your email' : 'Fill in your details'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {view === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 py-3 px-4 border"
                                placeholder="StyleIcon123"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 py-3 px-4 border"
                            placeholder="you@example.com"
                        />
                    </div>

                    {view === 'signup' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 py-3 px-4 border"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setGender('Mens')}
                                        className={`py-2 px-4 rounded-lg border ${gender === 'Mens' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}
                                    >
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGender('Womens')}
                                        className={`py-2 px-4 rounded-lg border ${gender === 'Womens' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}
                                    >
                                        Female
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
                        <Mail className="mr-2 h-5 w-5" />
                        {view === 'login' ? 'Sign in with Email Link' : 'Create Account'}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full h-12 text-lg border-gray-300"
                    onClick={() => signInWithGoogle()}
                >
                    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Google
                </Button>

                {/* DEBUG: Temporary Config Check */}
                <div className="text-xs text-gray-300 text-center mt-4">
                    Config: {import.meta.env.VITE_SUPABASE_URL ? 'URL Loaded' : 'URL Missing'}
                    ({import.meta.env.VITE_SUPABASE_URL?.substring(0, 15)}...)
                </div>
            </Card>
        </div>
    );
}
