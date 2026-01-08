import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { StyleSwipe } from '../components/StyleSwipe';

// Quizlet-style Animal Options
const ANIMALS = [
    { emoji: '🦊', name: 'Fox', bg: 'bg-orange-100 border-orange-200' },
    { emoji: '🐼', name: 'Panda', bg: 'bg-slate-100 border-slate-200' },
    { emoji: '🦁', name: 'Lion', bg: 'bg-yellow-100 border-yellow-200' },
    { emoji: '🐯', name: 'Tiger', bg: 'bg-orange-50 border-orange-200' },
    { emoji: '🐨', name: 'Koala', bg: 'bg-gray-100 border-gray-200' },
    { emoji: '🐸', name: 'Frog', bg: 'bg-green-100 border-green-200' },
    { emoji: '🐷', name: 'Pig', bg: 'bg-pink-100 border-pink-200' },
    { emoji: '🐙', name: 'Octopus', bg: 'bg-purple-100 border-purple-200' },
    { emoji: '🦄', name: 'Unicorn', bg: 'bg-indigo-100 border-indigo-200' },
    { emoji: '🦉', name: 'Owl', bg: 'bg-amber-100 border-amber-200' },
];

export default function Onboarding() {
    const { updateProfile } = useAuth();
    // const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedAvatar, setSelectedAvatar] = useState<string>('🦊'); // Default Fox

    const handleNext = () => {
        setStep(2);
    };

    const handleComplete = async (finalStyles: string[]) => {
        // Use ui-avatars to serve the emoji as an image, or just save the emoji itself if backend supports it.
        // For now, let's use the UI Avatars API to generate a nice image from the emoji/name.
        // Actually, let's just use the emoji character + a background color as the 'avatarUrl' logic 
        // in the app is simple. But to be safe and get a real image URL:
        const avatarUrl = `https://ui-avatars.com/api/?name=${selectedAvatar}&background=random&length=1&rounded=true&size=128`;

        try {
            await updateProfile({
                avatarUrl,
                // We could also save a separate field for 'avatarEmoji' if we changed the interface, 
                // but sticking to avatarUrl is safer for now.
                stylePreferences: finalStyles,
                onboardingCompleted: true
            });
            // Hard redirect to ensure state refresh
            window.location.href = '/';
        } catch (error) {
            console.error("Error saving profile:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border-none">

                {/* Step 1: Avatar Selection */}
                {step === 1 && (
                    <div className="animate-in slide-in-from-left fade-in duration-300">
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center text-6xl bg-white rounded-full shadow-sm border-4 border-white ring-1 ring-gray-100">
                                {selectedAvatar}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Choose Your Buddy</h1>
                            <p className="text-gray-500 mt-2">Pick an animal to represent you</p>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-5 gap-3">
                                {ANIMALS.map((animal) => (
                                    <button
                                        key={animal.name}
                                        onClick={() => setSelectedAvatar(animal.emoji)}
                                        className={cn(
                                            "aspect-square flex items-center justify-center rounded-xl text-3xl transition-all",
                                            animal.bg,
                                            selectedAvatar === animal.emoji
                                                ? "ring-4 ring-black ring-offset-2 transform scale-110 z-10 shadow-lg"
                                                : "hover:scale-105 hover:shadow-md opacity-90 hover:opacity-100"
                                        )}
                                        title={animal.name}
                                    >
                                        {animal.emoji}
                                    </button>
                                ))}
                            </div>

                            <Button
                                onClick={handleNext}
                                className="w-full h-12 text-lg"
                            >
                                Next: Set Your Style
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Style Swipe */}
                {step === 2 && (
                    <div className="animate-in slide-in-from-right fade-in duration-300">
                        <div className="text-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Define Your Style</h1>
                            <p className="text-gray-500 mt-1">Swipe right on looks you love!</p>
                        </div>

                        <div className="mb-6">
                            <StyleSwipe
                                onComplete={handleComplete}
                            />
                        </div>

                        {/* Back button removed as per design change */}
                    </div>
                )}
            </Card>
        </div>
    );
}
