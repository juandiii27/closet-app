import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
    gender: 'Mens' | 'Womens' | 'Unisex';
    age?: string;
    avatarUrl?: string;
    stylePreferences?: string[]; // New field
    onboardingCompleted: boolean;
}

interface SignUpData {
    email: string;
    password?: string;
    username: string;
    gender: UserProfile['gender'];
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password?: string) => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (!supabase) {
                // Mock mode
                const storedUser = localStorage.getItem('mock_user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    const storedProfile = localStorage.getItem(`profile_${parsedUser.id}`);
                    if (storedProfile) setProfile(JSON.parse(storedProfile));
                }
                setLoading(false);
                return;
            }

            try {
                // Creates a race between the actual session check and a 5-second timeout
                // This prevents the app from hanging efficiently on "Verifying session..." forever
                // if Supabase is initializing slowly or network is weird.
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 5000)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };

                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    const stored = localStorage.getItem(`profile_${session.user.id}`);
                    if (stored) setProfile(JSON.parse(stored));
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                // If auth fails, we just assume no user and let them login again
                setUser(null);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();

        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                setSession(session);
                const newUser = session?.user ?? null;
                setUser(newUser);
                if (newUser) {
                    const stored = localStorage.getItem(`profile_${newUser.id}`);
                    if (stored) setProfile(JSON.parse(stored));
                    else setProfile(null);
                } else {
                    setProfile(null);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, []);

    const updateProfile = (data: Partial<UserProfile>) => {
        if (!user) return;
        const newProfile = { ...profile, ...data, onboardingCompleted: true } as UserProfile;
        setProfile(newProfile);
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(newProfile));
    };

    const signInWithGoogle = async () => {
        if (!supabase) {
            alert("Demo Mode: Simulating Google login");
            const mockUser = { id: 'mock-user-google', email: 'user@gmail.com' } as User;
            setUser(mockUser);
            localStorage.setItem('mock_user', JSON.stringify(mockUser));
            return;
        }
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
    };

    const signInWithEmail = async (email: string, password?: string) => {
        if (!supabase) {
            alert(`Demo Mode: Logging in as ${email}`);
            const mockUser = { id: 'mock-user-1', email } as User;
            setUser(mockUser);
            localStorage.setItem('mock_user', JSON.stringify(mockUser));
            return;
        }
        if (password) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
        }
    };

    const signUp = async (data: SignUpData) => {
        if (!supabase) {
            alert(`Demo Mode: Created account for ${data.username}`);
            const mockUser = {
                id: `user-${Date.now()}`,
                email: data.email,
                user_metadata: { username: data.username },
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as unknown as User;
            setUser(mockUser);
            localStorage.setItem('mock_user', JSON.stringify(mockUser));

            // Save profile
            const newProfile: UserProfile = {
                gender: data.gender,
                stylePreferences: [],
                onboardingCompleted: false
            };
            setProfile(newProfile);
            localStorage.setItem(`profile_${mockUser.id}`, JSON.stringify(newProfile));
            return;
        }
        // Supabase Sign Up 
        const { error, data: authData } = await supabase.auth.signUp({
            email: data.email,
            password: data.password || 'temporary-password', // Fallback if no password provided (e.g. magic link flow, though we have password now)
            options: {
                data: {
                    username: data.username,
                    gender: data.gender
                }
            }
        });
        if (error) throw error;

        // If auto-login happened (local session), set profile
        if (authData.user) {
            const newProfile: UserProfile = {
                gender: data.gender,
                stylePreferences: [], // Init empty
                onboardingCompleted: false
            };
            setProfile(newProfile);
            localStorage.setItem(`profile_${authData.user.id}`, JSON.stringify(newProfile));
        }
    };

    const signOut = async () => {
        if (!supabase) {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('mock_user');
            return;
        }
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signInWithGoogle, signInWithEmail, signUp, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
