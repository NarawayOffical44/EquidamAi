import fs from "node:fs";
import path from "node:path";

const outDir = path.join("data", "synthetic");
const datasetPath = path.join(outDir, "evaldam_training_chatgopt_10000_generated_quality.jsonl");
const scenarioPath = path.join(outDir, "evaldam_training_chatgopt_10000_scenarios.jsonl");
const reportPath = path.join(outDir, "evaldam_training_chatgopt_10000_report.json");

const SYSTEM = "You are Evaldam AI, an expert in Indian startup and MSME finance.";

const officialAnchors = [
  "MSME classification effective 1 April 2025: Micro up to INR 2.5Cr investment and INR 10Cr turnover; Small up to INR 25Cr and INR 100Cr; Medium up to INR 125Cr and INR 500Cr.",
  "CGTMSE facilitates credit guarantees for eligible MSE credit facilities up to INR 10Cr from 1 April 2025.",
  "SISFS supports up to INR 20L grant for proof of concept/prototype/product trials and up to INR 50L through debt, convertible debentures or debt-linked instruments for market entry, commercialization or scaling.",
  "Section 80-IAC requires DPIIT recognition and IMB approval; eligible startups can claim 100 percent profit deduction for 3 consecutive years out of the first 10 years, subject to conditions.",
  "Income Tax startup guidance states Section 56(2)(viib) is not applicable from Assessment Year 2025-26.",
  "RBI TReDS enables MSME invoice discounting through platforms including RXIL, M1xchange and Invoicemart.",
  "RBI Digital Lending Directions 2025 and Co-Lending Directions 2025 matter for lending, fintech and embedded-credit models.",
  "MeitY DPDP Rules 2025 and the DPDP Act matter for data-heavy startups, enterprise SaaS, healthtech, edtech, fintech and AI platforms.",
  "Companies Act 2013 private placement, ESOP approvals, board/shareholder approvals, PAS-3 filings, SHA and AoA alignment matter for financing rounds.",
  "SEBI ICDR, DRHP/RHP disclosure, governance and audited controls matter for IPO-readiness and pre-IPO financing.",
  "NIDHI-PRAYAS supports early prototype conversion through approved PRAYAS centers where eligibility and stage fit are satisfied.",
  "BIRAC BIG supports eligible biotechnology innovation with grant-in-aid style milestone funding.",
  "iDEX and defence innovation pathways can be relevant for defence-tech validation and procurement access.",
  "SIDBI, AIF/VC routes, angel syndicates, incubators, accelerators, strategic investors and lender products are different resources with different risk profiles."
];

const stages = [
  { name: "idea", stageRisk: "no MVP or revenue, so equity is expensive and proof matters most", runwayBase: 6 },
  { name: "prototype", stageRisk: "prototype risk is still high, so grants and customer validation beat expensive equity", runwayBase: 8 },
  { name: "MVP", stageRisk: "MVP exists but repeatability is unproven, so valuation must stay evidence-led", runwayBase: 10 },
  { name: "pilot revenue", stageRisk: "pilot revenue can mislead if conversion, gross margin and collections are weak", runwayBase: 11 },
  { name: "pre-seed", stageRisk: "instrument choice and founder dilution can shape the next 3 rounds", runwayBase: 9 },
  { name: "seed", stageRisk: "terms, ESOP and next-round fundability matter more than headline valuation", runwayBase: 14 },
  { name: "bridge", stageRisk: "bridge money can either buy a milestone or signal distress", runwayBase: 6 },
  { name: "Series A", stageRisk: "repeatability and governance are now diligence issues, not founder claims", runwayBase: 18 },
  { name: "post-Series-A", stageRisk: "department decisions affect Series B, debt capacity and board credibility", runwayBase: 16 },
  { name: "Series B/growth", stageRisk: "capital efficiency, controls and customer quality decide growth valuation", runwayBase: 20 },
  { name: "pre-IPO", stageRisk: "governance, auditability and disclosure discipline matter before valuation", runwayBase: 24 },
  { name: "exit or restructuring", stageRisk: "cash certainty, tax, escrow, earnout and creditor exposure dominate headline price", runwayBase: 7 }
];

