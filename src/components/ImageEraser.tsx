
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Eraser, Undo, Check, X } from 'lucide-react';

interface ImageEraserProps {
    imageSrc: string;
    originalSrc?: string; // Optional original image for restoration
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export const ImageEraser: React.FC<ImageEraserProps> = ({ imageSrc, originalSrc, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImgRef = useRef<HTMLImageElement | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(25);
    const [mode, setMode] = useState<'erase' | 'restore'>('erase');
    const [history, setHistory] = useState<ImageData[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load main image (processed)
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            saveToHistory();
        };

        // Preload original image for restoration
        if (originalSrc) {
            const origImg = new Image();
            origImg.crossOrigin = "anonymous";
            origImg.src = originalSrc;
            origImg.onload = () => {
                originalImgRef.current = origImg;
            };
        }

    }, [imageSrc, originalSrc]);

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limit history
        if (history.length > 10) {
            setHistory(prev => [...prev.slice(1), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        } else {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const newHistory = [...history];
        newHistory.pop();
        const previousState = newHistory[newHistory.length - 1];

        ctx.putImageData(previousState, 0, 0);
        setHistory(newHistory);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);

        if (mode === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else if (mode === 'restore' && originalImgRef.current) {
            // Restore logic: Clip to brush circle, then draw original image
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(originalImgRef.current, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    };

    const handleSaveClick = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (blob) onSave(blob);
        }, 'image/png');
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium mr-4 hidden sm:block">Edit Image</h3>

                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setMode('erase')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${mode === 'erase' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Eraser className="w-4 h-4" /> Erase
                        </button>
                        <button
                            onClick={() => setMode('restore')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${mode === 'restore' ? 'bg-green-600/20 text-green-400 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Undo className="w-4 h-4 rotate-180" /> Restore
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length <= 1} className="text-white hover:bg-gray-700">
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onCancel} className="text-white hover:bg-red-900/50 hover:text-red-200">
                        <X className="w-5 h-5" />
                    </Button>
                    <Button size="sm" onClick={handleSaveClick} className="bg-white text-black hover:bg-gray-200">
                        <Check className="w-5 h-5 mr-1" /> Finish
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden relative touch-none flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-700/50 p-4">
                <div className="relative max-w-full max-h-full shadow-2xl border border-white/20">
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-[70vh] w-auto h-auto object-contain cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </div>

            {/* Brush Settings */}
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>{mode === 'erase' ? 'Eraser' : 'Restore Brush'} Size</span>
                    <span>{brushSize}px</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mode === 'restore' ? 'accent-green-500 bg-gray-600' : 'accent-white bg-gray-600'}`}
                />
                <div className="flex justify-center mt-2">
                    <div
                        className={`rounded-full border ${mode === 'restore' ? 'bg-green-500/50 border-green-500' : 'bg-white/20 border-white'}`}
                        style={{ width: brushSize, height: brushSize }}
                    />
                </div>
            </div>
        </div>
    );
};
