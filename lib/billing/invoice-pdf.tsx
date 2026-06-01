import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";

export type InvoicePdfData = {
  invoiceNumber: string;
  issuedAt: string;
  customerName: string;
  customerEmail: string;
  companyName?: string | null;
  planName: string;
  billingPeriod: string;
  paymentProvider: string;
  paymentId: string;
  subscriptionId?: string | null;
  amountSubunits: number;
  currency: string;
};

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", color: "#111827", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 34 },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#007a7a" },
  label: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
  value: { fontSize: 11, color: "#111827", marginTop: 4 },
  title: { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  paid: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, backgroundColor: "#ecfdf5", color: "#047857", fontSize: 10, fontFamily: "Helvetica-Bold" },
  grid: { flexDirection: "row", gap: 24, marginTop: 26, marginBottom: 30 },
  box: { flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 },
  table: { border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginTop: 14 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", padding: 12, borderBottom: "1px solid #e5e7eb" },
  tableRow: { flexDirection: "row", padding: 12 },
  colDescription: { flex: 2.5 },
  colSmall: { flex: 1, textAlign: "right" },
  headerText: { fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  cellText: { fontSize: 11, color: "#111827" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 18 },
  totalBox: { width: 220, borderTop: "1px solid #e5e7eb", paddingTop: 12 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { fontSize: 11, color: "#4b5563" },
  totalValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111827" },
  footer: { position: "absolute", bottom: 34, left: 48, right: 48, borderTop: "1px solid #e5e7eb", paddingTop: 12, fontSize: 9, color: "#6b7280" },
});

export async function renderInvoicePdf(data: InvoicePdfData) {
  return renderToBuffer(<InvoiceDocument data={data} />);
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const amount = formatMoney(data.amountSubunits, data.currency);

  return (
    <Document title={`Evaldam AI Invoice ${data.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Evaldam AI</Text>
            <Text style={[styles.value, { color: "#4b5563" }]}>Startup valuation and finance intelligence</Text>
          </View>
          <View>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.paid}>PAID</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.box}>
            <Text style={styles.label}>Billed to</Text>
            <Text style={styles.value}>{data.customerName || data.customerEmail}</Text>
            {data.companyName ? <Text style={styles.value}>{data.companyName}</Text> : null}
            <Text style={styles.value}>{data.customerEmail}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Invoice details</Text>
            <Text style={styles.value}>Invoice: {data.invoiceNumber}</Text>
            <Text style={styles.value}>Date: {formatDate(data.issuedAt)}</Text>
            <Text style={styles.value}>Provider: {data.paymentProvider}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>Description</Text>
            <Text style={[styles.headerText, styles.colSmall]}>Period</Text>
            <Text style={[styles.headerText, styles.colSmall]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colDescription]}>{data.planName}</Text>
            <Text style={[styles.cellText, styles.colSmall]}>{data.billingPeriod}</Text>
            <Text style={[styles.cellText, styles.colSmall]}>{amount}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total paid</Text>
              <Text style={styles.totalValue}>{amount}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.box, { marginTop: 26 }]}>
          <Text style={styles.label}>Payment reference</Text>
          <Text style={styles.value}>Payment ID: {data.paymentId}</Text>
          {data.subscriptionId ? <Text style={styles.value}>Subscription ID: {data.subscriptionId}</Text> : null}
        </View>

        <Text style={styles.footer}>
          Evaldam AI | equidamai.com | This invoice was generated automatically after successful Razorpay payment confirmation.
        </Text>
      </Page>
    </Document>
  );
}

function formatMoney(amountSubunits: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((amountSubunits || 0) / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
