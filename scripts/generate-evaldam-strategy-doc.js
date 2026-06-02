const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, PageNumber, LevelFormat, PageBreak } = require('docx');
const fs = require('fs');

// Colors
const PRIMARY = "00B2B2";
const DARK = "111827";
const GRAY = "4B5563";

// Border style for tables
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: PRIMARY };

function createHeaderCell(text, width) {
  return new TableCell({
    borders: { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder },
    width: { size: width, type: WidthType.DXA },
    shading: { fill: PRIMARY, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Arial" })]
    })]
  });
}

function createCell(text, width, bold = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 18, font: "Arial", bold, color: DARK })]
    })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: PRIMARY },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "EVALDAM AI", bold: true, size: 18, font: "Arial", color: PRIMARY }),
            new TextRun({ text: "  |  Strategic Overview", size: 18, font: "Arial", color: GRAY })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Confidential  •  Page ", size: 16, font: "Arial", color: GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: GRAY })
          ]
        })]
      })
    },
    children: [
      // TITLE
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "EVALDAM AI", bold: true, size: 56, font: "Arial", color: PRIMARY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "Strategic Overview & Business Analysis", size: 28, font: "Arial", color: DARK })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "Prepared: " + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: 18, font: "Arial", color: GRAY })]
      }),

      // ONE-LINER
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("One-Liner")] }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun({ 
          text: "Evaldam AI gives founders and investors defensible, methodology-backed startup valuations with full assumptions, comparables, and investor-ready reports in minutes instead of weeks or spreadsheets.", 
          size: 22, font: "Arial", italics: true, color: DARK 
        })]
      }),

      // 100-WORD PARAGRAPH
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Positioning Statement (100 Words)")] }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun({ 
          text: "Evaldam AI is a professional-grade startup valuation platform that combines six established methods (Scorecard, Berkus, VC Method, two DCF variants, and proprietary Evaldam Score) into a single blended, stage-adjusted range. It delivers transparent evidence trails, sensitivity analysis, India-specific comparables, and clean PDF reports that founders can confidently share with angels, VCs, and advisors. Built with a deterministic core for near-zero marginal cost and strong India market data (RBI rates, local benchmarks), Evaldam serves individual founders raising capital, agencies and micro-VCs running portfolio valuations, and platforms needing valuation intelligence via API — replacing expensive consultants and fragile spreadsheets with repeatable, auditable output in minutes.", 
          size: 20, font: "Arial", color: DARK 
        })]
      }),

      // ONE-PAGER
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("One-Pager Summary")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The Opportunity")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Founders walk into funding conversations with gut-feel numbers or expensive consultant reports. Investors and advisors waste hours rebuilding spreadsheets. Traditional tools (AngelList, Crunchbase, generic calculators) lack transparency, methodology depth, or India-specific data. Result: weak credibility and lost time/money.", size: 20, font: "Arial", color: DARK })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The Solution")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Evaldam runs 6 professional valuation methods in parallel, blends them with dynamic stage-based weights, and produces a complete package: low/mid/high range, full assumptions trail, sensitivity analysis, live comparables (strong India focus), and clean investor PDF. Core engine is mostly deterministic → extremely low cost and fully auditable.", size: 20, font: "Arial", color: DARK })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Key Differentiators")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "6 methods + proprietary Evaldam Score (not black-box AI)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "India-optimized (RBI rates, local comparables, INR pricing)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Evidence trail + confidence scoring on every input", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Free preview → $44/mo Startup → $250/mo Agency tiers", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Developer API for platforms (credit-based, high margin)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Minutes, not weeks or $5k–25k consultant fees", size: 20, font: "Arial" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Business Model")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Freemium funnel (5 previews + watermarked reports)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Recurring SaaS (Startup & Agency plans)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "High-margin API credits for fintechs, accelerators, marketplaces", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Future: Enterprise portfolio programs + white-label", size: 20, font: "Arial" })] }),

      // ICP
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Ideal Customer Profile (ICP)")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Primary: Founder / Startup ($44/mo)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Raising or preparing to raise angel/seed/Series A", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "1–2 founders or small team", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Has (or can estimate) basic data: stage, team, revenue/growth, TAM", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 160 }, children: [new TextRun({ text: "Pain: Doesn’t trust gut feel or generic calculators; can’t afford consultants", size: 20, font: "Arial" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Secondary: Agency / Investor / Micro-VC / Incubator ($250/mo)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Runs 5–30+ valuations per year (portfolio, due diligence, client work)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Needs repeatable process + professional output for multiple stakeholders", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 160 }, children: [new TextRun({ text: "Values team seats, portfolio dashboard, history/versioning, review workflows", size: 20, font: "Arial" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Tertiary: Platform / Developer (API Credits)")] }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "Fintechs, cap table tools, accelerators, lending platforms needing to embed valuation intelligence. Pays via prepaid credits (high margin for Evaldam).", size: 20, font: "Arial", color: DARK })]
      }),

      // MARKET SIZE
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Market Size")] }),

      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2400, 7680],
        rows: [
          new TableRow({ children: [
            createHeaderCell("Segment", 2400),
            createHeaderCell("Estimate & Rationale", 7680)
          ]}),
          new TableRow({ children: [
            createCell("TAM", 2400, true),
            createCell("~$8–12 billion — Global early-stage startup valuation & diligence tools + financial modeling software (includes valuation consulting, spreadsheet tools, data platforms like PitchBook/Crunchbase subsets, emerging AI vertical SaaS).", 7680)
          ]}),
          new TableRow({ children: [
            createCell("SAM", 2400, true),
            createCell("~$1.8–2.5 billion — Early-stage founders + advisors/investors who need pre-money / seed / Series A valuations, especially those frustrated with spreadsheets or expensive consultants.", 7680)
          ]}),
          new TableRow({ children: [
            createCell("SOM (5yr)", 2400, true),
            createCell("$180–350 million — India + emerging markets + English-speaking global early-stage segment that values speed + transparency. Conservative estimate.", 7680)
          ]}),
        ]
      }),

      new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "Why India is the wedge:", bold: true, size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "One of the highest densities of early-stage startups globally", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Strong cultural need for credible numbers before talking to angels/family offices", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Existing players weak on India-specific data (local multiples, RBI rates, Indian comparables)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 300 }, children: [new TextRun({ text: "Evaldam already has the data advantage + INR pricing", size: 20, font: "Arial" })] }),

      // BUSINESS ANALYTICS
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Business Analytics & Unit Economics")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Unit Economics (Current Architecture – Very Strong)")] }),

      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [4200, 5880],
        rows: [
          new TableRow({ children: [
            createHeaderCell("Metric", 4200),
            createHeaderCell("Estimate", 5880)
          ]}),
          new TableRow({ children: [
            createCell("CAC (organic + content)", 4200, true),
            createCell("$15–60 (Free valuation funnel is the main engine)", 5880)
          ]}),
          new TableRow({ children: [
            createCell("LTV (Startup plan)", 4200, true),
            createCell("$280–520 (8–14 month average retention @ $44/mo)", 5880)
          ]}),
          new TableRow({ children: [
            createCell("LTV (Agency plan)", 4200, true),
            createCell("$1,800–3,600 (Much stickier)", 5880)
          ]}),
          new TableRow({ children: [
            createCell("Gross Margin", 4200, true),
            createCell("92–97% (Deterministic core + Groq = near-zero marginal cost)", 5880)
          ]}),
          new TableRow({ children: [
            createCell("Payback Period", 4200, true),
            createCell("1–3 months (Excellent)", 5880)
          ]}),
          new TableRow({ children: [
            createCell("LTV:CAC (Startup)", 4200, true),
            createCell("8–15x", 5880)
          ]}),
          new TableRow({ children: [
            createCell("LTV:CAC (Agency)", 4200, true),
            createCell("25x+", 5880)
          ]}),
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Projected Revenue Mix (Next 12–24 Months)")] }),

      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2800, 2200, 2200, 2880],
        rows: [
          new TableRow({ children: [
            createHeaderCell("Revenue Stream", 2800),
            createHeaderCell("% of Revenue", 2200),
            createHeaderCell("Margin", 2200),
            createHeaderCell("Growth Driver", 2880)
          ]}),
          new TableRow({ children: [
            createCell("Startup Subscriptions", 2800),
            createCell("55–65%", 2200),
            createCell("High", 2200),
            createCell("Free funnel conversion", 2880)
          ]}),
          new TableRow({ children: [
            createCell("Agency Subscriptions", 2800),
            createCell("20–30%", 2200),
            createCell("Very High", 2200),
            createCell("Portfolio users", 2880)
          ]}),
          new TableRow({ children: [
            createCell("API Credits", 2800),
            createCell("10–20%", 2200),
            createCell("85–95%", 2200),
            createCell("Platform partnerships", 2880)
          ]}),
          new TableRow({ children: [
            createCell("Enterprise", 2800),
            createCell("5–10%", 2200),
            createCell("High", 2200),
            createCell("Later stage", 2880)
          ]}),
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Key Risks & Mitigations")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Anthropic cost leakage → Gate rich report generation; default to cheap deterministic path", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Low conversion from free → Double down on onboarding, email sequences, and “investor readiness” triggers", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 300 }, children: [new TextRun({ text: "India payment friction → Razorpay already integrated; continue optimizing", size: 20, font: "Arial" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Growth Levers (Priority Order)")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Optimize free valuation → paid conversion (biggest near-term lever)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "India-specific content + SEO (huge untapped wedge)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Developer API distribution (high margin, low support)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Agency/accelerator partnerships (volume + credibility)", size: 20, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 300 }, children: [new TextRun({ text: "Enterprise portfolio deals (high ACV)", size: 20, font: "Arial" })] }),

      // CONCLUSION
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Overall Verdict")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "Evaldam has best-in-class unit economics for a vertical SaaS because of the deterministic engine. The moat is real (India data + methodology transparency + audit trail). The main job now is disciplined funnel execution and protecting the cost advantage. This is a high-margin, capital-efficient business with clear paths to significant scale.", 
          size: 20, font: "Arial", color: DARK 
        })]
      }),

      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "— End of Document —", size: 18, font: "Arial", color: GRAY, italics: true })]
      }),
    ]
  }]
});

// Generate the document
Packer.toBuffer(doc).then(buffer => {
  const outputPath = "D:\\apps\\evaldam\\evaldam\\Evaldam_AI_Strategic_Overview.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("Document created successfully: " + outputPath);
}).catch(err => {
  console.error("Error creating document:", err);
});