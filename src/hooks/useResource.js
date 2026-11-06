import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic async resource hook: loading / error / data / refetch.
 * `fetcher` should call a service (e.g. () => leadsService.list(params)).
 * `deps` re-run the fetch when they change.
 */
export default function useResource(fetcher, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const callId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    const id = (callId.current += 1);
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => { if (id === callId.current) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (id === callId.current) setState((s) => ({ ...s, loading: false, error })); });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);

  return { ...state, refetch: run };
}
