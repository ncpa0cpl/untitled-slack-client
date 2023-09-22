import React from "react";
import { useRefState } from "./use-ref-state";

export const useAsyncOperation = <A extends any[], R>(
  action: (...args: A) => Promise<R>,
) => {
  const [loading, setLoading] = useRefState(false);
  const [error, setError] = React.useState<unknown>(null);
  const [result, setResult] = React.useState<R | null>(null);

  const execute = React.useCallback(
    async (...args: A) => {
      if (loading.current) {
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const result = await action(...args);
        setResult(result);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }

      return result;
    },
    [action],
  );

  return { loading, error, result, execute };
};
