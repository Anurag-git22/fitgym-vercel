import { useState, useEffect, useCallback } from 'react';

/**
 * useSupabaseQuery
 *
 * @param {() => Promise<{data: any, error: any}>} queryFn
 *   A function that returns a Supabase query promise.
 *   Re-runs whenever `deps` change.
 * @param {Array} deps  Dependency array (like useEffect).
 *
 * @returns {{ data, loading, error, refetch }}
 */
export function useSupabaseQuery(queryFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await queryFn();
      if (err) throw err;
      setData(result);
    } catch (e) {
      setError(e.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
