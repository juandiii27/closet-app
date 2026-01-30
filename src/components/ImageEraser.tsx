

import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Undo, Check, X } from 'lucide-react';
import { SchematicOverlay, type SchematicShape, type SchematicType } from './SchematicOverlay';

interface ImageEraserProps {
    imageSrc: string;
    originalSrc?: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export const ImageEraser: React.FC<ImageEraserProps> = ({ imageSrc, originalSrc, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const originalImgRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [history, setHistory] = useState<ImageData[]>([]);
    const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastPanPoint = useRef({ x: 0, y: 0 });

    // Schematic State
    const [schematic, setSchematic] = useState<SchematicShape | null>(null);

    const [isRestoreReady, setIsRestoreReady] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            maskCanvasRef.current = maskCanvas;

            if (overlayRef.current) {
                overlayRef.current.width = canvas.width;
                overlayRef.current.height = canvas.height;
            }

            saveToHistory();
        };

        if (originalSrc) {
            const origImg = new Image();
            origImg.crossOrigin = "anonymous";
            origImg.src = originalSrc;
            origImg.onload = () => {
                originalImgRef.current = origImg;
                setIsRestoreReady(true);
            };
            origImg.onerror = () => {
                setIsRestoreReady(false);
            };
        } else {
            setIsRestoreReady(false);
        }
    }, [imageSrc, originalSrc]);

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Save Image History
        const limit = 10;
        const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => {
            const newHist = [...prev, currentImg];
            return newHist.length > limit ? newHist.slice(1) : newHist;
        });

        // Save Mask History
        if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext('2d');
            if (maskCtx) {
                const currentMask = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
                setMaskHistory(prev => {
                    const newHist = [...prev, currentMask];
                    return newHist.length > limit ? newHist.slice(1) : newHist;
                });
            }
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;

        const ctx = canvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');
        if (!ctx || !maskCtx) return;

        const newHistory = [...history];
        newHistory.pop();
        const previousState = newHistory[newHistory.length - 1];
        ctx.putImageData(previousState, 0, 0);
        setHistory(newHistory);

        if (maskHistory.length > 1) {
            const newMaskHistory = [...maskHistory];
            newMaskHistory.pop();
            const previousMask = newMaskHistory[newMaskHistory.length - 1];
            maskCtx.putImageData(previousMask, 0, 0);
            setMaskHistory(newMaskHistory);
        }

        redrawOverlay();
    };

    const redrawOverlay = () => {
        if (!overlayRef.current || !maskCanvasRef.current) return;
        const oCtx = overlayRef.current.getContext('2d');
        if (!oCtx) return;

        oCtx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

        oCtx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

        oCtx.save();
        oCtx.drawImage(maskCanvasRef.current, 0, 0);
        oCtx.globalCompositeOperation = 'source-in';
        oCtx.fillStyle = '#0ea5e9';
        oCtx.fillRect(0, 0, overlayRef.current.width, overlayRef.current.height);
        oCtx.restore();
    };

    useEffect(() => { redrawOverlay(); }, [maskHistory]);





    // Schematic Logic
    const startSchematic = (type: SchematicType) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const initialSize = Math.min(rect.width, rect.height) * 0.5;

        setSchematic({
            type,
            x: (rect.width - initialSize) / 2,
            y: (rect.height - initialSize) / 2,
            width: initialSize,
            height: initialSize,
            rotation: 0
            // Points will be initialized by SchematicOverlay
        });
    };

    const applySchematic = () => {
        if (!schematic || !maskCanvasRef.current || !canvasRef.current || !schematic.points) return;

        const maskCtx = maskCanvasRef.current.getContext('2d');
        const canvas = canvasRef.current;
        if (!maskCtx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Calculate absolute position and size of the schematic on the canvas
        // schematic.x, y, width, height are in CSS pixels relative to the container
        // We need to map 0-100% points to these dimensions, then scale to canvas resolution

        const sX = schematic.x * scaleX;
        const sY = schematic.y * scaleY;
        const sWidth = schematic.width * scaleX;
        const sHeight = schematic.height * scaleY;

        maskCtx.save();
        // Clear the area first? No, we are adding to the mask (protecting). 
        // If we want to "Apply" (Protect), we draw WHITE on the mask canvas.

        // Translate and Rotate
        maskCtx.translate(sX + sWidth / 2, sY + sHeight / 2);
        maskCtx.rotate((schematic.rotation * Math.PI) / 180);
        maskCtx.translate(-(sX + sWidth / 2), -(sY + sHeight / 2));
        maskCtx.translate(sX, sY); // Move to top-left of shape

        maskCtx.fillStyle = 'white';
        maskCtx.beginPath();

        schematic.points.forEach((p, i) => {
            // Points are 0-100 relative to sWidth/sHeight
            const px = (p.x / 100) * sWidth;
            const py = (p.y / 100) * sHeight;
            if (i === 0) maskCtx.moveTo(px, py);
            else maskCtx.lineTo(px, py);
        });
        maskCtx.closePath();

        maskCtx.fill();
        maskCtx.restore();

        saveToHistory();
        setSchematic(null);
        redrawOverlay();
    };

    const applySchematicCrop = () => {
        if (!schematic || !canvasRef.current || !schematic.points) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const sX = schematic.x * scaleX;
        const sY = schematic.y * scaleY;
        const sWidth = schematic.width * scaleX;
        const sHeight = schematic.height * scaleY;

        saveToHistory();

        // Create a temporary canvas to draw the shape mask
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.save();
        tempCtx.translate(sX + sWidth / 2, sY + sHeight / 2);
        tempCtx.rotate((schematic.rotation * Math.PI) / 180);
        tempCtx.translate(-(sX + sWidth / 2), -(sY + sHeight / 2));
        tempCtx.translate(sX, sY);

        tempCtx.fillStyle = 'black'; // Color doesn't matter for destination-in, alpha does
        tempCtx.beginPath();
        schematic.points.forEach((p, i) => {
            const px = (p.x / 100) * sWidth;
            const py = (p.y / 100) * sHeight;
            if (i === 0) tempCtx.moveTo(px, py);
            else tempCtx.lineTo(px, py);
        });
        tempCtx.closePath();
        tempCtx.fill();
        tempCtx.restore();

        // Use destination-in to keep only the intersection
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        // Also update the mask to reflect this "protection" (although technically we just cropped everything else)
        // If we want the remaining area to be "protected" from future erasers, we should paint it white on the mask.
        if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext('2d');
            if (maskCtx) {
                // Clear mask? Or add to it? 
                // If we cropped, the outside is gone. We probably want to protect what's left.
                maskCtx.save();
                maskCtx.translate(sX + sWidth / 2, sY + sHeight / 2);
                maskCtx.rotate((schematic.rotation * Math.PI) / 180);
                maskCtx.translate(-(sX + sWidth / 2), -(sY + sHeight / 2));
                maskCtx.translate(sX, sY);

                maskCtx.fillStyle = 'white';
                maskCtx.beginPath();
                schematic.points.forEach((p, i) => {
                    const px = (p.x / 100) * sWidth;
                    const py = (p.y / 100) * sHeight;
                    if (i === 0) maskCtx.moveTo(px, py);
                    else maskCtx.lineTo(px, py);
                });
                maskCtx.closePath();
                maskCtx.fill();
                maskCtx.restore();
            }
        }

        saveToHistory(); // Save again? Or just once.
        setSchematic(null);
        redrawOverlay();
    };


    const handleSaveClick = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
            if (blob) onSave(blob);
        }, 'image/png');
    };

    const handleSchematicSave = () => {
        applySchematicCrop();
        // Allow the canvas update to be registered before saving
        setTimeout(() => {
            handleSaveClick();
        }, 50);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium mr-4 hidden sm:block">Edit Image</h3>

                    <div className="flex bg-gray-700 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => startSchematic('pants')}
                            className={`p - 1.5 rounded - md text - sm hover: bg - blue - 600 / 20 hover: text - blue - 400 text - white font - medium flex items - center gap - 1`}
                            title="Protect Pants"
                        >
                            <span className='bg-blue-500/20 p-1 rounded'>👖</span> Pants
                        </button>
                        <button
                            onClick={() => startSchematic('shirt')}
                            className={`p - 1.5 rounded - md text - sm hover: bg - blue - 600 / 20 hover: text - blue - 400 text - white font - medium flex items - center gap - 1`}
                            title="Protect Shirt"
                        >
                            <span className='bg-blue-500/20 p-1 rounded'>👕</span> Shirt
                        </button>

                    </div>
                </div>
            </div>

            {/* Canvas Area - Pan & Zoom Container */}
            <div
                className="flex-1 overflow-hidden relative touch-none flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-700/50 p-4 cursor-grab active:cursor-grabbing"
                onWheel={(e) => {
                    // Simple zoom on wheel
                    const delta = -e.deltaY * 0.001;
                    setZoom(z => Math.min(4, Math.max(1, z + delta)));
                }}
                onMouseDown={(e) => {
                    // Only start pan if not clicking on schematic or other interactive elements
                    // But schematic handles its own stopPropagation? Yes.
                    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
                        isPanning.current = true;
                        lastPanPoint.current = { x: e.clientX, y: e.clientY };
                    }
                }}
                onMouseMove={(e) => {
                    if (!isPanning.current) return;
                    const dx = e.clientX - lastPanPoint.current.x;
                    const dy = e.clientY - lastPanPoint.current.y;
                    lastPanPoint.current = { x: e.clientX, y: e.clientY };
                    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
                }}
                onMouseUp={() => isPanning.current = false}
                onMouseLeave={() => isPanning.current = false}
                onTouchStart={(e) => {
                    // Only start pan if not clicking on schematic or other interactive elements
                    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
                        isPanning.current = true;
                        lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    }
                }}
                onTouchMove={(e) => {
                    if (!isPanning.current) return;
                    const dx = e.touches[0].clientX - lastPanPoint.current.x;
                    const dy = e.touches[0].clientY - lastPanPoint.current.y;
                    lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
                }}
                onTouchEnd={() => isPanning.current = false}
            >
                <div
                    ref={containerRef}
                    className="relative shadow-2xl border border-white/20 transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center'
                    }}
                >
                    {/* Main Image Canvas */}
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-[70vh] w-auto h-auto object-contain cursor-crosshair touch-none block"
                    />
                    {/* Overlay Canvas (Blue Mask) */}
                    <canvas
                        ref={overlayRef}
                        className={`max-w-full max-h-[70vh] w-auto h-auto object-contain pointer-events-none absolute inset-0 transition-opacity duration-300 opacity-30`}
                    />
                    {/* Hit Area (Only active if NOT in schematic mode) */}
                    {/* Hit Area logic removed to enable default Panning */}

                    {/* Schematic Layer */}
                    {schematic && canvasRef.current && (
                        <SchematicOverlay
                            shape={schematic}
                            containerWidth={canvasRef.current.clientWidth} // Use client dimensions for overlay sizing
                            containerHeight={canvasRef.current.clientHeight}
                            onChange={setSchematic}
                            onApply={applySchematic}
                            onCrop={applySchematicCrop}
                            onSave={handleSchematicSave}
                            zoom={zoom}
                            onCancel={() => setSchematic(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