const industries = [
  { name: "SaaS exports", regs: ["GST LUT/export documentation", "FEMA realization discipline where applicable", "DPDP/customer data processing", "IP assignment"], proof: ["ARR waterfall", "receivable aging", "customer DPAs", "NRR/churn", "export invoices"] },
  { name: "AI and ML platform", regs: ["DPDP Act", "data licensing", "model evaluation", "IP ownership", "enterprise security reviews"], proof: ["data-rights memo", "model evaluation results", "paid AI pilots", "compute cost", "liability language"] },
  { name: "fintech lending", regs: ["RBI Digital Lending Directions 2025", "KFS/APR disclosure", "NBFC partnership", "co-lending controls", "bureau/KYC"], proof: ["NBFC agreement", "loan cohort data", "delinquency table", "grievance SOP", "KFS samples"] },
  { name: "payments and embedded finance", regs: ["RBI payment ecosystem", "KYC", "settlement reconciliation", "bank partnership", "DPDP"], proof: ["settlement ledger", "merchant risk scores", "partner-bank agreement", "chargeback data", "audit logs"] },
  { name: "insurtech", regs: ["IRDAI intermediary context", "carrier agreements", "claims controls", "data consent", "commission discipline"], proof: ["carrier contracts", "claims TAT", "renewal data", "commission schedule", "customer consent logs"] },
  { name: "healthtech SaaS", regs: ["DPDP Act", "hospital procurement", "clinical workflow validation", "patient-data processing", "CDSCO where applicable"], proof: ["hospital MoUs", "clinical workflow results", "DPA", "security review", "paid pilot conversion"] },
  { name: "medtech device", regs: ["CDSCO classification", "clinical validation", "warranty/service obligations", "hospital procurement", "DPDP"], proof: ["device classification memo", "validation data", "service cost", "hospital committee notes", "adverse-event SOP"] },
  { name: "biotech", regs: ["BIRAC grant evidence", "lab validation", "IP ownership", "CDSCO where applicable", "research collaboration contracts"], proof: ["lab milestones", "grant utilization", "patent file", "collaboration agreement", "validation budget"] },
  { name: "space-tech", regs: ["IN-SPACe authorization", "launch/testing milestones", "dual-use controls", "strategic capital restrictions", "IP ownership"], proof: ["payload test plan", "IN-SPACe tracker", "strategic rights matrix", "IP schedule", "launch budget"] },
  { name: "defence-tech", regs: ["iDEX/defence innovation pathways", "security sensitivity", "beneficial ownership scrutiny", "procurement cycle", "export controls"], proof: ["field trial report", "user letter", "component-origin sheet", "security SOP", "dual-use pipeline"] },
  { name: "climate and energy", regs: ["PPA quality", "project finance", "DISCOM/payment risk", "carbon-credit credibility", "state approvals"], proof: ["PPA", "carbon methodology", "project IRR", "receivable history", "permit tracker"] },
  { name: "agritech", regs: ["RKVY-RAFTAAR", "FPO channels", "hardware deployment", "Udyam/MSME status", "crop-cycle evidence"], proof: ["farmer/FPO pilots", "seasonality model", "hardware failure data", "state scheme fit", "paid repeat use"] },
  { name: "D2C consumer brand", regs: ["GST", "inventory records", "marketplace terms", "advertising claims", "RBF economics"], proof: ["contribution margin", "repeat purchase", "inventory aging", "return rates", "marketplace payout reports"] },
  { name: "food and consumer health", regs: ["FSSAI", "batch traceability", "distributor credit", "expiry risk", "GST"], proof: ["FSSAI license", "batch records", "expiry dashboard", "distributor aging", "product-claim review"] },
  { name: "manufacturing MSME", regs: ["Udyam classification", "CGTMSE up to INR 10Cr", "MSMED Act 45-day payment discipline", "Section 43B(h)", "ZED/BIS"], proof: ["Udyam certificate", "machine quotations", "buyer POs", "DSCR model", "quality certifications"] },
  { name: "industrial IoT", regs: ["hardware warranties", "OEM agreements", "BIS/ZED where relevant", "installation receivables", "data processing"], proof: ["installation pipeline", "AMC terms", "warranty cost", "OEM contracts", "receivable aging"] },
  { name: "logistics and supply chain", regs: ["e-way bill discipline", "working-capital limits", "vendor contracts", "fleet utilization", "receivable aging"], proof: ["route density", "fuel cost", "fleet utilization", "customer aging", "vendor ledger"] },
  { name: "edtech", regs: ["DPDP obligations for student/children data", "school procurement", "learning outcome evidence", "refund policies", "academic-year cycles"], proof: ["school contracts", "student-data process", "outcome data", "renewal pipeline", "refund/complaint logs"] },
  { name: "govtech and B2G", regs: ["GeM", "tender eligibility", "EMD/MSME benefits", "QCBS/L1 risk", "public receivable delays"], proof: ["GeM listing", "RFP tracker", "implementation acceptance", "public receivable aging", "tender eligibility matrix"] },
  { name: "cybersecurity", regs: ["CERT-In expectations", "DPDP Act", "SOC2/ISO evidence", "enterprise security procurement", "breach response"], proof: ["SOC2/ISO tracker", "incident logs", "customer security reviews", "DPDP controls", "ARR at risk"] },
  { name: "ecommerce marketplace", regs: ["GST/TCS operations", "seller onboarding", "escrow/payout controls", "consumer returns", "data privacy"], proof: ["seller KYC", "payout reconciliation", "return rates", "GST/TCS records", "customer complaints"] },
  { name: "gaming and media", regs: ["GST/gaming risk where relevant", "IP ownership", "platform policies", "creator contracts", "payment controls"], proof: ["D1/D7/D30 retention", "DAU/MAU", "IP contracts", "platform revenue share", "payment reconciliation"] },
  { name: "proptech", regs: ["RERA", "escrow/project revenue", "broker agreements", "customer deposits", "project-level disclosure"], proof: ["RERA tracker", "escrow records", "broker contracts", "project revenue schedule", "customer refund exposure"] },
  { name: "semiconductor design", regs: ["IP ownership", "customer NRE contracts", "export-control sensitivity", "EDA/foundry agreements", "grant support"], proof: ["IP map", "NRE term sheet", "tape-out budget", "foundry quote", "validation plan"] },
  { name: "enterprise services and IT consulting", regs: ["GST export/services documentation", "TDS", "contractor classification", "IP assignment", "receivable aging"], proof: ["SOWs", "contractor IP assignments", "milestone billing", "TDS/GST records", "utilization data"] }
];

