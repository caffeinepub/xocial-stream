import { useEffect } from 'react';

/**
 * Hook that prevents mobile browser page zoom (pinch-to-zoom and double-tap zoom)
 * while allowing normal scrolling and custom zoom implementations.
 * 
 * Components can opt out by adding data-allow-zoom="true" to their container.
 */
export function usePreventPageZoom() {
  useEffect(() => {
    // Prevent double-tap zoom on iOS Safari and other mobile browsers
    let lastTouchEnd = 0;
    
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Check if the target or any parent has data-allow-zoom
        let element = e.target as HTMLElement | null;
        while (element) {
          if (element.dataset?.allowZoom === 'true') {
            return; // Allow zoom in opted-in containers
          }
          element = element.parentElement;
        }
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent pinch-to-zoom gesture on iOS Safari
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Check if the target or any parent has data-allow-zoom
        let element = e.target as HTMLElement | null;
        while (element) {
          if (element.dataset?.allowZoom === 'true') {
            return; // Allow zoom in opted-in containers
          }
          element = element.parentElement;
        }
        e.preventDefault();
      }
    };

    // Prevent gesturestart event (iOS Safari specific)
    const preventGesture = (e: Event) => {
      // Check if the target or any parent has data-allow-zoom
      let element = e.target as HTMLElement | null;
      while (element) {
        if (element.dataset?.allowZoom === 'true') {
          return; // Allow zoom in opted-in containers
        }
        element = element.parentElement;
      }
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    document.addEventListener('touchmove', preventPinchZoom, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
      document.removeEventListener('touchmove', preventPinchZoom);
      document.removeEventListener('gesturestart', preventGesture);
    };
  }, []);
}
