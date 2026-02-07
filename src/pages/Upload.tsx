import { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Camera, Image as ImageIcon, Loader2, Check, ArrowRight, Wand2, Eraser } from 'lucide-react';
import { ImageEraser } from '../components/ImageEraser';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCloset } from '../hooks/useCloset';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../context/ClosetContext';
import { StorageService } from '../services/StorageService';
import { ImageService } from '../services/ImageService';
import { VisionService } from '../services/VisionService';
import { useAuth } from '../context/AuthContext';

const CATEGORIES: Category[] = ['Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories', 'Other'];

export default function Upload() {
    const { addItem } = useCloset();
    const { user, profile } = useAuth(); // Get profile
    const navigate = useNavigate();

    const [step, setStep] = useState<'select' | 'preview' | 'processing' | 'result' | 'adjust'>('select');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category>('Tops');
    // Gender is now derived from profile
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for the raw file object
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [processedFile, setProcessedFile] = useState<File | null>(null);
    const [aiTags, setAiTags] = useState<string | null>(null);
    const [fullVisionResult, setFullVisionResult] = useState<any>(null); // Store full JSON
    const [visionError, setVisionError] = useState<string | null>(null); // NEW: Error state

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Keep preview logic for UI
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setSelectedImage(result);
                setOriginalImage(result);
                setStep('preview');
                setAiTags(null);
                setVisionError(null); // Reset error
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = async () => {
        setStep('processing');
        setVisionError(null);

        if (!selectedFile) {
            setStep('result');
            return;
        }

        try {
            // 1. Parallel Processing: Remove Background + Analyze Image (Vision API)
            const processPromise = ImageService.removeBackground(selectedFile);

            // Vision analysis with precise error catching
            const analysisPromise = VisionService.analyzeClothing(selectedFile).catch(err => {
                console.error("Vision API Error:", err);
                return { error: err.message || "Unknown error" }; // Return object on error
            });

            const timeoutPromise = new Promise<Blob>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 25000)
            );

            // Wait for both results
            const [processedBlob, visionResult] = await Promise.all([
                Promise.race([processPromise, timeoutPromise]),
                analysisPromise
            ]);

            // Handle Vision Result
            if (typeof visionResult === 'object' && visionResult.error) {
                setVisionError(visionResult.error); // Show error in UI
                console.warn("Vision Failed:", visionResult.error);
                setFullVisionResult(null);
            } else if (typeof visionResult === 'object') {
                // Success case with Object
                // If it's the simplified string (legacy), we won't see this branch typically
                // But VisionService returns JSON object now by default for 2.0+
                console.log("👗 AI Vision Data:", visionResult);

                const result = visionResult as any;

                // Build tag string for filename/display
                const desc = [
                    result.primaryColor,
                    result.subCategory,
                    result.fitAppearance,
                    result.formalitySignal
                ].filter(Boolean).join('_').toLowerCase();

                setAiTags(desc);
                setFullVisionResult(visionResult);
            } else if (typeof visionResult === 'string' && visionResult.length > 0) {
                console.log("👗 AI Vision Tags:", visionResult);
                setAiTags(visionResult);
            } else {
                setVisionError("No description returned.");
            }

            // Convert Blob to Base64 for preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setStep('result');
            };
            reader.readAsDataURL(processedBlob);

            // 2. SMART RENAMING
            // If tags exist, rename the file! e.g. "blue_polo_old_money.png"
            const tags = typeof visionResult === 'string' ? visionResult : "";
            const newFileName = tags
                ? `${tags}.png`
                : `processed-image_${Date.now()}.png`;

            const refinedFile = new File([processedBlob], newFileName, { type: 'image/png' });
            setProcessedFile(refinedFile);

        } catch (error) {
            console.error("Image processing failed", error);
            alert("Could not process image completely. Using original.");
            setStep('result');
        }
    };

    const handleSave = async () => {
        if (!selectedFile || !user) return;
        setIsSaving(true);

        try {
            const fileToUpload = processedFile || selectedFile;
            const imageUrl = await StorageService.uploadImage(user.id, fileToUpload);

            await addItem({
                image: imageUrl,
                category: selectedCategory,
                gender: profile?.gender || 'Unisex',
                // Save AI Metadata
                subCategory: fullVisionResult?.subCategory,
                primaryColor: fullVisionResult?.primaryColor,
                secondaryColors: fullVisionResult?.secondaryColors,
                formalitySignal: fullVisionResult?.formalitySignal,
                fabricAppearance: fullVisionResult?.fabricAppearance,
                fitAppearance: fullVisionResult?.fitAppearance,
                patterns: fullVisionResult?.patterns,
            });

            navigate('/');
        } catch (error) {
            console.error("Upload failed details:", error);
            alert(`Failed to save item: ${(error as any).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const reset = () => {
        setSelectedImage(null);
        setOriginalImage(null);
        setSelectedFile(null);
        setProcessedFile(null);
        setAiTags(null);
        setVisionError(null);
        setStep('select');
    };

    return (
        <div className="h-full flex flex-col p-6 bg-white min-h-[calc(100vh-80px)]">
            <AnimatePresence mode="wait">

                {step === 'select' && (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col items-center justify-center text-center"
                    >
                        <div className="bg-gray-50 p-8 rounded-full mb-8 relative">
                            <Camera className="w-12 h-12 text-black" />
                            <div className="absolute top-0 right-0 bg-white p-2 rounded-full shadow-md">
                                <Wand2 className="w-4 h-4 text-purple-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">Add New Item</h2>
                        <p className="text-gray-500 mb-8 max-w-[260px] leading-relaxed">
                            Upload a photo and our AI will remove the background to create a studio-quality image.
                        </p>

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />

                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="mr-2 w-5 h-5" /> Take Photo
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="mr-2 w-5 h-5" /> Upload from Gallery
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'preview' && selectedImage && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col"
                    >
                        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg mb-6 bg-gray-100">
                            <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                                <p className="text-white font-medium">Original Image</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={reset}>Retake</Button>
                            <Button className="flex-[2]" onClick={handleProcess}>
                                Remove Background <Wand2 className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-black blur-xl opacity-10 animate-pulse rounded-full" />
                            <Loader2 className="w-16 h-16 text-black animate-spin relative z-10" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">My Designer Eye is Looking...</h3>
                        <p className="text-gray-500">Analyzing style, fabric, and vibe...</p>
                    </motion.div>
                )}

                {step === 'result' && selectedImage && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col"
                    >
                        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 flex items-center justify-center p-8">
                            <img src={selectedImage} className="max-h-full object-contain drop-shadow-2xl" alt="Processed" />

                            <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Studio Ready
                            </div>

                            {/* Edit Button overlay */}
                            <div className="absolute bottom-4 right-4">
                                <Button size="sm" variant="outline" onClick={() => setStep('adjust')} className="bg-white/80 backdrop-blur-sm hover:bg-white text-xs h-8">
                                    <Eraser className="w-3 h-3 mr-1.5" /> Edit / Erase
                                </Button>
                            </div>
                        </div>

                        {/* AI TAG DISPLAY */}
                        {aiTags && (
                            <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start gap-3">
                                <Wand2 className="w-5 h-5 text-purple-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-purple-900">Detected Style:</h4>
                                    <p className="text-xs text-purple-700 mt-1 leading-relaxed capitalize">
                                        {aiTags.split('_').join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ERROR DISPLAY */}
                        {visionError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                                <div className="text-red-600 font-bold">!</div>
                                <div>
                                    <h4 className="text-sm font-semibold text-red-900">Vision Error:</h4>
                                    <p className="text-xs text-red-700 mt-1">
                                        {visionError}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-gray-700 px-1">Select Category:</label>
                            {/* Gender is auto-selected based on profile: {profile?.gender} */}
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            selectedCategory === cat
                                                ? "bg-gray-50 border-black text-black font-medium"
                                                : "border-gray-200 hover:border-gray-300 text-gray-600"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <Button size="lg" className="w-full" onClick={handleSave} isLoading={isSaving}>
                                Add to Closet <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'adjust' && selectedImage && (
                    <motion.div
                        key="adjust"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col h-full"
                    >
                        <ImageEraser
                            imageSrc={selectedImage}
                            originalSrc={originalImage || selectedImage}
                            onCancel={() => setStep('result')}
                            onSave={(blob) => {
                                const newFile = new File([blob], processedFile?.name || 'edited_image.png', { type: 'image/png' });
                                setProcessedFile(newFile);

                                // Update preview
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setSelectedImage(reader.result as string);
                                    setStep('result');
                                };
                                reader.readAsDataURL(blob);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
