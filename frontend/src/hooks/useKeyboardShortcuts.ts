import { useEffect, useRef } from 'react';

interface KeyboardShortcuts {
  [key: string]: (e: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const shortcutsRef = useRef<KeyboardShortcuts>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create a key combination string
      let key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) key = 'ctrl+' + key;
      if (e.shiftKey) key = 'shift+' + key;
      if (e.altKey) key = 'alt+' + key;

      // Prevent default for handled shortcuts
      if (shortcutsRef.current[key]) {
        e.preventDefault();
        shortcutsRef.current[key](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};