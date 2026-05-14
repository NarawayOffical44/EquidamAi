export type TrainingScenario = {
  id: string;
  title: string;
  category: string;
  content: string;
};

export const trainingScenarios: TrainingScenario[] = [
  {
    id: "S001",
    title: "Valuation Method Selection Logic",
    category: "Medium",
    content:
      "Rahul co-founded a B2B SaaS startup in Pune building an AI-powered inventory tool for D2C brands. Team of 6, 14 months old, 8 paying customers contributing INR 4.2L MRR, growing 18 percent month-on-month. Bootstrapped INR 35L so far, 4 months runway left. A Mumbai angel syndicate offered INR 1.5Cr at INR 12Cr post-money using Berkus Method. A Bengaluru angel offered INR 2Cr at INR 18Cr post-money using Scorecard Method. His CA suggested DCF. Rahul has 30 days to decide and is confused which method actually applies to his stage.",
  },
  {
    id: "S002",
    title: "Complex Multi-Scheme Grant Eligibility",
    category: "Hard",
    content:
      "Priya runs a 3-person agritech hardware startup in Coimbatore, 11 months old, building soil sensors for small farmers. DPIIT recognized, MSME Udyam registered as a Micro enterprise. Revenue INR 2.8L total, mostly pilot installations. She has shortlisted four schemes: Startup India Seed Fund Scheme (SISFS), Tamil Nadu TANSEED, NIDHI-PRAYAS, and Krishi Udaan 2.0. Limited bandwidth, can realistically apply to two this quarter. Her IIT-Madras mentor says SISFS is the obvious choice. Her co-founder, an ex-banker, says TANSEED gives faster disbursement. She is unsure if applying to multiple central schemes disqualifies her and what the actual hit rate looks like for hardware agritech in 2026.",
  },
  {
    id: "S003",
    title: "Founder Dilution & ESOP Strategy",
    category: "Medium",
    content:
      "Arjun and Sneha co-founded a fintech startup in Gurugram 18 months ago, 50-50 split, INR 8L MRR, 22 percent MoM growth, runway 9 months. They are raising INR 6Cr seed at INR 30Cr post-money. The lead investor, a Tier-1 Indian VC, is asking for a 12 percent ESOP pool created pre-money, not post. Arjun's friend at another startup said this is standard, Sneha's lawyer said it costs founders 3-4 percent extra dilution. They have hired 2 senior people who were promised 'meaningful equity' but nothing formalized. They need to finalize ESOP allocation, pool size, and vesting before signing.",
  },
  {
    id: "S004",
    title: "MSME Debt Products & Working Capital",
    category: "Medium",
    content:
      "Vikram runs a 4-year-old textile manufacturing MSME in Surat, Udyam registered as Small enterprise, INR 6.2Cr annual revenue, 14 percent EBITDA margin. He supplies to 3 large garment exporters on 90-day credit terms. Receivables stuck at INR 1.8Cr, factory needs INR 60L for a new dyeing unit, plus INR 40L working capital gap. His SBI RM offered a CGTMSE-backed term loan at 11.2 percent. A fintech NBFC offered invoice discounting at 14.5 percent. TReDS platform RXIL suggested onboarding for receivable financing at 9-10.5 percent depending on buyer rating. He has 45 days to decide before the dyeing unit order deadline.",
  },
  {
    id: "S005",
    title: "Indian Angel & Early VC Psychology",
    category: "Medium",
    content:
      "Nikhil pitched his consumer health app to 14 Indian angels over 3 months in Bengaluru. Team of 4, 6 months old, 12K downloads, 800 DAU, no revenue yet. He got 11 polite declines, 2 ghosts, 1 verbal interest that went cold. Feedback ranged from 'too early' to 'show me revenue' to 'market is crowded'. His IIM batchmate told him Indian angels behave differently from US angels and he is pitching wrong. He has INR 8L personal savings left, 5 months runway, and is considering pivoting the pitch entirely or shifting to US angels via AngelList.",
  },
  {
    id: "S006",
    title: "Real-World Trade-off Decision Making",
    category: "Hard",
    content:
      "Meera runs a 2-year-old D2C skincare brand from Jaipur, INR 1.4Cr ARR, 38 percent gross margin, 8 percent net loss, 7 months runway. She has 3 options on the table simultaneously: (a) a INR 3Cr seed round at INR 18Cr post-money from a Tier-2 VC with aggressive growth expectations, (b) a INR 80L revenue-based financing deal from Velocity at 8 percent of monthly revenue capped at 1.4x, (c) a strategic acquisition offer from a listed FMCG company at INR 9Cr cash plus 2-year earnout up to INR 4Cr. Her co-founder wants to take the acquisition, her advisor pushes for the VC round, her CA recommends RBF. She has 21 days before the FMCG offer expires.",
  },
  {
    id: "S007",
    title: "Term Sheet Comparison & Negotiation",
    category: "Hard",
    content:
      "Karan received two term sheets for his logistics SaaS startup in Bengaluru, 18 months old, INR 12L MRR, 11 percent MoM growth. TS1: INR 5Cr at INR 28Cr post-money from a Tier-1 Indian VC, 1x non-participating liquidation, 15 percent pre-money ESOP, broad-based weighted average anti-dilution, one board seat, standard pro-rata. TS2: INR 6Cr at INR 32Cr post-money from a US fund's India arm, 1.5x participating liquidation capped at 3x, 12 percent pre-money ESOP, full ratchet anti-dilution for 18 months, one board seat plus one observer, super pro-rata up to 2x. Both refuse to budge on the headline.",
  },
  {
    id: "S008",
    title: "Grant Rejection Analysis & Improvement",
    category: "Medium",
    content:
      "Anita applied to Startup India Seed Fund Scheme (SISFS) for her edtech startup focused on rural Hindi-medium students in UP, team of 5, 9 months old, INR 80K MRR from 12 schools. She was rejected at the incubator screening stage. Feedback received was generic: 'application lacks clarity on scalability and unit economics'. She wants to reapply after 4 months but is unsure whether to apply to a different incubator, fix the application, or pivot the entire pitch. Her mentor said most rejections are about narrative, not the business itself.",
  },
  {
    id: "S009",
    title: "Indian Tax Benefits for Startups & MSMEs",
    category: "Medium",
    content:
      "Suresh's deeptech startup in Hyderabad got DPIIT recognition 8 months ago, building computer vision for manufacturing QC. Team of 9, INR 1.1Cr revenue last FY, INR 22L net profit. He has not claimed any startup tax benefits yet. His CA mentioned Section 80-IAC and Section 56(2)(viib) but said the paperwork is heavy. He also recently raised INR 4Cr from an Indian VC at INR 25Cr post-money, and the CA flagged potential 'angel tax' exposure on the premium. Suresh wants to understand what he can actually claim and whether the angel tax issue is real after the 2024 abolition.",
  },
  {
    id: "S010",
    title: "Stage-Specific Valuation Logic",
    category: "Medium",
    content:
      "Vivek runs a 3-year-old fintech NBFC-lite startup in Mumbai operating as a co-lending partner, INR 8Cr disbursed, INR 90L revenue last year, 28 percent gross margin, INR 12L net profit. He is raising Series A and got valuations ranging from INR 60Cr to INR 180Cr from different VCs. The spread confuses him. One VC used revenue multiple, another used loan book multiple, another used DCF, and one used 'strategic premium'. He needs to understand which method actually applies at his stage and sector.",
  },
  {
    id: "S011",
    title: "Due Diligence Preparation & Red Flags",
    category: "Medium",
    content:
      "Ananya's 2-year-old healthtech startup in Bengaluru has signed a term sheet for INR 8Cr Series A. The VC has triggered due diligence with a 60-page checklist covering legal, financial, technical, HR, and compliance. Ananya's team has 14 people, INR 2.4Cr ARR, but the company has informal contracts with 3 early employees, no formal IP assignment from the 2 ex-employees who built the original codebase, founder loans treated as equity in spreadsheets but not in the cap table, and missing TDS filings for FY23. Closing date is 45 days away.",
  },
  {
    id: "S012",
    title: "Cap Table Structuring for Future Rounds",
    category: "Hard",
    content:
      "Rohan and Tanvi co-founded an AI infra startup in Bengaluru 16 months ago, equal 50-50 split. Current cap table: Rohan 47.5 percent, Tanvi 47.5 percent, advisor 1 percent, ESOP pool 4 percent. They are raising INR 7Cr seed at INR 35Cr post-money. They expect to raise Series A in 18-24 months at INR 100-150Cr, and Series B in another 24 months at INR 400-600Cr. Their lead investor is asking them to model cap table evolution over the next 4 years and demonstrate they have planned for it. Both founders are first-time founders and have never modeled dilution before.",
  },
  {
    id: "S013",
    title: "MSME Registration & Government Benefits",
    category: "Easy",
    content:
      "Deepak owns a 5-year-old electrical components manufacturing unit in Faridabad, INR 4.2Cr annual revenue, 18 employees, INR 1.8Cr plant and machinery investment. He registered for GST and has all factory licenses but has not done Udyam registration. His banker mentioned he is leaving 'lakhs on the table' but did not specify. A consultant offered to do Udyam plus 'all benefit linkages' for INR 35K. Deepak wants to understand what he actually qualifies for, whether the consultant fee is justified, and what to do himself.",
  },
  {
    id: "S014",
    title: "Invoice Financing & Supply Chain Finance",
    category: "Medium",
    content:
      "Pooja runs a 6-year-old packaging materials supplier in Ahmedabad, INR 9.5Cr annual revenue, MSME Small, supplying to 4 large FMCG companies (Marico, ITC, Dabur, Britannia) on 60-90 day credit terms. Receivables stuck at INR 2.2Cr. She has three financing options: TReDS via RXIL at 8.5-9.5 percent based on buyer rating, supply chain finance via her bank (HDFC) at 10.5 percent linked to specific buyer programs, and a fintech bill discounting product at 13 percent with same-day disbursal. Her CFO recommends TReDS, her bank pushes their SCF program, and the fintech salesperson is calling daily.",
  },
  {
    id: "S015",
    title: "Founder Equity Split & Co-founder Agreements",
    category: "Medium",
    content:
      "Amit (full-time technical founder, IIT-Delhi, building product for 8 months) and Ravi (full-time business co-founder, IIM-Bangalore, joining now after quitting Goldman) are formalizing their AI legal-tech startup in Delhi. Amit built the MVP solo and has 2 paying pilots. Ravi brings INR 25L personal investment, sales pipeline, and full-time commitment from now. They are debating equity split: Amit suggests 60-40 (his favor due to 8 months head start), Ravi proposes 50-50 (equal future commitment), and their advisor suggested 55-45 with reverse vesting. They want to formalize before raising INR 1.5Cr pre-seed.",
  },
  {
    id: "S016",
    title: "Raising First Round vs Bootstrapping Decision",
    category: "Medium",
    content:
      "Sneha runs a 14-month-old vernacular content platform from Indore, team of 3, INR 1.6L MRR from 220 paying subscribers, 12 percent MoM growth, INR 18L personal savings used so far. She has two paths: (a) raise INR 80L pre-seed from a local angel network at INR 5Cr post-money (16 percent dilution), or (b) bootstrap another 12-18 months until she hits INR 10-15L MRR, then raise a stronger round. Her cousin who runs a profitable bootstrapped business says raise nothing. Her friend who raised seed at Series A levels of traction says raise now. She has 6 months runway and an offer that expires in 30 days.",
  },
];
