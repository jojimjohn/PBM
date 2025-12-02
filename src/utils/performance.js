/**
 * Performance Optimization Utilities
 *
 * This module provides utilities for optimizing React application performance:
 * - Debouncing and throttling for user inputs and events
 * - Lazy loading utilities for images and components
 * - Memoization helpers for expensive computations
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last invocation. Ideal for search inputs and autocomplete.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 * @returns {Function} The debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   fetchSearchResults(query);
 * }, 300);
 */
export function debounce(func, wait, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function - ensures function is called at most once per interval.
 * Ideal for scroll handlers and resize events.
 *
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} The throttled function
 *
 * @example
 * const throttledScroll = throttle((event) => {
 *   updateScrollPosition(event);
 * }, 100);
 */
export function throttle(func, limit) {
  let inThrottle;

  return function executedFunction(...args) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization utility for expensive computations
 * Caches results based on argument signature
 *
 * @param {Function} fn - The function to memoize
 * @returns {Function} The memoized function
 *
 * @example
 * const expensiveCalculation = memoize((data) => {
 *   return data.reduce((acc, item) => acc + item.price, 0);
 * });
 */
export function memoize(fn) {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  };
}

/**
 * Lazy load images with IntersectionObserver
 * Defers image loading until they're about to enter viewport
 *
 * @param {string} selector - CSS selector for images to lazy load
 * @param {object} options - IntersectionObserver options
 *
 * @example
 * lazyLoadImages('img[data-src]', { rootMargin: '50px' });
 */
export function lazyLoadImages(selector = 'img[data-src]', options = {}) {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    });

    document.querySelectorAll(selector).forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Request Idle Callback polyfill for non-critical tasks
 * Defers work until browser is idle
 *
 * @param {Function} callback - Function to execute when idle
 * @param {object} options - Options with timeout
 * @returns {number} Request ID
 */
export const requestIdleCallback = window.requestIdleCallback ||
  function(callback, options) {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, 1);
  };

export const cancelIdleCallback = window.cancelIdleCallback ||
  function(id) {
    clearTimeout(id);
  };

/**
 * Batch multiple state updates to reduce re-renders
 * Groups multiple setState calls into a single render cycle
 *
 * @param {Function[]} updates - Array of update functions
 *
 * @example
 * batchUpdates([
 *   () => setName('John'),
 *   () => setAge(30),
 *   () => setEmail('john@example.com')
 * ]);
 */
export function batchUpdates(updates) {
  // In React 18+, updates are automatically batched
  // This is a helper for clarity and backward compatibility
  updates.forEach(update => update());
}

/**
 * Create a cache with size limit and TTL
 * Useful for API response caching
 *
 * @param {number} maxSize - Maximum cache size
 * @param {number} ttl - Time to live in milliseconds
 * @returns {object} Cache with get/set/clear methods
 */
export function createCache(maxSize = 100, ttl = 300000) {
  const cache = new Map();
  const timestamps = new Map();

  return {
    get(key) {
      if (!cache.has(key)) return undefined;

      const timestamp = timestamps.get(key);
      if (Date.now() - timestamp > ttl) {
        cache.delete(key);
        timestamps.delete(key);
        return undefined;
      }

      return cache.get(key);
    },

    set(key, value) {
      // Remove oldest entry if cache is full
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        timestamps.delete(firstKey);
      }

      cache.set(key, value);
      timestamps.set(key, Date.now());
    },

    clear() {
      cache.clear();
      timestamps.clear();
    },

    has(key) {
      return cache.has(key) && (Date.now() - timestamps.get(key) <= ttl);
    },

    size() {
      return cache.size;
    }
  };
}

/**
 * Virtual scrolling helper - calculates visible items
 * Reduces DOM nodes for large lists
 *
 * @param {Array} items - Full list of items
 * @param {number} scrollTop - Current scroll position
 * @param {number} containerHeight - Height of scroll container
 * @param {number} itemHeight - Height of each item
 * @param {number} overscan - Number of items to render outside viewport
 * @returns {object} Start index, end index, and offset
 */
export function calculateVisibleRange(
  items,
  scrollTop,
  containerHeight,
  itemHeight,
  overscan = 3
) {
  const totalItems = items.length;
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems, visibleEnd + overscan);

  return {
    start,
    end,
    offsetY: start * itemHeight,
    visibleItems: items.slice(start, end)
  };
}

/**
 * Measure component render performance
 * Useful for identifying performance bottlenecks
 *
 * @param {string} componentName - Name of component being measured
 * @param {Function} callback - Function to measure
 */
export function measurePerformance(componentName, callback) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = callback();
    const end = performance.now();

    console.log(`[Performance] ${componentName}: ${(end - start).toFixed(2)}ms`);

    return result;
  }

  return callback();
}

/**
 * Preload component for faster navigation
 * Starts loading component code before it's actually needed
 *
 * @param {Function} importFunc - Dynamic import function
 *
 * @example
 * const SalesPage = lazy(() => import('./pages/Sales'));
 * // On hover or idle time:
 * preloadComponent(() => import('./pages/Sales'));
 */
export function preloadComponent(importFunc) {
  importFunc().catch(() => {
    // Silently fail - component will load normally when needed
  });
}
