import { useEffect, useState } from 'react';

/**
 * Loads a list from the CMS once. `fetcher` must be a stable function that resolves to an array
 * (the content service functions never reject – they resolve to [] on failure).
 */
export default function useCmsList(fetcher) {
  const [state, setState] = useState({ items: [], isLoaded: false });

  useEffect(() => {
    let isMounted = true;
    fetcher().then((items) => {
      if (isMounted) setState({ items, isLoaded: true });
    });
    return () => {
      isMounted = false;
    };
  }, [fetcher]);

  return state;
}