const departments = [
  { name: "CEO and strategy", user: "founder CEO", area: "capital route and strategic timing", decision: "raise, wait, debt, grant, customer advance or strategic capital", recommendation: "choose the route that creates the next milestone without surrendering unnecessary control", risk: "optimizing for a headline amount while weakening the next financing or strategic option" },
  { name: "Finance and CFO", user: "CFO", area: "runway, debt and reporting quality", decision: "equity, venture debt, working capital, RBF, grant or internal cash", recommendation: "match capital type to cash-flow visibility and repayment capacity", risk: "using debt for uncertain growth or equity for a short working-capital gap" },
  { name: "HR and people", user: "head of people", area: "ESOP, retention and hiring", decision: "ESOP refresh, senior hiring budget, contractor conversion or retention grants", recommendation: "approve people spend only when tied to named roles, retention risk and business impact", risk: "diluting the cap table or raising burn for vague hiring ambition" },
  { name: "Marketing and growth", user: "growth head", area: "CAC, channel spend and payback", decision: "increase, cap, reallocate or stop growth spend", recommendation: "scale only channels with proven payback, cash collection and retention quality", risk: "buying pipeline that weakens burn multiple and funding readiness" },
  { name: "Sales and partnerships", user: "VP sales", area: "enterprise contracts and strategic partnerships", decision: "accept, renegotiate or reject large customer/partner terms", recommendation: "accept growth only when payment terms, liability, implementation scope and renewal path are financeable", risk: "turning a large logo into receivables, free services, exclusivity or legal exposure" },
  { name: "Product and R&D", user: "product or R&D head", area: "roadmap and technical milestone funding", decision: "fund, stage, narrow or stop product/R&D spend", recommendation: "fund roadmap in tranches tied to customer proof, IP, compliance and margin impact", risk: "turning technical ambition into burn without financing evidence" },
  { name: "Legal and compliance", user: "startup lawyer or CS", area: "diligence cleanup and regulated-risk controls", decision: "pause, disclose, remediate or proceed with conditions", recommendation: "fix blockers that affect ownership, customer data, filings, regulated activity or investor rights before signing", risk: "letting a known legal issue become a valuation discount or post-closing liability" },
  { name: "Operations and supply chain", user: "COO or operations head", area: "capacity, delivery and working capital", decision: "fund capacity through debt, equity, supplier credit, customer advance or capex", recommendation: "match financing to the asset life, receivable cycle and utilization proof", risk: "funding permanent capacity with short-cycle credit or speculative equity" },
  { name: "Data security and IT", user: "security or data lead", area: "security, privacy and audit readiness", decision: "fund, phase or defer security/privacy work", recommendation: "fund controls when they unlock revenue, regulated partnerships or diligence readiness", risk: "losing enterprise contracts or facing DPDP/security exposure because controls lag growth" },
  { name: "Investor relations and board", user: "founder/CFO for board", area: "board memo and investor reporting", decision: "approve, reject, defer or condition a financing/budget decision", recommendation: "give the board a numbered decision rule with base, upside and downside cases", risk: "board approval based on optimism instead of quantified cash, dilution and compliance trade-offs" },
  { name: "Corporate development and M&A", user: "corp dev lead", area: "strategic sale, acquisition or partnership", decision: "buy, sell, partner, raise or walk away", recommendation: "protect IP, customer optionality, integration capacity and downside payout", risk: "accepting a strategic headline that hides earnout, exclusivity, integration or IP-control risk" },
  { name: "Tax and accounting", user: "CA/CFO/controller", area: "tax position and accounting quality", decision: "claim, defer, restate, disclose or document a tax/accounting treatment", recommendation: "make tax and accounting positions document-led before using them in valuation", risk: "inflating revenue, EBITDA or tax savings in a way that fails diligence" },
  { name: "Customer success", user: "customer success leader", area: "retention, onboarding and NRR", decision: "fund retention, reduce churn, hire CS or change renewal terms", recommendation: "fund customer success where churn, onboarding or expansion quality threatens revenue durability", risk: "growing new ARR while existing ARR weakens quietly" },
  { name: "Risk and regulated operations", user: "risk/compliance lead", area: "regulated operating model", decision: "slow growth, change partner model, strengthen controls or continue", recommendation: "slow or narrow growth where regulated activity or customer harm can destroy enterprise value", risk: "scaling revenue that later has to be unwound because the model is not compliant" },
  { name: "Procurement and vendor finance", user: "procurement/finance lead", area: "vendor commitments and fixed obligations", decision: "sign, defer, resize or renegotiate vendor/cloud/supplier commitments", recommendation: "take discounts only when usage, cash runway and exit flexibility are clear", risk: "turning a discount into a fixed liability that limits runway or gross margin" },
  { name: "Investor or lender diligence", user: "VC associate or credit analyst", area: "investment memo or credit approval", decision: "proceed to IC/credit committee, pause, price risk or reject", recommendation: "proceed only if the key risk has a priced mitigation, document owner and deadline", risk: "approving a deal that looks cheap or exciting because the diligence problem is real" }
];

