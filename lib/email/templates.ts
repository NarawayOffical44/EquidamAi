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
        <p>This free estimate is only a starting point. After subscribing, you can build an investor-ready valuation and analysis report with evidence, assumptions, benchmarks, and a professional PDF.</p>

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
          <strong>Note:</strong> This free estimate is not an investor-ready report. It uses public website data for a quick directional view. The subscribed full report adds 6-method analysis, investor benchmarks, assumptions, evidence trail, and a professional PDF.
        </p>

        <p style="background: #f9fafb; border-left: 4px solid #ff006e; padding: 15px; border-radius: 4px; font-size: 13px;">
          After subscribing, you do not just share a pitch deck. You can share an investor-ready valuation and analysis report that helps investors make better funding decisions.
        </p>

        <div class="cta-section">
          <a href="https://equidamai.com/signup" class="cta-button">Get Full 6-Method Report →</a>
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
            Questions? <a href="https://equidamai.com">Visit our website</a> or reply to this email.
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

This free estimate is not an investor-ready report. It uses public website data for a quick directional view.

After subscribing, you can build an investor-ready valuation and analysis report with evidence, assumptions, benchmarks, and a professional PDF.

After subscribing, you do not just share a pitch deck. You can share an investor-ready valuation and analysis report that helps investors make better funding decisions.

For a comprehensive 6-method valuation with detailed analysis, sign up at:
https://equidamai.com/signup

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
          <a href="https://equidamai.com" style="background: #ff006e; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View All Leads</a>
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
          <a href="https://equidamai.com/startup/create" class="cta-button">Start My First Valuation →</a>
        </p>

        <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <strong>Pro Tip:</strong> Check out our <a href="https://equidamai.com/pricing" style="color: #ff006e;">pricing page</a> to learn about Startup and Agency / Investor plans with saved reports, scenarios, and advanced features.
        </p>

        <p style="margin-top: 30px; font-size: 14px;">
          Have questions? We're here to help!<br>
          Reply to this email or visit <a href="https://equidamai.com" style="color: #ff006e;">equidamai.com</a>
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

Start your first valuation: https://equidamai.com/startup/create

Questions? Reply to this email.

Best regards,
The Evaldam Team
  `;

  return { html, text };
}

export function nurtureDayOneEmailTemplate(data: {
  companyName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .benefit-box { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #ff006e; margin: 20px 0; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Next Steps for ${data.companyName} 📈</h1>
        <p>Make your valuation even more powerful</p>
      </div>

      <div class="content">
        <p>Hi,</p>

        <p>Thanks for using Evaldam's free valuation tool for <strong>${data.companyName}</strong>! You now have a starting point, not an investor-ready report yet. Here's what successful founders do next after subscribing:</p>

        <div class="benefit-box">
          <h3 style="margin-top: 0;">Why Build the Full Investor-Ready Report?</h3>
          <ul style="margin: 10px 0;">
            <li><strong>6 Professional Methods</strong> vs. 4 methods in the free version</li>
            <li><strong>Investor-ready valuation and analysis report</strong> to share alongside your pitch deck</li>
            <li><strong>Comparable Company Analysis</strong> - see how you stack against peers</li>
            <li><strong>Sensitivity Analysis</strong> - understand what moves your valuation</li>
            <li><strong>Evidence and assumptions trail</strong> so investors can see what supports the number</li>
          </ul>
        </div>

        <p><strong>Pro Tip:</strong> Now you do not just share a pitch deck. After subscribing, you can share an investor-ready valuation and analysis report that helps investors make better funding decisions.</p>

        <div style="text-align: center;">
          <a href="https://equidamai.com/pricing" class="cta-button">See Pricing →</a>
        </div>

        <p style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; font-size: 13px; margin-top: 20px;">
          <strong>Early-stage special:</strong> Join Startup or Agency / Investor plans now and lock in your pricing forever, even if we raise prices later.
        </p>

        <p style="margin-top: 30px;">Questions? Reply to this email anytime.</p>

        <p>Best regards,<br><strong>The Evaldam Team</strong></p>

        <div class="footer">
          <p>© 2025 Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Next Steps for ${data.companyName}
================================

Hi,

Thanks for using Evaldam's free valuation! Here's what you should do next:

WHY GET THE FULL REPORT?
• 6 Professional Methods (vs 4 in free version)
• Investor-Ready PDF Reports (25+ pages)
• Comparable Company Analysis
• Sensitivity Analysis
• No Watermarks

Most founders run 3-5 valuations during fundraising. Paid plans let you regenerate valuations as your saved inputs and assumptions change.

See pricing: https://equidamai.com/pricing

Early-stage special: Lock in pricing forever by joining Startup or Agency / Investor now.

Questions? Reply to this email.

Best regards,
The Evaldam Team
  `;

  return { html, text };
}

