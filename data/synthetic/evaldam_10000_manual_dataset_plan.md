# Evaldam 10,000 Record Manual Dataset Plan

Goal: build a high-quality Indian startup and MSME finance training dataset without random script-generated repetition.

This plan assumes the dataset can take days or weeks. The purpose is commercial-grade domain behavior, not raw row count.

## Core Principle

One topic can produce 44 or more records, but only if each record changes the actual decision surface.

Bad variants:

- Same facts, same answer, different wording
- Same 30-day plan repeated across records
- Same generic "pick clean terms" answer
- Same legal references pasted into unrelated sectors

Good variants:

- Same topic, different stage
- Same topic, different sector
- Same topic, different numbers
- Same topic, different constraint
- Same topic, different legal blocker
- Same topic, different final recommendation

## 400-Record ICP Coverage Layer

Use this layer for `training_dataset_chatgopt_2.jsonl`. The goal is not random breadth; it is commercial coverage for the real people who would ask Evaldam finance questions today.

### Primary ICPs

1. First-time founder
   - Needs: what to do first, whether to incorporate, whether to raise, which grant fits, how much equity is too much
   - Good questions: Should I raise before MVP? Is an angel offer fair? What is the 30-day rule?

2. VC-backed founder
   - Needs: seed, bridge, Series A, ESOP, term sheet, runway, dilution, investor rights
   - Good questions: Should I accept the higher valuation? Is this liquidation preference dangerous? How do I survive diligence?

3. MSME owner or operator
   - Needs: term loan, working capital, CGTMSE, TReDS, delayed payments, procurement, restructuring
   - Good questions: Which loan should I take? How do I finance receivables? What if the buyer delays payment?

4. Finance lead or fractional CFO
   - Needs: data room, GST, TDS, FEMA, cash-flow model, board approval, investor reporting
   - Good questions: What documents are missing? Which filings block closing? What should go into the board memo?

5. Angel investor or syndicate lead
   - Needs: valuation sanity, founder dilution, downside protection, red flags, follow-on risk
   - Good questions: Is this term sheet fair? Should I insist on CCPS? What red flags should stop the cheque?

6. VC associate or investment partner
   - Needs: diligence, market risk, cap table, regulatory exposure, follow-on fundability, exit path
   - Good questions: What diligence issue matters most? Is the bridge a bad signal? What should be in the investment memo?

7. Incubator, accelerator, or grant reviewer
   - Needs: scheme fit, milestone quality, eligibility, duplication risk, utilization evidence
   - Good questions: Should this startup get SISFS? Is NIDHI-PRAYAS stage-fit? What milestones are fundable?

8. CA, CS, startup lawyer, or advisor
   - Needs: Companies Act, FEMA, tax, ESOP, private placement, board/shareholder approvals
   - Good questions: Which compliance action comes first? What is the legal blocker? What wording creates risk?

9. Lender, NBFC, or credit analyst
   - Needs: repayment capacity, DSCR, collateral, guarantee cover, receivables quality, borrower behavior
   - Good questions: Should this borrower get CGTMSE-backed credit? Is OD or term loan better? What covenant matters?

10. Strategic investor, corporate partner, or acquirer
   - Needs: exclusivity, customer-funded development, ROFR, IP ownership, earnout, integration risk
   - Good questions: Is this strategic capital too restrictive? Should we buy, partner, or invest? What clauses preserve optionality?

### 400-Record Mix For This Topic

- 40 idea/MVP/pre-seed founder financing records
- 50 seed/Series A fundraising and term-sheet records
- 40 cap table, ESOP, dilution, founder split, and note-conversion records
- 45 MSME loan, CGTMSE, cash credit, overdraft, TReDS, delayed-payment records
- 40 grants, DPIIT, SISFS, NIDHI-PRAYAS, BIRAC, state-scheme records
- 45 tax, FEMA, GST, TDS, Companies Act, ESOP tax, IP, and data-room records
- 50 sector-specific records across AI, SaaS, fintech, space, medtech, agritech, climate, D2C, manufacturing, logistics, edtech, govtech, gaming, and proptech
- 35 investor-side diligence and investment memo records
- 25 lender/credit analyst records
- 30 exit, M&A, secondary, SME IPO, mainboard IPO, shutdown, and restructuring records

### Quality Rules For The 400

