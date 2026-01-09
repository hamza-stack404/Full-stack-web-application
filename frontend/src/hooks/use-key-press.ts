import { useEffect } from 'react';

export const useKeyPress = (targetKey: string, callback: () => void) => {
  useEffect(() => {
    const downHandler = ({ key, ctrlKey, metaKey }: KeyboardEvent) => {
      if (key === targetKey && (ctrlKey || metaKey)) {
        callback();
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [callback, targetKey]);
};
