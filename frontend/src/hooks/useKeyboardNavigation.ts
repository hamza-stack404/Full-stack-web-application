import { useState, useEffect, KeyboardEvent } from 'react';

export const useKeyboardNavigation = (items: any[], onSelect: (index: number) => void) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Reset focused index when items change
    if (items.length === 0) {
      setFocusedIndex(null);
    } else if (focusedIndex === null || focusedIndex >= items.length) {
      setFocusedIndex(0);
    }
  }, [items.length]);

  const handleKeyDown = (e: KeyboardEvent<Element>) => {
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev === null || prev >= items.length - 1 ? 0 : prev + 1;
          onSelect(nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const prevIndex = prev === null || prev <= 0 ? items.length - 1 : prev - 1;
          onSelect(prevIndex);
          return prevIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex !== null) {
          onSelect(focusedIndex);
        }
        break;
      case 'Delete':
        // Optionally handle delete here
        break;
      default:
        break;
    }
  };

  const resetFocus = () => {
    setFocusedIndex(null);
  };

  return {
    focusedIndex,
    handleKeyDown,
    resetFocus
  };
};