const resourceFamilies = [
  {
    name: "DPIIT and Startup India benefits",
    userAsk: "DPIIT recognition, startup tax benefits, public procurement support and Startup India-linked resources",
    bestFor: "startups needing eligibility for schemes, tax benefits, procurement credibility or incubator-linked funding",
    risk: "assuming DPIIT recognition automatically gives every tax or grant benefit",
    proof: ["DPIIT certificate", "incorporation date", "IMB approval status where 80-IAC is claimed", "scheme eligibility note"]
  },
  {
    name: "SISFS and incubator seed support",
    userAsk: "SISFS grant/debt-linked support through incubators",
    bestFor: "prototype, product trial, market-entry and early commercialization milestones",
    risk: "applying with vague milestones or duplicate cost heads already funded elsewhere",
    proof: ["incubator fit", "milestone budget", "prior government support ledger", "utilization plan"]
  },
  {
    name: "NIDHI-PRAYAS and prototype grants",
    userAsk: "NIDHI-PRAYAS, prototype grants and lab/prototype support",
    bestFor: "idea-to-prototype hardware or deeptech validation before commercial stage",
    risk: "using a prototype-stage scheme after the company has already crossed into commercial pilots",
    proof: ["prototype-stage memo", "technical milestone", "PRAYAS center feedback", "budget under prototype heads"]
  },
  {
    name: "BIRAC, medtech and biotech grants",
    userAsk: "BIRAC BIG, biotech grants, medtech validation support and clinical/lab milestone funding",
    bestFor: "biotech, medtech and life-sciences innovation with milestone validation",
    risk: "treating grant approval as market validation without clinical, regulatory or customer proof",
    proof: ["scientific workplan", "lab validation", "IP ownership", "clinical/regulatory path", "utilization certificate plan"]
  },
  {
    name: "iDEX, defence and space innovation routes",
    userAsk: "iDEX, defence innovation, IN-SPACe, strategic trials and dual-use validation",
    bestFor: "defence-tech, drone, aerospace and space-tech companies needing user validation",
    risk: "accepting strategic restrictions that block future customers, IP or procurement freedom",
    proof: ["field trial plan", "component-origin sheet", "authorization tracker", "security note", "strategic rights matrix"]
  },
  {
    name: "MSME credit and CGTMSE",
    userAsk: "Udyam registration, CGTMSE, term loans, cash credit and MSME bank products",
    bestFor: "manufacturing, services and operating MSMEs with repayment capacity",
    risk: "confusing guarantee eligibility with loan sanction or ignoring DSCR",
    proof: ["Udyam certificate", "GST/ITR/bank statements", "DSCR model", "machine quote", "buyer POs"]
  },
  {
    name: "TReDS and receivable financing",
    userAsk: "TReDS, invoice discounting, buyer acceptance, delayed payment leverage and Section 43B(h)",
    bestFor: "MSME suppliers with accepted invoices from credible buyers",
    risk: "financing disputed invoices or using long-term debt for short receivables",
    proof: ["accepted invoice", "buyer onboarding", "delivery proof", "receivable aging", "Udyam details"]
  },
  {
    name: "angel syndicates and family offices",
    userAsk: "angel cheques, syndicate terms, side letters, valuation caps and early investor rights",
    bestFor: "pre-seed/seed companies needing strategic help plus capital",
    risk: "casual side letters, messy cap table, excessive advisor equity or weak documentation",
    proof: ["term sheet", "cap table", "investor value-add", "reference checks", "SHA/AoA changes"]
  },
  {
    name: "VC, AIF and institutional equity",
    userAsk: "seed, Series A, Series B, AIF/VC capital, term sheets and institutional diligence",
    bestFor: "venture-scale companies with repeatable growth and fundable governance",
    risk: "choosing headline valuation while accepting dirty terms or weak next-round fundability",
    proof: ["ARR/cohort data", "cap table", "ESOP plan", "diligence data room", "term-sheet redline"]
  },
  {
    name: "venture debt and RBF",
    userAsk: "venture debt, warrants, covenants, RBF repayment caps and non-dilutive capital",
    bestFor: "companies with visible revenue and enough runway to service repayment",
    risk: "calling debt non-dilutive while ignoring interest, warrants, covenants or repayment drag",
    proof: ["runway model", "debt-service schedule", "covenants", "warrant math", "downside cash case"]
  },
  {
    name: "strategic capital and corporate partnerships",
    userAsk: "CVC investment, customer-funded development, strategic partnerships, exclusivity and ROFR",
    bestFor: "companies where customer access, channel, manufacturing or procurement help is valuable",
    risk: "trading market freedom, IP, future acquisition optionality or pricing control for one strategic cheque",
    proof: ["exclusivity scope", "IP schedule", "customer/channel commitment", "ROFR limits", "commercial KPI"]
  },
  {
    name: "government procurement and market access",
    userAsk: "GeM, tenders, EMD/MSME benefits, QCBS/L1, procurement eligibility and public receivables",
    bestFor: "B2G, govtech, manufacturing and MSMEs selling to government buyers",
    risk: "winning low-margin tenders with long payment cycles and heavy implementation obligations",
    proof: ["GeM listing", "RFP matrix", "EMD/MSME documents", "acceptance certificate process", "public receivable aging"]
  },
  {
    name: "tax, FEMA and compliance resources",
    userAsk: "80-IAC, angel tax status, GST/LUT, TDS, FEMA filings, Press Note 3 and compliance sequencing",
    bestFor: "companies raising, exporting, paying contractors, taking foreign capital or claiming benefits",
    risk: "treating a tax or compliance benefit as automatic without filings, approvals and evidence",
    proof: ["tax memo", "valuation report", "FC-GPR/FLA status", "GST/LUT records", "board approvals"]
  },
  {
    name: "IPO, M&A and secondary liquidity",
    userAsk: "SME IPO, mainboard IPO, strategic sale, secondary, earnout, escrow and shareholder exit",
    bestFor: "growth, pre-IPO and exit-stage companies evaluating liquidity routes",
    risk: "optimizing headline valuation while accepting disclosure, escrow, earnout or governance risk",
    proof: ["audited controls", "DRHP readiness", "buyer diligence list", "tax impact", "board/shareholder consent"]
  }
];

