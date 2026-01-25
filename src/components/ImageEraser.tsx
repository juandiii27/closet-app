
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Eraser, Undo, Check, X } from 'lucide-react';

interface ImageEraserProps {
    imageSrc: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export const ImageEraser: React.FC<ImageEraserProps> = ({ imageSrc, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(25);
    // Simple history for one level of undo or just full reset? 
    // Let's implement a rudimentary history stack for better UX.
    const [history, setHistory] = useState<ImageData[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            // Set canvas size to match image, but max width/height within viewport?
            // Better to keep full resolution for processing and scale via CSS.
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            saveToHistory();
        };

    }, [imageSrc]);

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limit history to 10 steps to save memory
        if (history.length > 10) {
            setHistory(prev => [...prev.slice(1), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        } else {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return; // Keep initial state
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const newHistory = [...history];
        newHistory.pop(); // Remove current state
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

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; // Reset
    };

    // Handle saving
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
                <h3 className="font-medium flex items-center gap-2">
                    <Eraser className="w-4 h-4" /> Manual Eraser
                </h3>
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
                {/* We use a container to limit max size but allow scaling */}
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
                    <span>Eraser Size</span>
                    <span>{brushSize}px</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-white h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-center mt-2">
                    {/* Visual preview of brush size */}
                    <div
                        className="rounded-full bg-white/20 border border-white"
                        style={{ width: brushSize, height: brushSize }}
                    />
                </div>
            </div>
        </div>
    );
};