export function nurtureDayThreeEmailTemplate(data: {
  companyName: string;
  valuationMid: number;
}) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 26px; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .case-box { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>How Other Founders Use Evaldam 🚀</h1>
        <p>Real strategies from successful startups</p>
      </div>

      <div class="content">
        <p>Hi,</p>

        <p>Your free valuation shows ${data.companyName} at around <strong>$${(data.valuationMid / 1000000).toFixed(1)}M</strong>. But here's what's interesting—founders who upgrade discover insights that change their strategy.</p>

        <div class="case-box">
          <h3 style="margin-top: 0;">A Real Example:</h3>
          <p><strong>SaaS founder, Series A stage</strong> initially valued at $12M using the free tool. After running the full 6-method analysis:</p>
          <ul style="margin: 10px 0;">
            <li>Found they could realistically raise at $18-20M (higher than expected)</li>
            <li>Discovered their team quality added $3M in valuation premium</li>
            <li>Understood which metrics to improve first for next round</li>
            <li>Shared the professional report with 5 VCs (3 expressed interest)</li>
          </ul>
        </div>

        <p>The full Evaldam report doesn't just give a number—it shows <strong>why</strong> your startup is valuable and <strong>what levers you can pull</strong> to increase it.</p>

        <div style="text-align: center;">
          <a href="https://equidamai.com/pricing" class="cta-button">See Startup Pricing from $44/mo →</a>
        </div>

        <p style="font-size: 13px; color: #666; margin-top: 20px;">
          Not ready yet? No problem. We'll follow up one more time with success stories and a special offer.
        </p>

        <p style="margin-top: 30px;">Best regards,<br><strong>The Evaldam Team</strong></p>

        <div class="footer">
          <p>© 2025 Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
How Other Founders Use Evaldam
==============================

Hi,

Your free valuation shows ${data.companyName} at ~$${(data.valuationMid / 1000000).toFixed(1)}M.

But here's what's interesting: founders who upgrade discover insights that change strategy.

REAL EXAMPLE: SaaS founder, Series A stage
• Initially valued at $12M (free tool)
• Full analysis showed $18-20M realistically
• Discovered team quality added $3M premium
• Used report with 5 VCs (3 interested)

The full report shows WHY your startup is valuable and WHAT to improve next.

See Startup Pricing: https://equidamai.com/pricing (from $44/mo)

Best regards,
The Evaldam Team
  `;

  return { html, text };
}

export function nurtureDaySevenEmailTemplate(data: {
  companyName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 26px; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .offer-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Last Chance: Special Offer Inside 🎁</h1>
        <p>Lock in your pricing</p>
      </div>

      <div class="content">
        <p>Hi,</p>

        <p>We noticed you ran a free valuation for <strong>${data.companyName}</strong> but haven't upgraded to see the full analysis yet.</p>

        <div class="offer-box">
          <h3 style="margin-top: 0;">🎯 FOUNDER'S SPECIAL OFFER</h3>
          <p><strong>Sign up this week and lock in your plan price forever.</strong> We're growing fast, and pricing will increase soon for new customers. Early founders get grandfathered rates.</p>
          <ul style="margin: 10px 0;">
            <li>✓ <strong>Startup Plan</strong> (full report workflow for one startup)</li>
            <li>✓ <strong>Agency / Investor Plan</strong> (portfolio workflows + advanced features)</li>
            <li>✓ <strong>Forever lock-in</strong> — pay this price forever, even if we raise it</li>
          </ul>
        </div>

        <p>This offer expires <strong>in 7 days</strong>. After that, new customers will pay higher rates.</p>

        <div style="text-align: center;">
          <a href="https://equidamai.com/pricing" class="cta-button">See Startup and Agency Plans →</a>
        </div>

        <p style="font-size: 13px; color: #666; margin-top: 20px;">
          Questions? Reply to this email or chat with us on <a href="https://equidamai.com" style="color: #ff006e;">equidamai.com</a>
        </p>

        <p style="margin-top: 30px;">Good luck with ${data.companyName},<br><strong>The Evaldam Team</strong></p>

        <div class="footer">
          <p>© 2025 Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Last Chance: Special Offer Inside
=================================

Hi,

We noticed you ran a free valuation for ${data.companyName} but haven't upgraded yet.

FOUNDER'S SPECIAL OFFER:
Sign up this week and lock in your plan price forever. Pricing increases soon!

• Startup Plan (one startup + saved reports)
• Agency / Investor Plan (portfolio workflows + advanced features)
• Forever lock-in price guarantee

This offer expires in 7 days.

See Startup and Agency Plans: https://equidamai.com/pricing

Questions? Reply to this email.

Good luck with ${data.companyName},
The Evaldam Team
  `;

  return { html, text };
}

