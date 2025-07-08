/**
 * React hook for analytics integration
 * Provides easy access to analytics functions with React patterns
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  trackExtensionInstallClick,
  trackNpmCopyClick,
  trackNewsletterSubmitted,
  trackEvent,
  trackPageView,
  trackConversion,
  isAnalyticsReady,
  setAnalyticsEnabled,
} from './analytics';

export function useAnalytics() {
  const [isReady, setIsReady] = useState(false);

  // Check analytics readiness on mount and when window loads
  useEffect(() => {
    const checkReady = () => {
      setIsReady(isAnalyticsReady());
    };

    checkReady();

    // Check again after a short delay to ensure gtag is loaded
    const timer = setTimeout(checkReady, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Wrapped tracking functions with useCallback for performance
  const trackExtensionInstall = useCallback((extensionType: string) => {
    trackExtensionInstallClick(extensionType);
  }, []);

  const trackNpmCopy = useCallback((packageName: string = 'qarbon-query') => {
    trackNpmCopyClick(packageName);
  }, []);

  const trackNewsletter = useCallback((source: string, email?: string) => {
    trackNewsletterSubmitted(source, email);
  }, []);

  const trackCustomEvent = useCallback(
    (action: string, category: string, label?: string, value?: number) => {
      trackEvent(action, category, label, value);
    },
    []
  );

  const trackPage = useCallback((url: string, title: string) => {
    trackPageView(url, title);
  }, []);

  const trackCustomConversion = useCallback(
    (conversionName: string, value?: number, currency?: string) => {
      trackConversion(conversionName, value, currency);
    },
    []
  );

  const setEnabled = useCallback((enabled: boolean) => {
    setAnalyticsEnabled(enabled);
  }, []);

  return {
    // State
    isReady,

    // Core tracking functions
    trackExtensionInstall,
    trackNpmCopy,
    trackNewsletter,

    // Generic tracking
    trackCustomEvent,
    trackPage,
    trackCustomConversion,

    // Utilities
    setEnabled,
  };
}

/**
 * Hook for tracking page views automatically
 * Useful for client-side navigation in SPA
 */
export function usePageTracking() {
  const { trackPage, isReady } = useAnalytics();

  useEffect(() => {
    if (isReady && typeof window !== 'undefined') {
      trackPage(window.location.href, document.title);
    }
  }, [trackPage, isReady]);

  return { trackPage };
}

/**
 * Hook for tracking user interactions with debouncing
 * Prevents duplicate events from rapid clicking
 */
export function useDebouncedTracking(delay: number = 300) {
  const analytics = useAnalytics();
  const [lastEventTime, setLastEventTime] = useState<{ [key: string]: number }>(
    {}
  );

  const trackWithDebounce = useCallback(
    (eventKey: string, trackFunction: () => void) => {
      const now = Date.now();
      const lastTime = lastEventTime[eventKey] || 0;

      if (now - lastTime >= delay) {
        trackFunction();
        setLastEventTime(prev => ({ ...prev, [eventKey]: now }));
      }
    },
    [delay, lastEventTime]
  );

  return {
    ...analytics,
    trackWithDebounce,
  };
}