const questionStyles = [
  { q1: "What should I choose first and why?", q2: "What is the hidden risk if I follow the opposite advice?", q3: "Give me the exact 30-day plan and final decision rule." },
  { q1: "Should I approve this plan or push back?", q2: "Which term or assumption is most dangerous?", q3: "What proof should I require before signing?" },
  { q1: "Is this financing route better than the alternative?", q2: "How does the answer change if runway falls faster?", q3: "What should go into the board or IC memo?" },
  { q1: "Is the headline number misleading here?", q2: "What is the real cost in INR, dilution or control?", q3: "When should we walk away even if the money is available?" },
  { q1: "What is the right sequence of actions this month?", q2: "What would make this option fail diligence?", q3: "Give me the final yes/no rule." }
];

const cities = ["Bengaluru", "Mumbai", "Pune", "Delhi NCR", "Hyderabad", "Chennai", "Ahmedabad", "Kochi", "Coimbatore", "Jaipur", "Indore", "Thiruvananthapuram", "Surat", "Nagpur", "Noida", "Gurugram"];
const names = ["Aarav Menon", "Meera Shah", "Priya Rao", "Karthik Iyer", "Dev Khanna", "Ishita Narang", "Farah Qureshi", "Rohan Gupta", "Neha Bansal", "Tanvi Jain", "Suresh Nair", "Ananya Sen", "Rahul Verma", "Lakshmi Pillai", "Vikram Desai", "Arjun Malhotra", "Nisha Kapoor", "Kabir Sethi"];
const routeSets = [
  ["equity round", "venture debt", "customer advance"],
  ["grant", "angel equity", "incubator support"],
  ["CGTMSE-backed loan", "collateral loan", "cash credit"],
  ["TReDS", "overdraft", "buyer credit"],
  ["strategic capital", "VC capital", "commercial partnership"],
  ["RBF", "working capital", "priced equity"],
  ["bridge round", "cost cuts", "inside round"],
  ["SME IPO path", "strategic sale", "Series C"],
  ["ESOP refresh", "cash compensation", "deferred hiring"],
  ["security spend", "roadmap spend", "sales expansion"]
];

function pick(arr, n) { return arr[n % arr.length]; }
function pad(n, width = 5) { return String(n).padStart(width, "0"); }
function cr(n) { return `INR ${n}Cr`; }
function l(n) { return `INR ${n}L`; }
function pct(n) { return `${n} percent`; }
function list(items) { return items.map((item, i) => `${i + 1}. ${item}`).join("\\n"); }

function metrics(i) {
  const seed = i * 43 + Math.floor(i / 7) * 19;
  const stage = pick(stages, seed);
  const early = ["idea", "prototype", "MVP", "pilot revenue", "pre-seed"].includes(stage.name);
  const arrCr = early ? Math.max(0, Math.round((seed % 95) / 10) / 10) : 3 + (seed % 120);
  const monthlyRevenueL = early ? 1 + (seed % 35) : Math.max(6, Math.round((arrCr * 100) / 12));
  const cashCr = early ? Math.max(0.1, Math.round((5 + (seed % 70)) / 10)) : 2 + (seed % 65);
  const burnL = early ? 2 + (seed % 25) : 18 + (seed % 190);
  const runway = Math.max(2, Math.round((cashCr * 100) / burnL));
  const team = early ? 3 + (seed % 28) : 30 + (seed % 520);
  const growth = 10 + (seed % 140);
  const fundingCr = early ? Math.max(0.2, Math.round((5 + (seed % 45)) / 10)) : 3 + (seed % 130);
  const dilution = 6 + (seed % 24);
  const postCr = Math.max(1, Math.round(fundingCr / (dilution / 100)));
  const spendCr = early ? Math.max(0.1, Math.round((3 + (seed % 30)) / 10)) : 1 + (seed % 35);
  const invoiceL = 8 + (seed % 240);
  const days = 21 + (seed % 90);
  const interest = 10 + (seed % 8);
  const esop = 3 + (seed % 12);
  return { stage, early, arrCr, monthlyRevenueL, cashCr, burnL, runway, team, growth, fundingCr, dilution, postCr, spendCr, invoiceL, days, interest, esop };
}

