/**
 * Centralized configuration management
 * All environment variables and constants in one place
 */
export declare const config: {
    readonly anthropic: {
        readonly apiKey: string;
        readonly model: "claude-3-5-sonnet-20241022";
        readonly maxTokens: 8000;
    };
    readonly stripe: {
        readonly secretKey: string;
        readonly webhookSecret: string;
        readonly pricing: {
            readonly pro: {
                readonly monthlyUSD: 9900;
                readonly annualUSD: 107892;
                readonly maxProfiles: 3;
                readonly description: "3 active startup profiles per month";
            };
            readonly plus: {
                readonly monthlyUSD: 19900;
                readonly annualUSD: 215892;
                readonly maxProfiles: 15;
                readonly description: "15 active startup profiles per month";
            };
            readonly enterprise: {
                readonly description: "Custom pricing for VCs, accelerators, white-label";
                readonly contact: "sales@evaldam.ai";
            };
        };
    };
    readonly app: {
        readonly siteUrl: string;
        readonly name: "Evaldam AI";
        readonly version: "1.0.0";
    };
    readonly benchmarks: {
        readonly arr: {
            readonly traditionaSaaS: {
                readonly min: 3;
                readonly max: 7;
                readonly median: 5.1;
            };
            readonly aiEnhancedSaaS: {
                readonly min: 8;
                readonly max: 20;
                readonly median: 14;
            };
            readonly aiNative: {
                readonly min: 10;
                readonly max: 50;
                readonly median: 25;
            };
            readonly earlyStage: {
                readonly min: 1;
                readonly max: 4;
                readonly median: 2.5;
            };
            readonly growthStage: {
                readonly min: 3;
                readonly max: 8;
                readonly median: 5.5;
            };
        };
        readonly ebitda: {
            readonly publicSaaS: {
                readonly min: 9;
                readonly max: 13;
                readonly median: 10.2;
            };
            readonly privateSaaS: {
                readonly min: 20;
                readonly max: 30;
                readonly median: 25;
            };
            readonly aiPremium: 1.35;
        };
        readonly damodaran: {
            readonly ltgRate: 0.025;
            readonly wacc: 0.11;
            readonly riskFreeRate: 0.042;
            readonly taxRate: 0.21;
        };
        readonly scorecard: {
            readonly baseValuation: {
                readonly 'pre-revenue': 1500000;
                readonly seed: 3000000;
                readonly 'series-a': 8000000;
                readonly 'series-b+': 25000000;
            };
            readonly weights: {
                readonly team: 0.3;
                readonly market: 0.25;
                readonly product: 0.15;
                readonly competition: 0.1;
                readonly sales: 0.1;
                readonly capital: 0.1;
            };
        };
        readonly berkus: {
            readonly factorValue: 750000;
            readonly maxValuation: 3750000;
        };
    };
    readonly timeouts: {
        readonly claudeApiCall: 60000;
        readonly valuationProcess: 120000;
    };
    readonly validation: {
        readonly maxPdfSize: number;
        readonly urlPattern: RegExp;
        readonly companyNameMinLength: 2;
        readonly companyNameMaxLength: 100;
    };
};
export type Config = typeof config;
//# sourceMappingURL=index.d.ts.map