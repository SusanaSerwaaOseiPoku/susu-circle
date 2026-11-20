import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

export function useFetch(url, { enabled = true } = {}) {
  const [result, setResult] = useState({
    data: null,
    loading: enabled,
    error: null,
  });
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setResult({ data: null, loading: false, error: null });
      return undefined;
    }

    const controller = new AbortController();
    setResult((current) => ({ ...current, loading: true, error: null }));

    async function load() {
      try {
        const response = await api.get(url, { signal: controller.signal });
        const data = response.data;
        if (!Array.isArray(data)) {
          throw new Error(`Expected an array from ${url}.`);
        }
        setResult({ data, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setResult((current) => ({
          ...current,
          loading: false,
          error: `Could not load ${url}: ${error.message}`,
        }));
      }
    }

    load();
    return () => controller.abort();
  }, [enabled, requestNumber, url]);

  const reload = useCallback(
    () => setRequestNumber((current) => current + 1),
    [],
  );

  return { ...result, reload };
}
