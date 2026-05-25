# Evaldam ICP And Question Map

Purpose: make the dataset user-led, not topic-led.

Every training record should start with:

1. Who is the user?
2. What decision are they trying to make?
3. What do they ask directly?
4. What should they have asked but may not know?
5. What would a generic model miss?
6. What should Evaldam answer better than a generic LLM?

## ICP 1: Idea-Stage Founder

Profile:

- Has an idea, maybe a prototype plan, no incorporated company or revenue
- Often first-time founder
- Confused by advice from friends, LinkedIn, CA, accelerator, and YouTube
- Wants to avoid making irreversible equity and compliance mistakes

Likely questions:

- Should I incorporate now or wait until MVP?
- Should I start as LLP, Pvt Ltd, or proprietorship?
- How much equity should I give a co-founder who is joining later?
- Should I apply for a grant before incorporation?
- How much money do I need to build MVP?
- Should I raise pre-seed on idea only?
- Is a 50-50 split fair if one person has already worked for 6 months?

Questions they should ask:

- Who owns the IP before incorporation?
- Should founder shares have reverse vesting?
- What decisions require a board/shareholder record later?
- What proof will matter for the first investor?
- What is the cheapest path to validate before raising?

Model should answer with:

- Incorporation timing
- Founder equity logic
- IP assignment
- MVP budget
- grant eligibility if relevant
- what not to spend on yet

Generic model failure:

- Gives generic startup advice without Indian Pvt Ltd, GST, DPIIT, IP assignment, or founder vesting context

## ICP 2: MVP / Prototype Founder

Profile:

- Has early product or prototype
- Has pilots, no meaningful revenue
- Needs validation capital
- Often confused between grants, angel, and accelerator money

Likely questions:

- Should I charge for pilots?
- Will pilot revenue hurt grant eligibility?
- Should I apply to SISFS, NIDHI-PRAYAS, BIRAC BIG, or state grant?
- How do I value a pre-revenue prototype?
- What documents do I need before angel outreach?
- Should I give equity to an advisor or incubator?

Questions they should ask:

- Does the scheme match my stage?
- Are my cost heads duplicated across grants?
- What evidence will increase approval probability?
- What milestone should this grant fund?
- Will the grant delay customer work?

Model should answer with:

- Scheme fit
- document checklist
- use-of-funds split
- grant vs equity trade-off
- milestone plan

Generic model failure:

- Says apply to every grant without stage fit, disbursement delay, or utilization-certificate risk

## ICP 3: Early-Traction Startup Founder

Profile:

- Has MRR, pilots, early paying customers
- Needs first external round or bridge
- Wants valuation and term-sheet clarity

Likely questions:

- Which valuation method applies?
- Is this angel offer fair?
- Should I optimize valuation or terms?
- Should I take a bridge or priced round?
- How much dilution is normal?
- Should I accept a board seat request?

Questions they should ask:

- What happens after ESOP, note conversion, and next round?
- What liquidation preference is acceptable?
- How does runway weaken leverage?
- How do I simulate Series A ownership?
- What term can break future fundability?

Model should answer with:

- dilution math
- valuation method selection
- term-sheet red flags
- 30-day closing plan
- founder reference checks

Generic model failure:

- Compares only headline valuation and ignores preference stack, ESOP pool, anti-dilution, or closing speed

## ICP 4: Seed-Stage Founder

Profile:

- Raising institutional seed
- Has some revenue and team
- Facing ESOP, governance, investor-rights questions

Likely questions:

- Is 12 percent ESOP pre-money standard?
- How much equity for senior hires?
- Should I accept full-ratchet anti-dilution?
- How many board seats are normal?
- Should I let a strategic investor lead?
- Should I accept a no-shop?

Questions they should ask:

- Does existing ESOP count inside the refresh?
- What is founder ownership after Series A?
- Which reserved matters hurt operations?
- What rights become impossible to clean later?
- What does this term imply at a moderate exit?

Model should answer with:

- cap table after seed
- ESOP sizing by hiring plan
- governance boundaries
- anti-dilution explanation
- deal/no-deal rule

Generic model failure:

- Treats all VC terms as standard and does not quantify founder cost

## ICP 5: Series A / Growth Founder

Profile:

