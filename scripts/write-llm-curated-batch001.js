const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "synthetic",
  "evaldam_training_llm_generated_curated.jsonl",
);

const base = {
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
};

const system = {
  role: "system",
  content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
};

const records = {
  S007: {
    ...base,
    scenario_id: "S007",
    area: "Term Sheet Comparison & Negotiation",
    difficulty: "hard",
    sample_index: 7,
    lenses: {
      profile: "logistics SaaS founder comparing clean prestige capital with dirty higher headline terms",
      angle: "liquidation preference, anti-dilution, and Series A fundability",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What term sheet should I choose if TS2 has more money and a higher valuation?",
      },
      {
        role: "assistant",
        content: `<thinking>
Karan has INR 12L MRR, about INR 1.44Cr ARR, and 11 percent month-on-month growth. TS1 gives INR 5Cr at INR 28Cr post-money, so dilution is 17.9 percent. TS2 gives INR 6Cr at INR 32Cr post-money, so dilution is 18.75 percent. The extra INR 1Cr does not reduce dilution; it slightly increases it, although the post-money headline is higher. The real issue is terms. TS1 has 1x non-participating liquidation, broad-based weighted-average anti-dilution, one board seat, and standard pro-rata. TS2 has 1.5x participating liquidation capped at 3x, full ratchet for 18 months, observer rights, and super pro-rata up to 2x.

Need compare exit outcomes and future financing. Participating preference can take proceeds before founders and then participate again. Full ratchet can punish founders and employees if a down round happens. Super pro-rata can scare future leads. Self-check: is Tier-1 brand alone driving recommendation? No. Even without brand, TS1 is cleaner. Recommendation: choose TS1 unless TS2 removes participating preference, full ratchet, and super pro-rata.
</thinking>

Choose TS1. TS2's higher cheque does not compensate for participating liquidation, full-ratchet anti-dilution, and super pro-rata rights that can damage founder economics and the next round.

**Why this works in Indian context:**
Indian SaaS seed and early Series A investors usually accept 1x non-participating liquidation preference and broad-based weighted-average anti-dilution as the clean market standard. TS1 is inside that zone. TS2 imports aggressive downside protection: a 1.5x participating preference capped at 3x can materially reduce founder payout in modest exits, while full ratchet can reprice the cap table harshly if the next round is flat or down. These rights will sit in the shareholders agreement and Articles under the Companies Act 2013, so they are not cosmetic terms. For a logistics SaaS company, future investors will also care about clean customer metrics, not cleaning up old investor rights. A bad seed term can therefore create both economic loss and process delay during the next institutional round.

**How to execute:**
1. Put the headline math in one line: TS1 is INR 5Cr for 17.9 percent; TS2 is INR 6Cr for 18.75 percent, so TS2 is not lower dilution.
2. Ask TS2 for 3 changes within 48 hours: convert liquidation to 1x non-participating, replace full ratchet with broad-based weighted average, and remove 2x super pro-rata.
3. Keep the observer issue negotiable only after economics are cleaned; governance is secondary to liquidation and anti-dilution here.
4. Ask TS1 for one improvement: reduce the pre-money ESOP pool impact or confirm no hidden founder vesting reset before closing.
5. Build a payout model at INR 40Cr, INR 75Cr, and INR 150Cr exit values; show how TS2's participating preference shifts money away from common shareholders.
6. Model a flat Series A in 18 months; full ratchet in TS2 should show an immediate founder and ESOP hit, making the risk visible to the team.
7. Speak to 3 portfolio founders from each fund this week and ask about follow-on support, response during bad months, and behaviour in bridge rounds.
8. If TS2 refuses the 3 economic fixes, sign TS1 within 14 days and use the cleaner cap table as a strength in the next raise.
9. Ask counsel to redline economic clauses before governance clauses; one extra observer seat is manageable, but participating preference and full ratchet can change payout math for years.

**Bottom line:**
TS1 is the better financing even with INR 1Cr less capital. TS2 becomes competitive only if it becomes a clean term sheet; without those fixes, the higher valuation is a trap wearing a larger cheque. Your goal is to raise money that future investors can underwrite quickly, not money that needs to be renegotiated later.`,
      },
      {
        role: "user",
        content: "How do I negotiate TS2 without losing leverage with TS1?",
      },
      {
        role: "assistant",
        content: `<thinking>
Karan has two live term sheets, which is leverage, but the leverage decays if he appears indecisive. He should not use TS1 as a crude threat. He needs a principled terms memo: TS2's economics are not market for an Indian logistics SaaS at INR 12L MRR. He should separate non-negotiables from negotiables. Non-negotiables: no participating preference, no full ratchet, no super pro-rata that blocks future leads. Negotiables: observer seat, information rights, limited pro-rata, ESOP sizing, closing timeline. Need protect TS1 relationship by keeping them warm and not over-shopping.

Need include timelines. Both refuse headline movement, so focus on structure. Ask TS2 for clean terms by a fixed deadline, maybe 72 hours. Meanwhile request confirmatory diligence checklist from TS1 to move toward closing. Self-check: could TS2's US India arm bring better later-stage access? Yes, but only if rights are normalized. It is acceptable to say TS2 wins if they match clean standards because INR 6Cr is useful, but do not accept dirty terms for network value.
</thinking>

Give TS2 one structured counter and a short deadline. Keep TS1 moving toward diligence so you are not left with only the aggressive offer.

**Why this works in Indian context:**
Indian VC negotiations reward clear issue framing. If you say "valuation is fine but downside rights are not market," you sound disciplined rather than difficult. A logistics SaaS company with INR 12L MRR and 11 percent monthly growth is credible enough to reject full ratchet and participating preference. Future Indian Series A leads will review the SHA, AoA, board rights, and pro-rata clauses carefully under the Companies Act 2013 framework; a messy early investor can become a financing blocker even if the company performs. The strongest founders do not argue every clause emotionally. They identify the terms that change economics, explain the future-round consequence, and offer a clean path to yes.

**How to execute:**
1. Send TS2 a 1-page mark-up within 24 hours with 3 required changes: 1x non-participating preference, broad-based weighted-average anti-dilution, and standard pro-rata only.
2. Offer 2 concessions in return: accept the INR 32Cr post-money headline and allow one board seat plus one observer for 12 months, subject to confidentiality.
3. Put a deadline: "We can proceed if clean documents are agreed by Friday 6 pm, otherwise we will move with the other term sheet."
4. Ask TS1 for its diligence checklist, draft SHA, and closing timeline immediately; this makes TS1 operationally real, not just a fallback.
5. Avoid disclosing the other investor's name unless already known; say you have a clean competing term sheet and are deciding on terms, not playing auction theatre.
6. If TS2 proposes a compromise like 1x participating or narrow full ratchet, reject it; both still create bad precedent and poor future-round optics.
7. Use your metrics as leverage: INR 1.44Cr ARR, 11 percent monthly growth, and enterprise SaaS retention should justify standard terms.
8. Decide within 7 days; every week of drift costs customer focus and increases the chance that one investor gets cold.
9. Keep TS1 updated with a factual note every 3-4 days: diligence items ready, customer references available, and no attempt to renegotiate headline unless needed.
10. If TS2 cleans the economics, compare closing certainty, fund reputation, partner involvement, and follow-on capacity; only then should the extra INR 1Cr matter.

**Bottom line:**
Negotiate TS2 firmly, but keep the door open only for a clean version. Your leverage is not that TS1 is famous; your leverage is that TS1 proves market-standard capital is available right now. A calm deadline beats a dramatic auction because it lets both funds know you understand the cost of time.`,
      },
      {
        role: "user",
        content: "Why is full ratchet so dangerous if it only lasts 18 months?",
      },
      {
        role: "assistant",
        content: `<thinking>
Full ratchet matters most during exactly the risky period it covers: the next 18 months before the company proves Series A metrics. If Karan raises at a lower price, full ratchet reprices TS2's conversion as if all shares were issued at the new lower price, regardless of how small the down-round issuance is. Broad-based weighted average considers the size and price of the new round, so it is more proportionate. For a startup at INR 12L MRR, the next 18 months could include macro slowdown, enterprise sales delays, or a bridge round. That is when full ratchet bites.

Need answer why it affects everyone. It dilutes founders, ESOP holders, and sometimes earlier investors, creating internal friction. It can also deter new investors who do not want their money used to clean old terms. Self-check: if no down round occurs, does it matter? It still matters because future investors price legal risk and negotiation complexity. Recommendation: reject full ratchet completely, not shorten it.
</thinking>

Full ratchet is dangerous because it protects the investor from price risk by transferring that risk to founders, employees, and future financing. The 18-month limit is not comforting; that is the exact window when your next round risk is highest.

**Why this works in Indian context:**
Indian SaaS companies often raise the next institutional round 12-24 months after seed, so an 18-month full-ratchet period covers the most sensitive fundraising window. If growth slips from 11 percent monthly to 4-5 percent, or if the market reprices logistics SaaS multiples, a flat or down bridge can happen even in a good company. Broad-based weighted-average anti-dilution is accepted because it balances investor protection with cap-table fairness. Full ratchet is viewed as investor-aggressive and can become a red flag during Companies Act 2013 diligence and SHA review. It also affects hiring because ESOP value becomes harder to explain when employees see investor protection absorbing downside before common shareholders recover.

**How to execute:**
1. Ask TS2 to replace full ratchet with broad-based weighted-average anti-dilution; do not negotiate merely from 18 months to 12 months.
2. Build a numerical example: if a INR 5Cr bridge happens at INR 20Cr post-money, show founder ownership under full ratchet versus weighted average.
3. Include ESOP impact in the model; employees should see whether their 8-12 percent pool gets diluted by investor protection.
4. Ask future-friendly wording: anti-dilution should exclude ESOP grants, strategic issuances, stock splits, acquisitions, and small permitted issuances.
5. Confirm that any anti-dilution adjustment requires board notice and cap-table update, not automatic hidden conversion math.
6. Reject any clause that lets TS2 keep full-ratchet protection and also take super pro-rata in the next round; that combination is especially hostile to a new lead.
7. If TS2 says the clause is standard in the US, respond that Indian seed and Series A market standard is broad-based weighted average for venture-backed startups.
8. Use this as a character test: an investor willing to punish the team for a small bridge round may not be the right partner for a logistics SaaS execution cycle.
9. Ask for the anti-dilution example to be attached as a schedule to the SHA; if the investor resists showing math, that is itself a warning sign.

**Bottom line:**
Full ratchet is not a small legal detail; it is a future dilution weapon. If TS2 will not remove it, the clean TS1 term sheet is the rational choice even with lower capital. A startup with real MRR should not sell away future flexibility to solve a problem that INR 1Cr extra capital does not truly solve for runway planning today, materially enough.`,
      },
    ],
  },
  S008: {
    ...base,
    scenario_id: "S008",
    area: "Grant Rejection Analysis & Improvement",
    difficulty: "medium",
    sample_index: 8,
    lenses: {
      profile: "edtech founder trying to convert a SISFS rejection into a stronger reapplication",
      angle: "application narrative, unit economics, and incubator fit",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What should I fix before reapplying to SISFS after this rejection?",
      },
      {
        role: "assistant",
        content: `<thinking>
Anita has rural Hindi-medium edtech, 9 months old, 5 people, INR 80K MRR from 12 schools. SISFS rejection feedback says scalability and unit economics lack clarity. That is specific enough to diagnose. She should not pivot the whole business because there is some revenue. The weakness is likely that the application sounded mission-driven but not commercially scalable. SISFS committees need to see how grant money converts proof-of-concept or market entry into a repeatable model. For schools, unit economics must include acquisition cost, onboarding time, teacher training, content cost, collections cycle, churn, and gross margin.

Need recommend fix versus different incubator. Applying to a different incubator without fixing the story repeats the same failure. But incubator fit matters: edtech, rural access, language, and education outcomes. Self-check: is "narrative" enough? No, the mentor is partly right but not fully. The narrative must be backed by numbers and evidence, especially because Indian edtech has credibility pressure after many growth-at-any-cost stories. Recommendation: rebuild application for 8-10 weeks, gather school-level proof, then reapply through a better-fit incubator if the first one is not sector aligned.
</thinking>

Do not pivot the company. Fix the SISFS application around a sharper scalability model, school-level unit economics, and measurable learning outcomes before reapplying.

**Why this works in Indian context:**
SISFS is not a generic grant for good intentions; it funds DPIIT-recognised startups through incubators for proof-of-concept, prototype validation, market entry, commercialization, and scaling. A rural Hindi-medium edtech startup can be compelling, but committees need to see how INR 20L or INR 50L converts into repeatable adoption, not only social impact. Your INR 80K MRR from 12 schools is useful evidence, but it must be translated into per-school economics and expansion logic. Incubator fit also matters because an education-focused incubator will understand school sales cycles better than a generic technology incubator. The reapplication should feel like a business becoming more measurable, not a founder asking for a second chance with the same material. That shift is what changes reviewer confidence.

**How to execute:**
1. Rebuild the application around 5 numbers: average revenue per school, gross margin, onboarding cost, monthly active students, and renewal probability.
2. Convert 12 schools into a cohort table: start date, students served, monthly fee, payment delay, usage rate, teacher adoption, and expected renewal date.
3. Write the scalability section as a repeatable playbook: district selection, principal outreach, demo, pilot, teacher training, parent communication, and renewal.
4. Add learning evidence: baseline score, 30-day improvement, attendance or practice completion, and subject-level progress for at least 300 students.
5. Use the SISFS budget for specific milestones: INR 6L content localization, INR 5L field sales pilots, INR 4L assessment tooling, INR 3L teacher onboarding, and INR 2L monitoring.
6. Get 3 school letters before reapplication; at least 1 should say they will renew or expand if results continue.
7. If the first incubator has no edtech or rural distribution strength, reapply through an incubator with education, social impact, or Bharat-market portfolio experience.
8. Wait 8-10 weeks before resubmitting so the application has new evidence, not the same deck with cleaner wording.
9. Add a risk section yourself: payment delays, teacher adoption, content quality, and district-level sales friction; then show the mitigation and budget attached to each risk.
10. Ask one independent education operator to review the application before submission and mark every claim that sounds like mission language rather than evidence.

**Bottom line:**
The rejection is fixable. Treat it as a diligence memo: prove school-level economics, show learning outcomes, and apply through an incubator that can understand rural edtech rather than forcing a generic startup story. A stronger application should make the reviewer see exactly what changes after the first INR 20L, not merely why the problem matters.`,
      },
      {
        role: "user",
        content: "How do I show unit economics when schools pay slowly and pilots are small?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need solve early unit economics without mature data. For 12 schools and INR 80K MRR, average MRR per school is about INR 6.7K. Need estimate gross margin, sales effort, onboarding cost, content support, and collections. Slow payments are common in Indian school sales, especially smaller schools. She should not hide this; she should model cash collection separately from contracted revenue. SISFS reviewers will appreciate honesty if the plan includes reducing payback through clusters and standardized onboarding.

Need include metrics. Unit economics can be shown as current, target, and grant-enabled. Current CAC may be high because founder-led sales; target CAC lower through district clusters and referrals. Need also show impact economics: cost per student served. Self-check: should she use annual contracts? Yes, if schools can pay quarterly, but collections reality should be reflected. The model should not pretend rural school collections behave like SaaS credit-card billing. Recommendation: build a 3-layer model: school P&L, cash cycle, and learning outcome per rupee.
</thinking>

Show unit economics as a simple school-level operating model, not a mature SaaS dashboard. Separate contracted revenue from cash collection so the committee sees that you understand Indian school payment behaviour.

**Why this works in Indian context:**
Indian K-12 school sales often involve long decision cycles, principal trust, budget timing, and delayed payments. SISFS reviewers do not expect a 9-month startup to have perfect metrics, but they expect the founder to understand the economics of expansion. A rural Hindi-medium model also needs proof that low pricing can still support content, onboarding, and service quality. If you show both commercial and learning outcomes, the application becomes more credible than a pure social-impact pitch. This is also how you avoid the common edtech rejection: impressive mission, unclear buyer, weak collections, and no proof that teachers will use the product after the demo.

**How to execute:**
1. Start with current ARPS: INR 80K MRR across 12 schools equals about INR 6.7K MRR per school; show this plainly.
2. Build a school contribution table: monthly fee, content cost, support cost, teacher training cost, field visit cost, payment delay, and gross margin.
3. Show CAC in founder-hours and rupees: number of visits, demos, calls, and travel cost required to convert 1 school.
4. Add a cash-cycle line: invoice date, expected payment date, actual collection date, and overdue amount for every school.
5. Create a target model for 50 schools: cluster selling in 3 districts, one field executive per district, standardized teacher onboarding, and quarterly payment collection.
6. Show payback period under 3 cases: current pilot economics, grant-supported district cluster, and steady-state without grant subsidy.
7. Add a cost-per-student metric: if 12 schools cover 2,400 students, show monthly revenue, content cost, and learning improvement per student.
8. Include 2 bad-case assumptions: 20 percent school churn and 60-day payment delay, then show how much working capital SISFS support protects.
9. Convert the numbers into one visual in the application: current, target after 6 months, target after 12 months.
10. Add a renewal experiment before reapplication: ask 5 schools to sign renewal letters or pay for the next term in advance, even if the amount is small.
11. Show how grant money reduces payback period from, for example, 9 months to 5 months through standardized onboarding and cluster sales.

**Bottom line:**
Small pilots can still produce strong unit economics if the model is honest. The committee does not need perfection; it needs proof that you know what must improve and exactly how grant money changes the curve. If the numbers are simple enough for a reviewer to repeat aloud, your application becomes much stronger and easier to defend.`,
      },
      {
        role: "user",
        content: "Why not just apply to a different incubator with the same business plan?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain incubator switching versus application quality. A different incubator can help if the first was a poor sector fit, but the rejection reason points to real gaps: scalability and unit economics. If Anita applies with same plan, new incubator may reject for same reason. SISFS is implemented through incubators, but committees still evaluate business clarity, milestone plan, and fund use. Need recommend selecting a better incubator after fixing dossier.

Need address timing. Reapply after 4 months? She can use that window well. Use 8 weeks for evidence, 2 weeks for application rewrite, 2 weeks for incubator selection and warm introductions. Self-check: could narrative alone change outcome? Maybe if first application was badly written, but numbers are still required, and switching incubators without new evidence can look like shopping for approval. Need produce process for incubator selection: edtech portfolio, rural reach, grant track record, mentor access, speed, conflict. Recommendation: fix plan first, then choose incubator strategically.
</thinking>

A different incubator may help, but only after you fix the substance. Reapplying with the same business plan is likely to reproduce the same rejection in a new queue.

**Why this works in Indian context:**
SISFS is routed through approved incubators, so incubator selection matters, but the scheme still expects a fundable startup case. "Scalability and unit economics" is not a random rejection phrase; it means reviewers could not see how 12 schools and INR 80K MRR become a larger, financially sustainable model. Indian edtech has also faced credibility pressure after overpromising outcomes, so committees are more careful about learning proof and revenue quality. A better incubator can improve interpretation, but it cannot compensate for missing numbers. If you approach a stronger incubator with the same weak model, you may lose a better relationship that could have helped after the business case matured.

**How to execute:**
1. Use the next 30 days to fix the application before approaching any new incubator; do not send the old plan again.
2. Shortlist 6 incubators and score them on edtech portfolio, rural distribution experience, SISFS disbursement history, mentor quality, and committee speed.
3. Ask each incubator 3 questions: how many SISFS applications they supported last year, what rejection reasons they see most, and whether rural school sales fits their thesis.
4. Prepare a revised 2-page concept note before warm outreach; include INR 80K MRR, 12 schools, target 50 schools, student outcomes, and budget use.
5. Get one warm introduction through a school network, education NGO, DPIIT mentor, or founder already supported by that incubator.
6. If the old incubator gives detailed feedback, keep the relationship open; a reapplication to the same incubator can work if you show measurable changes.
7. Avoid incubators that promise approval for fees, guaranteed selection, or generic pitch polishing; that creates compliance and quality risk.
8. Submit only when the reapplication has at least 3 new proof points: better unit economics, renewal evidence, and learning outcome data.
9. Choose the incubator that can help after approval too: school introductions, assessment design, government-school navigation, and impact measurement are more valuable than a quick upload.
10. Keep a comparison sheet with decision date, sector fit, mentor access, grant experience, and expected diligence depth so the choice is not based on hearsay.

**Bottom line:**
Incubator switching is a distribution tactic, not a cure. Fix the business case first, then choose the incubator most likely to understand rural Hindi-medium edtech and defend your application in committee. The right incubator should amplify a strong application, not be used to hide a weak one. Use the 4-month gap to become materially better, not merely better packaged again.`,
      },
    ],
  },
  S009: {
    ...base,
    scenario_id: "S009",
    area: "Indian Tax Benefits for Startups & MSMEs",
    difficulty: "medium",
    sample_index: 9,
    lenses: {
      profile: "deeptech founder confused by startup tax benefits after raising a VC round",
      angle: "80-IAC eligibility, angel-tax abolition, and compliance sequencing",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What tax benefits can I actually claim, and is angel tax still a real risk?",
      },
      {
        role: "assistant",
        content: `<thinking>
Suresh has DPIIT recognition, 8 months ago, INR 1.1Cr revenue last FY, INR 22L net profit, and raised INR 4Cr from an Indian VC at INR 25Cr post-money. Need answer Section 80-IAC and Section 56(2)(viib). DPIIT recognition alone is not enough for 80-IAC; he needs IMB approval. If approved, 100 percent profit deduction for any 3 consecutive years out of first 10 years from incorporation, but MAT at 15 percent can still apply. Need mention incorporation age cutoff maybe extended to 31 March 2030 per source facts. Angel tax under Section 56(2)(viib) was abolished by Finance (No. 2) Act 2024 from AY 2025-26, so new FY 2024-25 issuances should not face old angel-tax premium issue. But valuation support and share allotment compliance still matter.

Self-check: Can he claim 80-IAC on FY profit immediately? Only if IMB approval and chosen year. He may not want to waste holiday on INR 22L profit if larger profits expected. Recommendation: angel-tax panic low, 80-IAC strategy high.
</thinking>

Angel-tax risk on the VC premium is not the main issue if the shares were issued after the abolition window. Your real opportunity is to secure IMB approval for Section 80-IAC and choose the 3 profit years carefully.

**Why this works in Indian context:**
Section 56(2)(viib), the old angel-tax provision taxing share premium above fair market value, was abolished for relevant new issuances from FY 2024-25 onward, so your recent INR 4Cr VC round should not be treated like the older angel-tax regime. That does not remove the need for valuation support, board approvals, PAS-3 filings, and clean share-allotment records under the Companies Act 2013. Section 80-IAC is different: DPIIT recognition is only the first gate, while IMB approval is needed before claiming the profit deduction. The tax holiday can be valuable, but using it too early on INR 22L profit may waste a larger future benefit. Your deeptech profile helps the innovation narrative, but tax benefit claims still need documentation, timing discipline, and audit-ready board records.

**How to execute:**
1. First, confirm the exact share allotment date of the INR 4Cr VC round; if it is in FY 2024-25 or later, old Section 56(2)(viib) angel-tax exposure should not drive the decision.
2. Keep the valuation report, term sheet, board minutes, shareholder approval, bank inward proof, and PAS-3 filing in one funding-compliance folder.
3. Apply for IMB approval for Section 80-IAC if not already done; DPIIT recognition alone is not enough to claim the deduction.
4. Do not automatically select the current INR 22L profit year for the holiday; model profits for the next 5 years and choose the best 3 consecutive years.
5. Remember that 80-IAC is a profit deduction, not a cash grant; if the company is loss-making in a selected year, the benefit is wasted.
6. Check MAT impact in the model because the tax holiday does not always mean zero cash tax in practice.
7. If R&D expenditure is material, separately map whether any deduction, capitalization, or grant accounting treatment applies; do not mix that with angel-tax logic.
8. Create a board note within 30 days documenting tax positions, expected claim year, and compliance owner so diligence is clean for the next round.
9. Keep a separate note for the VC round explaining why the share premium was commercially negotiated, even if 56(2)(viib) no longer drives the tax exposure.
10. Review the next return filing before submission so the 80-IAC position, MAT computation, and funding disclosures are internally consistent.

**Bottom line:**
The CA's angel-tax concern is likely outdated for a fresh post-abolition VC issuance, but the paperwork discipline is still real. Focus energy on IMB approval and timing the 80-IAC claim for bigger profit years, not on fighting a dead version of angel tax. The best tax strategy here is not panic avoidance; it is sequencing the benefit when profits become large enough to matter.`,
      },
      {
        role: "user",
        content: "How should I decide the best three years for 80-IAC?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain 80-IAC timing. Suresh has INR 22L profit now. The deduction is for 3 consecutive financial years out of first 10 years, subject to eligibility and IMB approval. Deeptech computer vision for manufacturing QC may see profits rise after enterprise adoption. If he claims now on INR 22L, the tax saving may be relatively small. Need model expected profit trajectory: maybe INR 22L, INR 60L, INR 1.5Cr, INR 3Cr. Choose 3-year block with highest taxable profits after losses and deductions, while considering MAT and investor timeline.

Need mention losses, carry-forward, funding. If there are carried-forward losses, taxable profit may be reduced anyway. 80-IAC should be used when taxable profits are meaningful. Self-check: should he delay too long? Do not delay beyond certainty; eligibility window and profit forecasts can fail. Best is to get approval now, decide claim year annually based on audited projections. Recommendation: get IMB now, likely defer claim until profits scale beyond INR 75L-1Cr unless current profits are exceptional.
</thinking>

Get IMB approval now, but probably do not use the 80-IAC window on the current INR 22L profit year unless forecasts show profits will stay modest.

**Why this works in Indian context:**
Section 80-IAC gives a 100 percent deduction on eligible profits for any 3 consecutive years out of the first 10 years from incorporation, but the value depends on which years actually have taxable profit. DPIIT recognition does not itself unlock the claim; IMB approval is the important gate. Deeptech startups often move from small early profits to much larger profits once enterprise deployments scale, so premature selection can waste the holiday. MAT and carried-forward losses must also be checked because they can reduce the cash benefit in a selected year. For a manufacturing-QC computer-vision company, enterprise contracts may create a step-change in profit after deployments stabilize, so the highest-value window may be later than the first profitable year.

**How to execute:**
1. Build a 10-year incorporation timeline and mark the last year by which the 3-year block must begin.
2. Prepare a profit forecast with 4 cases: conservative, base, high-growth, and delayed-enterprise-sales.
3. Compare tax saving if you choose current year plus next 2 years versus waiting until profits cross INR 75L or INR 1Cr annually.
4. Adjust for carried-forward losses, depreciation, R&D capitalization, and any grant income treatment before estimating eligible profit.
5. Include MAT in the cash-tax model; even during a holiday period, cash tax planning should not assume zero without computation.
6. Ask the board to approve a tax-holiday strategy note after IMB approval, but leave final year selection tied to audited numbers.
7. Revisit the decision 60 days before each financial year-end; do not decide casually after the return filing deadline is close.
8. Preserve all innovation evidence: product architecture, patents if any, customer deployment proof, technical team profile, and how the computer-vision product is not routine services.
9. If FY profit is only INR 22L, treat that as a signal to wait unless future profit visibility is weak or eligibility timing forces action.
10. Run the model with and without the INR 4Cr VC funding plan, because hiring and cloud spend may suppress profits in the near term but increase eligible profit later.
11. Document the chosen 3-year block in board minutes once selected, including why earlier years were not chosen and what audited numbers support the decision.

**Bottom line:**
The highest-value move is approval early, claim later. Use 80-IAC when taxable profits are large enough for the deduction to matter, not just because this is the first year the company is profitable. A small current tax saving should not crowd out a much larger benefit when product revenue scales.`,
      },
      {
        role: "user",
        content: "Why do we still need valuation reports if angel tax was abolished?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need distinguish angel tax from corporate compliance and diligence. Section 56(2)(viib) abolition reduces tax risk on share premium, but issuance of shares still requires valuation discipline under Companies Act, FEMA if foreign investors, accounting records, and investor diligence. His investor is Indian VC, so FEMA may not apply unless foreign source. Still, valuation report supports pricing, board judgment, and future diligence. Also Section 56(2)(x) can matter for transfers or receipt of property at inadequate consideration in some cases, not the same as primary share issue angel tax.

Need caution not to overdo. He doesn't need panic-level defensive paperwork, but he does need a clean funding file. Self-check: Is a merchant banker valuation mandatory for every case? Depends on instrument and legal route; avoid banned phrase. Say choose valuation support suitable to issuance route and investor type. Recommendation: keep valuation report for governance and next-round diligence, not because old angel tax survives.
</thinking>

Because angel-tax abolition removes one tax exposure, not the need to prove that the round was properly priced, approved, allotted, and recorded.

**Why this works in Indian context:**
Section 56(2)(viib) was the scary angel-tax provision, but a private company share issuance still sits inside Companies Act 2013 governance. Board minutes, shareholder approval where required, valuation support, PAS-3 return of allotment, updated register of members, and cap-table records all matter during the next VC diligence. If a foreign investor later enters, FEMA pricing and reporting discipline also become relevant. A valuation report is therefore less about defending old angel tax and more about showing that the company issued securities through a clean, reasoned process. It also protects management judgment: a future diligence team can see that the board accepted INR 25Cr post-money based on actual traction and not arbitrary premium.

**How to execute:**
1. Keep the round file even if angel tax is not applicable: term sheet, SHA, SSA, valuation support, board resolutions, shareholder approvals, bank proof, and PAS-3.
2. Match the valuation method to the company's stage: deeptech traction, comparable transactions, revenue potential, and strategic value are more defensible than a fragile DCF alone.
3. Record why INR 25Cr post-money was commercially reasonable: INR 1.1Cr revenue, INR 22L profit, manufacturing QC market, computer-vision IP, and enterprise customer pipeline.
4. Update the statutory registers within the required timeline; a clean register of members prevents avoidable diligence questions later.
5. Store the DPIIT certificate, IMB application status, and tax-benefit strategy with the funding file so investors can see the full compliance picture.
6. If any shares are transferred between founders, advisors, or employees, separately check Section 56(2)(x) implications because that is not the same as the abolished angel-tax provision.
7. Have finance prepare a one-page memo saying why Section 56(2)(viib) is not applicable to the round, with dates and legal basis.
8. Review the file before the next fundraise, not after a diligence request; missing allotment paperwork can slow a Series A by 30-45 days.
9. Keep cap-table math reconciled across the SHA, statutory registers, accounting ledger, and investor reporting deck; mismatch across these 4 sources is a common diligence irritant.
10. Store tax memos with version dates, because future rules and interpretations can shift while your historical compliance position remains tied to the allotment date.

**Bottom line:**
Do not keep valuation reports because you are afraid of obsolete angel tax. Keep them because clean issuance records, pricing rationale, and statutory filings are what prevent future diligence from reopening a solved issue. The practical standard is simple: a new investor should be able to verify the round in 30 minutes, not chase documents for 30 days later again unnecessarily.`,
      },
    ],
  },
  S010: {
    ...base,
    scenario_id: "S010",
    area: "Stage-Specific Valuation Logic",
    difficulty: "medium",
    sample_index: 10,
    lenses: {
      profile: "fintech founder confused by valuation spread across different VC methods",
      angle: "sector-fit valuation method and investor narrative discipline",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What valuation method actually applies to my fintech co-lending startup at Series A?",
      },
      {
        role: "assistant",
        content: `<thinking>
Vivek has a 3-year fintech NBFC-lite co-lending partner: INR 8Cr disbursed, INR 90L revenue, 28 percent gross margin, INR 12L net profit. Valuations range INR 60Cr to INR 180Cr. Need explain why spread exists. Revenue multiple alone may understate embedded loan-volume potential but overstate if margins are thin. Loan book multiple may be wrong if he does not own the book or credit risk. DCF is only useful as a sanity check because early fintech cash flows and regulatory costs can shift. Strategic premium can exist if data, lender partnerships, or distribution is scarce, but cannot be the base case.

Need recommend hybrid. For Series A, use revenue/gross-profit multiple plus disbursement quality, take-rate, default exposure, lender concentration, compliance strength, and scalability. If INR 90L revenue with 28 percent gross margin, gross profit is INR 25.2L, so INR 180Cr is hard to defend unless growth and strategic value are exceptional. Self-check: Should profit matter more? Some, but Series A still prices growth. The model should also separate regulated lender value from platform value, because RBI-facing compliance and balance-sheet ownership change economics. Recommendation: anchor INR 75-110Cr, stretch higher only with strong cohort and lender proof.
</thinking>

Use a hybrid Series A method: revenue and gross-profit multiple as the base, adjusted for disbursement quality, lender partnerships, regulatory risk, and repeatable growth. Do not use pure loan-book multiple unless you actually own credit exposure.

**Why this works in Indian context:**
Indian fintech valuation depends heavily on where risk sits. If you are a co-lending partner or NBFC-lite platform and the regulated lender owns most credit exposure, a loan-book multiple can exaggerate your value. If you own borrower acquisition, underwriting data, collections workflow, and lender integrations, revenue multiple alone can understate strategic value. RBI-linked compliance, digital lending discipline, data handling, and partner concentration also matter. At INR 90L revenue and INR 12L profit, a INR 60Cr valuation may be conservative, while INR 180Cr needs exceptional evidence. Investors will also ask whether revenue is regulated-finance infrastructure revenue or temporary implementation income. Your valuation method must make that distinction visible.

**How to execute:**
1. Break revenue into components: platform fees, processing fees, servicing income, collection fees, float income, and any one-time integration revenue.
2. Show INR 8Cr disbursed by cohort: lender, borrower segment, ticket size, default rate, repeat usage, and contribution margin.
3. Use ARR or forward revenue multiple only after normalizing one-time income; investors should see recurring revenue, not inflated transaction spikes.
4. Calculate gross profit: INR 90L revenue at 28 percent gross margin gives about INR 25.2L gross profit; explain how this improves to 45-55 percent at scale.
5. Reject pure DCF as the headline method; keep it as a downside sanity check for cash burn, compliance cost, and operating leverage.
6. Reject pure loan-book multiple unless the company owns the loan book, credit risk, and regulatory capital requirements.
7. Prepare a valuation range: INR 75-110Cr defensible base, INR 120-150Cr stretch if lender concentration is low and growth is strong, INR 180Cr only with strategic competition.
8. Build the Series A use-of-funds plan around 18 months: compliance, lender integrations, risk analytics, enterprise partnerships, and controlled borrower acquisition.
9. Show 3 lender-concentration cases: top lender above 60 percent, top lender below 40 percent, and 5-lender diversified model; valuation should rise as concentration risk falls.
10. Prepare a regulatory-risk memo so investors see you understand RBI expectations, data flows, customer consent, grievance handling, and lender-of-record responsibilities.

**Bottom line:**
Your valuation should be built around what you actually control: revenue quality, underwriting data, partner network, and scalable margin. The right answer is not one method; it is a sector-fit hybrid that prevents investors from cherry-picking the lowest or highest number. A credible Series A story should make INR 90-120Cr feel reasoned, not arbitrary.`,
      },
      {
        role: "user",
        content: "How should I answer VCs who each use different valuation logic?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need give communication strategy. Different VCs use methods aligned with their risk view. One sees software revenue, one sees lending volume, one wants DCF discipline, one sees strategic premium. Vivek should not fight every method separately. He should create a valuation bridge that reconciles methods and explains which ones are applicable. Need include numbers and a decision framework: revenue base, disbursement multiplier, risk discount, strategic premium.

Need make him credible, not defensive. With INR 12L net profit, he can show discipline. With only INR 8Cr disbursed and INR 90L revenue, he should avoid overclaiming. Self-check: Is anchoring too low weakening negotiation? Maybe, but a defensible anchor increases close probability. Series A investors prefer founders who understand valuation drivers. The memo should include RBI and compliance assumptions because a fintech valuation without regulatory framing feels incomplete in India. Recommendation: use a one-page valuation memo and invite VCs to debate assumptions, not methods.
</thinking>

Answer with a valuation bridge, not a debate. Show why each method captures one part of the company and where it breaks for your model.

**Why this works in Indian context:**
Indian fintech investors are sensitive to regulatory structure, credit exposure, and revenue recognition. A co-lending partner can look like SaaS, lending infrastructure, distribution, or balance-sheet finance depending on the investor's lens. If you let each VC choose its own frame, you get a INR 60Cr to INR 180Cr spread and no negotiation anchor. A valuation bridge makes you look financially mature and reduces the chance that a low multiple gets presented as the only rational answer. It also anchors the conversation in RBI-facing realities such as regulated lender roles, borrower consent, collections conduct, and data governance. That helps separate real fintech infrastructure value from generic loan-volume excitement.

**How to execute:**
1. Create a 1-page bridge with 4 columns: method, what it captures, why it is relevant, and why it is incomplete.
2. For revenue multiple, show INR 90L last-year revenue, current monthly run-rate if higher, recurring percentage, and expected FY revenue.
3. For loan-volume logic, show INR 8Cr disbursed but separate owned risk from partner-lender risk; do not let investors value you like a lender if you are not one.
4. For DCF, present it as a floor-case check using conservative growth, compliance hiring, technology cost, and no strategic premium.
5. For strategic premium, name the evidence required: exclusive lender partnerships, proprietary repayment data, low default cohorts, and integrations that are hard to replicate.
6. Tell VCs your target range before they anchor you: "We see a defensible Series A range of INR 90-120Cr, with upside for strategic fit."
7. Ask every VC what metric would justify the top end in 6 months; use their answer to sharpen milestones and choose the best lead.
8. Avoid accepting a high valuation if it comes with liquidation preference, ratchets, or growth covenants that make the effective terms worse than a lower clean round.
9. Add a compliance slide: lender-of-record structure, outsourcing responsibilities, grievance process, data consent, audit trail, and how the platform avoids unauthorized lending exposure.
10. Keep the Companies Act 2013 financing documents clean if a lead emerges; valuation logic helps negotiation, but sloppy allotment and SHA terms can still damage closing.

**Bottom line:**
The way to handle conflicting valuation logic is to own the framework. When you explain each method's use and limitation, investors negotiate assumptions instead of forcing you into their preferred box. That is how a founder turns valuation spread from confusion into leverage during the Series A process. It also makes it easier to choose the investor whose method matches how the company will actually scale.`,
      },
      {
        role: "user",
        content: "Why is the INR 180Cr valuation risky if a VC is willing to offer it?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain high valuation risk. INR 180Cr on INR 90L revenue is 200x trailing revenue, unless current run-rate is much higher. On INR 12L profit, it is 1500x earnings. For fintech infrastructure, such valuation could be justified only by very high growth, strategic scarcity, or a large near-term revenue pipeline. Risk is Series B mark-up pressure. If Series A at INR 180Cr, next round may need INR 400-600Cr post-money or strong metrics to avoid flat/down. Also high valuation may include dirty terms.

Need include regulatory/compliance. RBI-related fintech shifts can affect co-lending partnerships and digital lending economics. If valuation bakes in perfect regulatory scale, any compliance delay hurts. Self-check: Is high valuation always bad? No, if clean, milestone-consistent, and backed by real growth. The key is whether the valuation is supported by forward contracted revenue and diversified lender access, not optimism. Recommendation: accept INR 180Cr only if terms are clean and milestones are achievable; otherwise choose lower clean round.
</thinking>

INR 180Cr is risky because it can turn the next 18 months into a valuation trap. Accept it only if the terms are clean and your metrics can credibly support a much higher Series B.

**Why this works in Indian context:**
Indian fintech markets can reprice quickly when RBI guidance, lender appetite, default performance, or funding cycles change. A valuation that looks attractive today can become a burden if the next investor sees only INR 90L revenue, modest gross margin, and limited owned credit economics. High valuation is especially risky if it comes with structured downside rights such as participating liquidation preference, full ratchet, redemption pressure, or harsh performance covenants. The Companies Act 2013 documents and SHA will decide the real economics, not the headline number in the press note. In fintech, future investors also underwrite compliance maturity; a valuation that assumes scale before governance is built can backfire.

**How to execute:**
1. Back-solve the Series B: if Series A closes at INR 180Cr, decide what revenue, disbursement volume, gross margin, and lender count justify INR 400-600Cr in 18-24 months.
2. Set metric gates: at least INR 4-6Cr annual revenue run-rate, 45 percent gross margin, controlled defaults, 3-5 strong lender partners, and low customer concentration.
3. Check term quality before accepting: 1x non-participating liquidation, broad-based weighted-average anti-dilution, no redemption rights, no full ratchet, and normal pro-rata.
4. Ask whether the high-valuation VC is leading with conviction or using valuation to win while loading protection elsewhere.
5. Compare founder ownership after 2 rounds, not only this round; a lower INR 110Cr clean Series A can outperform a INR 180Cr dirty Series A.
6. Build a downside model where revenue grows only 50 percent and compliance costs rise by INR 40-60L; see whether a bridge or flat round becomes likely.
7. If you take INR 180Cr, reduce burn discipline risk by keeping 18 months runway and avoiding a hiring plan that assumes instant Series B access.
8. Use the high offer as leverage with cleaner investors, but do not let ego convert a financing round into a future down-round setup.
9. Ask the high-valuation VC to define the next-round milestone in writing; if their expectation is vague, the headline is probably substituting for conviction.
10. Compare board rights and reporting demands; a high price with monthly covenant pressure can feel cheaper at signing and more expensive in operation.

**Bottom line:**
A high valuation is good only when it is clean and growable. If INR 180Cr forces unrealistic milestones or hides investor protection, a lower but cleaner valuation is the stronger founder outcome. Choose the price that lets the company compound, not the number that only looks impressive in a fundraising announcement.`,
      },
    ],
  },
  S011: {
    ...base,
    scenario_id: "S011",
    area: "Due Diligence Preparation & Red Flags",
    difficulty: "medium",
    sample_index: 11,
    lenses: {
      profile: "healthtech founder under 45-day Series A diligence pressure",
      angle: "red-flag triage, closing risk, and document cleanup",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What diligence issues can actually delay or kill my Series A closing?",
      },
      {
        role: "assistant",
        content: `<thinking>
Ananya has a signed INR 8Cr Series A term sheet, 45 days to close, 14 people, INR 2.4Cr ARR, and multiple red flags: informal early employee contracts, missing IP assignment from 2 ex-employees who built original code, founder loans treated as equity in spreadsheets, and missing TDS filings for FY23. Need rank by closing risk. IP assignment is highest because healthtech software value depends on owning code. TDS default is also serious but usually curable with payment, interest, and filings. Founder loans misclassified as equity can corrupt the cap table. Informal employee contracts create HR and IP risk.

Need recommend triage not perfection. The VC's 60-page checklist cannot be solved linearly. Companies Act 2013 cap table records, Income Tax Act TDS compliance, and IP assignment deeds need priority. Self-check: is technical diligence more important? It matters, but legal ownership of the code and tax defaults are sharper deal blockers. Recommendation: run a 15-day red-flag sprint, then a 30-day closing cleanup.
</thinking>

The two issues most likely to delay closing are missing IP assignments from ex-employees and unresolved FY23 TDS filings. Fix those before polishing the rest of the 60-page checklist.

**Why this works in Indian context:**
Indian Series A diligence is usually less about whether every file is perfect and more about whether core ownership, tax, and cap-table facts are reliable. If 2 ex-employees built the original codebase and never assigned IP, the investor cannot be sure the company owns the software it is funding. Missing TDS under the Income Tax Act can be cured, but it creates liability, interest, and compliance questions. Founder loans shown as equity in spreadsheets but not in statutory records create Companies Act 2013 and cap-table reliability issues.

**How to execute:**
1. Day 1: create a red-flag tracker with 4 labels: closing blocker, price adjustment risk, condition precedent, and post-closing cleanup.
2. Day 1-3: contact the 2 ex-employees and get IP assignment deeds, invention assignment, confidentiality confirmation, and no-claims acknowledgements signed.
3. Day 1-5: reconcile founder loans against bank statements, board minutes, accounting ledgers, and cap table; decide whether they remain loans or convert through proper approvals.
4. Day 3-7: quantify FY23 TDS shortfall, interest, late fees, and revised return requirements; pay and file before the investor's tax diligence call.
5. Day 5-10: issue proper employment, confidentiality, and IP assignment agreements to the 3 early employees with informal arrangements.
6. Day 10-15: prepare a disclosure note for the VC explaining what was wrong, what was fixed, dates of correction, and residual liability if any.
7. Day 15-30: clean lower-risk items: vendor contracts, HR files, insurance, board minutes, GST filings, data security policies, and technical architecture documentation.
8. Day 30-45: keep only true blockers in the condition-precedent list; push minor items into post-closing covenants with 60-90 day deadlines.

**Bottom line:**
Do not treat diligence as a paperwork marathon. Fix ownership of code, tax defaults, and cap-table truth first; those are the items that can make an INR 8Cr round slow down or get repriced.`,
      },
      {
        role: "user",
        content: "How should I organize the diligence cleanup so the VC stays confident?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need organize process under pressure. VC confidence comes from transparency, not hiding problems. Ananya should set up a data room, assign owners, and send weekly status. Need avoid dumping messy documents. 60-page checklist can become chaos unless grouped by legal, finance, tax, HR, tech, compliance. Need mention healthtech data issues maybe DPDP Act, patient data, contracts. But scenario red flags focus IP, TDS, loans, informal contracts.

Need include timeline and communication. If she discloses issues before VC finds them, credibility improves. But avoid over-sharing raw uncertainty; disclose with remediation plan. Self-check: should she ask for closing extension now? Not immediately; first 10 days show progress. If blockers remain after day 20, negotiate condition precedent or holdback. Recommendation: data room plus risk memo plus weekly diligence call.
</thinking>

Create a diligence war room with one source of truth, one risk memo, and a weekly investor update. The goal is to make the VC see control, not panic.

**Why this works in Indian context:**
Indian VC diligence teams expect early-stage records to have imperfections, but they react badly to surprises. Under Companies Act 2013, statutory registers, board approvals, allotment records, and loan documentation must match the cap table presented in the deck. Under the Income Tax Act, TDS delays should be quantified and cured, not vaguely explained. In healthtech, patient-data handling, hospital contracts, and software IP ownership are central because revenue and regulatory trust depend on them.

**How to execute:**
1. Build a data room by day 2 with 6 folders: corporate, finance-tax, cap table, IP-tech, HR, and customer-commercial.
2. Put a tracker on top with 60 checklist items, owner, status, document link, risk level, and target completion date.
3. Create a 2-page red-flag memo by day 5: IP assignment gap, FY23 TDS issue, founder-loan classification, and informal employee contracts.
4. For each red flag, state the fix in progress: signed deed, payment challan, revised filing, board ratification, or amended agreement.
5. Schedule one 45-minute diligence call every week with the VC, counsel, finance owner, and founder; do not let questions scatter across WhatsApp and email.
6. Use version control on documents; every file should have date, final/draft label, and signer status.
7. If a document cannot be fixed before closing, propose a specific condition: for example, "signed IP confirmation from ex-employee 2 within 30 days post-closing."
8. Keep customer contracts and data-protection policies ready because healthtech diligence will likely ask about consent, storage, access controls, and breach response.
9. Send Friday updates with 3 numbers: checklist completion percent, unresolved closing blockers, and expected date for final legal sign-off.

**Bottom line:**
The VC will stay confident if the cleanup looks managed. Disclose issues with dates, fixes, and owners; silence creates more fear than the actual defects.`,
      },
      {
        role: "user",
        content: "Why are IP assignments and founder loans more serious than normal missing paperwork?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain severity. Missing paperwork can often be signed later. IP assignment affects asset ownership: if ex-employees wrote original code and did not assign, they may claim rights or create uncertainty. For healthtech software, the codebase is core value. Founder loans misclassified as equity are serious because investors buy specific ownership percentages. If INR amounts treated informally, the pre-money cap table may be wrong. TDS is financial liability but quantifiable.

Need mention Indian law. Copyright in software can involve employer-employee relationship, contract terms, and assignment. Companies Act governs share issuance and loans; without proper conversion, loan is not equity. Self-check: can retrospective documents solve it? Sometimes, but only if parties cooperate and records support facts. Recommendation: fix legal reality, not just create folders.
</thinking>

They are serious because they affect what the investor is buying. Missing routine files are process gaps; IP ownership and cap-table truth are deal-substance gaps.

**Why this works in Indian context:**
Under Indian practice, software IP should be backed by employment agreements, contractor agreements, invention assignment, and confidentiality terms. If 2 ex-employees wrote the original code and never signed assignment documents, the company may still have arguments, but the VC sees uncertainty around the asset it is funding. Founder loans are equally sensitive: under Companies Act 2013 records, a loan does not become equity because a spreadsheet says so. It needs proper approval, valuation, allotment, and statutory filings if it is converted.

**How to execute:**
1. Treat IP assignment as a closing blocker and not a post-closing nice-to-have; get signatures from both ex-employees before final SHA execution if possible.
2. Offer a small settlement amount if needed, such as INR 50K-1L each, in exchange for clean IP assignment, waiver, confidentiality, and no-claims confirmation.
3. Ask the current tech lead to map code repositories by author and date so the assignment documents match actual contribution history.
4. Reconcile founder loans rupee by rupee: amount advanced, date, bank entry, accounting classification, board approval, repayment or conversion plan.
5. If loans are to convert into equity, route them through proper valuation, board/shareholder approvals, and ROC filings; do not silently edit the cap table.
6. If loans remain debt, show repayment terms and whether the VC requires subordination until after the Series A.
7. Add disclosure schedules to the transaction documents so corrected historical issues are transparent and not later treated as hidden breaches.
8. Ask counsel to separate legal risk from accounting cleanup; the board needs to know which items can create third-party claims.
9. Keep the VC informed once the fixes are signed; unresolved ownership uncertainty should not survive into the final closing week.

**Bottom line:**
IP assignment defines whether the company owns its product. Founder-loan classification defines who owns the company. Those are not administrative defects; they are core diligence facts that must be made clean before money comes in.`,
      },
    ],
  },
  S012: {
    ...base,
    scenario_id: "S012",
    area: "Cap Table Structuring for Future Rounds",
    difficulty: "hard",
    sample_index: 12,
    lenses: {
      profile: "first-time AI infra founders learning multi-round dilution planning",
      angle: "cap table forecasting, ESOP planning, and investor confidence",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What cap table model should we show the seed investor for the next four years?",
      },
      {
        role: "assistant",
        content: `<thinking>
Rohan and Tanvi currently own 47.5 percent each, advisor 1 percent, ESOP 4 percent. They are raising INR 7Cr at INR 35Cr post-money, so seed investor gets 20 percent. Need model seed, Series A at INR 100-150Cr, Series B at INR 400-600Cr, and ESOP refreshes. Typical Indian seed dilution 15-22 percent, Series A 18-25 percent. Existing ESOP 4 percent is too low for hiring through Series A. Need maybe refresh to 10-12 percent at seed. But if created pre-money, founders bear it.

Need recommend model. Use 3 scenarios: conservative, base, upside. Show ownership after seed, A, B with ESOP refresh before each round. Self-check: investor wants evidence they planned, not exact future. The model should show founders remain above 20-25 percent combined after Series B and the ESOP stays hireable. Recommendation: base case seed 20 percent investor, ESOP 10 percent post-seed, Series A 22 percent, Series B 20 percent.
</thinking>

Show a 3-scenario cap table model: seed close, Series A in 18-24 months, Series B 24 months later, with ESOP refreshes before each institutional round.

**Why this works in Indian context:**
Indian seed investors want to see that founders understand dilution before signing, especially when the current ESOP pool is only 4 percent. A seed round of INR 7Cr at INR 35Cr post-money creates 20 percent investor ownership, which is normal. The risk is not the seed dilution alone; it is repeated ESOP top-ups and 18-25 percent Series A dilution compounding over 4 years. Under Companies Act 2013 records, ESOP creation and share issuances need clean approvals, so the model should match the legal path.

**How to execute:**
1. Start with today's cap table: Rohan 47.5 percent, Tanvi 47.5 percent, advisor 1 percent, ESOP 4 percent.
2. Model seed at INR 7Cr on INR 35Cr post-money: investor 20 percent, existing holders collectively diluted to 80 percent before any pool change.
3. Add an ESOP refresh case: pool increased from 4 percent to 10-12 percent post-seed, with clear impact on both founders.
4. Model Series A at 3 valuation points: INR 100Cr, INR 125Cr, and INR 150Cr post-money, with 20-22 percent new investor dilution.
5. Model Series B at INR 400Cr, INR 500Cr, and INR 600Cr post-money, with 18-20 percent new investor dilution.
6. Keep an ESOP refresh before Series A and Series B; investors expect enough pool for senior engineering, GTM, and infra operations hires.
7. Show founder combined ownership after every round; keep a warning line if combined ownership falls below 35 percent after Series A or 25 percent after Series B.
8. Add a fully diluted view, not just issued shares; seed investors will calculate on the fully diluted cap table anyway.
9. Include a note that all issuances, ESOP approvals, and investor rights will be reflected in the SHA, AoA, and statutory registers.

**Bottom line:**
The investor does not need prophecy; they need evidence that you understand dilution mechanics. A clean model with seed, Series A, Series B, and ESOP refreshes will make the founders look fundable and disciplined.`,
      },
      {
        role: "user",
        content: "How do we avoid being over-diluted while still creating enough ESOP?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need balance founder ownership and hiring. AI infra needs strong engineers, product, DevRel, enterprise sales, and support. 4 percent ESOP is too low. But a large pre-money pool can over-dilute founders. Need recommend 10 percent post-seed or 8 percent pre-seed plus future refresh. Since seed investor asks model, not necessarily terms. Founders can negotiate pool size and timing. Need include grants by role.

Need numbers. If seed takes 20 percent and ESOP becomes 10 percent, founders/advisor share remaining 70 percent roughly. Series A and B will further dilute. To avoid over-dilution, use hiring-based pool, milestone refreshes, and avoid advisor overhang. Self-check: should advisor 1 percent be reduced? Maybe if not vested or active. Need mention reverse vesting for founders? At 16 months, investors may request. Recommendation: create enough pool for 18 months, not 4 years.
</thinking>

Create enough ESOP for the next 18-24 months, not the entire company journey. A 10 percent post-seed pool is more defensible than jumping blindly from 4 percent to 15 percent.

**Why this works in Indian context:**
Indian seed investors often ask founders to create a larger ESOP pool before the round, which pushes dilution onto founders. That can be acceptable if the hiring plan supports it, but not if the number is arbitrary. AI infra hiring is equity-sensitive because senior infra engineers and GTM leaders may expect meaningful upside. ESOPs need board and shareholder approvals under the Companies Act 2013 framework, so the pool should be planned, documented, and used through actual grants rather than treated as a vague reserve.

**How to execute:**
1. Build a hiring plan first: 3 senior engineers, 2 platform engineers, 1 DevRel lead, 1 enterprise sales lead, and 1 customer engineering lead over 18 months.
2. Size the pool from grants: senior technical lead 0.5-1.0 percent, strong senior IC 0.2-0.5 percent, early GTM leader 0.5-1.25 percent.
3. Increase the ESOP pool to 10 percent post-seed as the base case; accept 12 percent only if the investor shares some dilution or hiring plan requires it.
4. Keep 25-30 percent of the pool unallocated after initial grants so you can hire before Series A without emergency refresh.
5. Add standard 4-year vesting with 1-year cliff, monthly vesting after cliff, and clear leaver treatment.
6. Review the advisor's 1 percent: if it is not vested against deliverables, convert it into milestone-based vesting or reduce future advisory dilution.
7. Negotiate that the Series A pool refresh is calculated with new investors sharing dilution, not entirely loaded onto founders.
8. Run founder ownership after seed and ESOP; if either founder drops below a psychologically important threshold too early, renegotiate pool timing.
9. Use a board-approved grant budget every 6 months; do not grant options casually because each 0.25 percent becomes meaningful after Series B.

**Bottom line:**
You avoid over-dilution by linking ESOP size to actual hiring, not investor habit. A 10 percent post-seed pool with disciplined grants should be enough now, while future refreshes should be shared with future capital.`,
      },
      {
        role: "user",
        content: "Why does the investor care about our Series A and B cap table now?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain investor psychology. Seed investor wants to know founders remain motivated, there is room for ESOP, future investors can enter, and no cap table defects. If founders become too diluted early, future rounds harder. If ESOP too small, hiring suffers. If advisor or early grants too large, cleanup needed. The investor also wants to assess whether INR 7Cr seed can create Series A milestones.

Need include follow-on math. At seed 20 percent, Series A 20-22, Series B 18-20, founders get diluted multiple times. If they start 95 combined and no huge pool, they can remain meaningful. Self-check: is this premature? No, because cap table mistakes are hardest to fix later. Need mention Companies Act statutory records and SHA. Recommendation: present model as planning, not certainty.
</thinking>

The investor cares because today's cap table determines whether the company can raise the next 2 rounds without founder fatigue, ESOP shortage, or cleanup negotiations.

**Why this works in Indian context:**
Indian institutional investors underwrite the next financing round almost as much as the current one. A seed investor wants Series A funds to see a clean fully diluted cap table, motivated founders, enough ESOP, and no strange advisor or side-letter rights. Companies Act 2013 records, SHA terms, AoA rights, and ESOP approvals all travel into the next diligence process. If the cap table looks careless now, future investors may ask for cleanup, price cuts, or founder re-vesting before investing.

**How to execute:**
1. Show founder ownership after 3 events: seed, Series A, and Series B; do not stop the model at the seed close.
2. Add a motivation test: each founder should still own enough after Series A to remain deeply aligned through Series B.
3. Add a hiring test: ESOP pool should not fall below 3-4 percent unallocated right before major hiring phases.
4. Add a fundability test: no investor should have rights that block future qualified financings, pro-rata allocation, or ESOP refreshes.
5. Add a cleanup test: advisor shares, early employee grants, and side promises must be documented or removed before seed closing.
6. Connect dilution to milestones: INR 7Cr seed should buy 18-24 months and produce metrics strong enough for INR 100-150Cr Series A valuation.
7. Present downside and upside cases; if the company raises Series A at INR 100Cr instead of INR 150Cr, the cap table should still work.
8. Put the model in the board pack and update it after every grant, share issuance, or investor conversion.
9. Use the model to negotiate calmly; founders who know the future math can push back on excessive ESOP or investor rights without sounding defensive.

**Bottom line:**
Cap tables are path-dependent. A seed investor asks about Series A and B now because small ownership decisions today can decide whether the company is hireable, fundable, and founder-led 4 years from now.`,
      },
    ],
  },
  S013: {
    ...base,
    scenario_id: "S013",
    area: "MSME Registration & Government Benefits",
    difficulty: "easy",
    sample_index: 13,
    lenses: {
      profile: "manufacturing MSME owner deciding whether to pay a consultant for Udyam",
      angle: "self-service registration, benefit mapping, and practical next steps",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What MSME benefits do I qualify for, and is the INR 35K consultant worth it?",
      },
      {
        role: "assistant",
        content: `<thinking>
Deepak has INR 4.2Cr revenue, 18 employees, INR 1.8Cr plant and machinery. Under the older thresholds in provided facts, Small is investment under INR 10Cr and turnover under INR 50Cr; he qualifies as Small. Udyam registration is free online. Consultant asking INR 35K for Udyam plus "all benefit linkages" is likely overpriced unless they provide specific loan, subsidy, or tender outcomes. Benefits: priority sector lending, CGTMSE access, delayed payment protection under MSMED Act, TReDS, government procurement, possible lower collateral friction, and Section 43B(h) leverage with buyers.

Need recommend doing Udyam himself. He has GST and factory licenses, so data should auto-fetch. Self-check: any reason to use consultant? Maybe for scheme mapping after registration, but not for basic Udyam. Recommendation: do Udyam free, then pay only for outcome-specific work.
</thinking>

You qualify as an MSME Small enterprise and should do Udyam registration yourself. Do not pay INR 35K for basic registration; pay only for a specific loan, tender, or subsidy outcome.

**Why this works in Indian context:**
Udyam registration is free and online at the official portal, and your INR 4.2Cr turnover plus INR 1.8Cr plant and machinery investment fits the Small enterprise band under MSME classification. Once registered, you can access MSME-linked benefits such as priority sector lending, CGTMSE-backed collateral-free loans, TReDS onboarding, delayed-payment protection under the MSMED Act 2006, and stronger buyer leverage through Section 43B(h) of the Income Tax Act. The banker is right that you may be leaving value on the table. The consultant fee is not justified for basic registration because the core process is self-service.

**How to execute:**
1. Complete Udyam registration yourself this week using Aadhaar, PAN, GST-linked details, bank information, and enterprise activity classification.
2. Save the Udyam certificate and give it to your bank within 48 hours; ask them to tag your account correctly as an MSME Small enterprise.
3. Ask the bank for 3 products in writing: working-capital limit enhancement, CGTMSE-backed term loan, and lower collateral requirement based on MSME status.
4. Create a buyer-payment tracker after registration; if large buyers cross 45 days, use MSMED Act Section 15 and Section 43B(h) language in reminders.
5. Register on at least 1 TReDS platform if you supply to large companies or PSUs; compare RXIL, M1xchange, and Invoicemart based on buyer availability.
6. Check government procurement portals for electrical component tenders where MSME status gives EMD exemption or procurement preference.
7. Pay a consultant only for a defined deliverable: approved CGTMSE loan, tender submission, subsidy application, or receivable recovery, not vague "linkages."
8. Keep annual turnover and investment records updated because MSME classification can change as the business grows.

**Bottom line:**
The valuable step is Udyam registration, not the consultant invoice. Do the free registration yourself, then use the certificate to negotiate banking, receivables, and procurement advantages.`,
      },
      {
        role: "user",
        content: "How do I use Udyam after registration instead of just keeping the certificate?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need give post-registration action plan. Many MSMEs register and do nothing. Deepak should convert Udyam into bank, buyer, and procurement action. Benefits: bank classification, CGTMSE, TReDS, delayed payments, GeM perhaps for government procurement, vendor onboarding, insurance maybe. Need list documents and timelines. Since electrical components manufacturing, government and PSU procurement may matter.

Need include Section 43B(h), MSMED Act. Also caution not to threaten buyers immediately; use professional communication. Self-check: does Udyam create automatic subsidy? No. It creates eligibility and leverage, not automatic money. Recommendation: 30-day implementation plan with bank, buyers, platforms, tenders.
</thinking>

Treat Udyam as a commercial tool. Within 30 days, use it with your bank, buyers, TReDS platforms, and procurement portals.

**Why this works in Indian context:**
Udyam registration does not automatically deposit money into an MSME account. It creates formal MSME identity, which banks, buyers, government departments, and TReDS platforms can recognize. Under the MSMED Act 2006, registered MSMEs get stronger delayed-payment rights, including the 45-day payment framework. Section 43B(h) gives buyers a tax reason to pay registered MSMEs on time. The benefit appears only when you actively communicate and document your status.

**How to execute:**
1. Day 1: send the Udyam certificate to your banker and ask them to update MSME classification in the loan account and current account.
2. Day 2-5: request a credit review for working capital, machinery finance, or CGTMSE-backed expansion debt; attach GST returns and 12 months bank statements.
3. Day 5-7: update vendor registrations with major buyers and include Udyam number on invoices, quotations, and payment reminders.
4. Day 7-10: revise invoice terms to mention payment due within the agreed MSMED Act timeline, capped at 45 days where applicable.
5. Day 10-15: register on TReDS if your buyers are large corporates, PSUs, or creditworthy enterprises; check whether they are on RXIL, M1xchange, or Invoicemart.
6. Day 15-20: create a tender calendar for government departments, PSUs, and GeM opportunities relevant to electrical components.
7. Day 20-25: ask your accountant to track delayed buyer payments separately so Section 43B(h) reminders can be sent with facts, not emotion.
8. Day 25-30: review insurance, quality certifications, BIS needs, and factory compliance because MSME procurement benefits still require technical eligibility.
9. Repeat this every quarter; Udyam is a starting point for operating discipline, not a one-time certificate.

**Bottom line:**
Udyam becomes valuable when it changes bank conversations, invoice discipline, and tender access. Use it actively for 30 days and you will know which benefits are real for your business.`,
      },
      {
        role: "user",
        content: "Why do banks and buyers care so much whether I am Udyam registered?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain formal recognition. Banks need Udyam for priority sector classification, MSME loan schemes, CGTMSE, risk tagging. Buyers care because MSMED Act delayed payment and Section 43B(h) tax disallowance apply to registered MSMEs. Without registration, Deepak may still be small business but not visible in formal system. Need mention it changes documentation, not bargaining power magically.

Need balanced tone. Udyam won't force buyer to pay instantly, but it gives leverage. Banks still underwrite cash flow, GST, collateral, bureau, financials. Self-check: could buyers dislike registration because payment pressure? Some may, but serious buyers already handle MSME vendors. Recommendation: use registration professionally, as compliance alignment.
</thinking>

Banks care because Udyam helps classify and underwrite you as an MSME. Buyers care because registered MSME status changes payment discipline and tax consequences.

**Why this works in Indian context:**
For banks, Udyam makes your enterprise visible in the formal MSME ecosystem and can support priority-sector lending treatment, CGTMSE-backed loans, and MSME-specific credit products. For buyers, Udyam registration activates practical pressure under the MSMED Act 2006 and Section 43B(h) of the Income Tax Act. If a buyer delays payment to a registered MSME beyond the permitted period, they face stronger legal and tax consequences than with a normal vendor. That is why the registration number on invoices matters.

**How to execute:**
1. Give banks your Udyam certificate, GST returns, balance sheet, debtors ageing, and plant-machinery details; do not expect Udyam alone to approve credit.
2. Ask the bank to compare your current interest rate and collateral requirement with MSME-linked products and CGTMSE options.
3. Add Udyam number to every invoice and purchase-order confirmation so buyers cannot later say MSME status was not disclosed.
4. Send payment reminders at 30, 45, and 60 days with invoice number, delivery proof, due date, and MSME status.
5. Keep communication commercial first: "we need timely payment to maintain production schedule" works better than starting with legal threats.
6. Use Section 43B(h) language when buyers repeatedly delay; it gives their finance team a reason to prioritize your payment before year-end.
7. Maintain clean delivery, quality, and acceptance records because delayed-payment rights are stronger when there is no dispute over goods.
8. Track which buyers improve after Udyam disclosure; prioritize those relationships and price chronic late payers differently.
9. Review your MSME classification yearly so buyers and banks are not relying on stale status.

**Bottom line:**
Udyam registration turns your business from an informal small supplier into a recognized MSME in bank and buyer systems. It does not replace good financials, but it gives you formal leverage you currently are not using.`,
      },
    ],
  },
  S014: {
    ...base,
    scenario_id: "S014",
    area: "Invoice Financing & Supply Chain Finance",
    difficulty: "medium",
    sample_index: 14,
    lenses: {
      profile: "packaging supplier with large FMCG receivables and competing finance offers",
      angle: "cost, buyer acceptance, and financing hierarchy",
      style: "what, how, why progression",
    },
    conversation: [
      system,
      {
        role: "user",
        content: "What receivables financing option should I choose for the INR 2.2Cr stuck with FMCG buyers?",
      },
      {
        role: "assistant",
        content: `<thinking>
Pooja has INR 9.5Cr revenue, MSME Small, supplies to Marico, ITC, Dabur, Britannia on 60-90 day terms, INR 2.2Cr receivables. Options: TReDS via RXIL at 8.5-9.5 percent, HDFC supply-chain finance at 10.5 percent, fintech bill discounting at 13 percent same-day. Need recommend hierarchy. Since buyers are large and likely creditworthy, TReDS should be first. Bank SCF second if specific buyer program gives reliable acceptance. Fintech third for urgent non-accepted invoices.

Need include MSMED Act and Section 43B(h). Since she is MSME Small, delayed payment rules and buyer tax disallowance can help. But don't threaten FMCG buyers immediately; use TReDS as professional process. Self-check: is same-day fintech worth it? Only if cash need is urgent and TReDS onboarding not ready. Recommendation: TReDS first, HDFC for buyer-specific gaps, fintech capped emergency.
</thinking>

Choose TReDS as the default route, use HDFC supply-chain finance where a buyer program is already active, and keep fintech discounting only for emergency liquidity.

**Why this works in Indian context:**
TReDS platforms such as RXIL, M1xchange, and Invoicemart are designed for MSME receivables from stronger buyers. Your buyers are large FMCG companies, so their accepted invoices should attract better pricing than generic fintech bill discounting. At 8.5-9.5 percent, TReDS is meaningfully cheaper than 13 percent fintech funding. The MSMED Act 2006 and Section 43B(h) also improve your leverage because buyers have legal and tax reasons not to stretch registered MSME suppliers indefinitely.

**How to execute:**
1. Segment the INR 2.2Cr receivables by buyer, invoice age, due date, dispute status, and whether goods acceptance is documented.
2. Start RXIL onboarding this week and ask whether Marico, ITC, Dabur, and Britannia are active buyers on RXIL, M1xchange, or Invoicemart.
3. Upload only clean invoices first; disputed invoices or debit-note cases should not be used for the first financing cycle.
4. Compare cost per INR 10L invoice for 60 and 90 days under TReDS at 9 percent, HDFC SCF at 10.5 percent, and fintech at 13 percent.
5. Use HDFC SCF only where the buyer's program gives reliable acceptance and faster settlement than TReDS.
6. Cap fintech discounting at 10-15 percent of receivables, used only when payroll, raw material purchase, or shipment commitment is at risk.
7. Add Udyam and MSME status to invoices and buyer communications so payment discipline improves before year-end.
8. Build a monthly receivables dashboard with DSO, financed invoices, discount cost, buyer acceptance time, and overdue amount above 45 days.
9. Renegotiate buyer payment terms after 2 successful financing cycles; stable TReDS acceptance gives you data, not just complaints.

**Bottom line:**
The CFO is right that TReDS should lead. The fintech product is useful for speed, but at 13 percent it should not become the default cost of doing business with strong FMCG buyers.`,
      },
      {
        role: "user",
        content: "How do I compare TReDS and HDFC supply-chain finance buyer by buyer?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need give buyer-by-buyer comparison. TReDS needs buyer acceptance on platform; SCF may be tied to buyer program through HDFC. Compare acceptance speed, discount rate, recourse, documentation, limits, settlement, charges, buyer onboarding friction. For large FMCG buyers, some may prefer their bank SCF program over TReDS. Need not choose one forever; use per-buyer lowest all-in cost and reliability.

Need include GST/TDS? Invoice discounting doesn't change GST liability on underlying supply; financing charges may have GST. Need maybe mention. Self-check: should she use three platforms? Maybe start with one, expand if buyer coverage weak. Recommendation: matrix.
</thinking>

Create a buyer-wise financing matrix. The best option may differ for Marico, ITC, Dabur, and Britannia depending on acceptance speed and platform availability.

**Why this works in Indian context:**
Indian receivables financing is operationally buyer-dependent. TReDS can be cheaper, but only if the buyer accepts invoices promptly on the platform. Bank supply-chain finance can be smoother when the buyer already runs a structured program with HDFC. RBI-regulated TReDS gives transparent bidding and without-recourse style comfort in many cases, while bank SCF may be more relationship-led. MSME status gives you leverage, but platform mechanics decide actual cash timing.

**How to execute:**
1. Build a 4-buyer table: Marico, ITC, Dabur, Britannia; add outstanding amount, average days overdue, dispute count, and monthly billing.
2. For each buyer, record whether they are active on RXIL, M1xchange, Invoicemart, HDFC SCF, or another bank program.
3. Compare all-in cost, not only rate: discount rate, processing fee, platform fee, GST on fees, documentation cost, and minimum tenor.
4. Track acceptance time: if TReDS is 9 percent but buyer acceptance takes 15 days, a 10.5 percent bank program with 2-day acceptance may be better for urgent cycles.
5. Check recourse language: confirm whether non-payment risk after buyer acceptance sits with financier or can come back to you.
6. Match financing to cash need: use the lowest-cost route for predictable invoices and the fastest reliable route for payroll or raw-material deadlines.
7. Ask HDFC whether limits are buyer-specific or overall; a low program limit can look attractive but fail during peak season.
8. Keep invoice GST treatment clean; financing the invoice does not remove your normal GST reporting obligation on the underlying supply.
9. Review the matrix every 60 days and shift volumes toward the buyer-route combination with best realized cost and fastest settlement.

**Bottom line:**
Do not choose TReDS or HDFC as a slogan. Choose buyer by buyer, using realized cost, acceptance speed, recourse terms, and reliability of settlement.`,
      },
      {
        role: "user",
        content: "Why not use the fintech product since same-day money solves my immediate pressure?",
      },
      {
        role: "assistant",
        content: `<thinking>
Need explain cost of speed. Fintech at 13 percent is higher than TReDS 8.5-9.5 and HDFC 10.5. On INR 1Cr for 90 days, extra 3.5-4.5 percent annualized costs roughly INR 90K-1.1L per cycle compared to 9 percent; repeated over many cycles hurts margin. Same-day money has value if urgent, but using it regularly becomes margin leakage. Packaging supplier margins may not support this.

Need include when acceptable. If TReDS onboarding incomplete or buyer acceptance delayed, fintech bridge okay for small capped amount. Need beware hidden fees, recourse, bureau reporting. Self-check: is rejecting fintech too rigid? No, use as emergency. Recommendation: cap and exit.
</thinking>

Use fintech same-day discounting only as a bridge. It solves timing, but at 13 percent it should not become your routine receivables strategy.

**Why this works in Indian context:**
MSMEs often pay a speed premium because documentation-heavy bank products feel slow. But when your buyers are large FMCG companies, TReDS and bank SCF should normally give lower-cost liquidity after setup. RXIL or another TReDS platform can price the buyer's credit strength, while fintech bill discounting often prices speed and platform risk. The MSMED Act and Section 43B(h) also give you buyer-payment leverage that a quick fintech loan does not improve.

**How to execute:**
1. Set a fintech cap immediately: no more than INR 20-25L outstanding unless the alternative is missing payroll or losing a critical raw-material shipment.
2. Use fintech only for invoices from buyers not yet active on TReDS or HDFC SCF, or where acceptance delay exceeds 10 working days.
3. Ask the fintech for all-in cost in rupees on a sample INR 10L invoice for 60 days and 90 days; include processing fee and GST on fees.
4. Check whether the facility is with recourse, whether late buyer payment creates penalty interest, and whether it affects commercial credit reporting.
5. Put the first fintech transaction on a repayment calendar; bridge finance becomes dangerous when the exit source is vague.
6. Move the same buyer's next invoices to TReDS or HDFC once onboarding is complete; do not let convenience create a permanent 13 percent habit.
7. Compare realized cost after 30 days and show the CFO: fintech speed saved time, but TReDS or SCF should take over recurring flows.
8. Use buyer conversations to reduce the need for emergency discounting: ask for faster invoice acceptance even if payment terms remain 60-90 days.
9. Review cash-flow weekly until INR 2.2Cr receivables falls below a comfortable operating threshold.

**Bottom line:**
Same-day money is a tool, not a strategy. Use fintech when delay would cost more than interest; otherwise route strong-buyer invoices through TReDS or bank SCF and protect your margin.`,
      },
    ],
  },
};

function readExistingRecords(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const scenarioId = process.argv[2];
if (!scenarioId || !records[scenarioId]) {
  const available = Object.keys(records).sort().join(", ");
  throw new Error(`Pass one scenario id. Available: ${available}`);
}

const record = records[scenarioId];
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existing = readExistingRecords(outputPath);
if (existing.some((item) => item.batch === record.batch && item.scenario_id === record.scenario_id)) {
  throw new Error(`${record.scenario_id} already exists in ${record.batch}`);
}

fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, "utf8");
console.log(`appended ${record.scenario_id} to ${outputPath}`);
