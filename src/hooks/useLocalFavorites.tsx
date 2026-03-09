import { useCallback, useSyncExternalStore } from 'react';

// Shared in-memory cache and listener pattern for cross-component sync
const listeners = new Set<() => void>();
let cache: string[] = (() => {
  try {
    return JSON.parse(localStorage.getItem('native_favorites') || '[]');
  } catch {
    return [];
  }
})();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return cache;
}

function notify() {
  listeners.forEach(l => l());
}

export function useLocalFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleFavorite = useCallback((id: string) => {
    cache = cache.includes(id) 
      ? cache.filter(f => f !== id) 
      : [...cache, id];
    localStorage.setItem('native_favorites', JSON.stringify(cache));
    notify();
  }, []);

  return { favorites, toggleFavorite };
}