- Every record must identify the user type implicitly through the question and scenario.
- Every 3-turn conversation must stay on one coherent decision, not jump across unrelated topics.
- Each assistant answer must include math, Indian context, a recommendation, and an execution rule.
- At least one turn must challenge the recommendation or change one variable.
- Do not repeat the same 30-day plan across records.
- Do not use live legal or scheme thresholds unless checked against an official source near generation time.
- Use the current CGTMSE and MSME thresholds from official sources, not stale older limits.

Example: "ESOP pool negotiation" can produce 44 useful records if the cases include:

- Idea-stage co-founders formalizing equity before incorporation
- Seed SaaS raising from Indian VC with 12 percent pre-money pool
- Fintech needing senior risk/compliance hires
- AI infra needing expensive senior engineers
- D2C brand with low cash salary and high ESOP expectations
- Series A company with pool refresh and already-granted options
- Down round where ESOP top-up creates founder-control risk
- Founder secondary where ESOP refresh affects common shareholders
- Foreign investor asking for US-style option terms
- Employee asking about exercise tax and eligible startup deferral

## Target Dataset Shape

Build the dataset in layers:

1. Manual gold records
   - Target: 500-1,000 records
   - Purpose: highest quality examples written or heavily edited manually
   - Use: final training data and standard for all later generation

2. Reviewed expansion records
   - Target: 3,000-5,000 records
   - Purpose: scale coverage with strict human review
   - Source: generated only from approved scenario cards and rejected if repetitive

3. Preference / DPO records
   - Target: 2,000-4,000 pairs
   - Purpose: teach the model to prefer sharper Indian finance answers over generic advice
   - Format: chosen answer vs rejected answer

4. Evaluation set
   - Target: 500-1,000 questions
   - Purpose: never train on these
   - Must include: math, legal traps, sector-specific cases, and hallucination traps

## 10,000 Record Mix

Suggested final mix:

- 2,000 startup fundraising and valuation records
- 1,500 cap table, ESOP, dilution, and term-sheet records
- 1,200 grants, schemes, DPIIT, and government benefit records
- 1,200 MSME credit, working capital, TReDS, CGTMSE, and loan records
- 1,000 tax, compliance, FEMA, GST, Companies Act, and IP records
- 1,000 sector-specific finance records
- 800 exit, M&A, secondary, PE buyout, and IPO records
- 800 distress, restructuring, bridge, down round, and cash-crisis records
- 500 founder conflicts, co-founder agreements, compensation, and governance records

## Stage Coverage

Each major topic should be represented across:

1. Idea stage
2. Prototype / MVP
3. Pilot revenue
4. Pre-seed
5. Seed
6. Bridge
7. Series A
8. Series B / growth
9. Pre-IPO
10. Exit or shutdown

## Topic Families

### A. Startup Valuation And Fundraising

Subtopics:

- Berkus vs Scorecard vs VC Method vs ARR multiple vs DCF
- Pre-revenue valuation
- SaaS ARR multiple selection
- Fintech revenue vs loan-book valuation
- Deeptech milestone valuation
- D2C revenue vs contribution-margin valuation
- Strategic premium
- Down-round valuation
- Bridge valuation cap
- Series A pricing
- Series B growth multiple
- IPO readiness valuation

Variant requirements:

- Change traction numbers
- Change runway
- Change investor type
- Change sector
- Change whether high valuation is good or dangerous
- Include at least one scenario where lower valuation is the better answer

### B. Cap Table, ESOP, And Dilution

Subtopics:

- Founder split
- Reverse vesting
- ESOP pre-money vs post-money
- ESOP refresh at Series A
- SAFE / note conversion dilution
- Convertible note cap vs discount
- Anti-dilution
- Full ratchet vs weighted average
- Founder secondary
- Advisor equity
- Employee ESOP grant sizing
- ESOP exercise tax

Variant requirements:

- Include both simple and multi-round cap tables
- Include at least 3 records where the answer says "accept the dilution"
- Include at least 3 records where the answer says "walk away"
- Include Indian Companies Act control thresholds where relevant

### C. Grants And Schemes

Subtopics:

- SISFS
- NIDHI-PRAYAS
- TANSEED
- RKVY-RAFTAAR
- BIRAC BIG
- MeitY support
- Startup India recognition
- State startup grants
- DPIIT procurement benefits
- Grant rejection repair
- Non-duplication of cost heads
- Utilization certificates

Variant requirements:

- Include one record for each major sector: AI, biotech, agritech, hardware, SaaS, climate, space
- Include cases where the startup should not apply to a popular scheme
- Include disbursement and documentation realism

### D. MSME Loans And Working Capital

Subtopics:

