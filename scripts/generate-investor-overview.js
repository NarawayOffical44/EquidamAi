const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, PageNumber, LevelFormat, PageBreak, VerticalAlign } = require('docx');
const fs = require('fs');

// Brand colors
const PRIMARY = "00B2B2";      // Teal
const PRIMARY_DARK = "008080";
const DARK = "0F172A";
const GRAY = "475569";
const LIGHT_GRAY = "F1F5F9";
const ACCENT = "0EA5E9";

// Border helpers
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: PRIMARY };

function createHeaderCell(text, width, bg = PRIMARY) {
  return new TableCell({
    borders: { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder },
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18, font: "Arial" })]
    })]
  });
}

function createCell(text, width, options = {}) {
  const { bold = false, align = AlignmentType.LEFT, bg = undefined } = options;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 55, bottom: 55, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, size: 17, font: "Arial", bold, color: DARK })]
    })]
  });
}

function createMetricBox(title, value, subtext) {
  return new Table({
    width: { size: 3000, type: WidthType.DXA },
    columnWidths: [3000],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            width: { size: 3000, type: WidthType.DXA },
            shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: title, size: 15, font: "Arial", color: GRAY })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40 },
                children: [new TextRun({ text: value, bold: true, size: 26, font: "Arial", color: PRIMARY_DARK })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: subtext, size: 14, font: "Arial", color: GRAY })]
              })
            ]
          })
        ]
      })
    ]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: PRIMARY_DARK },
        paragraph: { spacing: { before: 220, after: 80 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 580, hanging: 280 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 580, hanging: 280 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 720, right: 720, bottom: 720, left: 720 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "EVALDAM AI", bold: true, size: 16, font: "Arial", color: PRIMARY }),
            new TextRun({ text: "   |   Investor Strategic Overview", size: 15, font: "Arial", color: GRAY })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Confidential  •  Page ", size: 14, font: "Arial", color: GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 14, font: "Arial", color: GRAY }),
            new TextRun({ text: "  •  equiDam.ai", size: 14, font: "Arial", color: GRAY })
          ]
        })]
      })
    },
    children: [
      // ========== TITLE SECTION ==========
      new Paragraph({ spacing: { after: 60 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "EVALDAM AI", bold: true, size: 48, font: "Arial", color: PRIMARY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Defensible Startup Valuations. Investor-Ready Reports. Built for Scale.", size: 18, font: "Arial", color: DARK, italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }), size: 15, font: "Arial", color: GRAY })]
      }),

      // ONE-LINER BOX
      new Table({
        width: { size: 10800, type: WidthType.DXA },
        columnWidths: [10800],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY }, bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY }, left: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY }, right: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY } },
                width: { size: 10800, type: WidthType.DXA },
                shading: { fill: "F0FDFA", type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "One-Liner", size: 14, font: "Arial", color: PRIMARY_DARK, bold: true })]
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60 },
                    children: [new TextRun({ text: "Evaldam AI gives founders and investors defensible, methodology-backed startup valuations with full assumptions, comparables, and investor-ready reports in minutes — not weeks or spreadsheets.", size: 18, font: "Arial", color: DARK })]
                  })
                ]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 240 }, children: [] }),

      // EXECUTIVE SUMMARY
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
      new Paragraph({
        spacing: { after: 140 },
        children: [new TextRun({ text: "Evaldam AI is a capital-efficient vertical SaaS platform that replaces expensive consultants and fragile spreadsheets with professional-grade, auditable startup valuations. Our deterministic 6-method engine delivers 95%+ gross margins and 8–25× LTV:CAC while solving a painful, recurring problem for founders raising capital and advisors managing portfolios.", size: 17, font: "Arial", color: DARK })]
      }),

      // Key highlights row
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: "Key Highlights", bold: true, size: 17, font: "Arial", color: PRIMARY_DARK })]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "95%+ Gross Margins — Core valuation engine is mostly deterministic (near-zero marginal cost)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "LTV:CAC of 8–15× (Startup) and 25×+ (Agency) with $15–60 organic CAC via free valuation funnel", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Strong India wedge + global applicability — already optimized for the fastest-growing early-stage market", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Multiple high-margin revenue streams: SaaS subscriptions + API credits (85–95% margin)", size: 16, font: "Arial" })] }),

      // PROBLEM + SOLUTION
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The Problem")] }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Founders walk into investor conversations with gut-feel numbers or $5k–25k consultant reports that take weeks. Advisors and micro-VCs waste hours rebuilding spreadsheets for every startup. Existing tools (AngelList, Crunchbase, generic calculators) are either black-box, lack methodology depth, or have almost no India-specific data.", size: 17, font: "Arial", color: DARK })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Our Solution")] }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Evaldam runs six professional valuation methods in parallel (Scorecard, Berkus, VC Method, DCF LTG, DCF Exit Multiples + proprietary Evaldam Score), blends them with stage-adjusted weights, and instantly produces a complete, evidence-backed package: low/mid/high range, full assumptions trail, sensitivity analysis, live comparables, and clean investor PDF.", size: 17, font: "Arial", color: DARK })]
      }),

      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "Key Differentiators", bold: true, size: 17, font: "Arial", color: PRIMARY_DARK })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "6-method professional blend + proprietary Evaldam Score (not black-box AI)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "India-optimized from day one (RBI rates, local comparables, INR pricing, Indian benchmarks)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Complete evidence trail and confidence scoring on every input — fully auditable", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Minutes, not weeks — and 50–100× cheaper than traditional consultants", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Developer API for platforms (fintechs, cap tables, accelerators) — high-margin embedded revenue", size: 16, font: "Arial" })] }),

      // MARKET
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Market Opportunity")] }),

      new Table({
        width: { size: 10800, type: WidthType.DXA },
        columnWidths: [2200, 8600],
        rows: [
          new TableRow({ children: [createHeaderCell("Segment", 2200), createHeaderCell("Size & Rationale", 8600)] }),
          new TableRow({ children: [
            createCell("TAM", 2200, { bold: true }),
            createCell("~$8–12B — Global early-stage valuation, diligence tools & financial modeling software", 8600)
          ]}),
          new TableRow({ children: [
            createCell("SAM", 2200, { bold: true }),
            createCell("~$1.8–2.5B — Founders + advisors needing credible pre-money/seed/Series A valuations", 8600)
          ]}),
          new TableRow({ children: [
            createCell("SOM (5yr)", 2200, { bold: true }),
            createCell("$180–350M — India + emerging markets + English-speaking early-stage segment (conservative)", 8600)
          ]}),
        ]
      }),

      new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Why India is our wedge: ", bold: true, size: 16, font: "Arial", color: DARK }), new TextRun({ text: "One of the highest densities of early-stage startups globally + strong cultural need for credible numbers before talking to angels/family offices. Existing players are weak on India-specific data. We already own the data advantage and INR pricing.", size: 16, font: "Arial", color: DARK })] }),

      // BUSINESS MODEL
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Business Model")] }),

      new Table({
        width: { size: 10800, type: WidthType.DXA },
        columnWidths: [2400, 2800, 2800, 2800],
        rows: [
          new TableRow({ children: [
            createHeaderCell("Plan", 2400),
            createHeaderCell("Price (USD)", 2800),
            createHeaderCell("Target Customer", 2800),
            createHeaderCell("Key Limits", 2800)
          ]}),
          new TableRow({ children: [
            createCell("Free (Funnel)", 2400),
            createCell("$0", 2800),
            createCell("Early explorers", 2800),
            createCell("5 previews + 3 watermarked PDFs/mo", 2800)
          ]}),
          new TableRow({ children: [
            createCell("Startup", 2400),
            createCell("$44/mo or $475/yr", 2800),
            createCell("Individual founders raising", 2800),
            createCell("1 startup, unlimited previews, full reports", 2800)
          ]}),
          new TableRow({ children: [
            createCell("Agency / Investor", 2400),
            createCell("$250/mo or $2,700/yr", 2800),
            createCell("Advisors, micro-VCs, incubators", 2800),
            createCell("10 startups, 5 team seats, portfolio dashboard", 2800)
          ]}),
          new TableRow({ children: [
            createCell("Enterprise + API", 2400),
            createCell("Custom + Credit top-ups", 2800),
            createCell("Platforms & large funds", 2800),
            createCell("Unlimited + embedded valuation intelligence", 2800)
          ]}),
        ]
      }),

      new Paragraph({ spacing: { before: 140 }, children: [new TextRun({ text: "Three revenue engines: ", bold: true, size: 16, font: "Arial", color: DARK }), new TextRun({ text: "Recurring SaaS (55–65%), Agency plans (20–30%), and high-margin Developer API credits (10–20%, 85–95% gross margin).", size: 16, font: "Arial", color: DARK })] }),

      // UNIT ECONOMICS - HERO SECTION
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Unit Economics (Our Superpower)")] }),

      new Table({
        width: { size: 10800, type: WidthType.DXA },
        columnWidths: [3800, 7000],
        rows: [
          new TableRow({ children: [
            createHeaderCell("Metric", 3800),
            createHeaderCell("Performance", 7000)
          ]}),
          new TableRow({ children: [
            createCell("Gross Margin", 3800, { bold: true }),
            createCell("92–97% (deterministic core + Groq = near-zero marginal cost per valuation)", 7000)
          ]}),
          new TableRow({ children: [
            createCell("CAC (organic)", 3800, { bold: true }),
            createCell("$15–60 via free valuation → paid conversion funnel", 7000)
          ]}),
          new TableRow({ children: [
            createCell("LTV — Startup Plan", 3800, { bold: true }),
            createCell("$280–520 (8–14 month retention @ $44/mo)", 7000)
          ]}),
          new TableRow({ children: [
            createCell("LTV — Agency Plan", 3800, { bold: true }),
            createCell("$1,800–3,600 (much stickier, higher ACV)", 7000)
          ]}),
          new TableRow({ children: [
            createCell("LTV:CAC (Startup)", 3800, { bold: true }),
            createCell("8–15×", 7000)
          ]}),
          new TableRow({ children: [
            createCell("LTV:CAC (Agency)", 3800, { bold: true }),
            createCell("25×+", 7000)
          ]}),
          new TableRow({ children: [
            createCell("Payback Period", 3800, { bold: true }),
            createCell("1–3 months", 7000)
          ]}),
        ]
      }),

      new Paragraph({
        spacing: { before: 120, after: 200 },
        children: [new TextRun({ text: "These economics are best-in-class for vertical SaaS. The deterministic engine is the fundamental advantage — most competitors are pure LLM and carry 30–60%+ variable costs.", size: 16, font: "Arial", color: DARK, italics: true })]
      }),

      // MOAT
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Defensible Moat")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Data moat: Deep India-specific valuation benchmarks and comparables that are hard to replicate quickly", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Methodology moat: 6-method deterministic engine + full evidence trail (investors demand auditability)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Cost moat: 10–50× lower marginal cost than pure-LLM competitors", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Switching costs: Once teams build workflows around reports and evidence, migration is painful", size: 16, font: "Arial" })] }),

      // GTM & GROWTH
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Go-to-Market & Growth Levers (Prioritized)")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Free valuation → paid conversion optimization (highest-leverage near-term move)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "India-first content + SEO (massive untapped demand)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Developer API distribution partnerships (high margin, low support cost)", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Agency / accelerator / incubator partnerships for volume and credibility", size: 16, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Enterprise portfolio deals (high ACV, long-term contracts)", size: 16, font: "Arial" })] }),

      // VERDICT
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Investment Thesis")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Evaldam AI combines the unit economics of a high-margin infrastructure business with the defensibility of a vertical data + methodology moat. We are solving a painful, recurring, high-willingness-to-pay problem in one of the fastest-growing startup ecosystems in the world. The product is already built, the economics are proven in the architecture, and the go-to-market is capital-efficient. This is a rare opportunity to own the professional standard for early-stage valuation infrastructure.", size: 17, font: "Arial", color: DARK })]
      }),

      // CONTACT
      new Paragraph({
        spacing: { before: 300 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Next Steps", bold: true, size: 18, font: "Arial", color: PRIMARY_DARK })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [new TextRun({ text: "We are open to strategic conversations with investors who understand vertical SaaS, India, and developer platforms.", size: 16, font: "Arial", color: DARK })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [new TextRun({ text: "Contact: founders@equidamai.com  |  equiDam.ai", size: 16, font: "Arial", color: PRIMARY, bold: true })]
      }),

      new Paragraph({
        spacing: { before: 320 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "— End of Document —", size: 14, font: "Arial", color: GRAY, italics: true })]
      }),
    ]
  }]
});

// Generate
Packer.toBuffer(doc).then(buffer => {
  const outputPath = "D:\\apps\\evaldam\\evaldam\\Evaldam_AI_Investor_Overview.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("Investor-ready document created: " + outputPath);
}).catch(err => {
  console.error("Error:", err);
});