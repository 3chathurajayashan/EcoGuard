import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage } from './http';

/**
 * Loads data every time the screen gains focus. Keeps showing the previous data while it
 * refreshes, so lists do not flash empty when you come back to them.
 */
export function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef(loader);
  useEffect(() => {
    latest.current = loader;
  });

  const reload = useCallback(async () => {
    try {
      const result = await latest.current();
      setData(result);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, loading, error, reload, setData };
}
