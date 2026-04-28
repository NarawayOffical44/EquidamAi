/**
 * Email templates for Evaldam
 */

interface ValuationData {
  companyName: string;
  email: string;
  valuationLow: number;
  valuationMid: number;
  valuationHigh: number;
  scorecard?: number;
  berkus?: number;
  keyReasons?: string[];
  website?: string;
}

interface LeadData {
  companyName: string;
  email: string;
  phone?: string;
  website: string;
  country?: string;
  valuationLow: number;
  valuationMid: number;
  valuationHigh: number;
}

interface WelcomeData {
  fullName: string;
  email: string;
}

const formatCurrency = (num: number): string => {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  return `$${(num / 1000).toFixed(0)}K`;
};

export function valuationResultsEmailTemplate(data: ValuationData) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .valuation-box { background: white; border: 2px solid #ff006e; border-radius: 8px; padding: 25px; text-align: center; margin: 20px 0; }
      .valuation-box .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 10px; }
      .valuation-box .range { font-size: 36px; font-weight: 900; color: #ff006e; margin: 10px 0; }
      .valuation-box .midpoint { font-size: 18px; color: #666; margin: 15px 0 0 0; }
      .methods { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .methods h3 { margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
      .method-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
      .method-item:last-child { border-bottom: none; }
      .method-name { font-weight: 500; }
      .method-value { color: #ff006e; font-weight: 600; }
      .insights { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .insights h3 { margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
      .insight-item { padding: 10px 0; padding-left: 20px; position: relative; }
      .insight-item:before { content: '→'; position: absolute; left: 0; color: #ff006e; font-weight: bold; }
      .cta-section { text-align: center; margin: 30px 0 20px 0; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .cta-button:hover { opacity: 0.9; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
      .footer a { color: #ff006e; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Startup Valuation ✓</h1>
        <p>Free instant analysis for ${data.companyName}</p>
      </div>

      <div class="content">
        <p>Hi there,</p>
        <p>Great news! We've analyzed <strong>${data.companyName}</strong> and generated your free startup valuation estimate. Here are the results:</p>

        <div class="valuation-box">
          <div class="label">Pre-Money Valuation Range</div>
          <div class="range">${formatCurrency(data.valuationLow)} — ${formatCurrency(data.valuationHigh)}</div>
          <div class="midpoint">Mid-point: <strong>${formatCurrency(data.valuationMid)}</strong></div>
        </div>

        ${
          (data.scorecard || data.berkus)
            ? `
        <div class="methods">
          <h3>Method Breakdown</h3>
          ${data.scorecard ? `<div class="method-item"><span class="method-name">Scorecard Method</span><span class="method-value">${formatCurrency(data.scorecard)}</span></div>` : ""}
          ${data.berkus ? `<div class="method-item"><span class="method-name">Berkus Method</span><span class="method-value">${formatCurrency(data.berkus)}</span></div>` : ""}
        </div>
        `
            : ""
        }

        ${
          data.keyReasons && data.keyReasons.length > 0
            ? `
        <div class="insights">
          <h3>Key Drivers</h3>
          ${data.keyReasons.map((reason) => `<div class="insight-item">${reason}</div>`).join("")}
        </div>
        `
            : ""
        }

        <p style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; font-size: 13px;">
          <strong>Note:</strong> This is a quick estimate based on 2 lightweight valuation methods using public website data. For a comprehensive 6-method valuation with detailed analysis, investor benchmarks, and a professional PDF report, sign up for our full platform.
        </p>

        <div class="cta-section">
          <a href="https://evaldam.ai/signup" class="cta-button">Get Full 6-Method Report →</a>
        </div>

        <p style="font-size: 13px; color: #666;">Ready to explore more? Sign up free and unlock:</p>
        <ul style="font-size: 13px; color: #666; margin: 10px 0;">
          <li>✓ 6 professional valuation methods</li>
          <li>✓ Detailed investor-ready PDF reports</li>
          <li>✓ Comparable company benchmarking</li>
          <li>✓ Sensitivity analysis</li>
          <li>✓ Unlimited valuations (on paid plans)</li>
        </ul>

        <p style="margin-top: 30px;">Best regards,<br><strong>The Evaldam Team</strong></p>

        <div class="footer">
          <p>
            Questions? <a href="https://evaldam.ai">Visit our website</a> or reply to this email.
          </p>
          <p>
            © 2025 Evaldam AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Your Startup Valuation Results
==============================

Valuation for ${data.companyName}
Pre-Money Valuation Range: ${formatCurrency(data.valuationLow)} — ${formatCurrency(data.valuationHigh)}
Mid-point: ${formatCurrency(data.valuationMid)}

${
  data.scorecard || data.berkus
    ? `Method Breakdown:
${data.scorecard ? `Scorecard Method: ${formatCurrency(data.scorecard)}` : ""}
${data.berkus ? `Berkus Method: ${formatCurrency(data.berkus)}` : ""}`
    : ""
}

${
  data.keyReasons && data.keyReasons.length > 0
    ? `Key Drivers:
${data.keyReasons.map((r) => `• ${r}`).join("\n")}`
    : ""
}

This is a quick estimate based on 2 lightweight valuation methods using public website data.

For a comprehensive 6-method valuation with detailed analysis, sign up at:
https://evaldam.ai/signup

Best regards,
The Evaldam Team
  `;

  return { html, text };
}

export function newLeadNotificationEmailTemplate(data: LeadData) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px; }
      .lead-box { background: white; padding: 15px; border-left: 4px solid #ff006e; margin: 15px 0; }
      .lead-field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .lead-field:last-child { border-bottom: none; }
      .label { font-weight: 600; color: #666; }
      .value { color: #1f2937; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2 style="margin: 0;">🚀 New Lead Alert</h2>
      </div>

      <div class="content">
        <p>A new startup just checked their free valuation:</p>

        <div class="lead-box">
          <div class="lead-field">
            <span class="label">Company:</span>
            <span class="value"><strong>${data.companyName}</strong></span>
          </div>
          <div class="lead-field">
            <span class="label">Email:</span>
            <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
          </div>
          ${data.phone ? `<div class="lead-field"><span class="label">Phone:</span><span class="value">${data.phone}</span></div>` : ""}
          <div class="lead-field">
            <span class="label">Website:</span>
            <span class="value"><a href="${data.website}" target="_blank">${data.website}</a></span>
          </div>
          ${data.country ? `<div class="lead-field"><span class="label">Country:</span><span class="value">${data.country}</span></div>` : ""}
          <div class="lead-field">
            <span class="label">Valuation:</span>
            <span class="value"><strong>${formatCurrency(data.valuationLow)} — ${formatCurrency(data.valuationHigh)}</strong></span>
          </div>
        </div>

        <p style="text-align: center; margin-top: 20px;">
          <a href="https://evaldam.ai" style="background: #ff006e; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View All Leads</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
New Lead: ${data.companyName}
========================

Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ""}
Website: ${data.website}
${data.country ? `Country: ${data.country}` : ""}
Valuation: ${formatCurrency(data.valuationLow)} — ${formatCurrency(data.valuationHigh)}

Check your leads dashboard for details.
  `;

  return { html, text };
}

export function welcomeEmailTemplate(data: WelcomeData) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 32px; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .step { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff006e; }
      .step h3 { margin: 0 0 10px 0; color: #1f2937; }
      .step p { margin: 0; color: #666; font-size: 14px; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Evaldam! 🎉</h1>
        <p>Professional startup valuations made affordable</p>
      </div>

      <div class="content">
        <p>Hi ${data.fullName},</p>

        <p>Welcome to <strong>Evaldam AI</strong>! We're excited to help you value your startup using professional methodologies trusted by investors and founders.</p>

        <h2 style="margin-top: 30px; color: #1f2937;">Get Started in 3 Steps:</h2>

        <div class="step">
          <h3>1. Create Your Startup Profile</h3>
          <p>Upload your pitch deck or website URL. Our AI will auto-fill your company data to save time.</p>
        </div>

        <div class="step">
          <h3>2. Run Your Valuation</h3>
          <p>Generate a professional valuation using 6 industry-standard methods including Scorecard, Berkus, VC Method, and DCF approaches.</p>
        </div>

        <div class="step">
          <h3>3. Download Your Report</h3>
          <p>Get an investor-ready PDF report with detailed analysis, benchmarks, and sensitivity analysis.</p>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="https://evaldam.ai/startup/create" class="cta-button">Start My First Valuation →</a>
        </p>

        <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <strong>Pro Tip:</strong> Check out our <a href="https://evaldam.ai/pricing" style="color: #ff006e;">pricing page</a> to learn about Pro and Plus plans with unlimited valuations and advanced features.
        </p>

        <p style="margin-top: 30px; font-size: 14px;">
          Have questions? We're here to help!<br>
          Reply to this email or visit <a href="https://evaldam.ai" style="color: #ff006e;">evaldam.ai</a>
        </p>

        <p style="margin-top: 30px;">Happy valuing,<br><strong>The Evaldam Team</strong></p>

        <div class="footer">
          <p>© 2025 Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Welcome to Evaldam AI!
====================

Hi ${data.fullName},

We're excited to help you value your startup using professional methodologies.

Get Started in 3 Steps:

1. Create Your Startup Profile
   Upload your pitch deck or website URL for automatic data extraction.

2. Run Your Valuation
   Generate valuations using 6 industry-standard methods.

3. Download Your Report
   Get an investor-ready PDF with detailed analysis.

Start your first valuation: https://evaldam.ai/startup/create

Questions? Reply to this email.

Best regards,
The Evaldam Team
  `;

  return { html, text };
}
