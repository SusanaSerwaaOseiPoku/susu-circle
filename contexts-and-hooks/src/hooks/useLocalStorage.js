import { useCallback, useEffect, useState } from "react";

function readStoredValue(key, initialValue, isValid) {
  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) {
      return {
        value: initialValue,
        hasStoredValue: false,
        error: null,
      };
    }

    const value = JSON.parse(storedValue);
    if (!isValid(value)) {
      throw new Error("Saved data has an unexpected format.");
    }

    return { value, hasStoredValue: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      value: initialValue,
      hasStoredValue: false,
      error: `Could not read saved data: ${message}`,
    };
  }
}

export function useLocalStorage(key, initialValue, isValid = () => true) {
  const [stored, setStored] = useState(() =>
    readStoredValue(key, initialValue, isValid),
  );

  const setValue = useCallback((nextValue) => {
    setStored((current) => ({
      value:
        typeof nextValue === "function" ? nextValue(current.value) : nextValue,
      hasStoredValue: true,
      error: null,
    }));
  }, []);

  useEffect(() => {
    if (!stored.hasStoredValue) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(stored.value));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStored((current) => ({
        ...current,
        error: `Could not save data locally: ${message}`,
      }));
    }
  }, [key, stored.hasStoredValue, stored.value]);

  return [stored.value, setValue, stored.hasStoredValue, stored.error];
}
