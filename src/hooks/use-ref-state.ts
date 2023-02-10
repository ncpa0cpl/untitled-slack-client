import React from "react";

export const useRefState = <T>(initialValue: T | (() => T)) => {
  const ref = React.useRef<T>(null as any as T);
  const [state, setState] = React.useState<T>(() => {
    const value =
      typeof initialValue === "function"
        ? (initialValue as any)()
        : initialValue;
    ref.current = value;
    return value;
  });

  const setRefState = React.useCallback((value: T | ((current: T) => T)) => {
    setState((current) => {
      const next =
        typeof value === "function" ? (value as any)(current) : value;
      ref.current = next;
      return next;
    });
  }, []);

  const accessor = React.useMemo(() => {
    return {
      get current() {
        return ref.current;
      },
      state,
    };
  }, [state]);

  return [accessor, setRefState] as const;
};