export function teamInvitationEmailTemplate(data: {
  inviterName: string;
  invitedEmail: string;
  invitationCode: string;
  expiresIn: string;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://equidamai.com").replace(/\/$/, "");
  const acceptLink = `${siteUrl}/team/accept-invite?code=${encodeURIComponent(data.invitationCode)}`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .invite-box { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #ff006e; margin: 20px 0; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #ff006e 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
      .expires { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; font-size: 13px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Join Evaldam Team 🎯</h1>
        <p>You've been invited to collaborate</p>
      </div>

      <div class="content">
        <p>Hi,</p>

        <p><strong>${data.inviterName}</strong> has invited you to join their team on <strong>Evaldam AI</strong>!</p>

        <div class="invite-box">
          <p style="margin: 0 0 15px 0;">You'll be able to:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>View and edit shared startup profiles</li>
            <li>Access team valuations and reports</li>
            <li>Collaborate on investor pitches</li>
            <li>Track valuation trends together</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${acceptLink}" class="cta-button">Accept Invitation →</a>
        </div>

        <p style="text-align: center; font-size: 13px; color: #666;">
          Or copy this link: <br><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${acceptLink}</code>
        </p>

        <div class="expires">
          <strong>⏰ This invitation expires in ${data.expiresIn}</strong>
        </div>

        <p style="margin-top: 30px; font-size: 14px;">
          Questions? Reply to this email or visit <a href="https://equidamai.com" style="color: #ff006e;">equidamai.com</a>
        </p>

        <p style="margin-top: 30px;">Best regards,<br><strong>The Evaldam Team</strong></p>

        <div class="footer">
          <p>© 2025 Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Join Evaldam Team
=================

Hi,

${data.inviterName} has invited you to join their team on Evaldam AI!

You'll be able to:
• View and edit shared startup profiles
• Access team valuations and reports
• Collaborate on investor pitches
• Track valuation trends together

Accept your invitation: ${acceptLink}

This invitation expires in ${data.expiresIn}.

Questions? Reply to this email.

Best regards,
The Evaldam Team
  `;

  return { html, text };
}

export function teamMemberAccountEmailTemplate(data: {
  inviterName: string;
  invitedEmail: string;
  isNewAccount: boolean;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://equidamai.com").replace(/\/$/, "");
  const loginLink = `${siteUrl}/login?email=${encodeURIComponent(data.invitedEmail)}`;
  const passwordLine = data.isNewAccount
    ? "Use the initial password shared by your workspace Admin."
    : "Use your existing Evaldam AI password.";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #007a7a; color: white; padding: 32px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; }
      .cta-button { display: inline-block; background: #007a7a; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .notice { background: #f9fafb; padding: 15px; border-left: 4px solid #007a7a; border-radius: 4px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Evaldam Team Access</h1>
        <p style="margin: 8px 0 0;">Your workspace login is ready</p>
      </div>
      <div class="content">
        <p>Hi,</p>
        <p><strong>${data.inviterName}</strong> added you to their Evaldam AI team workspace.</p>
        <div class="notice">
          <p style="margin: 0;"><strong>Login email:</strong> ${data.invitedEmail}</p>
          <p style="margin: 8px 0 0;">${passwordLine}</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink}" class="cta-button">Sign In</a>
        </div>
        <p style="font-size: 13px; color: #666;">If you were not expecting this, contact your workspace Admin.</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>The Evaldam Team</strong></p>
        <div class="footer">
          <p>Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Evaldam Team Access
===================

Hi,

${data.inviterName} added you to their Evaldam AI team workspace.

Login email: ${data.invitedEmail}
${passwordLine}

Sign in: ${loginLink}

Best regards,
The Evaldam Team
  `;

  return { html, text };
}

export function startupContributorAccountEmailTemplate(data: {
  inviterName: string;
  invitedEmail: string;
  startupName: string;
  startupId: string;
  isNewAccount: boolean;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://equidamai.com").replace(/\/$/, "");
  const nextPath = `/startup/${data.startupId}?tab=profile`;
  const loginLink = `${siteUrl}/login?email=${encodeURIComponent(data.invitedEmail)}&next=${encodeURIComponent(nextPath)}`;
  const passwordLine = data.isNewAccount
    ? "Use the initial password shared by the portfolio Admin."
    : "Use your existing Evaldam AI password.";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #007a7a; color: white; padding: 32px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; }
      .cta-button { display: inline-block; background: #007a7a; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .notice { background: #f9fafb; padding: 15px; border-left: 4px solid #007a7a; border-radius: 4px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Startup Details Access</h1>
        <p style="margin: 8px 0 0;">${data.startupName}</p>
      </div>
      <div class="content">
        <p>Hi,</p>
        <p><strong>${data.inviterName}</strong> added you to update details for <strong>${data.startupName}</strong> on Evaldam AI.</p>
        <div class="notice">
          <p style="margin: 0;"><strong>Login email:</strong> ${data.invitedEmail}</p>
          <p style="margin: 8px 0 0;">${passwordLine}</p>
          <p style="margin: 8px 0 0; font-size: 13px;">This restricted access only allows updating the assigned startup card details.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink}" class="cta-button">Update Startup Details</a>
        </div>
        <p style="font-size: 13px; color: #666;">If you were not expecting this, contact the portfolio Admin.</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>The Evaldam Team</strong></p>
        <div class="footer">
          <p>Evaldam AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Startup Details Access
======================

Hi,

${data.inviterName} added you to update details for ${data.startupName} on Evaldam AI.

Login email: ${data.invitedEmail}
${passwordLine}

This restricted access only allows updating the assigned startup card details.

Open startup details: ${loginLink}

Best regards,
The Evaldam Team
  `;

  return { html, text };
}
