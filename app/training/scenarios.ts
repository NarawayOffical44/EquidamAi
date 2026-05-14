export type TrainingScenario = {
  id: string;
  title: string;
  category: string;
  content: string;
};

export const trainingScenarios: TrainingScenario[] = [
  {
    id: "valuation-method-choice",
    title: "Choosing a Valuation Method",
    category: "Valuation",
    content:
      "You are advising a pre-revenue AI startup in Bengaluru. The founder has a working prototype, three team members, and an interested angel investor. The investor asks for a defensible valuation, but the founder is unsure whether to use the Berkus Method, Scorecard Method, or a market comparable approach.",
  },
  {
    id: "grant-rejection",
    title: "Rejected Grant Application",
    category: "Funding",
    content:
      "A founder applies for a government seed fund grant. The product solves a real problem for small manufacturers, but the application is rejected because the business model, financial projections, and use of funds are not clearly explained. The founder wants to reapply with a stronger case.",
  },
  {
    id: "investor-dilution",
    title: "Investor Dilution Decision",
    category: "Cap Table",
    content:
      "A seed-stage SaaS startup is offered INR 75 lakh from an angel investor for 12% equity. The founder needs the money to hire engineers and acquire early customers, but is worried about giving away too much ownership before the company has meaningful revenue.",
  },
  {
    id: "bootstrap-or-raise",
    title: "Bootstrap or Raise",
    category: "Strategy",
    content:
      "Two co-founders have built a profitable services-led software product for Indian SMEs. They can continue bootstrapping slowly or raise external funding to turn the product into a scalable SaaS platform. They are unsure how funding will change growth expectations, control, and valuation.",
  },
  {
    id: "esop-early-team",
    title: "ESOP for Early Team",
    category: "Hiring",
    content:
      "A fintech founder wants to hire a senior product leader but cannot match market salary. The candidate asks for meaningful ESOPs. The founder has never created an ESOP pool and does not know how it affects valuation, dilution, or future investor negotiations.",
  },
];
