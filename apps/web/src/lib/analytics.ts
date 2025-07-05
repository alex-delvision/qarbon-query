/**
 * Analytics wrapper for Google Analytics 4 and Vercel Analytics
 * Safely handles gtag calls with SSR compatibility
 */

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

// Analytics configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Initialize Google Analytics
 * This is called automatically when the gtag script loads
 */
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) return;
  
  // Safe window check for SSR
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

/**
 * Track a generic event
 * @param action - The action being tracked
 * @param category - The category of the event
 * @param label - Optional label for the event
 * @param value - Optional numeric value
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  // Safe noop during SSR
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};

/**
 * Track extension install button click
 * @param extensionType - Type of extension (chrome, firefox, etc.)
 */
export const trackExtensionInstallClick = (extensionType: string = 'chrome') => {
  trackEvent('extension_install_click', 'engagement', extensionType);
  
  // Also track as a custom event for better analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'extension_install_click', {
      extension_type: extensionType,
      event_category: 'user_engagement',
    });
  }
};

/**
 * Track npm package copy button click
 * @param packageName - Name of the package being copied
 */
export const trackNpmCopyClick = (packageName: string = 'qarbon-query') => {
  trackEvent('npm_copy_click', 'engagement', packageName);
  
  // Also track as a custom event for better analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'npm_copy_click', {
      package_name: packageName,
      event_category: 'user_engagement',
    });
  }
};

/**
 * Track newsletter subscription submission
 * @param email - The email address (optional, for privacy we might not want to track this)
 * @param source - Where the subscription came from (header, footer, modal, etc.)
 */
export const trackNewsletterSubmitted = (source: string = 'unknown', email?: string) => {
  trackEvent('newsletter_submitted', 'conversion', source);
  
  // Also track as a custom event for better analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'newsletter_submitted', {
      source,
      event_category: 'conversion',
      // Only include email if explicitly provided and user consents
      ...(email && { email_provided: true }),
    });
  }
};

/**
 * Track page view (useful for SPA navigation)
 * @param url - The URL being viewed
 * @param title - The page title
 */
export const trackPageView = (url: string, title: string) => {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: title,
    page_location: url,
  });
};

/**
 * Track custom conversion events
 * @param conversionName - Name of the conversion
 * @param value - Optional value of the conversion
 * @param currency - Currency for the conversion value
 */
export const trackConversion = (
  conversionName: string,
  value?: number,
  currency: string = 'USD'
) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'conversion', {
    send_to: GA_MEASUREMENT_ID,
    event_category: 'conversion',
    event_label: conversionName,
    value,
    currency,
  });
};

/**
 * Utility function to check if analytics is properly initialized
 */
export const isAnalyticsReady = (): boolean => {
  return typeof window !== 'undefined' && 
         !!window.gtag && 
         !!GA_MEASUREMENT_ID;
};

/**
 * Enable/disable analytics tracking (for GDPR compliance)
 * @param enabled - Whether to enable tracking
 */
export const setAnalyticsEnabled = (enabled: boolean) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }

  // Set the gtag config to respect user privacy choices
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
      // Disable tracking if user opts out
      send_page_view: enabled,
    });
  }
};