- Has meaningful ARR or revenue
- Comparing multiple institutional term sheets
- Needs lead investor selection, not only valuation

Likely questions:

- Which term sheet should I take?
- Is a Tier-1 brand worth lower valuation?
- Should I take CVC money?
- Is participating preference really bad?
- How much ESOP refresh is normal?
- Should I allow 2 board seats?

Questions they should ask:

- What will Series B investors think?
- Does the CVC create channel conflict?
- Does the no-shop length create fundraising risk?
- What exit waterfall does this preference create?
- What operating decisions are blocked by reserved matters?

Model should answer with:

- true economic cost
- board/control analysis
- downstream fundraising effect
- strategic investor conflict
- negotiation priorities

Generic model failure:

- Picks highest valuation or biggest cheque without modeling control, no-shop, or exit waterfall

## ICP 6: Startup CFO / Finance Head

Profile:

- Handles compliance, runway, debt, investor reporting, cross-border structuring
- Often more technical and expects precise sequencing

Likely questions:

- Should we use ECB, equity infusion, or intercompany loan?
- How do we file FC-GPR?
- How do we model thin capitalization?
- How do we handle warrants in venture debt?
- How do we report foreign investment?
- How much runway does this debt actually add?

Questions they should ask:

- Is the end use allowed?
- Does all-in-cost breach RBI ceiling?
- What tax withholding applies?
- Does transfer pricing support the interest rate?
- What reporting calendar starts after drawdown?

Model should answer with:

- regulatory path
- cash-flow model
- tax and transfer-pricing issues
- reporting timeline
- fallback structure

Generic model failure:

- Says foreign debt is cheaper without ECB restrictions, withholding, maturity, or end-use analysis

## ICP 7: MSME Owner / Promoter

Profile:

- Runs profitable or semi-profitable manufacturing, trading, food, textile, packaging, or services business
- Wants loans, working capital, government benefits, and buyer-payment protection
- Less interested in VC-style language

Likely questions:

- Which loan should I take?
- Is CGTMSE useful?
- Should I use TReDS or invoice discounting?
- Am I Micro, Small, or Medium?
- Should I register on Udyam?
- Can I force large buyers to pay within 45 days?
- Should I apply for PMEGP or Mudra?

Questions they should ask:

- Is this working-capital or capex need?
- What is the annualized cost?
- Is the buyer onboarded to TReDS?
- Will this loan create collateral lock-in?
- Can Section 43B(h) improve collection without harming relationships?

Model should answer with:

- product-fit financing logic
- current MSME classification
- documents needed
- repayment capacity
- buyer-payment strategy

Generic model failure:

- Lists schemes without choosing a financing stack or explaining lender/buyer behavior

## ICP 8: MSME Finance Manager / CFO

Profile:

- More numbers-driven than promoter
- Manages bank limits, GST, TDS, receivables, stock, and working capital

Likely questions:

- Should I increase cash credit or use TReDS?
- How do I calculate drawing power?
- How do I reduce receivable days?
- What does Section 43B(h) change for buyers?
- How do I prepare loan renewal documents?
- How much DSCR is safe?

Questions they should ask:

- Which invoices are eligible?
- Are buyer disputes blocking discounting?
- What is the total cost after fees?
- What covenant or collateral is hidden?
- What happens if sales fall 20 percent?

Model should answer with:

- working-capital cycle math
- receivable-aging plan
- bank/NBFC/TReDS comparison
- compliance and documentation

Generic model failure:

- Gives textbook finance without Indian bank process, stock statements, TReDS acceptance, or MSMED rules

## ICP 9: CA / CS / Startup Advisor

Profile:

- Advises founders and MSMEs
- Needs precise legal/tax framing and caveats
- Uses model to draft memos, check strategy, and identify risks

Likely questions:

- How should I explain angel-tax abolition without ignoring valuation documentation?
- What board approvals are needed for CCPS?
- How do I structure founder reverse vesting?
- How do I prepare a DPIIT/80-IAC plan?
- What should go into a due diligence checklist?

Questions they should ask:

- Is this commercial advice or compliance advice?
- Which fact needs official verification today?
- What should be in the board note?
- What should not be promised to the client?

Model should answer with:

- structured memo
- fact assumptions
- compliance steps
- risk flags
- clear limits