function scenarioFor(i) {
  const m = metrics(i);
  const industry = pick(industries, i * 3 + Math.floor(i / departments.length));
  const department = pick(departments, i + Math.floor(i / industries.length));
  const resource = pick(resourceFamilies, i * 5 + Math.floor(i / 13));
  const style = pick(questionStyles, i);
  const city = pick(cities, i * 5);
  const person = pick(names, i * 7);
  const routes = pick(routeSets, i * 11);
  const area = `${department.area} - ${industry.name}`;
  const coreFacts = m.early
    ? `${person} is building a ${m.stage.name} ${industry.name} company in ${city}. The company has ${l(m.monthlyRevenueL)} monthly revenue or pilot revenue, ${cr(m.cashCr)} cash, ${l(m.burnL)} monthly burn, ${m.runway} months runway and ${m.team} team members.`
    : `${person} leads a ${m.stage.name} ${industry.name} company in ${city}. The company has ${cr(m.arrCr)} ARR, ${cr(m.cashCr)} cash, ${l(m.burnL)} monthly burn, ${m.runway} months runway and ${m.team} employees.`;
  const decision = `The open ${department.name} decision is whether to use ${routes[0]}, ${routes[1]} or ${routes[2]} for a ${cr(m.fundingCr)} financing or ${cr(m.spendCr)} operating plan. Visible dilution is around ${pct(m.dilution)} if equity is used, implying about ${cr(m.postCr)} post-money. The relevant resource family is ${resource.name}: ${resource.userAsk}.`;
  return { i, m, industry, department, resource, style, city, person, routes, area, scenarioText: `${coreFacts} ${decision} The stage risk is: ${m.stage.stageRisk}. Industry facts: ${industry.proof.join(", ")}. Indian regulatory frame: ${industry.regs.join(", ")}. Resource fit: ${resource.bestFor}. Resource risk: ${resource.risk}.` };
}

function userQuestion(s, turn) {
  const { style, department, routes, m } = s;
  if (turn === 1) {
    return `${style.q1} Context: ${department.user} is comparing ${routes[0]}, ${routes[1]} and ${routes[2]} with ${m.runway} months runway.`;
  }
  if (turn === 2) {
    return style.q2;
  }
  return style.q3;
}

function thinking(s, turn) {
  const { m, industry, department, resource, routes } = s;
  const revenueLine = m.early
    ? `Monthly revenue or pilot revenue is ${l(m.monthlyRevenueL)}, cash is ${cr(m.cashCr)}, burn is ${l(m.burnL)}, and runway is ${m.runway} months.`
    : `ARR is ${cr(m.arrCr)}, cash is ${cr(m.cashCr)}, burn is ${l(m.burnL)}, and runway is ${m.runway} months.`;
  const economics = `A ${cr(m.fundingCr)} equity route at ${pct(m.dilution)} implies about ${cr(m.postCr)} post-money; a ${cr(m.spendCr)} operating plan changes runway and proof quality.`;
  const turnFrame = turn === 1
    ? `Need choose the first route, not list every possible option.`
    : turn === 2
      ? `Need test the opposite advice and identify the hidden risk.`
      : `Need give an executable decision rule, not a motivational checklist.`;
  return `<thinking>\\n${turnFrame} This is a ${m.stage.name} ${industry.name} case from the ${department.name} lens. ${revenueLine} ${economics} Relevant Indian context includes ${industry.regs.slice(0, 3).join(", ")}. The resource route is ${resource.name}, which is best for ${resource.bestFor}, but the risk is ${resource.risk}. I should reject generic advice if it ignores stage, cash timing, dilution, documentation, regulated activity, receivables, tax, resource eligibility or department ownership. Self-check: the answer must make a committed recommendation, include numbers, name the fallback and state what proof changes the decision.\\n</thinking>`;
}

function directRecommendation(s, turn) {
  const { m, department, routes } = s;
  if (turn === 1) {
    if (m.runway <= 5) return `Choose the fastest clean route first: ${routes[0]} only if it closes within ${m.days} days; otherwise cut burn and use ${routes[1]} as fallback.`;
    if (m.runway >= 18) return `${department.recommendation}. Because runway is ${m.runway} months, do not accept weak terms for speed.`;
    return `${department.recommendation}. Make ${routes[0]} the primary path and keep ${routes[1]} as the fallback until documents are signed.`;
  }
  if (turn === 2) {
    return `The hidden risk is ${department.risk}. This matters more than the visible headline if it changes cash, ownership, eligibility, control or diligence quality.`;
  }
  return `Final rule: proceed only if the chosen route preserves at least ${Math.min(12, Math.max(6, m.runway - 3))} months downside runway, passes the Indian compliance check and creates a measurable milestone within ${m.days} days.`;
}