- Udyam registration
- MSME classification after 1 April 2025 threshold change
- CGTMSE
- TReDS
- Invoice discounting
- Bank cash credit
- Term loan for machinery
- Mudra
- Stand-Up India
- PMEGP
- Section 43B(h)
- MSMED Act 45-day payment rule
- MSEFC
- GeM
- ZED
- Priority-sector lending

Variant requirements:

- Include manufacturing, services, food processing, textiles, packaging, fabrication, logistics, electronics, and exports
- Include at least 10 records where fintech NBFC credit is rejected as too expensive
- Include at least 10 records where TReDS is not viable because buyer is not onboarded or invoice is disputed

### E. Legal, Tax, FEMA, And Compliance

Subtopics:

- Section 80-IAC timing
- MAT and carried-forward losses
- Angel tax abolition vs valuation documentation
- Rule 11UA
- GST threshold and composition
- TDS sections
- FEMA FC-GPR
- Press Note 3
- ECB
- Delaware flip
- Reverse flip
- IP assignment
- DPDP Act
- Founder loans
- Related-party transactions

Variant requirements:

- Separate stable law from live data
- Include cases where user misunderstands abolished angel tax
- Include cases where a foreign SAFE request is rejected for Indian Pvt Ltd

### F. Sector-Specific Finance

Sectors:

- AI / ML / generative AI
- Fintech
- SaaS
- Deeptech hardware
- Space-tech
- Climate-tech
- Biotech
- Medtech
- Healthtech
- Agritech
- D2C
- Manufacturing MSME
- B2G / govtech
- Edtech
- Logistics
- Real estate / proptech
- Creator / media
- Gaming
- Defence-tech
- Semiconductor / electronics
- Food processing
- Textiles
- EV / mobility

Variant requirements:

- Every sector must include at least:
  - 5 idea/MVP records
  - 5 seed/Series A records
  - 5 debt/grant records
  - 5 compliance or regulatory records
  - 5 exit or strategic financing records

### G. IPO, M&A, And Exits

Subtopics:

- SME IPO vs mainboard IPO
- Strategic sale vs PE buyout
- Founder rollover
- Earnout
- Escrow
- Indemnity cap
- Secondary sale
- Slump sale vs share sale
- Pre-IPO governance cleanup
- Related-party cleanup
- Auditor readiness
- DRHP readiness

Variant requirements:

- Include profitable MSMEs considering SME IPO
- Include startups considering strategic acquisition before Series B
- Include cases where IPO is rejected as premature
- Include cases where PE buyout is better than strategic sale

## Variant Design For 44 Records On One Topic

If generating 44 records on one topic, use this grid:

1. 11 stage variants
   - Idea, MVP, pilot, pre-seed, seed, bridge, Series A, Series B, pre-IPO, exit, distress

2. 11 sector variants
   - SaaS, fintech, AI, deeptech, healthtech, agritech, D2C, manufacturing MSME, logistics, space, climate

3. 11 constraint variants
   - Low runway, foreign investor, family-business founder, high revenue but low margin, grants conflict, buyer payment delay, co-founder dispute, compliance gap, debt overhang, high customer concentration, tax confusion

4. 11 outcome variants
   - Take deal, reject deal, negotiate one clause, delay raise, take debt, take grant, use RBF, pursue acquisition, bootstrap, restructure, prepare IPO later

Each of the 44 should have a different final recommendation.

## Manual Record Checklist

Before adding a JSONL record:

1. Is the scenario specific enough that a generic model would struggle?
2. Does each assistant turn use the actual numbers?
3. Does it name the relevant Indian law, scheme, platform, or market practice?
4. Does it include a committed answer?
5. Does it reject at least one plausible alternative?
6. Does it include a 7-day, 30-day, or stage-specific action plan?
7. Does it avoid stale live data unless verified?
8. Does it avoid the repeated phrases from rejected template output?
9. Would this answer teach Llama 8B useful behavior beyond style?
10. Would a founder pay for this answer if it were accurate?

## Data Types To Keep Separate

Training data:

- Stable legal rules
- Decision frameworks
- Calculation patterns
- Negotiation logic
- Documentation sequencing
- Founder-facing explanation style

Retrieval / RAG data:

- Current scheme windows
- Current interest rates
- Current startup counts
- Current funding market reports
- Current government portal status
- Current tax filing dates
- Live bank/NBFC pricing

Evaluation data:

- Trick questions
- Outdated law traps
- Math traps
- Conflicting advice from CA/lawyer/investor
- Cases where the model must say "this fact must be verified before acting"
