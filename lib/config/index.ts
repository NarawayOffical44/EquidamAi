/**
 * Centralized configuration management
 * All environment variables and constants in one place
 */

const requiredEnvVars = ['ANTHROPIC_API_KEY'];
const optionalEnvVars = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_SITE_URL'];

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Only validate at runtime, not build time
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && process.env._NEXT_BUILD !== '1') {
  try {
    validateEnv();
  } catch (error) {
    // Log but don't throw during build
    console.warn('Config validation:', error instanceof Error ? error.message : String(error));
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
        monthlyUSD: 9900, // $99/month
        annualUSD: 107892, // $99 × 12 × 0.9 = $1,069/year (10% discount)
        maxProfiles: 3,
        description: '3 active startup profiles per month',
      },
      plus: {
        monthlyUSD: 19900, // $199/month
        annualUSD: 215892, // $199 × 12 × 0.9 = $2,159/year (10% discount)
        maxProfiles: 15,
        description: '15 active startup profiles per month',
      },
      enterprise: {
        description: 'Custom pricing for VCs, accelerators, white-label',
        contact: 'sales@evaldam.ai',
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
