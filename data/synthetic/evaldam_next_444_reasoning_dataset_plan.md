# Evaldam Manual Reasoning Dataset Plan - Next 444

## Current State

Canonical dataset file:

`data/synthetic/evaldam_training_manual_quality_what_how_why_400.jsonl`

Current verified count:

`444` valid JSONL records

Latest record:

- `scenario_id`: `M420`
- `sample_index`: `444`
- Topic: cofounder exit, vesting, cap table, investor confidence

Next starting point:

- Start next record at `scenario_id`: `M421`
- Start next `sample_index`: `445`
- Target next batch size: `444` records
- Target final count after next 444: `888`
- Target final scenario range after next 444: `M421` to `M864`
- Target final sample index range after next 444: `445` to `888`

## Non-Negotiable User Requirements

- Keep appending to the same single JSONL file.
- Do not create multiple JSONL output files.
- Do not generate random script-based data.
- Data should be manually/editorially written.
- Focus on reasoning-based scenario data, not narrow information dumps.
- Use Indian startup/MSME/finance context.
- Cover startup stages, financial events, operational events, founder decisions, funding choices, and business trade-offs.
- Each record must be one scenario with 3 connected user questions from the same scenario.
- Keep the `what / how / why` question style.
- Maintain commercial usefulness: answers should help real Indian founders make better decisions.

## Why Scenario-Based Reasoning Data Is Important

This dataset is for improving an 8B LoRA-tuned model on Indian startup and finance advice. The model should not mainly memorize isolated information. It needs to learn how to reason through founder situations.

Scenario-based records are important because:

- Real founders ask messy, context-heavy questions, not clean textbook prompts.
- The same financial concept changes depending on stage, runway, revenue quality, customer type, cap table, and founder constraints.
- Reasoning examples teach the model to identify the actual decision, not just answer the surface question.
- Multi-turn scenarios teach continuity: the model must remember the same founder situation across what/how/why follow-ups.
- Specific facts, rates, regulations, and scheme details can change. Reasoning patterns are more durable.
- Overly specific information-heavy samples can make the model brittle or stale if the fact later changes.
- Commercial quality depends on judgment: sequencing, trade-offs, risk diagnosis, capital matching, cash-flow discipline, and investor perception.
- Numbers should be included to force financial reasoning, but they should support the scenario rather than become the whole sample.
- The model should learn to say what to do first, what to avoid, what evidence matters, and why one option is better than another.

Good scenario records should feel like real startup events:

- fundraise delayed with 5 months runway
- cofounder leaving before seed
- CAC doubled after ad scaling
- large customer wants discount and 90-day payment terms
- revenue growing but cash falling
- one channel drives 75 percent of sales
- team morale hit after down round
- founder choosing between debt, equity, and internal cash
- expansion works in one city but may fail in another
- investor likes revenue but questions retention

The sample should train decision-making, not trivia recall.

## Record Structure

Each JSONL line should be one valid JSON object:

```json
{
  "scenario_id": "M421",
  "area": "short topic label",
  "difficulty": "medium-hard",
  "generator_model": "codex_manual",
  "generation_method": "manual_editorial",
  "batch": "manual_reasoning_extension_444_next",
  "sample_index": 445,
  "lenses": {
    "stage": "...",
    "sector": "...",
    "icp": "...",
    "question_pattern": "what-how-why"
  },
  "scenario": "Concrete founder/business situation with numbers and trade-offs.",
  "conversation": [
    {"role": "system", "content": "You are Evaldam AI, an expert in Indian startup and MSME finance."},
    {"role": "user", "content": "What ...?"},
    {"role": "assistant", "content": "<thinking>...</thinking>\n\n...\n\n**Why this works in Indian context:**\n...\n\n**How to execute:**\n1. ...\n\n**Bottom line:**\n..."},
    {"role": "user", "content": "How ...?"},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "Why ...?"},
    {"role": "assistant", "content": "..."}
  ]
}
```

## Assistant Answer Rules

Every assistant turn should include:

1. `<thinking>...</thinking>`
2. Direct recommendation
3. `**Why this works in Indian context:**`
4. `**How to execute:**`
5. `**Bottom line:**`

Reasoning should teach:

- trade-off evaluation
- sequencing
- risk diagnosis
- capital matching
- unit economics
- cash-flow thinking
- investor perception
- founder decision quality
- operational constraints

Avoid:

- overly specific live facts unless verified
- long regulation dumps
- generic advice like "consult a CA" as the main answer
- repeated scenarios with only wording changes
- pure information answers without decision reasoning

## Validation Commands

Line count:

```powershell
rg -c "^" data\synthetic\evaldam_training_manual_quality_what_how_why_400.jsonl
```

Tail ID check:

```powershell
rg -n -F M420 data\synthetic\evaldam_training_manual_quality_what_how_why_400.jsonl
```

Full JSONL structure validation:

```powershell
node -e "const fs=require('fs'); const p='data/synthetic/evaldam_training_manual_quality_what_how_why_400.jsonl'; const lines=fs.readFileSync(p,'utf8').trimEnd().split(/\r?\n/); for (let i=0;i<lines.length;i++){ try{ const o=JSON.parse(lines[i]); if(!o.scenario_id) throw new Error('missing scenario_id'); if(!Array.isArray(o.conversation)||o.conversation.length!==7) throw new Error('bad conversation length'); const roles=o.conversation.map(x=>x.role).join(','); if(roles!=='system,user,assistant,user,assistant,user,assistant') throw new Error('bad roles '+roles); }catch(e){ console.log('bad_line='+(i+1)); console.log(e.message); process.exit(1); } } console.log('valid_jsonl_records='+lines.length);"
```

