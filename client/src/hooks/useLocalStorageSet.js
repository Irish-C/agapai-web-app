import { useState, useEffect } from 'react';

export function useLocalStorageSet(key, initialValue = new Set()) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? new Set(JSON.parse(stored)) : initialValue;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(value)));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }, [value, key]);

  return [value, setValue];
}