function why(s) {
  const { m, industry, department, resource } = s;
  const facts = m.early
    ? `${l(m.monthlyRevenueL)} monthly revenue, ${cr(m.cashCr)} cash and ${m.runway} months runway`
    : `${cr(m.arrCr)} ARR, ${cr(m.cashCr)} cash and ${m.runway} months runway`;
  return `\\nFor an Indian ${industry.name} company, ${department.name.toLowerCase()} choices affect financing quality because ${industry.regs.join(", ")} can change whether the route is usable. ${resource.name} can be valuable when it fits ${resource.bestFor}, but it becomes dangerous when founders ignore ${resource.risk}. The decision should compare ${facts}, ${pct(m.dilution)} possible dilution, ${cr(m.spendCr)} operating spend and the next ${m.days} days of execution. The right answer is not the largest amount; it is the cleanest route that survives diligence and keeps the next option open.`;
}

function how(s, turn) {
  const { m, industry, department, routes } = s;
  if (turn === 1) {
    return "\\n" + list([
      `Within 48 hours, write a 1-page memo comparing ${routes[0]}, ${routes[1]} and ${routes[2]} with INR cash impact and ownership impact.`,
      `By day 3, model base and downside cases using ${cr(m.cashCr)} cash, ${l(m.burnL)} burn, ${m.runway} months runway and ${pct(m.growth)} growth.`,
      `By day 5, collect proof: ${industry.proof.slice(0, 3).join(", ")} plus ${s.resource.proof.slice(0, 2).join(", ")}.`,
      `By day 7, reject any option that cannot be documented under ${industry.regs.slice(0, 2).join(" and ")}.`,
      `By day 14, negotiate only terms that change economics by at least INR ${m.early ? "10L" : "1Cr"} or 5 percent ownership/control.`,
      `By day 21, pick the primary path and keep exactly one fallback open until day 30.`
    ]);
  }
  if (turn === 2) {
    return "\\n" + list([
      `Price the opposite advice in rupees: compare ${cr(m.fundingCr)} funding, ${pct(m.dilution)} dilution, ${cr(m.spendCr)} spend and ${l(m.invoiceL)} receivable or working-capital exposure.`,
      `Run a downside case with revenue 20 percent lower, closing delayed by 30 days and collections delayed by 45 days.`,
      `Ask legal/finance to classify the issue as economics, control, compliance, customer risk, tax or accounting quality.`,
      `Set a red line for anything that breaks ${industry.regs[0]} or blocks the next investor, lender, buyer or grant reviewer.`,
      `Update the board, IC or credit note within 24 hours so the decision record is explicit.`,
      `Keep a backup route active until the primary document, sanction or approval is signed.`
    ]);
  }
  return "\\n" + list([
    `Day 1-3: freeze facts, decision owner, cap table or debt schedule, cash, burn, runway and open obligations.`,
      `Day 4-7: build the proof pack: ${department.area}, ${industry.proof.slice(0, 3).join(", ")} and ${s.resource.proof.slice(0, 3).join(", ")}.`,
    `Day 8-12: get written positions from investors, lenders, buyers, vendors, incubators or regulators as relevant.`,
    `Day 13-18: fix the single blocker most likely to reduce valuation, delay sanction, create tax exposure or damage trust.`,
    `Day 19-21: hold one decision meeting and apply the go/no-go rule without reopening old options unless facts changed.`,
    `Day 22-30: sign, submit, renegotiate or walk away; do not extend optionality without new evidence.`
  ]);
}

function bottomLine(s, turn) {
  const { routes } = s;
  if (turn === 1) return `\\nPick the clean, provable route, not the loudest option. If ${routes[0]} cannot survive a 30-day evidence check, move to ${routes[1]} before delay becomes the real cost.`;
  if (turn === 2) return `\\nPush back where the term changes INR cash, dilution, control, eligibility, receivables or next-round quality. Accept small imperfections; reject anything that makes the next 12 months harder.`;
  return `\\nBy day 21, the company should know whether the route is signable, fundable and evidence-backed. If not, move to the fallback before runway, buyer or investor pressure forces a worse deal.`;
}

function assistantAnswer(s, turn) {
  return `${thinking(s, turn)}\\n\\n${directRecommendation(s, turn)}\\n\\n**Why this works in Indian context:**${why(s)}\\n\\n**How to execute:**${how(s, turn)}\\n\\n**Bottom line:**${bottomLine(s, turn)}`;
}

