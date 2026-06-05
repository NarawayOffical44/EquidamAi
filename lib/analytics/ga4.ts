/**
 * Google Analytics 4 utility functions
 * Initialize GA4 in layout and use these functions to track events
 */

import { hasAnalyticsConsent } from './consent';

const DEFAULT_GA4_MEASUREMENT_ID = 'G-TPJBBP9TKQ';
const blockedAnalyticsKeys = new Set([
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
type AnalyticsParamValue = string | number | boolean;

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

function getMeasurementId() {
  return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID;
}

function sanitizeAnalyticsParams(data?: Record<string, unknown>): Record<string, AnalyticsParamValue> {
  const safeParams: Record<string, AnalyticsParamValue> = {};

  for (const [key, value] of Object.entries(data || {})) {
    if (blockedAnalyticsKeys.has(key) || value === null || value === undefined) continue;
    if (typeof value === 'string') safeParams[key] = value.slice(0, 100);
    if (typeof value === 'number' || typeof value === 'boolean') safeParams[key] = value;
  }

  return safeParams;
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
 * Track key homepage CTA clicks.
 */
export function trackHomepageCtaClick(data: {
  label: string;
  location: string;
  destination: string;
  ctaType?: string;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'homepage_cta_click', {
    cta_label: data.label,
    cta_location: data.location,
    cta_type: data.ctaType,
    destination: data.destination,
  });
}

/**
 * Track plan selection from the pricing page before checkout.
 */
export function trackPricingPlanSelected(data: {
  plan: string;
  billingCycle: string;
  currency: string;
  price?: number;
  country?: string;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'pricing_plan_selected', {
    plan: data.plan,
    billing_cycle: data.billingCycle,
    currency: data.currency,
    value: data.price || 0,
    country: data.country || '',
  });
}

/**
 * Track successful startup profile creation.
 */
export function trackStartupCreated(data: {
  startupId: string;
  stage?: string;
  industry?: string;
  paidAccess?: boolean;
  currentlyRaising?: boolean;
  hasWebsite?: boolean;
  hasProof?: boolean;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'startup_created', {
    startup_id: data.startupId,
    startup_stage: data.stage,
    industry: data.industry,
    paid_access: data.paidAccess,
    currently_raising: data.currentlyRaising,
    has_website: data.hasWebsite,
    has_proof: data.hasProof,
  });
}

/**
 * Track completion of account onboarding.
 */
export function trackOnboardingCompleted(data: {
  role: string;
  nextPath?: string;
  founderStage?: string;
  fundraisingTimeline?: string;
  organizationType?: string;
  portfolioSize?: number;
  stageFocusCount?: number;
  portfolioAiInterest?: string;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'onboarding_completed', {
    role: data.role,
    destination: data.nextPath,
    founder_stage: data.founderStage,
    fundraising_timeline: data.fundraisingTimeline,
    organization_type: data.organizationType,
    portfolio_size: data.portfolioSize,
    stage_focus_count: data.stageFocusCount,
    portfolio_ai_interest: data.portfolioAiInterest,
  });
}

/**
 * Track successful sign-in.
 */
export function trackLogin(data: {
  method?: string;
  destination?: string;
  onboardingCompleted?: boolean;
  hasStartupAccess?: boolean;
}) {
  if (!canTrackAnalytics()) return;

  window.gtag('event', 'login', {
    method: data.method || 'password',
    destination: data.destination,
    onboarding_completed: data.onboardingCompleted,
    has_startup_access: data.hasStartupAccess,
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

  const safeParams = Object.fromEntries(
    Object.entries(data || {}).filter(([key, value]) => {
      if (blockedAnalyticsKeys.has(key)) return false;
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
export function setUserProperties(userId: string, properties?: Record<string, string | number | boolean>) {
  if (!canTrackAnalytics()) return;
  const measurementId = getMeasurementId();
  const safeProperties = sanitizeAnalyticsParams(properties);

  window.gtag('config', measurementId, {
    user_id: userId,
    user_properties: safeProperties,
  });

  if (Object.keys(safeProperties).length > 0) {
    window.gtag('set', 'user_properties', safeProperties);
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
