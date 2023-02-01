import React from "react";

/**
 * State hook for boolean values. Changes from `true` to `false`
 * are debounced by up to `debounce` milliseconds to avoid
 * flickering.
 */
export const useLoadState = (initial: boolean, debounce = 1000) => {
  const [isLoading, _setIsLoading] = React.useState(initial);
  const lastChangedAt = React.useRef<number>();

  const setIsLoading = React.useCallback((newValue: boolean) => {
    _setIsLoading((current) => {
      if (newValue || current === newValue) {
        lastChangedAt.current = Date.now();
        return newValue;
      } else {
        if (!lastChangedAt.current) {
          return newValue;
        }

        const timeSinceLastChange = Date.now() - lastChangedAt.current;

        if (timeSinceLastChange < debounce) {
          setTimeout(
            () => _setIsLoading(newValue),
            debounce - timeSinceLastChange
          );
          return current;
        } else {
          return newValue;
        }
      }
    });
  }, []);

  return [isLoading, setIsLoading] as const;
};