Generic model failure:

- Blurs legal, tax, and commercial advice and gives stale rules confidently

## ICP 10: Investor / Angel / VC Associate

Profile:

- Reviews deal quality, cap table, risk, and founder maturity
- Wants diligence questions and investment memo clarity

Likely questions:

- Is this valuation defensible?
- What term sheet risks matter?
- Is founder ownership healthy?
- Is this grant/revenue real traction?
- What diligence should I run before signing?
- Is the cap table too messy?

Questions they should ask:

- Does the business qualify for the claimed scheme or tax benefit?
- Are related-party transactions clean?
- What customer concentration risk exists?
- What financing terms will block next round?

Model should answer with:

- investor memo framing
- risk ranking
- diligence checklist
- negotiation changes
- go/no-go decision

Generic model failure:

- Gives founder-friendly advice only and ignores investor risk

## ICP 11: Sector-Specific Regulated Founder

Profile:

- Operates in fintech, healthtech, medtech, space-tech, defence-tech, insurance, or data-heavy AI
- Needs finance plus sector regulation

Likely questions:

- Do I need RBI, SEBI, IRDAI, CDSCO, IN-SPACe, or other approval?
- Can I raise foreign money?
- What compliance will investors ask about?
- Should I take strategic capital from a regulated incumbent?
- Should I apply for sector grants?

Questions they should ask:

- Is my revenue legal under current licensing?
- Are pilots allowed before approval?
- Does foreign investment trigger approval?
- Does data or security law affect diligence?
- Will a strategic investor limit market access?

Model should answer with:

- sector regulator map
- funding implication
- compliance-risk priority
- go-to-market constraint
- investor diligence plan

Generic model failure:

- Gives generic fundraising advice without sector approval, data, or customer-procurement constraints

## ICP 12: Exit / IPO-Stage Founder Or MSME Promoter

Profile:

- Profitable or near-profitable
- Considering SME IPO, mainboard IPO, PE buyout, strategic sale, or succession liquidity

Likely questions:

- Should I do SME IPO or sell to a strategic buyer?
- Is PE buyout better than IPO?
- What valuation multiple is fair?
- How do I handle earnout and escrow?
- What governance cleanup is needed before IPO?
- Should founder take secondary?

Questions they should ask:

- Are related-party transactions clean?
- Is EBITDA quality defensible?
- Are GST/TDS/ROC filings clean?
- What warranties and indemnity exposure exist?
- What liquidity does founder actually receive after tax and lock-in?

Model should answer with:

- exit route comparison
- tax and transaction structure
- diligence readiness
- founder proceeds math
- decision rule

Generic model failure:

- Says IPO is prestigious without testing governance, size, liquidity, and readiness

## Question Types Every Topic Needs

For each major topic, create records across these question types:

1. Direct decision
   - Which option should I choose?

2. Math check
   - How much dilution/cost/tax/runway impact does this create?

3. Risk challenge
   - What is the biggest risk if I follow the opposite advice?

4. Advisor conflict
   - My CA/lawyer/investor/mentor said X. Is that right?

5. Timeline
   - What should I do in the next 7/30/90 days?

6. Negotiation
   - What should I push back on and what should I accept?

7. Eligibility
   - Do I qualify for this scheme/loan/tax benefit?

8. Documentation
   - What documents prove this?

9. Downside case
   - What if revenue falls, runway shrinks, valuation drops, or buyer delays?

10. Hidden better question
   - What am I not asking that I should ask before signing?

## Record Design Template

Before writing a JSONL record, fill this mentally:

- ICP:
- Stage:
- Sector:
- Decision:
- User's direct question:
- Better hidden question:
- Numbers:
- Indian law/scheme/platform:
- Wrong generic answer:
- Evaldam answer:
- Final decision rule:

## Training Behavior Target

The model should learn to:

1. Answer the user's direct question first.
2. Identify the missing decision variable.
3. Use Indian finance/legal context.
4. Do math in plain language.
5. Reject bad alternatives.
6. Give a practical next-steps plan.
7. Avoid pretending unstable live data is permanent information.
8. Say when current official verification is needed before action.
9. Distinguish founder advice, CFO advice, advisor memo, and investor memo styles.
10. Be commercially useful, not just legally cautious.
