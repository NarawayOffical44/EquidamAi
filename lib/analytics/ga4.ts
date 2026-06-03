/**
 * Google Analytics 4 utility functions
 * Initialize GA4 in layout and use these functions to track events
 */

import { hasAnalyticsConsent } from './consent';

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag: (command: string, ...args: unknown[]) => void;
    evaldamInitGA4?: () => void;
  }
}

// Initialize GA4 with Measurement ID
export function initializeGA4(measurementId: string) {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  // Add GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_path: window.location.pathname,
  });
}

function canTrackAnalytics() {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return false;
  window.evaldamInitGA4?.();
  return Boolean(window.gtag);
}

/**
 * Track free valuation submission
 */
export function trackFreeValuationSubmitted(data: {
  companyName: string;
  industry?: string;
  stage?: string;
  valuationMid?: number;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'free_valuation_submitted', {
    company_name: data.companyName,
    industry: data.industry,
    startup_stage: data.stage,
    valuation_mid: data.valuationMid,
    value: data.valuationMid || 0,
    currency: 'USD',
  });
}

/**
 * Track user signup
 */
export function trackSignup(data: {
  email: string;
  plan?: string;
  source?: 'free_valuation' | 'pricing_page' | 'navbar' | 'other';
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'sign_up', {
    method: data.source || 'other',
    email_domain: data.email?.split('@')[1],
    plan: data.plan,
  });
}

/**
 * Track plan upgrade/purchase
 */
export function trackPlanUpgrade(data: {
  plan: 'pro' | 'plus' | 'startup' | 'agency' | 'enterprise';
  price: number;
  annualBilling?: boolean;
  source?: string;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'purchase', {
    transaction_id: `upgrade_${Date.now()}`,
    value: data.price,
    currency: 'USD',
    items: [
      {
        item_name: data.plan.toUpperCase() + ' Plan',
        item_category: 'subscription',
        price: data.price,
        quantity: 1,
      },
    ],
    coupon: '',
  });

  // Also track as conversion
  window.gtag('event', 'plan_upgrade', {
    plan: data.plan,
    price: data.price,
    annual_billing: data.annualBilling || false,
    source: data.source,
  });
}

/**
 * Track checkout intent before payment/manual activation.
 */
export function trackCheckoutRequest(data: {
  plan: string;
  billingCycle: string;
  currency: string;
  country?: string;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'checkout_request', {
    plan: data.plan,
    billing_cycle: data.billingCycle,
    currency: data.currency,
    country: data.country || '',
  });
}

/**
 * Track successful full valuation report generation.
 */
export function trackValuationReportGenerated(data: {
  startupId: string;
  valuationId: string;
  methodologyVersion?: string;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'valuation_report_generated', {
    startup_id: data.startupId,
    valuation_id: data.valuationId,
    methodology_version: data.methodologyVersion,
  });
}

/**
 * Track page view (usually happens automatically, but can force it)
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

/**
 * Track PDF report download
 */
export function trackReportDownload(data: {
  companyName: string;
  reportType: 'full' | 'summary';
  valuationMid?: number;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'file_download', {
    file_name: `${data.companyName}_valuation_${data.reportType}.pdf`,
    file_type: 'pdf',
    company_name: data.companyName,
    report_type: data.reportType,
    value: data.valuationMid || 0,
  });
}

/**
 * Track button/CTA clicks
 */
export function trackButtonClick(buttonName: string, location?: string) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'button_click', {
    button_name: buttonName,
    location: location,
  });
}

/**
 * Track form submission
 */
export function trackFormSubmission(formName: string, data?: Record<string, unknown>) {
  if (!canTrackAnalytics()) return;

  const blockedKeys = new Set([
    'email',
    'phone',
    'name',
    'fullName',
    'password',
    'token',
    'session',
    'session_id',
    'code',
  ]);

  const safeParams = Object.fromEntries(
    Object.entries(data || {}).filter(([key, value]) => {
      if (blockedKeys.has(key)) return false;
      if (typeof value === 'string') return value.length <= 100;
      return typeof value === 'number' || typeof value === 'boolean';
    })
  );

  window.gtag('event', 'form_submit', {
    form_name: formName,
    ...safeParams,
  });
}

/**
 * Track error events
 */
export function trackError(errorName: string, errorMessage?: string) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'exception', {
    description: `${errorName}: ${errorMessage || 'Unknown error'}`,
    fatal: false,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, metadata?: Record<string, unknown>) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'feature_usage', {
    feature_name: featureName,
    ...metadata,
  });
}

/**
 * Track user engagement time
 */
export function trackEngagementTime(seconds: number) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'engagement_time_msec', {
    engagement_time_msec: seconds * 1000,
  });
}

/**
 * Track comparison view
 */
export function trackComparisonView(itemsCompared: string[]) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'view_item_list', {
    items: itemsCompared.map((item, index) => ({
      item_name: item,
      index: index + 1,
    })),
  });
}

/**
 * Set user properties for advanced segmentation
 */
export function setUserProperties(userId: string, properties?: Record<string, string | number>) {
  if (!canTrackAnalytics()) return;
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (!measurementId) return;

  window.gtag('config', measurementId, {
    user_id: userId,
  });

  if (properties) {
    window.gtag('event', 'user_properties', properties);
  }
}

/**
 * Track GitHub repo valuation submission
 */
export function trackGitHubValuationSubmitted(data: {
  repoFullName: string;
  category?: string;
  score?: number;
  valuationMid?: number;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'github_valuation_submitted', {
    repo_full_name: data.repoFullName,
    category: data.category,
    score: data.score,
    valuation_mid: data.valuationMid,
    value: data.valuationMid || 0,
    currency: 'USD',
  });
}
