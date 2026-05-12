# Evaldam AI User Journey And UX Flow

This maps how a founder, advisor, or reviewer should move through Evaldam AI. The product goal is simple on the surface and rigorous underneath: users should not need valuation expertise to create a credible, evidence-backed startup valuation report.

## 1. End-To-End Journey

```mermaid
flowchart TD
  A[Discovery\nHome, SEO pages, blog, free tools] --> B{User intent}
  B -->|Quick estimate| C[Free Valuation Preview]
  B -->|Repo/startup idea| D[GitHub Valuation]
  B -->|Professional report| E[Signup or Login]
  C --> F[Preview result\nRange + gaps + upgrade CTA]
  D --> F
  F --> E
  E --> G[Dashboard]
  G --> H[Create Startup Profile]
  H --> I[Startup Workspace]
  I --> J[Profile\nCompany, team, moat, website]
  I --> K[Financials\nARR, growth, burn, runway, TAM]
  I --> L[Assumptions\nMethod controls]
  J --> M[Report Readiness Check]
  K --> M
  L --> M
  M -->|Missing required inputs| N[Show simple gaps\nExplain what to add]
  N --> J
  M -->|Ready| O[Generate Valuation]
  O --> P[Server saves valuation + evidence + versions]
  P --> Q[Report Page]
  Q --> R[Evidence Trail]
  Q --> S[Methodology]
  Q --> T[Scenarios]
  Q --> U[Download PDF]
  Q --> V[Share Investor Link]
  Q --> W[Improve Inputs]
  W --> I
```

## 2. Product Surface Map

```mermaid
flowchart LR
  subgraph Public["Public / Acquisition"]
    Home["/"]
    Free["/free-valuation"]
    GitHub["/github-valuation"]
    Report["/valuation-report"]
    Pricing["/pricing"]
    Blog["/blog + /blog/[slug]"]
    Methodology["/methodology"]
    Comparables["/comparable-companies"]
  end

  subgraph Auth["Account"]
    Signup["/signup"]
    Login["/login"]
    Dashboard["/dashboard"]
  end

  subgraph Workspace["Startup Workspace"]
    NewStartup["/startup/new"]
    Startup["/startup/[id]"]
    ReportList["Reports tab"]
    ReportPage["/startup/[id]/report/[valuationId]"]
    Share["/share/[token]"]
  end

  subgraph Trust["Trust / Review"]
    Evidence["Evidence Trail"]
    PDF["PDF Export"]
    Reviewer["/reviewer-dashboard"]
    Admin["/admin"]
  end

  Home --> Free
  Home --> GitHub
  Home --> Pricing
  Blog --> Free
  Report --> Signup
  Free --> Signup
  GitHub --> Signup
  Signup --> Dashboard
  Login --> Dashboard
  Dashboard --> NewStartup
  NewStartup --> Startup
  Startup --> ReportList
  ReportList --> ReportPage
  ReportPage --> Evidence
  ReportPage --> PDF
  ReportPage --> Share
  ReportPage --> Reviewer
  Reviewer --> Admin
```

## 3. Startup Workspace UX Flow

```mermaid
stateDiagram-v2
  [*] --> Chat
  Chat --> Profile: user shares company facts
  Profile --> Financials: save basics
  Financials --> Assumptions: add metrics
  Assumptions --> Reports: optional advanced control
  Reports --> Incomplete: required inputs missing
  Incomplete --> Profile: fix company/team gaps
  Incomplete --> Financials: fix ARR/growth/TAM gaps
  Reports --> Generating: ready
  Generating --> SavedReport: server persists valuation
  SavedReport --> ReportPage: open report
  ReportPage --> EvidenceTrail
  ReportPage --> PDFDownload
  ReportPage --> ShareLink
  ReportPage --> Reports: back to history
```

## 4. Valuation And Evidence Pipeline

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Startup Workspace
  participant API as /api/valuate
  participant Engine as Valuation Engine
  participant DB as Supabase
  participant Report as Report/PDF

  U->>UI: Completes profile + financials
  UI->>UI: Builds input snapshot + fingerprint
  UI->>API: POST startupProfile, startupId, inputSnapshot
  API->>DB: Verify user owns startup
  API->>Engine: Run 6 valuation methods
  Engine-->>API: Method outputs, weights, confidence, market context
  API->>DB: Insert valuation row
  API->>DB: Insert method evidence
  API->>DB: Insert input/data-source evidence
  API->>DB: Insert version snapshot
  API->>DB: Insert structured report data
  API-->>UI: savedValuation
  UI->>Report: Open report page
  Report->>DB: Fetch valuation + evidence + methodology
  U->>Report: Review, download PDF, or share
```

## 5. Trust Layer

```mermaid
flowchart TD
  A[Founder Input] --> B[Input Snapshot]
  C[Website / Deck Extraction] --> B
  D[Market Data / Comparables] --> E[Market Context]
  F[Fallback Assumptions] --> E
  B --> G[Six Valuation Methods]
  E --> G
  G --> H[Method Outputs]
  H --> I[Blended Valuation Range]
  B --> J[Input Evidence Rows]
  H --> K[Method Evidence Rows]
  E --> L[Market Data Status]
  I --> M[Report]
  J --> M
  K --> M
  L --> M
  M --> N[Evidence Trail]
  M --> O[PDF]
  M --> P[Reviewer Approval Optional]
```

## 6. Beginner-Friendly UX Principles

```mermaid
mindmap
  root((Best Startup Valuation Platform))
    Simple Input
      Plain language questions
      Tooltips for ARR/TAM/burn/runway
      Website and deck extraction
      Chat-based updates
    Accurate Output
      Six methods
      Dynamic weights
      Comparable context
      Sensitivity scenarios
    Professional Trust
      Source labels
      Input provenance
      Evidence trail
      Version history
      Reviewer status
    Useful Action
      Investor objections
      Evidence gaps
      Next value levers
      PDF and share link
```

## 7. Ideal User Experience In Plain English

1. User arrives from Google, blog, or recommendation.
2. User tries a free valuation or signs up directly.
3. User creates a startup profile with normal business facts.
4. Evaldam explains missing inputs in plain English.
5. User generates a valuation when enough evidence exists.
6. Evaldam saves the valuation and all evidence server-side.
7. User sees a valuation range, confidence, methods, assumptions, gaps, and next steps.
8. User downloads or shares a professional report.
9. User improves weak inputs and regenerates a stronger version.
10. Optional reviewer approval turns the report from system-generated to professionally reviewed.

## 8. What The User Should Feel

- "I do not need to understand valuation jargon to start."
- "The result is not a random AI answer."
- "Every number has a reason."
- "I know what data is weak."
- "I can show this to investors without embarrassment."
- "If I need more confidence, I know exactly what to improve."

## 9. Next UX Upgrades

1. Add a guided onboarding wizard before the full workspace.
2. Add inline explainers for ARR, TAM, burn, runway, gross margin, customer concentration.
3. Add a report readiness score before generation.
4. Add document upload proof for financials, pitch deck, cap table, and customer traction.
5. Add verified/unverified badges beside each key input.
6. Add reviewer-approved badge and locked final valuation state.
7. Add a one-page investor summary view separate from the full PDF.
