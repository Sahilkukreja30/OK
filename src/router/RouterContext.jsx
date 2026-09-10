import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { detectUserCountry, setCountryPreference, normalizeCountryCode } from '../services/geoService';

const RouterContext = createContext(null);

/**
 * Parses browser pathname into route state
 */
export function parseRoute(pathname) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);

  // Home root "/"
  if (parts.length === 0) {
    return {
      routeType: 'home',
      countryCode: null,
      slug: null,
      path: '/'
    };
  }

  const first = parts[0].toLowerCase();
  const second = parts[1]?.toLowerCase();
  const third = parts[2]?.toLowerCase();

  // /in or /in/blog or /in/blog/:slug or /in/:slug
  if (first === 'in') {
    if (second === 'blog') {
      if (third) {
        return { routeType: 'blog_detail', countryCode: 'IN', slug: parts[2], path: cleanPath };
      }
      return { routeType: 'blog_list', countryCode: 'IN', slug: null, path: cleanPath };
    }
    if (second) {
      return { routeType: 'blog_detail', countryCode: 'IN', slug: parts[1], path: cleanPath };
    }
    return { routeType: 'blog_list', countryCode: 'IN', slug: null, path: cleanPath };
  }

  // /ae or /ae/blog or /ae/blog/:slug or /ae/:slug
  if (first === 'ae') {
    if (second === 'blog') {
      if (third) {
        return { routeType: 'blog_detail', countryCode: 'AE', slug: parts[2], path: cleanPath };
      }
      return { routeType: 'blog_list', countryCode: 'AE', slug: null, path: cleanPath };
    }
    if (second) {
      return { routeType: 'blog_detail', countryCode: 'AE', slug: parts[1], path: cleanPath };
    }
    return { routeType: 'blog_list', countryCode: 'AE', slug: null, path: cleanPath };
  }

  // /blog or /blog/:slug
  if (first === 'blog') {
    if (second) {
      return { routeType: 'blog_detail', countryCode: 'ALL', slug: parts[1], path: cleanPath };
    }
    return { routeType: 'blog_list', countryCode: 'ALL', slug: null, path: cleanPath };
  }

  // Fallback / Unknown -> Default to home
  return {
    routeType: 'home',
    countryCode: null,
    slug: null,
    path: cleanPath
  };
}

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [detectedGeo, setDetectedGeo] = useState({ countryCode: 'ALL', source: 'detecting' });
  const [isGeoReady, setIsGeoReady] = useState(false);

  // Initialize and run geo-location detection
  useEffect(() => {
    let isMounted = true;
    async function initGeo() {
      const geo = await detectUserCountry();
      if (isMounted) {
        setDetectedGeo(geo);
        setIsGeoReady(true);
      }
    }
    initGeo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to popstate (back/forward browser buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const routeState = parseRoute(currentPath);

  // Determine active country code for the current view
  const effectiveCountry = routeState.countryCode || detectedGeo.countryCode || 'ALL';

  const navigate = useCallback((path, options = {}) => {
    const targetPath = path.startsWith('/') ? path : `/${path}`;
    if (window.location.pathname !== targetPath) {
      if (options.replace) {
        window.history.replaceState({}, '', targetPath);
      } else {
        window.history.pushState({}, '', targetPath);
      }
      setCurrentPath(targetPath);
    }
    if (!options.keepScroll) {
      window.scrollTo({ top: 0, behavior: options.smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Switch region manually
  const switchCountry = useCallback(
    (newCountryCode) => {
      const norm = normalizeCountryCode(newCountryCode);
      setCountryPreference(norm);
      setDetectedGeo({ countryCode: norm, source: 'user_override' });

      let newPath = '/blog';
      if (norm === 'IN') newPath = '/in';
      if (norm === 'AE') newPath = '/ae';

      navigate(newPath);
    },
    [navigate]
  );

  // Navigate to blog index respecting geo detection
  const goToBlogIndex = useCallback(() => {
    const targetCode = normalizeCountryCode(effectiveCountry);
    if (targetCode === 'IN') {
      navigate('/in');
    } else if (targetCode === 'AE') {
      navigate('/ae');
    } else {
      navigate('/blog');
    }
  }, [effectiveCountry, navigate]);

  // Navigate to single article
  const goToBlogPost = useCallback(
    (slug, postCountry = null) => {
      const targetCountry = normalizeCountryCode(postCountry || effectiveCountry);
      if (targetCountry === 'IN') {
        navigate(`/in/blog/${slug}`);
      } else if (targetCountry === 'AE') {
        navigate(`/ae/blog/${slug}`);
      } else {
        navigate(`/blog/${slug}`);
      }
    },
    [effectiveCountry, navigate]
  );

  // Navigate to Home
  const goToHome = useCallback(
    (hash = null) => {
      navigate('/');
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash.replace('#', ''));
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 80);
      }
    },
    [navigate]
  );

  const value = {
    currentPath,
    routeType: routeState.routeType,
    countryCode: effectiveCountry,
    slug: routeState.slug,
    detectedGeo,
    isGeoReady,
    navigate,
    switchCountry,
    goToBlogIndex,
    goToBlogPost,
    goToHome
  };

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
}
