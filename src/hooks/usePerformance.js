/**
 * Performance Optimization React Hooks
 *
 * Custom hooks for optimizing React component performance:
 * - useDebounce: Debounce rapidly changing values
 * - useThrottle: Throttle function calls
 * - useIntersectionObserver: Detect element visibility
 * - useMemoCompare: Memoize with custom comparison
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Debounce a rapidly changing value
 * Delays updating the value until changes stop for specified delay
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} The debounced value
 *
 * @example
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       // API call only happens 300ms after user stops typing
 *       fetchResults(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 * }
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle a callback function
 * Ensures function is called at most once per interval
 *
 * @param {Function} callback - The function to throttle
 * @param {number} delay - Delay in milliseconds (default: 1000ms)
 * @returns {Function} The throttled callback
 *
 * @example
 * function ScrollComponent() {
 *   const handleScroll = useThrottle((event) => {
 *     console.log('Scroll position:', event.target.scrollTop);
 *   }, 100);
 *
 *   return <div onScroll={handleScroll}>...</div>;
 * }
 */
export function useThrottle(callback, delay = 1000) {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args) => {
      const timeElapsed = Date.now() - lastRun.current;

      if (timeElapsed >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );
}

/**
 * Detect when an element enters/exits the viewport
 * Useful for lazy loading and infinite scroll
 *
 * @param {object} options - IntersectionObserver options
 * @returns {[Function, boolean, IntersectionObserverEntry]} [ref setter, isIntersecting, entry]
 *
 * @example
 * function LazyImage({ src, alt }) {
 *   const [ref, isVisible] = useIntersectionObserver({
 *     threshold: 0.1,
 *     rootMargin: '50px'
 *   });
 *
 *   return (
 *     <img
 *       ref={ref}
 *       src={isVisible ? src : placeholder}
 *       alt={alt}
 *     />
 *   );
 * }
 */
export function useIntersectionObserver(options = {}) {
  const [entry, setEntry] = useState(null);
  const [node, setNode] = useState(null);

  const observer = useRef(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      options
    );

    const { current: currentObserver } = observer;

    if (node) currentObserver.observe(node);

    return () => currentObserver.disconnect();
  }, [node, options]);

  return [setNode, !!entry?.isIntersecting, entry];
}

/**
 * Memoize a value with custom comparison function
 * Prevents unnecessary re-renders when complex objects don't actually change
 *
 * @param {Function} factory - Factory function that returns the value
 * @param {Array} deps - Dependency array
 * @param {Function} compare - Custom comparison function
 * @returns {any} The memoized value
 *
 * @example
 * const memoizedUser = useMemoCompare(
 *   () => ({ ...user, timestamp: Date.now() }),
 *   [user],
 *   (prev, next) => prev?.id === next?.id
 * );
 */
export function useMemoCompare(factory, deps, compare) {
  const ref = useRef();

  if (!ref.current || !compare(ref.current.deps, deps)) {
    ref.current = {
      value: factory(),
      deps
    };
  }

  return ref.current.value;
}

/**
 * Previous value hook - access previous prop or state value
 * Useful for comparing current vs previous to prevent unnecessary work
 *
 * @param {any} value - The value to track
 * @returns {any} The previous value
 *
 * @example
 * function DataTable({ data }) {
 *   const previousData = usePrevious(data);
 *
 *   useEffect(() => {
 *     if (previousData && previousData !== data) {
 *       console.log('Data changed from', previousData, 'to', data);
 *     }
 *   }, [data, previousData]);
 * }
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Local storage hook with automatic JSON serialization
 * Persists state across page reloads
 *
 * @param {string} key - LocalStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function]} [value, setValue]
 *
 * @example
 * function Settings() {
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Media query hook - detect responsive breakpoints
 * Useful for conditional rendering based on screen size
 *
 * @param {string} query - Media query string
 * @returns {boolean} Whether the media query matches
 *
 * @example
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *
 *   return isMobile ? <MobileView /> : <DesktopView />;
 * }
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Window size hook - track viewport dimensions
 * Throttled for performance
 *
 * @returns {object} { width, height }
 *
 * @example
 * function DynamicChart() {
 *   const { width } = useWindowSize();
 *
 *   return <Chart width={width - 100} />;
 * }
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 150); // Throttle to 150ms
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

/**
 * Async data hook with loading and error states
 * Simplifies async data fetching in components
 *
 * @param {Function} asyncFunction - Async function to execute
 * @param {Array} deps - Dependency array
 * @returns {object} { data, loading, error, refetch }
 *
 * @example
 * function UserProfile({ userId }) {
 *   const { data, loading, error } = useAsync(
 *     () => fetchUser(userId),
 *     [userId]
 *   );
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error />;
 *   return <Profile user={data} />;
 * }
 */
export function useAsync(asyncFunction, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const execute = useCallback(() => {
    setState({ data: null, loading: true, error: null });

    asyncFunction()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}
