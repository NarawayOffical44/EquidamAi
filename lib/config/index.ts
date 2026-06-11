/**
 * Centralized configuration management
 * All environment variables and constants in one place
 */

export const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SITE_URL',
] as const;

export const optionalEnvVars = [
  'ANTHROPIC_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'GA4_API_SECRET',
  'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
  'BREVO_SMTP_USER',
  'BREVO_SMTP_PASSWORD',
  'NEXT_PUBLIC_SUPPORT_EMAIL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
] as const;

export function getMissingRequiredEnvVars() {
  return requiredEnvVars.filter(key => !process.env[key]);
}

export function getMissingLlmEnvVars() {
  const preferred = (process.env.PREFERRED_LLM_PROVIDER || 'groq').trim().toLowerCase();

  if (preferred === 'evaldam') {
    return process.env.EVALDAM_LLM_ENDPOINT_URL ? [] : ['EVALDAM_LLM_ENDPOINT_URL'];
  }

  if (preferred === 'openrouter') {
    return process.env.OPENROUTER_API_KEY ? [] : ['OPENROUTER_API_KEY'];
  }

  if (preferred === 'anthropic') {
    return process.env.ANTHROPIC_API_KEY ? [] : ['ANTHROPIC_API_KEY'];
  }

  const missing = [];
  if (!process.env.GROQ_API_KEY) missing.push('GROQ_API_KEY');
  if (!process.env.OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY');
  return missing;
}

export function validateEnv() {
  const missing = [...getMissingRequiredEnvVars(), ...getMissingLlmEnvVars()];
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  // API
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8000,
  },

  // Stripe - 3-tier subscription pricing
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    pricing: {
      pro: {
        monthlyUSD: 4400, // $44/month Startup plan
        annualUSD: 47500, // $475/year Startup plan, approx 10% annual saving
        maxProfiles: 1,
        description: 'Startup plan: 1 active startup profile',
      },
      plus: {
        monthlyUSD: 25000, // $250/month Agency / Investor plan
        annualUSD: 270000, // $2,700/year Agency / Investor plan, approx 10% annual saving
        maxProfiles: 10,
        description: 'Agency / Investor plan: 10 active startup profiles',
      },
      enterprise: {
        description: 'Custom pricing for VCs, accelerators, and bulk valuation workflows',
        contact: 'hello@equidamai.com',
      },
    },
  },

  // App
  app: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'Evaldam AI',
    version: '1.0.0',
  },

  // Valuation benchmarks (2026 data)
  benchmarks: {
    arr: {
      traditionaSaaS: { min: 3, max: 7, median: 5.1 },
      aiEnhancedSaaS: { min: 8, max: 20, median: 14 },
      aiNative: { min: 10, max: 50, median: 25 },
      earlyStage: { min: 1, max: 4, median: 2.5 },
      growthStage: { min: 3, max: 8, median: 5.5 },
    },
    ebitda: {
      publicSaaS: { min: 9, max: 13, median: 10.2 },
      privateSaaS: { min: 20, max: 30, median: 25 },
      aiPremium: 1.35, // 35% premium
    },
    damodaran: {
      ltgRate: 0.025, // 2.5%
      wacc: 0.11, // 11% default
      riskFreeRate: 0.042, // 4.2%
      taxRate: 0.21,
    },
    scorecard: {
      baseValuation: {
        'pre-revenue': 1500000,
        'seed': 3000000,
        'series-a': 8000000,
        'series-b+': 25000000,
      },
      weights: {
        team: 0.30,
        market: 0.25,
        product: 0.15,
        competition: 0.10,
        sales: 0.10,
        capital: 0.10,
      },
    },
    berkus: {
      factorValue: 750000,
      maxValuation: 3750000,
    },
  },

  // Timeouts and limits
  timeouts: {
    claudeApiCall: 60000, // 60s
    valuationProcess: 120000, // 2 min
  },

  // Data validation
  validation: {
    maxPdfSize: 10 * 1024 * 1024, // 10MB
    urlPattern: /^https?:\/\/.+/,
    companyNameMinLength: 2,
    companyNameMaxLength: 100,
  },
} as const;

export type Config = typeof config;
