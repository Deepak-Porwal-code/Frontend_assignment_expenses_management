import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A tiny data-fetching hook with loading, error, retry and cancellation.
 * `deps` behave like a useEffect dependency list — change them to refetch.
 */
export function useResource(loader, deps = [], { enabled = true } = {}) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const requestId = useRef(0);

  const run = useCallback(async () => {
    const id = requestId.current + 1;
    requestId.current = id;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const data = await loaderRef.current();
      if (requestId.current === id) {
        setState({ data, loading: false, error: null });
      }
      return data;
    } catch (error) {
      if (requestId.current === id) {
        setState({ data: null, loading: false, error });
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      requestId.current += 1;
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    run().catch(() => {});
    return () => {
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const reload = useCallback(() => {
    run().catch(() => {});
  }, [run]);

  const setData = useCallback((data) => {
    setState((previous) => ({ ...previous, data }));
  }, []);

  return { ...state, reload, setData };
}