function recordFor(i) {
  const s = scenarioFor(i);
  return {
    scenario_id: `EVGQ10K_${pad(i)}`,
    source_scenario_id: `SCN_EVGQ10K_${pad(i)}`,
    area: s.area,
    difficulty: ["Legal and compliance", "Tax and accounting", "Risk and regulated operations", "Investor or lender diligence"].includes(s.department.name) ? "hard" : (s.m.stage.name.includes("Series") || s.m.stage.name === "pre-IPO" ? "hard" : "medium"),
    generator_model: "codex-scripted-quality-generator",
    generation_method: "scripted_scenario_matrix_with_quality_gates_review_required",
    batch: "evaldam_chatgopt_10000_generated_quality_001",
    sample_index: i,
    stage: s.m.stage.name,
    industry: s.industry.name,
      department: s.department.name,
      icp: s.department.user,
      resource_family: s.resource.name,
      verified_context_used: officialAnchors,
    scenario_facts: {
      city: s.city,
      founder_or_owner: s.person,
      ARR: s.m.early ? null : cr(s.m.arrCr),
      monthly_revenue_or_pilot_revenue: s.m.early ? l(s.m.monthlyRevenueL) : null,
      cash_balance: cr(s.m.cashCr),
      monthly_burn: l(s.m.burnL),
      runway_months: s.m.runway,
      team_size: s.m.team,
      growth_rate: pct(s.m.growth),
      proposed_funding: cr(s.m.fundingCr),
      visible_dilution: pct(s.m.dilution),
      implied_post_money: cr(s.m.postCr),
      department_spend: cr(s.m.spendCr),
      decision_window_days: s.m.days,
      regulatory_frame: s.industry.regs,
      resource_frame: {
        name: s.resource.name,
        user_ask: s.resource.userAsk,
        best_for: s.resource.bestFor,
        risk: s.resource.risk,
        proof: s.resource.proof
      }
    },
    conversation: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userQuestion(s, 1) },
      { role: "assistant", content: assistantAnswer(s, 1) },
      { role: "user", content: userQuestion(s, 2) },
      { role: "assistant", content: assistantAnswer(s, 2) },
      { role: "user", content: userQuestion(s, 3) },
      { role: "assistant", content: assistantAnswer(s, 3) }
    ]
  };
}

function scenarioCardFor(i) {
  const s = scenarioFor(i);
  return {
    scenario_id: `SCN_EVGQ10K_${pad(i)}`,
    stage: s.m.stage.name,
    industry: s.industry.name,
    department: s.department.name,
    user_type: s.department.user,
    resource_family: s.resource.name,
    area: s.area,
    scenario: s.scenarioText,
    question_arc: [userQuestion(s, 1), userQuestion(s, 2), userQuestion(s, 3)],
    must_cover: [...s.industry.regs, ...s.industry.proof.slice(0, 3), s.resource.name, ...s.resource.proof.slice(0, 2), "specific math", "committed recommendation", "fallback", "30-day decision rule"],
    avoid: ["generic advice", "low-specificity scheme listing", "missing numbers", "ignoring Indian documentation", "pretending this is manual gold"]
  };
}

function validateRecord(record, i) {
  if (!record || typeof record !== "object") throw new Error(`record ${i} not object`);
  if (!Array.isArray(record.conversation) || record.conversation.length !== 7) throw new Error(`record ${i} bad conversation length`);
  const roles = record.conversation.map((t) => t.role).join(",");
  if (roles !== "system,user,assistant,user,assistant,user,assistant") throw new Error(`record ${i} bad roles ${roles}`);
  const assistants = record.conversation.filter((t) => t.role === "assistant");
  for (const turn of assistants) {
    for (const marker of ["<thinking>", "</thinking>", "**Why this works in Indian context:**", "**How to execute:**", "**Bottom line:**"]) {
      if (!turn.content.includes(marker)) throw new Error(`record ${i} missing ${marker}`);
    }
    const numberHits = (turn.content.match(/INR|percent|months|days|Cr|L/g) || []).length;
    if (numberHits < 8) throw new Error(`record ${i} too few numeric anchors`);
    if (turn.content.length < 1800) throw new Error(`record ${i} assistant turn too short`);
  }
}

const records = [];
const scenarios = [];
const target = 10000;
for (let i = 1; i <= target; i++) {
  const record = recordFor(i);
  validateRecord(record, i);
  records.push(record);
  scenarios.push(scenarioCardFor(i));
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(datasetPath, records.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
fs.writeFileSync(scenarioPath, scenarios.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");

const parsed = fs.readFileSync(datasetPath, "utf8").trim().split(/\r?\n/).map((line, i) => {
  const record = JSON.parse(line);
  validateRecord(record, i + 1);
  return record;
});

const byStage = {};
const byIndustry = {};
const byDepartment = {};
for (const record of parsed) {
  byStage[record.stage] = (byStage[record.stage] || 0) + 1;
  byIndustry[record.industry] = (byIndustry[record.industry] || 0) + 1;
  byDepartment[record.department] = (byDepartment[record.department] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  dataset_path: datasetPath,
  scenario_path: scenarioPath,
  records: parsed.length,
  scenarios: scenarios.length,
  validation: {
    json_parse_ok: true,
    conversation_shape: "system,user,assistant,user,assistant,user,assistant",
    assistant_markers_required: ["<thinking>", "</thinking>", "Why", "How", "Bottom line"],
    min_numeric_anchor_hits_per_assistant_turn: 8,
    min_assistant_turn_chars: 1800
  },
  by_stage: byStage,
  by_industry: byIndustry,
  by_department: byDepartment,
  caveat: "Generated quality dataset, review required. Not manual gold."
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ records: parsed.length, scenarios: scenarios.length, datasetPath, scenarioPath, reportPath }, null, 2));
