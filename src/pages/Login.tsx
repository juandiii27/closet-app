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
                await signInWithEmail(email);
                alert('Check your email for the login link!');
            } else {
                await signUp({ email, password, username, gender });
                alert('Account created! Please check email or you are logged in.');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Error during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors duration-300">
            <Card className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border-none transition-colors duration-300">
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-6 transition-colors duration-300">
                    <button
                        onClick={() => setView('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === 'login' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setView('signup')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === 'signup' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {view === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {view === 'login' ? 'Sign in with your email' : 'Fill in your details'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {view === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 py-3 px-4 border bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600"
                                placeholder="StyleIcon123"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 py-3 px-4 border bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600"
                            placeholder="you@example.com"
                        />
                    </div>

                    {view === 'signup' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 py-3 px-4 border bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setGender('Mens')}
                                        className={`py-2 px-4 rounded-lg border transition-colors ${gender === 'Mens' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-zinc-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700'}`}
                                    >
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGender('Womens')}
                                        className={`py-2 px-4 rounded-lg border transition-colors ${gender === 'Womens' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-zinc-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700'}`}
                                    >
                                        Female
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <Button type="submit" className="w-full h-12 text-lg dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors" isLoading={loading}>
                        <Mail className="mr-2 h-5 w-5" />
                        {view === 'login' ? 'Sign in with Email Link' : 'Create Account'}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-zinc-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white dark:bg-zinc-900 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full h-12 text-lg border-gray-300 dark:border-zinc-700 dark:text-white dark:bg-transparent dark:hover:bg-zinc-800"
                    onClick={() => signInWithGoogle()}
                >
                    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Google
                </Button>

                {/* DEBUG: Temporary Config Check */}
                <div className="text-xs text-gray-300 dark:text-zinc-700 text-center mt-4">
                    Config: {import.meta.env.VITE_SUPABASE_URL ? 'URL Loaded' : 'URL Missing'}
                    ({import.meta.env.VITE_SUPABASE_URL?.substring(0, 15)}...)
                </div>
            </Card>
        </div>
    );
}
