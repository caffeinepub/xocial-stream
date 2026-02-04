import { useState, useRef, useCallback } from 'react';

export interface PinchPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface PinchPanHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export interface UseVideoPinchPanConfig {
  minScale?: number;
  maxScale?: number;
  containerRef: React.RefObject<HTMLElement | null>;
  contentWidth: number;
  contentHeight: number;
}

export interface UseVideoPinchPanReturn {
  state: PinchPanState;
  handlers: PinchPanHandlers;
  reset: () => void;
  zoomIn: (step: number) => void;
  zoomOut: (step: number) => void;
}

export function useVideoPinchPan({
  minScale = 1,
  maxScale = 3,
  containerRef,
  contentWidth,
  contentHeight,
}: UseVideoPinchPanConfig): UseVideoPinchPanReturn {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // Refs for gesture tracking
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef(1);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const isPinchingRef = useRef(false);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Clamp pan translation to keep content within bounds
  const clampTranslation = useCallback(
    (newScale: number, newTranslateX: number, newTranslateY: number) => {
      if (!containerRef.current || newScale <= 1) {
        return { x: 0, y: 0 };
      }

      const container = containerRef.current.getBoundingClientRect();
      const scaledWidth = contentWidth * newScale;
      const scaledHeight = contentHeight * newScale;

      // Calculate maximum allowed translation
      // The content should always cover the container
      const maxTranslateX = Math.max(0, (scaledWidth - container.width) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - container.height) / 2);

      return {
        x: Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX)),
        y: Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY)),
      };
    },
    [containerRef, contentWidth, contentHeight]
  );

  // Update scale and clamp translation
  const updateScale = useCallback(
    (newScale: number) => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      setScale(clampedScale);

      // When zooming, adjust translation to keep content centered and clamped
      const clamped = clampTranslation(clampedScale, translateX, translateY);
      setTranslateX(clamped.x);
      setTranslateY(clamped.y);
    },
    [minScale, maxScale, translateX, translateY, clampTranslation]
  );

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two-finger pinch
      isPinchingRef.current = true;
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchDistanceRef.current = distance;
      initialScaleRef.current = scale;
      lastTouchRef.current = null;
    } else if (e.touches.length === 1 && scale > 1) {
      // Single-finger pan (only when zoomed)
      isPinchingRef.current = false;
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale, getTouchDistance]);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
        // Pinch zoom
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const newScale = (currentDistance / initialPinchDistanceRef.current) * initialScaleRef.current;
        updateScale(newScale);
      } else if (e.touches.length === 1 && scale > 1 && lastTouchRef.current && !isPinchingRef.current) {
        // Pan
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchRef.current.x;
        const deltaY = touch.clientY - lastTouchRef.current.y;

        const newTranslateX = translateX + deltaX;
        const newTranslateY = translateY + deltaY;

        const clamped = clampTranslation(scale, newTranslateX, newTranslateY);
        setTranslateX(clamped.x);
        setTranslateY(clamped.y);

        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [scale, translateX, translateY, getTouchDistance, updateScale, clampTranslation]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    initialPinchDistanceRef.current = null;
    lastTouchRef.current = null;
    isPinchingRef.current = false;
  }, []);

  // Reset to default state
  const reset = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  // Zoom in by step
  const zoomIn = useCallback(
    (step: number) => {
      updateScale(scale + step);
    },
    [scale, updateScale]
  );

  // Zoom out by step
  const zoomOut = useCallback(
    (step: number) => {
      updateScale(scale - step);
    },
    [scale, updateScale]
  );

  return {
    state: { scale, translateX, translateY },
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
    zoomIn,
    zoomOut,
  };
}
