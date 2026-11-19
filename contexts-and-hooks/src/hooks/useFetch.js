import { useEffect, useState } from "react";

export function useFetch(url, { enabled = true } = {}) {
  const [result, setResult] = useState({
    data: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setResult({ data: null, loading: false, error: null });
      return undefined;
    }

    const controller = new AbortController();
    setResult({ data: null, loading: true, error: null });

    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Could not load starter groups (${response.status}).`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Starter groups must be a JSON array.");
        }
        setResult({ data, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setResult({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    load();
    return () => controller.abort();
  }, [enabled, url]);

  return result;
}