## Next 444 Roadmap

Use 44-record blocks. Each block can be appended in smaller groups of 8-11 records for safety.

### Block 1 - Founder Lifecycle Events

Target: `M421-M464`

Examples:

- deciding to quit job
- first cofounder conflict
- first customer rejection pattern
- first paid pilot failure
- first investor rejection
- first employee resignation
- first legal notice
- first bad hire
- first refund wave
- first major product delay
- first public launch failure
- first strong customer pull
- founder role transition from maker to manager

### Block 2 - Funding Stage Reasoning

Target: `M465-M508`

Examples:

- angel round sizing
- SAFE-like expectations versus Indian structures
- CCPS versus equity reasoning at high level
- bridge versus priced round
- insider round
- party round risk
- lead investor selection
- strategic investor conflict
- pro-rata pressure
- liquidation preference trade-offs
- anti-dilution concern
- valuation step-up planning
- runway before Series A
- Series A metrics by model
- late seed extension

### Block 3 - Revenue Model And Unit Economics

Target: `M509-M552`

Examples:

- subscription versus transaction fee
- usage pricing
- commission model
- high gross revenue but low net revenue
- negative contribution margin
- CAC payback too long
- LTV uncertainty
- churn hidden by acquisition
- low ARPU with high support
- gross margin versus contribution margin
- cohort payback
- sales cycle economics
- renewals and expansion revenue

### Block 4 - Cash Flow And Working Capital Events

Target: `M553-M596`

Examples:

- delayed customer payments
- supplier advance pressure
- inventory pile-up
- COD failure
- marketplace settlement delay
- payroll risk
- GST/tax cash planning at high level
- prepaid revenue obligations
- receivables aging
- vendor credit negotiation
- capex versus opex
- debt service stress
- emergency cash triage

### Block 5 - GTM And Market Selection

Target: `M597-M640`

Examples:

- ICP confusion
- switching from SMB to enterprise
- switching from enterprise to SMB
- city expansion
- India versus global market
- channel partner not performing
- founder-led outbound
- inbound leads low quality
- paid ads become expensive
- community-led growth
- referral economics
- distributor versus direct sales
- marketplace versus owned channel

### Block 6 - Product And Operations Scaling

Target: `M641-M684`

Examples:

- technical debt before scale
- customer support overload
- onboarding bottleneck
- reliability incident
- feature bloat
- roadmap captured by one customer
- quality control in offline expansion
- internal tools versus customer product
- manual operations versus automation
- outsourcing versus internal build
- SLA promise risk
- implementation-heavy sales

### Block 7 - Team, ESOP, And Organization

Target: `M685-M728`

Examples:

- early ESOP grants
- salary versus equity
- senior hire timing
- sales incentive design
- performance firing
- founder delegation
- culture after layoffs
- remote team cost
- advisor equity
- consultant becoming employee
- fractional CFO decision
- hiring ahead of revenue

### Block 8 - Sectors Without Over-Specific Facts

Target: `M729-M772`

Use sector context only to shape reasoning, not to dump facts:

- SaaS
- fintech
- healthtech
- edtech
- D2C
- manufacturing
- logistics
- agritech
- climate
- AI tools
- creator economy
- marketplaces
- offline services
- exports
- space/deeptech
- professional services

### Block 9 - MSME And Traditional Business To Startup

Target: `M773-M816`

Examples:

- family business digitization
- MSME expansion loan versus equity
- machinery purchase payback
- distributor credit
- wholesale to D2C transition
- export order cash cycle
- franchise expansion
- professionalizing accounts
- founder succession
- working capital discipline
- informal to formal payroll
- customer concentration in traditional business

### Block 10 - Growth, Exit, And IPO-Readiness

Target: `M817-M864`

Examples:

- acquisition offer
- acquihire offer
- competitor acquisition
- founder secondary
- employee liquidity
- governance cleanup
- audit readiness
- public-market quality metrics
- profitability versus growth
- late-stage down round
- investor rights cleanup
- board independence
- related-party transaction concerns
- exit timing

## Style Calibration

The next records should feel like a founder is asking during a real event:

- "We have 4 months runway and the round is delayed. What do I do?"
- "Our largest customer wants exclusivity. How should I think?"
- "Our CAC doubled after scaling. What should I diagnose first?"
- "A senior hire wants high salary and ESOP. How do I decide?"
- "Revenue is growing but cash is falling. Why?"

Prefer scenarios with:

- one clear business situation
- 2-4 concrete numbers
- one or two real trade-offs
- practical decision framework
- Indian business reality
- no excessive legal or regulatory specificity unless essential

## Next Start Prompt For Tomorrow

Continue appending to:

`data/synthetic/evaldam_training_manual_quality_what_how_why_400.jsonl`

Start with:

- `scenario_id`: `M421`
- `sample_index`: `445`
- `batch`: `manual_reasoning_extension_444_next`

First recommended mini-batch:

- `M421-M431`
- Founder lifecycle event scenarios
- Validate count should become `455`
