
import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, Scissors, Check } from 'lucide-react';


export type SchematicType = 'pants' | 'shirt' | 'box';

export interface SchematicShape {
    type: SchematicType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    points?: { x: number; y: number }[]; // Array of points relative to the shape box (0-100 range)
}

interface SchematicOverlayProps {
    shape: SchematicShape;
    containerWidth: number;
    containerHeight: number;
    onChange: (shape: SchematicShape) => void;
    onApply: () => void;
    onCrop: () => void;
    onSave: () => void;
    onCancel: () => void;
    zoom: number;
}

export const SchematicOverlay: React.FC<SchematicOverlayProps> = ({
    shape,
    containerWidth,
    containerHeight,
    onChange,
    onApply,
    onCrop,
    onSave,
    onCancel,
    zoom
}) => {
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const isDraggingPoint = useRef<number | null>(null); // Index of point being dragged
    const dragStart = useRef({ x: 0, y: 0 });
    const initialShape = useRef<SchematicShape>(shape);

    // Initialize points if missing
    useEffect(() => {
        if (!shape.points) {
            let defaultPoints: { x: number; y: number }[] = [];
            if (shape.type === 'pants') {
                defaultPoints = [
                    { x: 20, y: 5 }, { x: 80, y: 5 }, { x: 90, y: 30 }, { x: 85, y: 95 },
                    { x: 55, y: 95 }, { x: 50, y: 40 }, { x: 45, y: 95 }, { x: 15, y: 95 }, { x: 10, y: 30 }
                ];
            } else if (shape.type === 'shirt') {
                defaultPoints = [
                    { x: 30, y: 5 }, { x: 70, y: 5 }, { x: 95, y: 30 }, { x: 85, y: 40 },
                    { x: 70, y: 30 }, { x: 70, y: 95 }, { x: 30, y: 95 }, { x: 30, y: 30 },
                    { x: 15, y: 40 }, { x: 5, y: 30 }
                ];
            } else {
                defaultPoints = [
                    { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }
                ];
            }
            onChange({ ...shape, points: defaultPoints });
        }
    }, [shape.type]); // Only reset if type changes

    // Mouse/Touch handlers
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDragging.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStart.current = { x: clientX, y: clientY };
        initialShape.current = JSON.parse(JSON.stringify(shape)); // Deep copy
    };

    const handlePointMouseDown = (index: number, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation(); // Stop box dragging
        isDraggingPoint.current = index;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStart.current = { x: clientX, y: clientY };
        initialShape.current = JSON.parse(JSON.stringify(shape));
    };

    const handlePointDoubleClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!shape.points || shape.points.length <= 3) return; // Don't delete if too few points

        const newPoints = shape.points.filter((_, i) => i !== index);
        onChange({ ...shape, points: newPoints });
    };

    const handlePathMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!shape.points) return;

        // Calculate click position relative to the container
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to 0-100 coordinate space
        const clickX = (x / rect.width) * 100;
        const clickY = (y / rect.height) * 100;

        // Find closest segment
        let minDist = Infinity;
        let insertIndex = -1;
        let finalPoint = { x: 0, y: 0 };

        for (let i = 0; i < shape.points.length; i++) {
            const p1 = shape.points[i];
            const p2 = shape.points[(i + 1) % shape.points.length]; // Wrap around

            // Distance from point to line segment
            // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
            const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
            if (l2 === 0) continue;

            let t = ((clickX - p1.x) * (p2.x - p1.x) + (clickY - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));

            const projX = p1.x + t * (p2.x - p1.x);
            const projY = p1.y + t * (p2.y - p1.y);

            const dist = Math.sqrt((clickX - projX) ** 2 + (clickY - projY) ** 2);

            if (dist < minDist) {
                minDist = dist;
                insertIndex = i + 1;
                finalPoint = { x: projX, y: projY };
            }
        }

        if (insertIndex !== -1 && minDist < 5) { // Threshold for "clicking on line"
            const newPoints = [...shape.points];
            newPoints.splice(insertIndex, 0, finalPoint);
            onChange({ ...shape, points: newPoints });

            // Immediately start dragging the new point?
            // isDraggingPoint.current = insertIndex;
            // dragStart.current = { x: e.clientX, y: e.clientY };
            // initialShape.current = { ...shape, points: newPoints };
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const dx = (clientX - dragStart.current.x) / zoom;
        const dy = (clientY - dragStart.current.y) / zoom;

        if (isDraggingPoint.current !== null && initialShape.current.points) {
            // Updating a specific point
            // Convert pixel delta to relative % delta
            // shape.width is in pixels.
            const dxPercent = (dx / initialShape.current.width) * 100;
            const dyPercent = (dy / initialShape.current.height) * 100;

            const newPoints = [...initialShape.current.points];
            const pt = newPoints[isDraggingPoint.current];
            newPoints[isDraggingPoint.current] = {
                x: Math.min(100, Math.max(0, pt.x + dxPercent)), // Clamp or allow outside? Let's allow slightly outside? No, clamp for now or it gets weird.
                y: Math.min(100, Math.max(0, pt.y + dyPercent)) // Actually clamping makes it hard to use. Removing clamps.
            };
            // Updating standard state without clamping
            newPoints[isDraggingPoint.current] = {
                x: pt.x + dxPercent,
                y: pt.y + dyPercent
            };

            onChange({ ...shape, points: newPoints });

        } else if (isResizing.current) {
            // Resize logic
            onChange({
                ...shape,
                width: Math.max(50, initialShape.current.width + dx),
                height: Math.max(50, initialShape.current.height + dy)
            });

        } else if (isDragging.current) {
            // Move logic
            onChange({
                ...shape,
                x: initialShape.current.x + dx,
                y: initialShape.current.y + dy
            });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        isResizing.current = false;
        isDraggingPoint.current = null;
    };

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        isResizing.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStart.current = { x: clientX, y: clientY };
        initialShape.current = JSON.parse(JSON.stringify(shape));
    };

    useEffect(() => {
        const move = (e: any) => {
            if (isDragging.current || isResizing.current || isDraggingPoint.current !== null) {
                handleMouseMove(e);
            }
        };
        const up = () => handleMouseUp();

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', up);

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [shape]);

    // Construct SVG path from points
    const pointsPath = shape.points
        ? shape.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        : '';

    return (
        <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: containerWidth, height: containerHeight }}
        >
            <div
                className="absolute pointer-events-auto group border-2 border-transparent hover:border-blue-500/50" // We draw outline manually via SVG now
                style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.width,
                    height: shape.height,
                    transform: `rotate(${shape.rotation}deg)`,
                    // cursor: isDraggingPoint.current !== null ? 'crosshair' : 'move' // This flickers
                }}
            >
                {/* Drag Handle (Invisible full area capture) */}
                <div className="absolute inset-0 cursor-move" onMouseDown={handleMouseDown} onTouchStart={handleMouseDown} />

                {/* SVG Shape Rendering */}
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none overflow-visible absolute inset-0">
                    {pointsPath && (
                        <>
                            {/* Invisible thick path for easier clicking */}
                            <path
                                d={pointsPath}
                                fill="none"
                                stroke="transparent"
                                strokeWidth="10"
                                vectorEffect="non-scaling-stroke"
                                className="pointer-events-auto cursor-copy"
                                onMouseDown={handlePathMouseDown}
                            />
                            <path
                                d={pointsPath}
                                fill="rgba(59, 130, 246, 0.5)"
                                stroke="white"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </>
                    )}
                </svg>

                {/* Vertex Handles */}
                {shape.points && shape.points.map((p, i) => (
                    <div
                        key={i}
                        className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-crosshair transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform z-10"
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        onMouseDown={(e) => handlePointMouseDown(i, e)}
                        onTouchStart={(e) => handlePointMouseDown(i, e)}
                        onDoubleClick={(e) => handlePointDoubleClick(i, e)}
                    />
                ))}

                {/* Resize Handle (Bottom Right) */}
                <div
                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-se-resize flex items-center justify-center shadow-sm z-50"
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                >
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>

                {/* Actions Toolbar (Floating above) */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-xl border border-white/20 z-[100]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onCancel(); }}
                        className="p-2.5 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
                        title="Cancel"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-px bg-gray-300 my-1 mx-1" />

                    <button
                        onClick={onApply}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 font-medium text-sm flex items-center gap-1.5 transition-colors"
                        title="Keep Area (Mask)"
                    >
                        <Shield className="w-4 h-4" /> Protect
                    </button>

                    <button
                        onClick={onSave}
                        className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg shadow-green-500/20 font-medium text-sm flex items-center gap-2 transition-all transform active:scale-95 whitespace-nowrap"
                        title="Remove Background & Save"
                    >
                        <Check className="w-4 h-4" /> Add to Closet
                    </button>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <span className="bg-black/75 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                    Drag corners to reshape • Drag center to move
                </span>
            </div>
        </div>
    );
};
