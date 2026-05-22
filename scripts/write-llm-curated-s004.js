const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "synthetic",
  "evaldam_training_llm_generated_curated.jsonl",
);

const record = {
  scenario_id: "S004",
  area: "MSME Debt Products & Working Capital",
  difficulty: "medium",
  generator_model: "chatgpt-codex",
  generation_method: "per_sample_llm_authored_in_chat",
  batch: "batch001_target44",
  sample_index: 4,
  lenses: {
    profile: "experienced manufacturing MSME owner balancing expansion and cash-flow stress",
    angle: "financing mix, receivable discipline, and buyer-safe working capital",
    style: "what, how, why progression",
  },
  conversation: [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup and MSME finance.",
    },
    {
      role: "user",
      content: "What financing mix should I choose for the dyeing unit and working capital gap?",
    },
    {
      role: "assistant",
      content: `<thinking>
Vikram needs INR 60L for a dyeing unit and INR 40L working capital, while INR 1.8Cr is trapped in receivables from 3 large exporters. These are different financing problems. The dyeing unit is a fixed asset with longer payback, so a term loan fits. The working capital gap comes from buyer credit terms, so invoice-linked financing is better. SBI's CGTMSE-backed term loan at 11.2 percent is reasonable for capex if tenure is 4-5 years and moratorium aligns with installation. RXIL TReDS at 9-10.5 percent is better for accepted invoices than NBFC discounting at 14.5 percent.

Need avoid overloading one product. A term loan for receivables creates repayment pressure; invoice discounting for machinery is mismatched. MSMED Act Section 15 requires payment to MSMEs within 45 days, and Section 43B(h) gives leverage because delayed MSME payments can hurt buyer tax deduction. Self-check: is TReDS enough for all INR 1.8Cr? No, only invoices accepted by onboarded buyers may be financeable. Recommendation: CGTMSE for INR 60L capex, TReDS for eligible receivables, NBFC only as emergency bridge.
</thinking>

Use a split structure: take the SBI CGTMSE-backed term loan for the INR 60L dyeing unit, and use RXIL TReDS first for receivables-backed working capital. Keep the NBFC product only as a backup for invoices that cannot be accepted on TReDS.

**Why this works in Indian context:**
CGTMSE is built for collateral-free credit support to micro and small enterprises, so it fits expansion capex better than invoice discounting. TReDS platforms such as RXIL are RBI-regulated receivable discounting rails where large-buyer invoices can be financed at lower annualised rates when buyer credit quality is strong. The MSMED Act 2006 also gives you statutory payment leverage: Section 15 sets the 45-day payment framework, and Section 16 adds high interest on delayed payments. Section 43B(h) of the Income Tax Act further improves your negotiation position because delayed MSME payments can create tax disallowance risk for buyers. Your case is strong because the business has INR 6.2Cr revenue, 14 percent EBITDA margin, and a real purchase deadline; lenders can see operating history, not just projections. The financing design should protect that operating strength instead of replacing it with expensive short-term money.

**How to execute:**
1. Within 3 days, separate the requirement into 2 files: INR 60L dyeing-unit capex with quotations, and INR 40L working-capital gap backed by invoice ageing.
2. Accept the SBI term loan only if it has a 4-5 year tenor, no unnecessary collateral beyond CGTMSE coverage, clear processing charges, and prepayment flexibility after 12 months.
3. Start RXIL onboarding this week; list all 3 garment exporters, invoice dates, invoice values, due dates, and whether each buyer is already active on TReDS.
4. Use TReDS for invoices from accepted buyers first, targeting 9-10.5 percent annualised discounting instead of the NBFC's 14.5 percent.
5. Use the NBFC only for a capped emergency amount, such as INR 10-15L, where TReDS acceptance delays would make you miss payroll or raw-material purchase.
6. Send buyers a commercial note, not a legal threat: explain that TReDS helps you keep supply stable and does not change product pricing or quality commitments.
7. Build a 13-week cash-flow sheet showing collections, TReDS discounting, SBI disbursement, machinery advance, salary dates, GST payments, and raw-material purchases.
8. Keep at least INR 10L liquidity buffer after the dyeing-unit advance, because machinery installation often creates small unplanned costs for power load, civil work, trial runs, and consumables.

**Bottom line:**
Do not fund everything with one instrument. Use long-tenor CGTMSE debt for the dyeing unit and low-cost TReDS liquidity for accepted receivables; NBFC discounting is a pressure valve, not the main financing strategy. This structure keeps asset repayment matched to asset life and working-capital repayment matched to customer collections, which is the core discipline your factory needs now.`,
    },
    {
      role: "user",
      content: "How should I execute TReDS and CGTMSE without upsetting buyers or SBI?",
    },
    {
      role: "assistant",
      content: `<thinking>
This is execution risk. Buyer relationships matter because the exporters are probably repeat customers, and TReDS requires buyer acceptance of invoices. SBI also may worry if invoice discounting changes cash-flow routing or weakens its working-capital visibility. Need coordinate openly. For buyers, the message should be supply-chain stability, not collection pressure. For SBI, the message should be risk reduction: TReDS unlocks receivables and improves current-account discipline, while the term loan is for a revenue-generating dyeing unit.

Need include documents and timeline. RXIL onboarding may need Udyam, GST, PAN, bank details, board/authorization docs, invoice data, and buyer mapping. CGTMSE loan needs project report, quotations, financials, GST returns, Udyam, bank statements, and projected DSCR. Self-check: should he invoke MSMED Act immediately? Not as first move with strategic buyers. Use Section 43B(h) and 45-day MSME rule as soft leverage in conversations, escalating only if a buyer is chronically abusive. Recommendation: parallel tracks with coordinated communication and no hidden financing.
</thinking>

Run both tracks in parallel, but keep the communication clean. Buyers should hear that TReDS is for smoother supply continuity, and SBI should see that invoice liquidity lowers default risk on the term loan.

**Why this works in Indian context:**
TReDS works only when the buyer accepts the invoice on the platform, so a relationship-led rollout is better than a legalistic demand. SBI will be more comfortable if the receivable financing is transparent and does not secretly divert cash flows away from agreed banking arrangements. The MSMED Act 2006 gives you a 45-day payment right, but in Indian B2B manufacturing, the first move should usually be structured negotiation. Section 43B(h) strengthens that negotiation because buyers have tax reasons to avoid delayed MSME dues. Large exporters also care about vendor continuity; if your cash crunch disrupts supply, they suffer too. That is the commercial argument to lead with before you cite statutory rights.

**How to execute:**
1. Day 1: inform your SBI RM that you are using TReDS for receivable acceleration, not taking a competing long-term loan; share the INR 1.8Cr ageing report.
2. Day 2-4: complete RXIL seller onboarding with Udyam, GST returns, PAN, bank account proof, board authorization, invoice samples, and buyer GSTIN details.
3. Day 5: call each garment exporter's finance head and position TReDS as a vendor-stability mechanism; ask whether they are already live on RXIL, M1xchange, or Invoicemart.
4. Day 7-10: upload only clean, undisputed invoices first; avoid invoices with quality disputes, debit notes, or delivery mismatch.
5. Day 10-15: finalize the CGTMSE term-loan file with machinery quotation, installation schedule, expected capacity increase, projected incremental margin, and 24-month cash-flow impact.
6. Day 15-25: negotiate SBI disbursement linked to dyeing-unit vendor payment, with EMI start after installation or at least a short moratorium.
7. Day 30 onward: use monthly buyer ageing and TReDS usage reports as a discipline tool; if any buyer crosses 60 days repeatedly, escalate using MSMED Act language.
8. Keep all TReDS proceeds routed through the declared bank account unless SBI approves another flow; hidden routing can create avoidable tension during renewal or limit enhancement.
9. After the first 2 discounted invoices settle smoothly, ask SBI to consider a working-capital limit enhancement because your receivable data will be cleaner and less speculative.

**Bottom line:**
Treat TReDS as a relationship-preserving cash-flow tool, not a confrontation. Keep SBI informed, onboard buyers carefully, and use the legal leverage quietly before using it aggressively. The practical win is to make every party feel safer: buyers get stable supply, SBI gets better visibility, and you get cash without pledging family assets or straining long-term relationships during expansion season in Surat this quarter.`,
    },
    {
      role: "user",
      content: "Why not just take the NBFC discounting because it is fastest and simpler?",
    },
    {
      role: "assistant",
      content: `<thinking>
The NBFC option is attractive because speed matters: he has a 45-day order deadline and cash locked in receivables. But 14.5 percent annualised is materially higher than RXIL's 9-10.5 percent range. On INR 1Cr discounted for 90 days, the difference between 10 percent and 14.5 percent is roughly INR 1.1L in extra financing cost for just one cycle; repeated over a year, that hurts EBITDA. With 14 percent EBITDA margin on INR 6.2Cr revenue, he has about INR 86.8L EBITDA, so expensive working capital can eat meaningful profit.

Need explain when NBFC is still useful. If buyer is not onboarded, invoice acceptance is delayed, or funds are needed in 24-48 hours, NBFC bridge may be rational. But using it as default ignores MSME-specific tools. Self-check: is lowest rate always best? No. Reliability and speed matter. The recommendation should be a ladder: TReDS first, SBI CC/term coordination second, NBFC capped bridge third. Also avoid using short-term discounting for fixed asset purchase.
</thinking>

Do not make NBFC discounting the default. Use it only for urgent invoices or non-TReDS buyers, with a hard cap and a planned exit into TReDS or bank working capital.

**Why this works in Indian context:**
MSMEs often overpay for speed because the formal options feel slow, but TReDS was created specifically to finance MSME receivables from stronger buyers. RXIL, M1xchange, and Invoicemart create competitive bidding by banks and NBFC factors, which can reduce pricing when buyer credit is strong. The MSMED Act and Section 43B(h) also give you leverage that a generic NBFC product does not use. A 14.5 percent invoice-discounting rate may be acceptable once; as a habit, it quietly transfers your manufacturing margin to the financier. In a textile unit with 14 percent EBITDA, repeated high-cost discounting can turn a profitable order book into a cash treadmill. Speed has value, but only when it prevents a larger commercial loss.

**How to execute:**
1. Set a financing hierarchy today: TReDS for accepted large-buyer invoices, SBI for the INR 60L dyeing-unit term loan, NBFC only for emergency liquidity.
2. Put a rupee cap on NBFC usage: maximum INR 15L at any point until RXIL acceptance is tested with at least 2 buyers.
3. Compare cost per invoice before signing: for each INR 10L invoice over 90 days, estimate TReDS cost at 9-10.5 percent versus NBFC cost at 14.5 percent.
4. Do not discount invoices that have buyer disputes; the speed benefit disappears if the buyer later delays settlement or raises debit notes.
5. Ask the NBFC for all charges in writing: processing fee, penal interest, foreclosure terms, recourse clauses, and whether the facility reports to commercial credit bureaus.
6. If the dyeing-unit deadline is at risk within 20 days, use NBFC funds only for the advance payment and repay from the first TReDS settlement or buyer collection.
7. Review after 60 days: if TReDS acceptance is stable, reduce NBFC usage to zero and negotiate a better bank working-capital enhancement using cleaner receivable data.
8. Track the true cost in rupees, not only interest rate; include processing fees, GST on fees, documentation charges, and any minimum-tenor condition that keeps the facility expensive.

**Bottom line:**
Fast money is useful when it prevents a real loss, but expensive money should not become the operating model. Use the NBFC as a bridge, not as the road; your main structure should be CGTMSE plus TReDS. The right test is simple: if the same invoice can be financed through buyer-accepted TReDS, paying the NBFC premium needs a deadline-based reason, not convenience alone or salesperson pressure from a lender chasing volume this month, financially.`,
    },
  ],
};

function readExistingRecords(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const existing = readExistingRecords(outputPath);
if (existing.some((item) => item.batch === record.batch && item.scenario_id === record.scenario_id)) {
  throw new Error(`${record.scenario_id} already exists in ${record.batch}`);
}

fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, "utf8");
console.log(`appended ${record.scenario_id} to ${outputPath}`);
