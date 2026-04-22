import { useState, useEffect, useCallback } from 'react';
import { trackPlausible } from '@/components/TrackingPixels';

const STORAGE_KEY = 'native_favorites';

// Global event target for cross-component sync
const favoritesEmitter = new EventTarget();

function getStoredFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useLocalFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getStoredFavorites);

  // Listen for updates from other components
  useEffect(() => {
    const handler = () => {
      setFavorites(getStoredFavorites());
    };
    favoritesEmitter.addEventListener('update', handler);
    return () => favoritesEmitter.removeEventListener('update', handler);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const current = getStoredFavorites();
    const wasFav = current.includes(id);
    const updated = wasFav
      ? current.filter(f => f !== id)
      : [...current, id];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setFavorites(updated);
    trackPlausible(wasFav ? 'Favorite Removed' : 'Favorite Added', { source: 'local' });

    // Notify other components after state update
    setTimeout(() => favoritesEmitter.dispatchEvent(new Event('update')), 0);
  }, []);

  return { favorites, toggleFavorite };
}
