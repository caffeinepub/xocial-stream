import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device has a coarse pointer (touch device).
 * Returns true for mobile/tablet devices, false for desktop with mouse.
 */
export function useIsCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    
    const updatePointerType = () => {
      setIsCoarse(mediaQuery.matches);
    };

    // Initial check
    updatePointerType();

    // Listen for changes (e.g., connecting/disconnecting touch devices)
    mediaQuery.addEventListener('change', updatePointerType);

    return () => {
      mediaQuery.removeEventListener('change', updatePointerType);
    };
  }, []);

  return isCoarse;
}
